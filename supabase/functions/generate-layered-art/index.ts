import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const STABILITY_API_KEY = Deno.env.get("STABILITY_API_KEY");
const AI_PROVIDER = (Deno.env.get("AI_PROVIDER") || "stability").toLowerCase();
const CLOUDFLARE_ACCOUNT_ID = Deno.env.get("CLOUDFLARE_ACCOUNT_ID");
const CLOUDFLARE_API_TOKEN = Deno.env.get("CLOUDFLARE_API_TOKEN");
const CLOUDFLARE_IMAGE_MODEL = Deno.env.get("CLOUDFLARE_IMAGE_MODEL") || "@cf/black-forest-labs/flux-1-schnell";
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
  order: number;
  removeBackground: boolean;
  traitCount: number;
};

type GeneratedTrait = {
  id: string;
  name: string;
  url: string;
  cid: string;
  rarity: number;
};

type RequestedLayer = {
  id?: string;
  name?: string;
  prompt?: string;
  traitCount?: number;
};

const defaultLayers: RequestedLayer[] = [
  {
    id: "background",
    name: "Background",
    prompt: "environment, setting, atmosphere only",
    traitCount: 3,
  },
  {
    id: "body",
    name: "Body",
    prompt: "body and neck base only, no head, no face, no hair, no clothing accessories",
    traitCount: 3,
  },
  {
    id: "face",
    name: "Face",
    prompt: "face skin and head shape only, no eyes, no mouth, no hair, no body",
    traitCount: 3,
  },
  {
    id: "eyes",
    name: "Eyes",
    prompt: "eyes and eyebrows only, no face, no hair, no mouth, no body",
    traitCount: 3,
  },
  {
    id: "hair",
    name: "Hair",
    prompt: "hair only, no face, no eyes, no body, no background",
    traitCount: 3,
  },
];

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    || crypto.randomUUID();
}

function shouldRemoveBackground(layerName: string): boolean {
  return !layerName.toLowerCase().includes("background");
}

function getLayerIsolationInstructions(layerName: string): string {
  const normalizedName = layerName.toLowerCase();
  const sharedLayerRules = [
    "Create a single isolated NFT generator layer asset, not a full completed character",
    "Use the same centered front-facing alignment and scale so this layer can stack with the other layers",
    "Keep the canvas square",
    "Leave all unrelated parts empty/plain so background removal can make them transparent",
    "Do not include shadows, scenery, text, logos, frames, watermarks, or extra props unless this exact layer asks for them",
  ];

  if (normalizedName.includes("background")) {
    return [
      "Generate background/environment only",
      "Do not include any character, body, face, eyes, mouth, hair, clothing, accessories, foreground subject, text, logo, or watermark",
      "The result should be a full square background that can sit behind transparent character layers",
    ].join(". ");
  }

  if (normalizedName.includes("body")) {
    return [
      ...sharedLayerRules,
      "Generate only the character body base, shoulders, arms, torso, and neck if needed",
      "Do not include head, face, eyes, mouth, hair, clothes, dress, accessories, or background",
    ].join(". ");
  }

  if (normalizedName.includes("face") || normalizedName.includes("head")) {
    return [
      ...sharedLayerRules,
      "Generate only the face/head skin shape and expression base",
      "Do not include eyes, eyebrows, mouth, teeth, hair, hat, neck, body, clothing, accessories, or background",
    ].join(". ");
  }

  if (normalizedName.includes("eye") || normalizedName.includes("brow")) {
    return [
      ...sharedLayerRules,
      "Generate only eyes and eyebrows",
      "Do not include face skin, mouth, nose, hair, head outline, body, clothing, accessories, or background",
    ].join(". ");
  }

  if (normalizedName.includes("mouth") || normalizedName.includes("lip")) {
    return [
      ...sharedLayerRules,
      "Generate only mouth, lips, teeth, tongue, or facial expression mouth detail",
      "Do not include eyes, face skin, nose, hair, head outline, body, clothing, accessories, or background",
    ].join(". ");
  }

  if (normalizedName.includes("hair")) {
    return [
      ...sharedLayerRules,
      "Generate only hair or hairstyle",
      "Do not include face, eyes, mouth, body, clothing, accessories, or background",
    ].join(". ");
  }

  if (
    normalizedName.includes("dress") ||
    normalizedName.includes("clothes") ||
    normalizedName.includes("outfit") ||
    normalizedName.includes("shirt") ||
    normalizedName.includes("armor")
  ) {
    return [
      ...sharedLayerRules,
      "Generate only clothing, dress, outfit, armor, or wearable layer pieces",
      "Do not include face, eyes, mouth, hair, full body skin, background, or scenery",
    ].join(". ");
  }

  if (normalizedName.includes("accessor") || normalizedName.includes("prop")) {
    return [
      ...sharedLayerRules,
      "Generate only the requested accessory or prop layer",
      "Do not include full character, face, body, clothing, background, or scenery",
    ].join(". ");
  }

  return [
    ...sharedLayerRules,
    `Generate only the ${layerName} layer`,
    "Do not include unrelated character parts or background",
  ].join(". ");
}

function buildLayerPlan(prompt: string, requestedLayers?: RequestedLayer[], traitsPerLayer = 3): GeneratedLayer[] {
  const sourceLayers = requestedLayers?.length ? requestedLayers : defaultLayers;

  return sourceLayers
    .filter((layer) => (layer.name || layer.prompt || "").trim())
    .map((layer, index) => {
      const name = (layer.name || `Layer ${index + 1}`).trim();
      const layerPrompt = (layer.prompt || name).trim();
      const traitCount = Math.max(1, Math.min(8, layer.traitCount || traitsPerLayer || 3));

      return {
        id: layer.id || slugify(name),
        name,
        prompt: [
          `Collection concept and art style: ${prompt}`,
          `Layer to generate: ${name}`,
          `User direction for this layer: ${layerPrompt}`,
          getLayerIsolationInstructions(name),
          "High-detail digital collectible art, crisp PNG-ready layer, consistent style across all traits",
        ].join(". "),
        order: index,
        removeBackground: shouldRemoveBackground(name),
        traitCount,
      };
    });
}

function requireSecret(value: string | undefined, name: string): string {
  if (!value) {
    throw new Error(`Missing Edge Function secret: ${name}`);
  }

  return value;
}

async function generateImage(prompt: string): Promise<ArrayBuffer> {
  if (AI_PROVIDER === "cloudflare") {
    return generateImageWithCloudflare(prompt);
  }

  return generateImageWithStability(prompt);
}

async function generateImageWithStability(prompt: string): Promise<ArrayBuffer> {
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

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes.buffer;
}

async function generateImageWithCloudflare(prompt: string): Promise<ArrayBuffer> {
  const accountId = requireSecret(CLOUDFLARE_ACCOUNT_ID, "CLOUDFLARE_ACCOUNT_ID");
  const apiToken = requireSecret(CLOUDFLARE_API_TOKEN, "CLOUDFLARE_API_TOKEN");
  const encodedModel = CLOUDFLARE_IMAGE_MODEL
    .split("/")
    .map((part) => encodeURIComponent(part))
    .join("/");

  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${encodedModel}`,
    {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt,
        steps: 4,
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Cloudflare Workers AI error:", errorText);
    throw new Error(`Cloudflare Workers AI failed: ${errorText}`);
  }

  const contentType = response.headers.get("content-type") || "";
  if (contentType.startsWith("image/")) {
    return await response.arrayBuffer();
  }

  const data = await response.json();
  const image = data.image || data.result?.image;

  if (!image || typeof image !== "string") {
    console.error("Unexpected Cloudflare Workers AI response:", JSON.stringify(data));
    throw new Error("Cloudflare Workers AI failed: response did not include an image");
  }

  const base64 = image.includes(",") ? image.split(",").pop() || image : image;
  return base64ToArrayBuffer(base64);
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
    const {
      prompt,
      collectionName,
      collectionSymbol,
      description,
      dryRun,
      layerPrompts,
      traitsPerLayer,
    } = await req.json();

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

    const layerPlan = buildLayerPlan(prompt, layerPrompts, traitsPerLayer);
    const generatorLayers = [];
    const previewLayers = [];

    for (const layer of layerPlan) {
      console.log(`Generating ${layer.name} layer with ${layer.traitCount} traits...`);
      const traits = await Promise.all(
        Array.from({ length: layer.traitCount }, async (_item, traitIndex): Promise<GeneratedTrait> => {
          const variantNumber = traitIndex + 1;
          const traitPrompt = `${layer.prompt} Variant ${variantNumber}. Distinct from the other variants while preserving the same layer alignment and NFT collection style.`;
          const generatedImage = await generateImage(traitPrompt);
          const layerImage = layer.removeBackground
            ? await removeBackground(generatedImage)
            : generatedImage;
          const uploadedLayer = await uploadFileToPinata(
            layerImage,
            `${layer.id}-${variantNumber}.png`
          );

          console.log(`${layer.name} trait ${variantNumber} uploaded:`, uploadedLayer.url);

          return {
            id: `${layer.id}-${variantNumber}`,
            name: `${layer.name} ${variantNumber}`,
            url: uploadedLayer.url,
            cid: uploadedLayer.cid,
            rarity: 100,
          };
        })
      );

      generatorLayers.push({
        id: layer.id,
        name: layer.name,
        order: layer.order,
        prompt: layer.prompt,
        isRequired: true,
        traits,
      });

      const previewTrait = traits[0];
      if (previewTrait) {
        previewLayers.push({
          id: layer.id,
          url: previewTrait.url,
          cid: previewTrait.cid,
          zIndex: layer.order,
        });
      }
    }

    const metadata = {
      name: `${collectionName} AI Layer Kit`,
      symbol: collectionSymbol,
      description: description || `AI-generated layered NFT: ${prompt}`,
      image: previewLayers[0]?.url,
      composition: {
        layers: previewLayers.map((layer) => ({
          id: layer.id,
          url: `ipfs://${layer.cid}`,
          zIndex: layer.zIndex,
        })),
        blendMode: "normal",
      },
      generatorLayers: generatorLayers.map((layer) => ({
        id: layer.id,
        name: layer.name,
        order: layer.order,
        traits: layer.traits.map((trait) => ({
          id: trait.id,
          name: trait.name,
          image: `ipfs://${trait.cid}`,
          rarity: trait.rarity,
        })),
      })),
    };

    console.log("Pinning layered metadata to Pinata...");
    const uploadedMetadata = await uploadJsonToPinata(metadata, `${collectionName}-metadata.json`);
    console.log("Metadata pinned to:", uploadedMetadata.url);

    const previewLayer = previewLayers[0];

    return new Response(
      JSON.stringify({
        success: true,
        imageUrl: previewLayer?.url,
        imageCID: previewLayer?.cid,
        metadataUrl: uploadedMetadata.url,
        metadataCID: uploadedMetadata.cid,
        ipfsUrl: previewLayer?.url,
        layers: previewLayers.map((layer) => ({
          id: layer.id,
          url: layer.url,
          zIndex: layer.zIndex,
        })),
        generatorLayers: generatorLayers.map((layer) => ({
          id: layer.id,
          name: layer.name,
          order: layer.order,
          isRequired: layer.isRequired,
          traits: layer.traits.map((trait) => ({
            id: trait.id,
            name: trait.name,
            preview: trait.url,
            rarity: trait.rarity,
            fileType: "image",
          })),
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
