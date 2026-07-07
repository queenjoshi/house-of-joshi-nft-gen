import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const STABILITY_API_KEY = Deno.env.get("STABILITY_API_KEY");
const PINATA_JWT = Deno.env.get("PINATA_JWT");
const REMOVAL_API_KEY = Deno.env.get("REMOVAL_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { prompt, collectionName, collectionSymbol, description, dryRun } = await req.json();

    if (!prompt) {
      return new Response(
        JSON.stringify({ error: "Prompt is required" }),
        { 
          status: 400, 
          headers: { 
            "Content-Type": "application/json",
            ...corsHeaders,
          } 
        }
      );
    }

    if (dryRun) {
      return new Response(
        JSON.stringify({ success: true, message: "Edge Function is reachable" }),
        {
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders,
          },
        }
      );
    }

    console.log("Starting layered NFT generation for:", prompt);

    // Step 1: Generate image using Stability AI
    console.log("Step 1: Generating image with Stability AI...");
    const formData = new FormData();
    formData.append("prompt", prompt);
    formData.append("output_format", "png");
    formData.append("aspect_ratio", "1:1");
    formData.append("model", "sd3-medium");

    const stabilityResponse = await fetch("https://api.stability.ai/v2beta/stable-image/generate/sd3", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${STABILITY_API_KEY}`,
        "Accept": "image/*",
      },
      body: formData,
    });

    if (!stabilityResponse.ok) {
      const errorText = await stabilityResponse.text();
      console.error("Stability AI error:", errorText);
      throw new Error(`Stability AI failed: ${errorText}`);
    }

    const imageBuffer = await stabilityResponse.arrayBuffer();
    console.log("Image generated, size:", imageBuffer.byteLength);

    // Step 2: Remove background using remove.bg API
    console.log("Step 2: Removing background...");
    const removalFormData = new FormData();
    removalFormData.append("image_file", new Blob([imageBuffer]), "generated.png");
    removalFormData.append("size", "auto");

    const removalResponse = await fetch("https://api.remove.bg/v1.0/removebg", {
      method: "POST",
      headers: {
        "X-Api-Key": REMOVAL_API_KEY || "",
      },
      body: removalFormData,
    });

    if (!removalResponse.ok) {
      const errorText = await removalResponse.text();
      console.error("Background removal error:", errorText);
      // Fallback: use original image if removal fails
      console.log("Using original image as fallback");
      var transparentBuffer = imageBuffer;
    } else {
      transparentBuffer = await removalResponse.arrayBuffer();
      console.log("Background removed successfully");
    }

    // Step 3: Upload to Pinata
    console.log("Step 3: Uploading to Pinata...");
    const pinataFormData = new FormData();
    pinataFormData.append("file", new Blob([transparentBuffer]), "layered-nft.png");

    const pinataResponse = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${PINATA_JWT}`,
      },
      body: pinataFormData,
    });

    if (!pinataResponse.ok) {
      const errorText = await pinataResponse.text();
      console.error("Pinata error:", errorText);
      throw new Error(`Pinata upload failed: ${errorText}`);
    }

    const pinataData = await pinataResponse.json();
    const ipfsHash = pinataData.IpfsHash;
    const ipfsUrl = `https://gateway.pinata.cloud/ipfs/${ipfsHash}`;
    console.log("Uploaded to IPFS:", ipfsUrl);

    // Step 4: Create layered metadata
    const metadata = {
      name: `${collectionName} #AI`,
      description: description || `AI-generated layered NFT: ${prompt}`,
      composition: {
        layers: [
          { id: "main", url: `ipfs://${ipfsHash}`, zIndex: 0 },
        ],
        blendMode: "normal",
      },
    };

    // Step 5: Pin the metadata JSON to IPFS
    console.log("Step 5: Pinning metadata to Pinata...");
    const pinataJson = await fetch("https://api.pinata.cloud/pinning/pinJSONToIPFS", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${PINATA_JWT}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        pinataContent: metadata,
        pinataMetadata: { name: `${collectionName}-metadata.json` },
      }),
    });

    if (!pinataJson.ok) {
      const errorText = await pinataJson.text();
      console.error("Pinata metadata error:", errorText);
      throw new Error(`Metadata upload failed: ${errorText}`);
    }

    const metadataData = await pinataJson.json();
    const metadataUrl = `ipfs://${metadataData.IpfsHash}`;
    console.log("Metadata pinned to:", metadataUrl);

    // Step 6: Return the successful response
    return new Response(
      JSON.stringify({
        success: true,
        imageUrl: ipfsUrl,
        imageCID: ipfsHash,
        metadataUrl: metadataUrl,
        metadataCID: metadataData.IpfsHash,
        ipfsUrl: ipfsUrl,
      }),
      {
        headers: { 
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );

  } catch (error) {
    console.error("Critical error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { 
        status: 500,
        headers: { 
          "Content-Type": "application/json",
          ...corsHeaders,
        } 
      }
    );
  }
});
