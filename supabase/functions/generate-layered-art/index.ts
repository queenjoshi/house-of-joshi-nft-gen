import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const STABILITY_API_KEY = Deno.env.get("STABILITY_API_KEY");
const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
const OPENAI_IMAGE_MODEL = Deno.env.get("OPENAI_IMAGE_MODEL") || "gpt-image-1";
const OPENAI_IMAGE_QUALITY = Deno.env.get("OPENAI_IMAGE_QUALITY") || "low";
const AI_PROVIDER = (Deno.env.get("AI_PROVIDER") || "stability").toLowerCase();
const CLOUDFLARE_ACCOUNT_ID = Deno.env.get("CLOUDFLARE_ACCOUNT_ID");
const CLOUDFLARE_API_TOKEN = Deno.env.get("CLOUDFLARE_API_TOKEN");
const CLOUDFLARE_IMAGE_MODEL = Deno.env.get("CLOUDFLARE_IMAGE_MODEL") || "@cf/black-forest-labs/flux-1-schnell";
const HUGGINGFACE_API_KEY = Deno.env.get("HUGGINGFACE_API_KEY");
const HUGGINGFACE_IMAGE_MODEL = Deno.env.get("HUGGINGFACE_IMAGE_MODEL") || "stabilityai/stable-diffusion-xl-base-1.0";
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
  hasTransparency?: boolean;
  qualityWarnings?: string[];
};

type UploadedAsset = {
  cid: string;
  url: string;
};

type RequestedLayer = {
  id?: string;
  name?: string;
  prompt?: string;
  traitCount?: number;
};

type GenerationMode = "true-layered" | "image-to-layers" | "prompt-layers";
type ImageProvider = "openai" | "stability" | "cloudflare" | "huggingface";

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

const characterRigBlueprint = [
  "Character rig blueprint for every stackable layer",
  "Square 1024x1024 canvas, front-facing bust portrait, no perspective tilt",
  "Vertical centerline fixed at x=512",
  "Head bounding box x=326-698 y=170-560",
  "Eyes anchor y=330, left eye center x=438, right eye center x=586",
  "Mouth anchor center x=512 y=455",
  "Hair occupies x=285-739 y=95-385 and follows the head bounding box",
  "Neck occupies x=456-568 y=545-660",
  "Torso/body occupies x=260-764 y=610-980",
  "Dress/outfit occupies x=235-789 y=575-1000 and must wrap the torso/body anchor",
  "All non-background layers must use these exact anchors and proportions so the PNGs fit perfectly when stacked",
].join(". ");

const compactCharacterRigBlueprint = [
  "Rig: square 1024, front-facing bust, center x512",
  "head x326-698 y170-560",
  "eyes y330 x438/x586",
  "mouth x512 y455",
  "hair x285-739 y95-385",
  "neck x456-568 y545-660",
  "torso x260-764 y610-980",
  "dress x235-789 y575-1000",
  "use exact anchors so layers stack",
].join("; ");

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

function isBackgroundLayer(layerName: string): boolean {
  return layerName.toLowerCase().includes("background");
}

function getLayerIsolationInstructions(layerName: string): string {
  const normalizedName = layerName.toLowerCase();
  const sharedLayerRules = [
    "Create a single isolated NFT generator layer asset, not a full completed character",
    characterRigBlueprint,
    "Use the exact same centered front-facing alignment, pose, scale, and anchor positions so this layer can stack with the other layers",
    "Keep the canvas square",
    "Place only the requested layer object on a clean pure white background for background removal",
    "Leave all unrelated parts empty/pure white so they can become transparent",
    "Do not include shadows, scenery, text, logos, frames, watermarks, or extra props unless this exact layer asks for them",
  ];

  if (normalizedName.includes("background")) {
    return [
      "Generate a background/environment layer only, like the back layer in a generative NFT art engine",
      "This layer must be an empty scene, abstract backdrop, room, landscape, pattern, gradient, sky, wall, floor, or environment",
      "Do not include the collection's main subject even if the collection prompt names one",
      "Do not include cats, dogs, animals, humans, creatures, mascots, characters, bodies, faces, eyes, mouths, hair, clothing, accessories, silhouettes, foreground subjects, text, logo, or watermark",
      "The result should be a full square background that can sit behind transparent character layers",
    ].join(". ");
  }

  if (normalizedName.includes("body")) {
    return [
      ...sharedLayerRules,
      "Generate only the character body base, shoulders, arms, torso, and neck using the rig anchors",
      "Body must define the base silhouette that face, hair, dress, eyes, and mouth will fit",
      "Do not include head, face, eyes, mouth, hair, clothes, dress, accessories, or background",
    ].join(". ");
  }

  if (normalizedName.includes("face") || normalizedName.includes("head")) {
    return [
      ...sharedLayerRules,
      "Generate only the face/head skin shape and expression base inside the exact head bounding box",
      "Face must align to the neck and body silhouette anchors",
      "Do not include eyes, eyebrows, mouth, teeth, hair, hat, neck, body, clothing, accessories, or background",
    ].join(". ");
  }

  if (normalizedName.includes("eye") || normalizedName.includes("brow")) {
    return [
      ...sharedLayerRules,
      "Generate only eyes and eyebrows at the exact eye anchors",
      "Eyes must fit inside the face/head bounding box and match the face perspective",
      "Do not include face skin, mouth, nose, hair, head outline, body, clothing, accessories, or background",
    ].join(". ");
  }

  if (normalizedName.includes("mouth") || normalizedName.includes("lip")) {
    return [
      ...sharedLayerRules,
      "Generate only mouth, lips, teeth, tongue, or facial expression mouth detail at the exact mouth anchor",
      "Mouth must fit the face/head bounding box and match the face perspective",
      "Do not include eyes, face skin, nose, hair, head outline, body, clothing, accessories, or background",
    ].join(". ");
  }

  if (normalizedName.includes("hair")) {
    return [
      ...sharedLayerRules,
      "Generate only hair or hairstyle around the exact head bounding box",
      "Hair must fit over the face/head shape without shifting the head size or centerline",
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
      "Generate only clothing, dress, outfit, armor, or wearable layer pieces around the torso/body anchors",
      "Dress/outfit must fit the body silhouette and neck anchor exactly",
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

function buildCollectionImagePrompt(
  prompt: string,
  assetType: "cover" | "banner",
  userPrompt?: string,
): string {
  if (assetType === "banner") {
    return [
      `Collection concept and art style: ${prompt}`,
      `User banner direction: ${userPrompt || "cinematic marketplace banner for the NFT collection"}`,
      "Generate a wide collection banner image for an NFT drop page",
      "Use a strong horizontal composition with the main subject or emblem centered and safe space near the edges",
      "Do not include readable text, logos, UI, frames, watermarks, or marketplace screenshots",
      "High-detail digital collectible art, polished hero banner style",
    ].join(". ");
  }

  return [
    `Collection concept and art style: ${prompt}`,
    `User cover direction: ${userPrompt || "iconic square cover image for the NFT collection"}`,
    "Generate a square collection cover image that represents the whole NFT drop",
    "This is a complete cover artwork, not a transparent layer",
    "Do not include readable text, logos, UI, frames, watermarks, or marketplace screenshots",
    "High-detail digital collectible art, polished marketplace cover style",
  ].join(". ");
}

function buildLayerPlan(
  prompt: string,
  requestedLayers?: RequestedLayer[],
  traitsPerLayer = 3,
  stylePrompt?: string,
  blockingRules?: string,
): GeneratedLayer[] {
  const sourceLayers = requestedLayers?.length ? requestedLayers : defaultLayers;
  const lockedStyle = stylePrompt?.trim()
    ? `Locked collection style: ${stylePrompt.trim()}`
    : "Locked collection style: keep every layer visually consistent in linework, lighting, palette, camera angle, and scale";

  return sourceLayers
    .filter((layer) => (layer.name || layer.prompt || "").trim())
    .map((layer, index) => {
      const name = (layer.name || `Layer ${index + 1}`).trim();
      const layerPrompt = (layer.prompt || name).trim();
      const traitCount = Math.max(1, Math.min(8, layer.traitCount || traitsPerLayer || 3));
      const isBackground = isBackgroundLayer(name);
      const collectionContext = isBackground
        ? [
            `Collection theme/style reference only: ${prompt}`,
            "Use only the theme, colors, lighting, world, mood, and art direction from the collection prompt",
            "Do not render the named subject from the collection prompt in this background layer",
          ].join(". ")
        : `Collection concept and art style: ${prompt}`;

      return {
        id: layer.id || slugify(name),
        name,
        prompt: [
          collectionContext,
          lockedStyle,
          blockingRules?.trim() ? `Global blocking rules: ${blockingRules.trim()}` : "",
          `Layer to generate: ${name}`,
          `User direction for this layer: ${layerPrompt}`,
          getLayerIsolationInstructions(name),
          isBackground
            ? [
                "Output must be only a complete backplate/background artwork",
                "Absolutely no character, no animal, no cat, no creature, no body part, no face, no silhouette, and no foreground subject",
              ].join(". ")
            : shouldRemoveBackground(name)
            ? "Output must look like a clean isolated cutout on pure white, ready to remove the background into a transparent PNG"
            : "Output must be a complete background artwork with no transparent cutout subject",
          "High-detail digital collectible art, crisp NFT generator layer, consistent style across all traits",
        ].join(". "),
        order: index,
        removeBackground: shouldRemoveBackground(name),
        traitCount,
      };
    });
}

function buildTraitName(layerName: string, layerPrompt: string, variantNumber: number): string {
  const adjectives = ["Royal", "Golden", "Neon", "Crystal", "Shadow", "Ruby", "Cosmic", "Mythic"];
  const layerWords = layerPrompt
    .replace(/[^a-zA-Z0-9 ]+/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 3 && !["only", "with", "background", "transparent", "matching"].includes(word.toLowerCase()));
  const keyword = layerWords[variantNumber % Math.max(1, layerWords.length)] || layerName;
  return `${adjectives[(variantNumber - 1) % adjectives.length]} ${keyword} ${layerName}`.replace(/\s+/g, " ").trim();
}

function inspectPngTransparency(imageBuffer: ArrayBuffer): { hasTransparency: boolean; warnings: string[] } {
  const bytes = new Uint8Array(imageBuffer);
  const pngSignature = [137, 80, 78, 71, 13, 10, 26, 10];
  const isPng = pngSignature.every((byte, index) => bytes[index] === byte);

  if (!isPng) {
    return {
      hasTransparency: false,
      warnings: ["Transparent quality check could not confirm PNG format"],
    };
  }

  const colorType = bytes[25];
  const hasAlphaChannel = colorType === 4 || colorType === 6;

  return {
    hasTransparency: hasAlphaChannel,
    warnings: hasAlphaChannel ? [] : ["Layer PNG does not expose an alpha channel"],
  };
}

function requireSecret(value: string | undefined, name: string): string {
  if (!value) {
    throw new Error(`Missing Edge Function secret: ${name}`);
  }

  return value;
}

function limitPrompt(prompt: string, maxLength: number): string {
  const normalizedPrompt = prompt.replace(/\s+/g, " ").trim();
  if (normalizedPrompt.length <= maxLength) return normalizedPrompt;
  return normalizedPrompt.slice(0, maxLength - 3).replace(/\s+\S*$/, "") + "...";
}

function buildProviderPrompt(prompt: string, provider: string): string {
  if (provider !== "cloudflare" && provider !== "huggingface") {
    return prompt;
  }

  const layerMatch = prompt.match(/Layer to generate: ([^.]+)/);
  const directionMatch = prompt.match(/User direction for this layer: ([^.]+)/);
  const conceptMatch = prompt.match(/Collection concept and art style: ([^.]+)/);
  const backgroundConceptMatch = prompt.match(/Collection theme\/style reference only: ([^.]+)/);
  const variantMatch = prompt.match(/Variant \d+/);
  const isBackground = /Layer to generate: Background/i.test(prompt);

  if (layerMatch) {
    const layerName = layerMatch[1].trim();
    const direction = directionMatch?.[1]?.trim() || layerName;
    const concept = (isBackground ? backgroundConceptMatch?.[1] : conceptMatch?.[1])?.trim() || "NFT collection";
    const layerRules = isBackground
      ? "empty background/backplate only; use theme colors and mood only; no cat, animal, person, creature, mascot, character, body, face, eyes, mouth, hair, clothing, silhouette, logo, text, watermark"
      : "single transparent-ready isolated cutout on pure white; no unrelated parts, scenery, text, logo, watermark";

    return limitPrompt([
      isBackground ? `Theme only, do not draw subject: ${concept}` : `Concept: ${concept}`,
      `Layer: ${layerName}`,
      `Direction: ${direction}`,
      isBackground ? "" : compactCharacterRigBlueprint,
      layerRules,
      variantMatch?.[0] || "",
      "high-detail consistent NFT layer",
    ].filter(Boolean).join(". "), 2048);
  }

  return limitPrompt(prompt, 2048);
}

function normalizeProvider(value: string): ImageProvider | null {
  const normalized = value.trim().toLowerCase();
  if (normalized === "openai") return "openai";
  if (normalized === "stability" || normalized === "stabilityai") return "stability";
  if (normalized === "cloudflare" || normalized === "workers-ai") return "cloudflare";
  if (normalized === "huggingface" || normalized === "hugging-face" || normalized === "hf") return "huggingface";
  return null;
}

function configuredProviders(): ImageProvider[] {
  const requestedProviders = [
    ...((Deno.env.get("AI_PROVIDER_ORDER") || "")
      .split(",")
      .map((provider) => normalizeProvider(provider))
      .filter((provider): provider is ImageProvider => Boolean(provider))),
    normalizeProvider(AI_PROVIDER),
    "openai" as const,
    "stability" as const,
    "huggingface" as const,
    "cloudflare" as const,
  ];

  return [...new Set(requestedProviders.filter((provider): provider is ImageProvider => Boolean(provider)))]
    .filter((provider) => {
      if (provider === "openai") return Boolean(OPENAI_API_KEY);
      if (provider === "stability") return Boolean(STABILITY_API_KEY);
      if (provider === "huggingface") return Boolean(HUGGINGFACE_API_KEY);
      if (provider === "cloudflare") return Boolean(CLOUDFLARE_ACCOUNT_ID && CLOUDFLARE_API_TOKEN);
      return false;
    });
}

async function generateImage(prompt: string, aspectRatio = "1:1"): Promise<ArrayBuffer> {
  const providers = configuredProviders();
  const errors: string[] = [];

  if (!providers.length) {
    throw new Error(
      "No AI image provider is configured. Add at least one of OPENAI_API_KEY, STABILITY_API_KEY, HUGGINGFACE_API_KEY, or CLOUDFLARE_ACCOUNT_ID/CLOUDFLARE_API_TOKEN."
    );
  }

  for (const provider of providers) {
    try {
      console.log(`Generating image with ${provider}...`);
      if (provider === "openai") return await generateImageWithOpenAI(prompt, aspectRatio);
      if (provider === "stability") return await generateImageWithStability(prompt, aspectRatio);
      if (provider === "huggingface") return await generateImageWithHuggingFace(prompt);
      return await generateImageWithCloudflare(prompt);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.warn(`${provider} image generation failed; trying next provider if available:`, message);
      errors.push(`${provider}: ${message}`);
    }
  }

  throw new Error(`All configured AI image providers failed. ${errors.join(" | ")}`);
}

async function generateImageWithStability(prompt: string, aspectRatio = "1:1"): Promise<ArrayBuffer> {
  const stabilityKey = requireSecret(STABILITY_API_KEY, "STABILITY_API_KEY");
  const formData = new FormData();
  formData.append("prompt", prompt);
  formData.append("output_format", "png");
  formData.append("aspect_ratio", aspectRatio);
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

function openAIImageSizeForAspectRatio(aspectRatio: string): string {
  if (aspectRatio === "16:9" || aspectRatio === "3:2" || aspectRatio === "landscape") {
    return "1536x1024";
  }

  if (aspectRatio === "2:3" || aspectRatio === "portrait") {
    return "1024x1536";
  }

  return "1024x1024";
}

async function generateImageWithOpenAI(prompt: string, aspectRatio = "1:1"): Promise<ArrayBuffer> {
  const openAIKey = requireSecret(OPENAI_API_KEY, "OPENAI_API_KEY");
  const response = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${openAIKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: OPENAI_IMAGE_MODEL,
      prompt,
      size: openAIImageSizeForAspectRatio(aspectRatio),
      quality: OPENAI_IMAGE_QUALITY,
      output_format: "png",
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("OpenAI image generation error:", errorText);
    throw new Error(`OpenAI image generation failed: ${errorText}`);
  }

  const data = await response.json();
  const image = data.data?.[0]?.b64_json;

  if (!image || typeof image !== "string") {
    console.error("Unexpected OpenAI image response:", JSON.stringify(data));
    throw new Error("OpenAI image generation failed: response did not include image data");
  }

  return base64ToArrayBuffer(image);
}

async function generateImageWithHuggingFace(prompt: string): Promise<ArrayBuffer> {
  const huggingFaceKey = requireSecret(HUGGINGFACE_API_KEY, "HUGGINGFACE_API_KEY");
  const encodedModel = HUGGINGFACE_IMAGE_MODEL
    .split("/")
    .map((part) => encodeURIComponent(part))
    .join("/");
  const response = await fetch(
    `https://api-inference.huggingface.co/models/${encodedModel}`,
    {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${huggingFaceKey}`,
        "Content-Type": "application/json",
        "Accept": "image/png",
      },
      body: JSON.stringify({
        inputs: buildProviderPrompt(prompt, "huggingface"),
        options: {
          wait_for_model: true,
        },
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Hugging Face image generation error:", errorText);
    throw new Error(`Hugging Face image generation failed: ${errorText}`);
  }

  const contentType = response.headers.get("content-type") || "";
  if (contentType.startsWith("image/")) {
    return await response.arrayBuffer();
  }

  const errorText = await response.text();
  throw new Error(`Hugging Face image generation failed: response was not an image (${errorText})`);
}

async function editImageWithOpenAI(referenceImage: ArrayBuffer, prompt: string, aspectRatio = "1:1"): Promise<ArrayBuffer> {
  const openAIKey = requireSecret(OPENAI_API_KEY, "OPENAI_API_KEY");
  const formData = new FormData();
  formData.append("model", OPENAI_IMAGE_MODEL);
  formData.append("prompt", prompt);
  formData.append("size", openAIImageSizeForAspectRatio(aspectRatio));
  formData.append("quality", OPENAI_IMAGE_QUALITY);
  formData.append("image[]", new Blob([referenceImage], { type: "image/png" }), "base-character-reference.png");

  const response = await fetch("https://api.openai.com/v1/images/edits", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${openAIKey}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("OpenAI image edit error:", errorText);
    throw new Error(`OpenAI image edit failed: ${errorText}`);
  }

  const data = await response.json();
  const image = data.data?.[0]?.b64_json;

  if (!image || typeof image !== "string") {
    console.error("Unexpected OpenAI image edit response:", JSON.stringify(data));
    throw new Error("OpenAI image edit failed: response did not include image data");
  }

  return base64ToArrayBuffer(image);
}

function buildBaseCharacterReferencePrompt(prompt: string, stylePrompt?: string, blockingRules?: string): string {
  return [
    `Collection concept: ${prompt}`,
    stylePrompt ? `Locked style: ${stylePrompt}` : "Locked style: consistent NFT collection art",
    blockingRules?.trim() ? `Blocking rules: ${blockingRules.trim()}` : "",
    "Generate one complete front-facing bust character reference for an NFT layered generator",
    characterRigBlueprint,
    "Include the full base body, head, face, eyes, mouth, hair placeholder silhouette, and outfit placeholder so every later layer can align to this exact reference",
    "Neutral expression, centered, clean silhouette, no text, no logo, no watermark, no frame",
  ].join(". ");
}

function buildTrueLayerEditPrompt(layer: GeneratedLayer, variantNumber: number): string {
  const isBackground = !layer.removeBackground;

  if (isBackground) {
    return [
      layer.prompt,
      `Variant ${variantNumber}`,
      "Background layer only, no character and no foreground subject",
    ].join(". ");
  }

  return [
    "Use the provided base character image only as an alignment reference",
    "Preserve the exact pose, centerline, canvas size, body silhouette anchors, head box, eye anchors, mouth anchor, neck, shoulders, and torso scale from the reference",
    layer.prompt,
    `Variant ${variantNumber}`,
    "Output only this requested layer asset on a pure white background for background removal",
    "Do not output a completed character",
    "Do not include any unrelated parts from the reference image",
    "No shadows, scenery, text, logo, watermark, border, or frame",
  ].join(". ");
}

function buildImageToLayerEditPrompt(layer: GeneratedLayer, variantNumber: number): string {
  const isBackground = !layer.removeBackground;

  if (isBackground) {
    return [
      layer.prompt,
      `Variant ${variantNumber}`,
      "Create a background/backplate that matches the uploaded image's art style, lighting, palette, and world",
      "Do not copy or include the uploaded character, animal, person, creature, body, face, silhouette, clothing, or foreground subject",
      "Output only the environment/background layer",
    ].join(". ");
  }

  return [
    "Use the uploaded image as the source artwork and alignment reference",
    "Extract or faithfully recreate only the requested NFT generator layer from the uploaded character",
    "Preserve the exact canvas size, pose, centerline, scale, head box, eye anchors, mouth anchor, neck, shoulders, and torso position from the uploaded image",
    layer.prompt,
    `Variant ${variantNumber}`,
    "Output only this layer asset on a pure white background for background removal",
    "Do not output the full completed character",
    "Do not include unrelated layers, background, shadows, scenery, text, logo, watermark, border, or frame",
  ].join(". ");
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes.buffer;
}

function cleanBase64Image(value: string): string {
  return value.includes(",") ? value.split(",").pop() || "" : value;
}

async function generateImageWithCloudflare(prompt: string): Promise<ArrayBuffer> {
  const accountId = requireSecret(CLOUDFLARE_ACCOUNT_ID, "CLOUDFLARE_ACCOUNT_ID");
  const apiToken = requireSecret(CLOUDFLARE_API_TOKEN, "CLOUDFLARE_API_TOKEN");
  const encodedModel = CLOUDFLARE_IMAGE_MODEL
    .split("/")
    .map((part) => encodeURIComponent(part))
    .join("/");

  const cloudflarePrompt = buildProviderPrompt(prompt, "cloudflare");
  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${encodedModel}`,
    {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt: cloudflarePrompt,
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

async function removeBackground(imageBuffer: ArrayBuffer, layerName: string): Promise<ArrayBuffer> {
  if (!REMOVAL_API_KEY) {
    throw new Error(
      `Missing Edge Function secret: REMOVAL_API_KEY. ${layerName} must be converted to a transparent PNG layer before upload.`
    );
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
    throw new Error(`Background removal failed for ${layerName}: ${errorText}`);
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
      coverPrompt,
      bannerPrompt,
      stylePrompt,
      referenceImageBase64,
      blockingRules,
      generationMode = "true-layered",
      generateCollectionImages = true,
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

    const resolvedGenerationMode: GenerationMode =
      generationMode === "prompt-layers"
        ? "prompt-layers"
        : generationMode === "image-to-layers"
        ? "image-to-layers"
        : "true-layered";

    if ((resolvedGenerationMode === "true-layered" || resolvedGenerationMode === "image-to-layers") && !OPENAI_API_KEY) {
      throw new Error(
        "True Layer Kit and Image to Layers modes require OPENAI_API_KEY because they use OpenAI image edits with a shared character reference. Prompt Layers can use the fallback provider chain without OpenAI."
      );
    }

    if (resolvedGenerationMode === "image-to-layers" && (!referenceImageBase64 || typeof referenceImageBase64 !== "string")) {
      throw new Error("Image to Layers mode requires an uploaded referenceImageBase64 source image.");
    }

    const layerPlan = buildLayerPlan(prompt, layerPrompts, traitsPerLayer, stylePrompt, blockingRules);
    const generatorLayers = [];
    const previewLayers = [];
    let uploadedCoverImage: UploadedAsset | null = null;
    let uploadedBannerImage: UploadedAsset | null = null;
    let baseCharacterReference: ArrayBuffer | null = null;

    if (resolvedGenerationMode === "true-layered" || resolvedGenerationMode === "image-to-layers") {
      if (referenceImageBase64 && typeof referenceImageBase64 === "string") {
        console.log(
          resolvedGenerationMode === "image-to-layers"
            ? "Using uploaded source image to extract NFT layers..."
            : "Using uploaded base character reference for true layer alignment..."
        );
        baseCharacterReference = base64ToArrayBuffer(cleanBase64Image(referenceImageBase64));
      } else {
        console.log("Generating OpenAI base character reference for true layer alignment...");
        baseCharacterReference = await generateImageWithOpenAI(
          buildBaseCharacterReferencePrompt(prompt, stylePrompt, blockingRules),
          "1:1"
        );
      }
    }

    if (generateCollectionImages) {
      console.log("Generating collection cover and banner...");
      const [coverImage, bannerImage] = await Promise.all([
        generateImage(buildCollectionImagePrompt(prompt, "cover", coverPrompt), "1:1"),
        generateImage(buildCollectionImagePrompt(prompt, "banner", bannerPrompt), "16:9"),
      ]);

      const [coverUpload, bannerUpload] = await Promise.all([
        uploadFileToPinata(coverImage, "collection-cover.png"),
        uploadFileToPinata(bannerImage, "collection-banner.png"),
      ]);

      uploadedCoverImage = coverUpload;
      uploadedBannerImage = bannerUpload;
    }

    for (const layer of layerPlan) {
      console.log(`Generating ${layer.name} layer with ${layer.traitCount} traits...`);
      const traits = await Promise.all(
        Array.from({ length: layer.traitCount }, async (_item, traitIndex): Promise<GeneratedTrait> => {
          const variantNumber = traitIndex + 1;
          const traitPrompt = [
            resolvedGenerationMode === "image-to-layers"
              ? buildImageToLayerEditPrompt(layer, variantNumber)
              : resolvedGenerationMode === "true-layered"
              ? buildTrueLayerEditPrompt(layer, variantNumber)
              : layer.prompt,
            resolvedGenerationMode === "prompt-layers"
              ? `Variant ${variantNumber}`
              : "",
            resolvedGenerationMode === "prompt-layers"
              ? "Distinct from the other variants while preserving the same fixed rig, body shape anchors, layer alignment, and NFT collection style"
              : "Distinct from the other variants while preserving the same reference alignment and NFT collection style",
          ].filter(Boolean).join(". ");
          const generatedImage = (resolvedGenerationMode === "true-layered" || resolvedGenerationMode === "image-to-layers") && layer.removeBackground && baseCharacterReference
            ? await editImageWithOpenAI(baseCharacterReference, traitPrompt)
            : await generateImage(traitPrompt);
          const layerImage = layer.removeBackground
            ? await removeBackground(generatedImage, layer.name)
            : generatedImage;
          const quality = layer.removeBackground
            ? inspectPngTransparency(layerImage)
            : { hasTransparency: false, warnings: [] };

          if (layer.removeBackground && !quality.hasTransparency) {
            throw new Error(`Transparent quality check failed for ${layer.name}: ${quality.warnings.join(", ")}`);
          }

          const uploadedLayer = await uploadFileToPinata(
            layerImage,
            `${layer.id}-${variantNumber}.png`
          );

          console.log(`${layer.name} trait ${variantNumber} uploaded:`, uploadedLayer.url);

          return {
            id: `${layer.id}-${variantNumber}`,
            name: buildTraitName(layer.name, layer.prompt, variantNumber),
            url: uploadedLayer.url,
            cid: uploadedLayer.cid,
            rarity: 100,
            hasTransparency: quality.hasTransparency,
            qualityWarnings: quality.warnings,
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
      image: uploadedCoverImage?.url || previewLayers[0]?.url,
      banner_image: uploadedBannerImage?.url,
      generationMode: resolvedGenerationMode,
      blockingRules: blockingRules || "",
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
          hasTransparency: trait.hasTransparency,
          qualityWarnings: trait.qualityWarnings,
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
        generationMode: resolvedGenerationMode,
        imageUrl: uploadedCoverImage?.url || previewLayer?.url,
        imageCID: uploadedCoverImage?.cid || previewLayer?.cid,
        coverImageUrl: uploadedCoverImage?.url,
        coverImageCID: uploadedCoverImage?.cid,
        bannerImageUrl: uploadedBannerImage?.url,
        bannerImageCID: uploadedBannerImage?.cid,
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
            hasTransparency: trait.hasTransparency,
            qualityWarnings: trait.qualityWarnings,
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
