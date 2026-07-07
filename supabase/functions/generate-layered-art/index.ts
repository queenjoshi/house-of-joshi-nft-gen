import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const STABILITY_API_KEY = Deno.env.get("STABILITY_API_KEY");
const PINATA_JWT = Deno.env.get("PINATA_JWT");
const REMOVAL_API_KEY = Deno.env.get("REMOVAL_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type",
};

type GeneratedLayer = {
  id: string;
  name: string;
  prompt: string;
  zIndex: number;
  removeBackground: boolean;
};

function buildLayerPlan(prompt: string): GeneratedLayer[] {
  return [
    {
      id: "background",
      name: "Background",
      prompt: `${prompt}. Environment and background only, no central character, no portrait subject, rich atmosphere, square NFT background, high detail.`,
      zIndex: -1,
      removeBackground: false,
    },
    {
      id: "subject",
      name: "Main Subject",
      prompt: `${prompt}. Main character or primary object only, centered full subject, clean edges, simple plain background, high detail collectible NFT art.`,
      zIndex: 0,
      removeBackground: true,
    },
    {
      id: "foreground-effects",
      name: "Foreground Effects",
      prompt: `${prompt}. Foreground decorative effects only, glowing particles, jewelry highlights, magical accents, no full background, no main character, clean edges.`,
      zIndex: 1,
      removeBackground: true,
    },
  ];
}

function requireSecret(value: string | undefined, name: string): string {
  if (!value) {
    throw new Error(`Missing Edge Function secret: ${name}`);
  }

  return value;
}

async function generateImage(prompt: string): Promise<ArrayBuffer> {
  const stabilityKey = requireSecret(STABILITY_API_KEY, "STABILITY_API_KEY");
  const formData = new FormData();
  formData.append("prompt", prompt);
  formData.append("output_format", "png");
  formData.append("aspect_ratio", "1:1");
  formData.append("model", "sd3-medium");

  const response = await fetch("https://api.stability.ai/v2beta/stable-image/generate/sd3", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${stabilityKey}`,
      "Accept": "image/*",
    },
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Stability AI error:", errorText);
    throw new Error(`Stability AI failed: ${errorText}`);
  }

  return await response.arrayBuffer();
}

async function removeBackground(imageBuffer: ArrayBuffer): Promise<ArrayBuffer> {
  if (!REMOVAL_API_KEY) {
    console.warn("REMOVAL_API_KEY not set; using original image for transparent layer fallback");
    return imageBuffer;
  }

  const formData = new FormData();
  formData.append("image_file", new Blob([imageBuffer]), "layer.png");
  formData.append("size", "auto");

  const response = await fetch("https://api.remove.bg/v1.0/removebg", {
    method: "POST",
    headers: {
      "X-Api-Key": REMOVAL_API_KEY,
    },
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Background removal error:", errorText);
    console.log("Using original image as fallback");
    return imageBuffer;
  }

  return await response.arrayBuffer();
}

async function uploadFileToPinata(buffer: ArrayBuffer, filename: string): Promise<{ cid: string; url: string }> {
  const pinataJwt = requireSecret(PINATA_JWT, "PINATA_JWT");
  const formData = new FormData();
  formData.append("file", new Blob([buffer]), filename);

  const response = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${pinataJwt}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Pinata error:", errorText);
    throw new Error(`Pinata upload failed: ${errorText}`);
  }

  const data = await response.json();
  return {
    cid: data.IpfsHash,
    url: `https://gateway.pinata.cloud/ipfs/${data.IpfsHash}`,
  };
}

async function uploadJsonToPinata(json: unknown, filename: string): Promise<{ cid: string; url: string }> {
  const pinataJwt = requireSecret(PINATA_JWT, "PINATA_JWT");
  const response = await fetch("https://api.pinata.cloud/pinning/pinJSONToIPFS", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${pinataJwt}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      pinataContent: json,
      pinataMetadata: { name: filename },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Pinata metadata error:", errorText);
    throw new Error(`Metadata upload failed: ${errorText}`);
  }

  const data = await response.json();
  return {
    cid: data.IpfsHash,
    url: `ipfs://${data.IpfsHash}`,
  };
}

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

    const layerPlan = buildLayerPlan(prompt);
    const layers = [];

    for (const layer of layerPlan) {
      console.log(`Generating ${layer.name} layer...`);
      const generatedImage = await generateImage(layer.prompt);
      const layerImage = layer.removeBackground
        ? await removeBackground(generatedImage)
        : generatedImage;
      const uploadedLayer = await uploadFileToPinata(layerImage, `${layer.id}.png`);

      layers.push({
        id: layer.id,
        name: layer.name,
        url: uploadedLayer.url,
        cid: uploadedLayer.cid,
        zIndex: layer.zIndex,
        prompt: layer.prompt,
      });

      console.log(`${layer.name} layer uploaded:`, uploadedLayer.url);
    }

    const metadata = {
      name: `${collectionName} #AI`,
      description: description || `AI-generated layered NFT: ${prompt}`,
      image: layers.find((layer) => layer.id === "subject")?.url || layers[0]?.url,
      composition: {
        layers: layers.map((layer) => ({
          id: layer.id,
          url: `ipfs://${layer.cid}`,
          zIndex: layer.zIndex,
        })),
        blendMode: "normal",
      },
      attributes: layers.map((layer) => ({
        trait_type: "AI Layer",
        value: layer.name,
      })),
    };

    console.log("Pinning layered metadata to Pinata...");
    const uploadedMetadata = await uploadJsonToPinata(metadata, `${collectionName}-metadata.json`);
    console.log("Metadata pinned to:", uploadedMetadata.url);

    const previewLayer = layers.find((layer) => layer.id === "subject") || layers[0];

    return new Response(
      JSON.stringify({
        success: true,
        imageUrl: previewLayer?.url,
        imageCID: previewLayer?.cid,
        metadataUrl: uploadedMetadata.url,
        metadataCID: uploadedMetadata.cid,
        ipfsUrl: previewLayer?.url,
        layers: layers.map((layer) => ({
          id: layer.id,
          url: layer.url,
          zIndex: layer.zIndex,
        })),
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
