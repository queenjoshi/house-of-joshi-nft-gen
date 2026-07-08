'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, CheckCircle2, Download, Loader2, Package, Plus, RefreshCw, Save, Shuffle, Sparkles, Trash2, Wand2, Crown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { useAIGenerationStore, type AIGeneratedCollectionDraft } from '@/lib/store';
import {
  generateLayeredNFT,
  testEdgeFunctionConnectivity,
  type AIGenerationResponse,
  type AILayerPrompt,
  type GeneratedLayerAsset,
} from '@/lib/ai-layered';
import Link from 'next/link';
import { useAccount } from 'wagmi';

const defaultLayerPrompts: AILayerPrompt[] = [
  { id: 'background', name: 'Background', prompt: '10 clean collectible background swatches or scenes only, no character, no animal, no face, no body, no foreground subject', traitCount: 10 },
  { id: 'skin', name: 'Skin', prompt: '10 full base character skin/body variants on the exact same bust pose, head, face, torso and neck silhouette, no clothes, no hat, no accessories, no background', traitCount: 10 },
  { id: 'outfit', name: 'Outfit', prompt: '10 shirts, jackets, armor or clothing traits only, fitted to the same torso and neck anchors, no head, no face, no background', traitCount: 10 },
  { id: 'face', name: 'Face', prompt: '10 face accessory or expression traits such as glasses, beard, moustache, cigar, laser eyes, robot eye; fit the same head anchors, no hat, no outfit, no background', traitCount: 10 },
  { id: 'hat', name: 'Hat', prompt: '10 hats or headwear traits only, fitted to the same head box, no face, no body, no outfit, no background', traitCount: 10 },
];

function createLayerPrompt(): AILayerPrompt {
  return {
    id: crypto.randomUUID(),
    name: 'Custom',
    prompt: 'custom trait layer, transparent background',
    traitCount: 1,
  };
}

function summarizeConcept(value: string) {
  return value.trim().replace(/\s+/g, ' ');
}

function createSuggestedLayerPrompts(mainPrompt: string): AILayerPrompt[] {
  const concept = summarizeConcept(mainPrompt);
  const stylePrefix = concept ? `matching ${concept}` : 'matching the collection style';
  const backgroundDirection = concept
    ? `thematic backdrop inspired by the colors, mood, and world of ${concept}; environment only; no animals, no people, no character, no mascot, no face, no body, no foreground subject`
    : 'thematic backdrop for the collection; environment only; no animals, no people, no character, no mascot, no face, no body, no foreground subject';

  return [
    { id: 'background', name: 'Background', prompt: `${backgroundDirection}; create 10 distinct backdrop traits like color swatches, simple gradients, rooms, skies, walls, patterns or environments`, traitCount: 10 },
    { id: 'skin', name: 'Skin', prompt: `${stylePrefix}; create 10 full base character skin/body variants on the exact same front-facing bust pose, same head, ears, face base, neck and torso silhouette; no clothing, no hat, no accessories, no background`, traitCount: 10 },
    { id: 'outfit', name: 'Outfit', prompt: `${stylePrefix}; create 10 outfit traits such as shirts, jackets, armor, robes or uniforms; clothing only, fitted to the torso and neck anchors; no face, no head, no hat, no background`, traitCount: 10 },
    { id: 'face', name: 'Face', prompt: `${stylePrefix}; create 10 face accessory or expression traits such as glasses, beard, moustache, eye patch, cigar, laser eyes, robot eye or mouth props; fit the same head anchors; no hat, no outfit, no background`, traitCount: 10 },
    { id: 'hat', name: 'Hat', prompt: `${stylePrefix}; create 10 hat or headwear traits such as cap, crown, helmet, cowboy hat, captain hat or beanie; headwear only, fitted to the same head box; no face, no outfit, no background`, traitCount: 10 },
  ];
}

function createCoverPrompt(mainPrompt: string) {
  const concept = summarizeConcept(mainPrompt);
  return concept
    ? `Square marketplace cover for ${concept}, iconic full collection artwork, no text or logo`
    : 'Square marketplace cover for the NFT collection, iconic full collection artwork, no text or logo';
}

function createBannerPrompt(mainPrompt: string) {
  const concept = summarizeConcept(mainPrompt);
  return concept
    ? `Wide NFT drop banner for ${concept}, cinematic horizontal composition, no text or logo`
    : 'Wide NFT drop banner for the collection, cinematic horizontal composition, no text or logo';
}

function createCollectionName(mainPrompt: string) {
  const words = summarizeConcept(mainPrompt)
    .split(' ')
    .filter(Boolean)
    .slice(0, 4)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase());

  return words.length ? `${words.join(' ')} Collection` : 'AI Generated Collection';
}

function createCollectionSymbol(name: string) {
  const symbol = name
    .replace(/collection/gi, '')
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word[0])
    .join('')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 6);

  return symbol || 'AIGEN';
}

function safeFolderName(value: string, fallback: string) {
  const cleaned = value
    .trim()
    .replace(/[^a-z0-9 -]+/gi, '')
    .replace(/\s+/g, ' ')
    .slice(0, 48);

  return cleaned || fallback;
}

function safeFileName(value: string, fallback: string) {
  return safeFolderName(value, fallback).replace(/\s+/g, '-').toLowerCase();
}

type SampleComposition = {
  id: string;
  traitIds: Record<string, string>;
};

const crcTable = Array.from({ length: 256 }, (_item, index) => {
  let value = index;
  for (let bit = 0; bit < 8; bit += 1) {
    value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
  }
  return value >>> 0;
});

function crc32(bytes: Uint8Array) {
  let crc = 0xffffffff;
  for (let index = 0; index < bytes.length; index += 1) {
    const byte = bytes[index];
    crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function textBytes(value: string) {
  return new TextEncoder().encode(value);
}

function numberToBytes(value: number, bytes: number) {
  const output = new Uint8Array(bytes);
  for (let index = 0; index < bytes; index += 1) {
    output[index] = (value >>> (index * 8)) & 0xff;
  }
  return output;
}

function concatBytes(chunks: Uint8Array[]) {
  const length = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const output = new Uint8Array(length);
  let offset = 0;
  chunks.forEach((chunk) => {
    output.set(chunk, offset);
    offset += chunk.length;
  });
  return output;
}

function createStoredZip(files: Array<{ path: string; bytes: Uint8Array }>) {
  const localParts: Uint8Array[] = [];
  const centralParts: Uint8Array[] = [];
  let offset = 0;

  files.forEach((file) => {
    const name = textBytes(file.path);
    const checksum = crc32(file.bytes);
    const localHeader = concatBytes([
      numberToBytes(0x04034b50, 4),
      numberToBytes(20, 2),
      numberToBytes(0, 2),
      numberToBytes(0, 2),
      numberToBytes(0, 2),
      numberToBytes(0, 2),
      numberToBytes(checksum, 4),
      numberToBytes(file.bytes.length, 4),
      numberToBytes(file.bytes.length, 4),
      numberToBytes(name.length, 2),
      numberToBytes(0, 2),
      name,
    ]);

    localParts.push(localHeader, file.bytes);
    centralParts.push(concatBytes([
      numberToBytes(0x02014b50, 4),
      numberToBytes(20, 2),
      numberToBytes(20, 2),
      numberToBytes(0, 2),
      numberToBytes(0, 2),
      numberToBytes(0, 2),
      numberToBytes(0, 2),
      numberToBytes(checksum, 4),
      numberToBytes(file.bytes.length, 4),
      numberToBytes(file.bytes.length, 4),
      numberToBytes(name.length, 2),
      numberToBytes(0, 2),
      numberToBytes(0, 2),
      numberToBytes(0, 2),
      numberToBytes(0, 2),
      numberToBytes(0, 4),
      numberToBytes(offset, 4),
      name,
    ]));
    offset += localHeader.length + file.bytes.length;
  });

  const centralDirectory = concatBytes(centralParts);
  const endRecord = concatBytes([
    numberToBytes(0x06054b50, 4),
    numberToBytes(0, 2),
    numberToBytes(0, 2),
    numberToBytes(files.length, 2),
    numberToBytes(files.length, 2),
    numberToBytes(centralDirectory.length, 4),
    numberToBytes(offset, 4),
    numberToBytes(0, 2),
  ]);

  return new Blob([...localParts, centralDirectory, endRecord], { type: 'application/zip' });
}

export default function AIGeneratorPage() {
  const { isConnected } = useAccount();
  const setAIDraft = useAIGenerationStore((state) => state.setDraft);
  const saveAIDraft = useAIGenerationStore((state) => state.saveDraft);
  const savedDrafts = useAIGenerationStore((state) => state.savedDrafts);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationMode, setGenerationMode] = useState<'true-layered' | 'image-to-layers' | 'prompt-layers'>('true-layered');
  const [prompt, setPrompt] = useState('');
  const [referenceImageBase64, setReferenceImageBase64] = useState('');
  const [referenceImagePreview, setReferenceImagePreview] = useState('');
  const [blockingRules, setBlockingRules] = useState('No text, no logos, no watermark, no extra characters, no duplicate subjects, no cropped body parts, no random props outside the selected layer. Background must never contain the collection character or animal.');
  const [stylePrompt, setStylePrompt] = useState('');
  const [coverPrompt, setCoverPrompt] = useState('');
  const [bannerPrompt, setBannerPrompt] = useState('');
  const [collectionName, setCollectionName] = useState('');
  const [collectionSymbol, setCollectionSymbol] = useState('');
  const [description, setDescription] = useState('');
  const [maxSupply, setMaxSupply] = useState('100');
  const [mintPrice, setMintPrice] = useState('0.01');
  const [royaltyPercentage, setRoyaltyPercentage] = useState('5');
  const [layerPrompts, setLayerPrompts] = useState<AILayerPrompt[]>(defaultLayerPrompts);
  const [hasEditedSuggestions, setHasEditedSuggestions] = useState(false);
  const [generatedLayerAssets, setGeneratedLayerAssets] = useState<Record<string, GeneratedLayerAsset>>({});
  const [selectedTraits, setSelectedTraits] = useState<Record<string, string>>({});
  const [sampleCompositions, setSampleCompositions] = useState<SampleComposition[]>([]);
  const [isDownloadingZip, setIsDownloadingZip] = useState(false);
  const [generatingLayerId, setGeneratingLayerId] = useState<string | null>(null);
  const [generatedResult, setGeneratedResult] = useState<AIGenerationResponse | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (hasEditedSuggestions) return;

    const concept = summarizeConcept(prompt);
    if (concept.length < 12) return;

    setLayerPrompts(createSuggestedLayerPrompts(concept));
    setCoverPrompt(createCoverPrompt(concept));
    setBannerPrompt(createBannerPrompt(concept));
    setStylePrompt(`Consistent ${concept} NFT collection style, fixed centered bust portrait rig, same head box, same eye anchors, same mouth anchor, same torso silhouette, same lighting, same linework`);
  }, [prompt, hasEditedSuggestions]);

  useEffect(() => {
    const nextSelected = { ...selectedTraits };
    Object.values(generatedLayerAssets).forEach((layer) => {
      if (!nextSelected[layer.id] && layer.traits[0]) {
        nextSelected[layer.id] = layer.traits[0].id;
      }
    });
    setSelectedTraits(nextSelected);
  }, [generatedLayerAssets]);

  const orderedGeneratedLayers = layerPrompts
    .map((layerPrompt) => generatedLayerAssets[layerPrompt.id])
    .filter((layer): layer is GeneratedLayerAsset => Boolean(layer));

  const selectedPreviewLayers = orderedGeneratedLayers
    .map((layer) => {
      const selectedTraitId = selectedTraits[layer.id];
      return layer.traits.find((trait) => trait.id === selectedTraitId) || layer.traits[0];
    })
    .filter(Boolean);

  const qualityWarnings = orderedGeneratedLayers.flatMap((layer) =>
    layer.traits.flatMap((trait) =>
      trait.qualityWarnings?.length
        ? trait.qualityWarnings.map((warning) => `${layer.name} / ${trait.name}: ${warning}`)
        : []
    )
  );

  const generatedTraitCount = orderedGeneratedLayers.reduce((sum, layer) => sum + layer.traits.length, 0);
  const readyStepCount = [
    prompt.trim().length > 0,
    orderedGeneratedLayers.length > 0,
    sampleCompositions.length > 0,
    Boolean(generatedResult?.generatorLayers?.length),
  ].filter(Boolean).length;

  const applyPromptSuggestions = () => {
    const concept = summarizeConcept(prompt);
    setLayerPrompts(createSuggestedLayerPrompts(concept));
    setCoverPrompt(createCoverPrompt(concept));
    setBannerPrompt(createBannerPrompt(concept));
    setStylePrompt(concept ? `Consistent ${concept} NFT collection style, fixed centered bust portrait rig, same head box, same eye anchors, same mouth anchor, same torso silhouette, same lighting, same linework` : '');
    setHasEditedSuggestions(false);
  };

  const handleReferenceImageUpload = (file: File | null) => {
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Upload an image file to use as the collection reference.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const value = typeof reader.result === 'string' ? reader.result : '';
      const base64 = value.includes(',') ? value.split(',').pop() || '' : value;
      setReferenceImagePreview(value);
      setReferenceImageBase64(base64);
      setError('Reference image loaded. Image to Layers can extract layers from it, and True Layer Kit can use it for consistency.');
    };
    reader.onerror = () => setError('Could not read the reference image.');
    reader.readAsDataURL(file);
  };

  const updateLayerPrompt = (id: string, updates: Partial<AILayerPrompt>) => {
    setHasEditedSuggestions(true);
    setLayerPrompts((current) =>
      current.map((layer) => (layer.id === id ? { ...layer, ...updates } : layer))
    );
  };

  const removeLayerPrompt = (id: string) => {
    setHasEditedSuggestions(true);
    setLayerPrompts((current) => current.filter((layer) => layer.id !== id));
    setGeneratedLayerAssets((current) => {
      const next = { ...current };
      delete next[id];
      return next;
    });
  };

  const saveDraft = (
    result: AIGenerationResponse,
    generatorLayers = result.generatorLayers || []
  ): AIGeneratedCollectionDraft => {
    const previewImage = result.coverImageUrl || result.imageUrl || generatorLayers[0]?.traits[0]?.preview || '';

    const draft: AIGeneratedCollectionDraft = {
      generationMode,
      prompt,
      stylePrompt,
      blockingRules,
      coverPrompt,
      bannerPrompt,
      collectionName: collectionName || 'AI Generated Collection',
      collectionSymbol: collectionSymbol || 'AI',
      description,
      maxSupply: parseInt(maxSupply),
      mintPrice,
      royaltyPercentage: parseFloat(royaltyPercentage),
      imageUrl: previewImage,
      coverImageUrl: result.coverImageUrl || previewImage,
      bannerImageUrl: result.bannerImageUrl || '',
      metadataUrl: result.metadataUrl || '',
      imageCID: result.imageCID || null,
      metadataCID: result.metadataCID || null,
      layers: result.layers?.length
        ? result.layers
        : previewImage
          ? [{ id: 'preview', url: previewImage, zIndex: 0 }]
          : [],
      generatorLayers: generatorLayers.map((layer) => ({
        ...layer,
        traits: layer.traits.map((trait) => ({
          ...trait,
          file: null,
        })),
      })),
      createdAt: Date.now(),
    };

    setAIDraft(draft);
    return draft;
  };

  const persistCurrentKit = () => {
    if (!generatedResult || !orderedGeneratedLayers.length) {
      setError('Generate layers before saving this AI kit.');
      return;
    }

    const draft = saveDraft(
      {
        ...generatedResult,
        generatorLayers: orderedGeneratedLayers,
      },
      orderedGeneratedLayers
    );
    saveAIDraft(draft);
    setError('AI layer kit saved to dashboard.');
  };

  const loadSavedKit = (createdAt: number) => {
    const draft = savedDrafts.find((saved) => saved.createdAt === createdAt);
    if (!draft?.generatorLayers?.length) return;

    setPrompt(draft.prompt);
    setGenerationMode(draft.generationMode || 'true-layered');
    setBlockingRules(draft.blockingRules || blockingRules);
    setStylePrompt(draft.stylePrompt || '');
    setCoverPrompt(draft.coverPrompt || '');
    setBannerPrompt(draft.bannerPrompt || '');
    setCollectionName(draft.collectionName);
    setCollectionSymbol(draft.collectionSymbol);
    setDescription(draft.description);
    setMaxSupply(String(draft.maxSupply));
    setMintPrice(draft.mintPrice);
    setRoyaltyPercentage(String(draft.royaltyPercentage));
    setGeneratedLayerAssets(Object.fromEntries(draft.generatorLayers.map((layer) => [layer.id, layer])));
    setLayerPrompts(draft.generatorLayers.map((layer) => ({
      id: layer.id,
      name: layer.name,
      prompt: `${layer.name} layer`,
      traitCount: layer.traits.length || 1,
    })));
    setGeneratedResult({
      success: true,
      imageUrl: draft.imageUrl,
      coverImageUrl: draft.coverImageUrl,
      bannerImageUrl: draft.bannerImageUrl,
      metadataUrl: draft.metadataUrl,
      metadataCID: draft.metadataCID,
      imageCID: draft.imageCID,
      layers: draft.layers,
      generatorLayers: draft.generatorLayers,
    });
    setError('Saved AI kit loaded.');
  };

  const downloadMetadata = () => {
    if (!generatedResult) return;

    const metadata = {
      collectionName,
      collectionSymbol,
      description,
      maxSupply: parseInt(maxSupply),
      mintPrice,
      royaltyPercentage: parseFloat(royaltyPercentage),
      stylePrompt,
      blockingRules,
      coverPrompt,
      bannerPrompt,
      metadataUrl: generatedResult.metadataUrl,
      metadataCID: generatedResult.metadataCID,
      coverImageUrl: generatedResult.coverImageUrl,
      bannerImageUrl: generatedResult.bannerImageUrl,
      layers: generatedResult.generatorLayers,
    };

    const blob = new Blob([JSON.stringify(metadata, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${collectionSymbol || 'ai-collection'}-ai-layer-metadata.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleTestConnection = async () => {
    setError('');
    setError('Testing connection...');
    const result = await testEdgeFunctionConnectivity();
    if (result.success) {
      setError('Connection successful! You can now generate.');
    } else {
      setError(`Connection failed: ${result.error}`);
    }
  };

  const handleGenerate = async () => {
    if (!isConnected) {
      setError('Please connect your wallet first');
      return;
    }

    if (!prompt.trim()) {
      setError('Write a main prompt first. Example: cyberpunk cats with royal jackets, clean collectible art.');
      return;
    }

    const resolvedCollectionName = collectionName.trim() || createCollectionName(prompt);
    const resolvedCollectionSymbol = collectionSymbol.trim() || createCollectionSymbol(resolvedCollectionName);

    if (!collectionName.trim()) setCollectionName(resolvedCollectionName);
    if (!collectionSymbol.trim()) setCollectionSymbol(resolvedCollectionSymbol);

    if (generationMode === 'image-to-layers' && !referenceImageBase64) {
      setError('Upload a finished character image before using Image to Layers mode.');
      return;
    }

    setIsGenerating(true);
    setError('');

    try {
      const result = await generateLayeredNFT({
        prompt,
        generationMode,
        referenceImageBase64,
        blockingRules,
        stylePrompt,
        coverPrompt,
        bannerPrompt,
        generateCollectionImages: true,
        layerPrompts: layerPrompts.filter((layer) => layer.name.trim() && layer.prompt.trim()),
        collectionName: resolvedCollectionName,
        collectionSymbol: resolvedCollectionSymbol,
        description,
        maxSupply: parseInt(maxSupply),
        mintPrice,
        royaltyPercentage: parseFloat(royaltyPercentage),
      });

      if (result.success && result.imageUrl && result.metadataUrl) {
        if (result.generatorLayers?.length) {
          setGeneratedLayerAssets(
            Object.fromEntries(result.generatorLayers.map((layer) => [layer.id, layer]))
          );
        }
        saveDraft(result);
        setGeneratedResult(result);
      } else {
        setError(result.error || 'Generation completed without usable image metadata');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateLayer = async (layer: AILayerPrompt) => {
    if (!isConnected) {
      setError('Please connect your wallet first');
      return;
    }

    if (!prompt.trim() || !layer.name.trim() || !layer.prompt.trim()) {
      setError('Add a main prompt and fill in this layer before generating.');
      return;
    }

    if (generationMode === 'image-to-layers' && !referenceImageBase64) {
      setError('Upload a finished character image before generating layers from an image.');
      return;
    }

    setGeneratingLayerId(layer.id);
    setError('');

    try {
      const result = await generateLayeredNFT({
        prompt,
        generationMode,
        referenceImageBase64,
        blockingRules,
        stylePrompt,
        generateCollectionImages: false,
        layerPrompts: [layer],
        collectionName: collectionName || 'AI Generated Collection',
        collectionSymbol: collectionSymbol || 'AI',
        description,
        maxSupply: parseInt(maxSupply),
        mintPrice,
        royaltyPercentage: parseFloat(royaltyPercentage),
      });

      const generatedLayer = result.generatorLayers?.[0];

      if (result.success && generatedLayer) {
        const nextGeneratedLayers = {
          ...generatedLayerAssets,
          [generatedLayer.id]: generatedLayer,
        };
        const orderedGeneratedLayers = layerPrompts
          .map((layerPrompt) => nextGeneratedLayers[layerPrompt.id])
          .filter((generatedLayer): generatedLayer is GeneratedLayerAsset => Boolean(generatedLayer));

        setGeneratedLayerAssets(nextGeneratedLayers);
        saveDraft(result, orderedGeneratedLayers);
        setGeneratedResult({
          ...result,
          generatorLayers: orderedGeneratedLayers,
        });
      } else {
        setError(result.error || `Could not generate ${layer.name}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setGeneratingLayerId(null);
    }
  };

  const updateTrait = (layerId: string, traitId: string, updates: Partial<GeneratedLayerAsset['traits'][number]>) => {
    const nextGeneratedLayers = {
      ...generatedLayerAssets,
      [layerId]: {
        ...generatedLayerAssets[layerId],
        traits: generatedLayerAssets[layerId].traits.map((trait) =>
          trait.id === traitId ? { ...trait, ...updates } : trait
        ),
      },
    };

    setGeneratedLayerAssets(nextGeneratedLayers);
    const nextLayers = layerPrompts
      .map((layerPrompt) => nextGeneratedLayers[layerPrompt.id])
      .filter((layer): layer is GeneratedLayerAsset => Boolean(layer));

    if (generatedResult) {
      const nextResult = { ...generatedResult, generatorLayers: nextLayers };
      setGeneratedResult(nextResult);
      saveDraft(nextResult, nextLayers);
    }
  };

  const handleRegenerateTrait = async (layer: AILayerPrompt, traitId: string) => {
    if (!prompt.trim() || !layer.name.trim()) {
      setError('Add a main prompt and layer name before regenerating.');
      return;
    }

    if (generationMode === 'image-to-layers' && !referenceImageBase64) {
      setError('Upload a finished character image before regenerating layers from an image.');
      return;
    }

    setGeneratingLayerId(`${layer.id}:${traitId}`);
    setError('');

    try {
      const result = await generateLayeredNFT({
        prompt,
        generationMode,
        referenceImageBase64,
        blockingRules,
        stylePrompt,
        generateCollectionImages: false,
        layerPrompts: [{ ...layer, traitCount: 1 }],
        collectionName: collectionName || 'AI Generated Collection',
        collectionSymbol: collectionSymbol || 'AI',
        description,
        maxSupply: parseInt(maxSupply),
        mintPrice,
        royaltyPercentage: parseFloat(royaltyPercentage),
      });

      const replacement = result.generatorLayers?.[0]?.traits[0];
      const currentLayer = generatedLayerAssets[layer.id];
      if (!result.success || !replacement || !currentLayer) {
        setError(result.error || `Could not regenerate ${layer.name}`);
        return;
      }

      const nextGeneratedLayers = {
        ...generatedLayerAssets,
        [layer.id]: {
          ...currentLayer,
          traits: currentLayer.traits.map((trait) =>
            trait.id === traitId
              ? { ...replacement, id: trait.id, rarity: trait.rarity }
              : trait
          ),
        },
      };
      const nextLayers = layerPrompts
        .map((layerPrompt) => nextGeneratedLayers[layerPrompt.id])
        .filter((generatedLayer): generatedLayer is GeneratedLayerAsset => Boolean(generatedLayer));

      setGeneratedLayerAssets(nextGeneratedLayers);
      const nextResult = {
        ...(generatedResult || result),
        generatorLayers: nextLayers,
      };
      setGeneratedResult(nextResult);
      saveDraft(nextResult, nextLayers);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setGeneratingLayerId(null);
    }
  };

  const generateSampleCompositions = () => {
    if (!orderedGeneratedLayers.length) {
      setError('Generate layers before creating sample NFTs.');
      return;
    }

    const samples = Array.from({ length: 12 }, (_item, index) => ({
      id: `sample-${Date.now()}-${index}`,
      traitIds: Object.fromEntries(
        orderedGeneratedLayers.map((layer) => {
          const total = layer.traits.reduce((sum, trait) => sum + Math.max(1, trait.rarity), 0);
          let roll = Math.random() * total;
          const picked = layer.traits.find((trait) => {
            roll -= Math.max(1, trait.rarity);
            return roll <= 0;
          }) || layer.traits[0];
          return [layer.id, picked.id];
        })
      ),
    }));

    setSampleCompositions(samples);
  };

  const downloadLayerZip = async () => {
    if (!orderedGeneratedLayers.length) {
      setError('Generate layers before downloading a ZIP.');
      return;
    }

    setIsDownloadingZip(true);
    setError('');

    try {
      const files: Array<{ path: string; bytes: Uint8Array }> = [
        {
          path: 'metadata/ai-layer-kit.json',
          bytes: textBytes(JSON.stringify({
            collectionName,
            collectionSymbol,
            description,
            stylePrompt,
            blockingRules,
            coverPrompt,
            bannerPrompt,
            layers: orderedGeneratedLayers,
          }, null, 2)),
        },
      ];

      await Promise.all(
        orderedGeneratedLayers.flatMap((layer) =>
          layer.traits.map(async (trait) => {
            const response = await fetch(trait.preview);
            if (!response.ok) throw new Error(`Could not download ${trait.name}`);
            files.push({
              path: `${safeFolderName(layer.name, 'Layer')}/${safeFileName(trait.name, 'trait')}.png`,
              bytes: new Uint8Array(await response.arrayBuffer()),
            });
          })
        )
      );

      const blob = createStoredZip(files);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${collectionSymbol || 'ai'}-layers.zip`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not download ZIP');
    } finally {
      setIsDownloadingZip(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 py-5 sm:py-6 md:py-8">
        <div className="container px-3 sm:px-4 max-w-7xl">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 md:mb-8"
          >
            <h1 className="font-display text-2xl md:text-3xl font-bold mb-2 flex items-center gap-2 md:gap-3">
              <Wand2 className="h-6 w-6 md:h-8 md:w-8 text-crown" />
              AI Layered NFT Generator
            </h1>
            <p className="text-muted-foreground text-sm md:text-base">
              Turn one prompt or reference image into stackable NFT trait folders for the Launchpad.
            </p>
          </motion.div>

          {!isConnected ? (
            <Card className="royal-card text-center py-12 md:py-16">
              <CardContent>
                <Crown className="h-12 md:h-16 w-12 md:w-16 mx-auto mb-4 text-muted-foreground" />
                <h2 className="font-display text-lg md:text-xl font-bold mb-2">Connect Your Wallet</h2>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto text-sm md:text-base">
                  Connect your wallet to start generating AI-powered layered NFTs.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid min-w-0 grid-cols-1 items-start gap-4 sm:gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
              {/* Generator Form */}
              <Card className="royal-card min-w-0 overflow-hidden">
                <CardHeader className="p-4 sm:p-6">
                  <CardTitle className="flex min-w-0 items-center gap-2 text-lg leading-6 sm:text-xl">
                    <Sparkles className="h-5 w-5 flex-shrink-0 text-crown" />
                    <span className="min-w-0 break-words">Create Your AI Layered NFT</span>
                  </CardTitle>
                  <CardDescription>
                    Generate collection-ready trait layers, pin metadata, then send them into the launchpad.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 px-4 pb-4 pt-0 sm:px-6 sm:pb-6">
                  <div className="grid gap-2 rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 sm:grid-cols-4">
                    {[
                      ['1', 'Write prompt', prompt.trim() ? 'Ready' : 'Describe your collection'],
                      ['2', 'Generate layers', orderedGeneratedLayers.length ? `${orderedGeneratedLayers.length} layers` : 'Use all layers or one row'],
                      ['3', 'Preview samples', sampleCompositions.length ? `${sampleCompositions.length} samples` : 'Check stacked NFTs'],
                      ['4', 'Launch', generatedResult?.generatorLayers?.length ? 'Ready for Launchpad' : 'Save or export kit'],
                    ].map(([step, title, detail], index) => (
                      <div
                        key={step}
                        className={`rounded-md border p-2 ${
                          index < readyStepCount
                            ? 'border-green-500/30 bg-green-500/10 text-green-200'
                            : 'border-royal-500/20 bg-black/10 text-muted-foreground'
                        }`}
                      >
                        <div className="flex items-center gap-2 text-xs font-medium">
                          {index < readyStepCount ? (
                            <CheckCircle2 className="h-3.5 w-3.5" />
                          ) : (
                            <span className="grid h-4 w-4 place-items-center rounded-full border border-current text-[10px]">{step}</span>
                          )}
                          {title}
                        </div>
                        <p className="mt-1 text-[11px]">{detail}</p>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="prompt">Main Collection Prompt *</Label>
                    <Textarea
                      id="prompt"
                      placeholder="Example: cute cyberpunk cats, royal streetwear, clean 2D collectible art, front-facing bust, bold outlines"
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      rows={4}
                      className="royal-border"
                    />
                    <p className="text-xs text-muted-foreground">
                      Start here. The app will suggest a classic generator kit: Background, Skin, Outfit, Face, and Hat.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_180px] gap-3 rounded-lg border border-royal-500/30 p-3">
                    <div className="space-y-2">
                      <Label htmlFor="referenceImage">Reference Image</Label>
                      <Input
                        id="referenceImage"
                        type="file"
                        accept="image/*"
                        onChange={(event) => handleReferenceImageUpload(event.target.files?.[0] || null)}
                        className="royal-border file:mr-3 file:rounded-md file:border-0 file:bg-amber-500 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-white"
                      />
                      <p className="text-xs text-muted-foreground">
                        Upload one finished character image to lock the collection pose and style before generating layers.
                      </p>
                      {referenceImageBase64 ? (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setReferenceImageBase64('');
                            setReferenceImagePreview('');
                          }}
                          className="royal-border"
                        >
                          Remove Reference
                        </Button>
                      ) : null}
                    </div>
                    {referenceImagePreview ? (
                      <div className="aspect-square overflow-hidden rounded-md border border-royal-500/30 bg-black/20">
                        <img
                          src={referenceImagePreview}
                          alt="Collection reference"
                          className="h-full w-full object-contain"
                        />
                      </div>
                    ) : (
                      <div className="grid aspect-square place-items-center rounded-md border border-dashed border-royal-500/30 bg-royal-500/5 text-center text-xs text-muted-foreground">
                        Reference preview
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 gap-2 rounded-lg border border-royal-500/30 p-2 sm:grid-cols-3">
                    <Button
                      type="button"
                      variant={generationMode === 'true-layered' ? 'default' : 'outline'}
                      onClick={() => setGenerationMode('true-layered')}
                      className={`h-auto min-h-16 flex-col items-start justify-start gap-1 whitespace-normal text-left ${
                        generationMode === 'true-layered' ? 'bg-amber-500 hover:bg-amber-600 text-white' : 'royal-border'
                      }`}
                    >
                      <span>True Layer Kit</span>
                      <span className="text-[11px] font-normal opacity-80">Best for new AI collections</span>
                    </Button>
                    <Button
                      type="button"
                      variant={generationMode === 'image-to-layers' ? 'default' : 'outline'}
                      onClick={() => setGenerationMode('image-to-layers')}
                      className={`h-auto min-h-16 flex-col items-start justify-start gap-1 whitespace-normal text-left ${
                        generationMode === 'image-to-layers' ? 'bg-amber-500 hover:bg-amber-600 text-white' : 'royal-border'
                      }`}
                    >
                      <span>Image to Layers</span>
                      <span className="text-[11px] font-normal opacity-80">Use one finished reference</span>
                    </Button>
                    <Button
                      type="button"
                      variant={generationMode === 'prompt-layers' ? 'default' : 'outline'}
                      onClick={() => setGenerationMode('prompt-layers')}
                      className={`h-auto min-h-16 flex-col items-start justify-start gap-1 whitespace-normal text-left ${
                        generationMode === 'prompt-layers' ? 'bg-amber-500 hover:bg-amber-600 text-white' : 'royal-border'
                      }`}
                    >
                      <span>Prompt Layers</span>
                      <span className="text-[11px] font-normal opacity-80">Fallback provider mode</span>
                    </Button>
                    <p className="sm:col-span-3 text-xs text-muted-foreground px-1">
                      New users should choose True Layer Kit. Use Image to Layers only when you upload a finished character first.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="stylePrompt">Style Lock</Label>
                    <Textarea
                      id="stylePrompt"
                      placeholder="Fixed centered bust rig, same head box, same eye anchors, same mouth anchor, same torso silhouette..."
                      value={stylePrompt}
                      onChange={(e) => {
                        setHasEditedSuggestions(true);
                        setStylePrompt(e.target.value);
                      }}
                      rows={2}
                      className="royal-border"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="blockingRules">Blocking Rules</Label>
                    <Textarea
                      id="blockingRules"
                      placeholder="No text, no logos, no extra characters, no subject inside background..."
                      value={blockingRules}
                      onChange={(e) => {
                        setHasEditedSuggestions(true);
                        setBlockingRules(e.target.value);
                      }}
                      rows={3}
                      className="royal-border"
                    />
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="coverPrompt">Cover Image Prompt</Label>
                      <Textarea
                        id="coverPrompt"
                        placeholder="Square marketplace cover for the collection..."
                        value={coverPrompt}
                        onChange={(e) => {
                          setHasEditedSuggestions(true);
                          setCoverPrompt(e.target.value);
                        }}
                        rows={3}
                        className="royal-border"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="bannerPrompt">Banner Image Prompt</Label>
                      <Textarea
                        id="bannerPrompt"
                        placeholder="Wide cinematic NFT drop banner..."
                        value={bannerPrompt}
                        onChange={(e) => {
                          setHasEditedSuggestions(true);
                          setBannerPrompt(e.target.value);
                        }}
                        rows={3}
                        className="royal-border"
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div className="min-w-0">
                        <Label>Collection Layers</Label>
                        <p className="text-xs text-muted-foreground">
                          Match the classic generator format: Background, Skin, Outfit, Face, Hat, or add your own layer.
                        </p>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={applyPromptSuggestions}
                          className="royal-border"
                        >
                          <Wand2 className="h-4 w-4 mr-2" />
                          Suggest
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setHasEditedSuggestions(true);
                            setLayerPrompts((current) => [...current, createLayerPrompt()]);
                          }}
                          className="royal-border"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {layerPrompts.map((layer) => (
                        <div
                          key={layer.id}
                          className="min-w-0 space-y-3 rounded-lg border border-royal-500/30 p-3"
                        >
                          <div className="grid min-w-0 grid-cols-1 gap-2 lg:grid-cols-[140px_minmax(0,1fr)_88px] xl:grid-cols-[140px_minmax(0,1fr)_88px_120px_40px]">
                            <Input
                              value={layer.name}
                              onChange={(event) => updateLayerPrompt(layer.id, { name: event.target.value })}
                              placeholder="Layer"
                              className="royal-border min-w-0"
                            />
                            <Input
                              value={layer.prompt}
                              onChange={(event) => updateLayerPrompt(layer.id, { prompt: event.target.value })}
                              placeholder="What should this layer generate?"
                              className="royal-border min-w-0"
                            />
                            <Input
                              type="number"
                              min={1}
                              max={12}
                              value={layer.traitCount}
                              onChange={(event) =>
                                updateLayerPrompt(layer.id, {
                                  traitCount: Math.max(1, Math.min(12, parseInt(event.target.value) || 1)),
                                })
                              }
                              className="royal-border min-w-0"
                            />
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => handleGenerateLayer(layer)}
                              disabled={isGenerating || generatingLayerId !== null}
                              className="royal-border w-full"
                            >
                              {generatingLayerId === layer.id ? (
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              ) : (
                                <Sparkles className="h-4 w-4 mr-2" />
                              )}
                              Generate
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              onClick={() => removeLayerPrompt(layer.id)}
                              className="text-destructive hover:text-destructive w-full xl:w-10"
                            >
                              <Trash2 className="h-4 w-4" />
                              <span className="ml-2 xl:hidden">Remove</span>
                            </Button>
                          </div>

                          {generatedLayerAssets[layer.id]?.traits.length ? (
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                              {generatedLayerAssets[layer.id].traits.map((trait) => (
                                <div
                                  key={trait.id}
                                  className={`overflow-hidden rounded-md border bg-royal-500/10 ${
                                    selectedTraits[layer.id] === trait.id
                                      ? 'border-amber-400'
                                      : 'border-royal-500/30'
                                  }`}
                                >
                                  <button
                                    type="button"
                                    onClick={() => setSelectedTraits((current) => ({ ...current, [layer.id]: trait.id }))}
                                    className="aspect-square bg-black/20 block w-full"
                                  >
                                    <img
                                      src={trait.preview}
                                      alt={trait.name}
                                      className="h-full w-full object-contain"
                                    />
                                  </button>
                                  <div className="space-y-2 px-2 py-2">
                                    <Input
                                      value={trait.name}
                                      onChange={(event) => updateTrait(layer.id, trait.id, { name: event.target.value })}
                                      className="royal-border h-8 text-xs"
                                      aria-label={`${trait.name} trait name`}
                                    />
                                    <div className="text-[11px] text-muted-foreground">Rarity weight</div>
                                    <div className="grid grid-cols-[1fr_34px] gap-1">
                                      <Input
                                        type="number"
                                        min={1}
                                        max={100}
                                        value={trait.rarity}
                                        onChange={(event) =>
                                          updateTrait(layer.id, trait.id, {
                                            rarity: Math.max(1, Math.min(100, parseInt(event.target.value) || 1)),
                                          })
                                        }
                                        className="royal-border h-8 text-xs"
                                        aria-label={`${trait.name} rarity`}
                                      />
                                      <Button
                                        type="button"
                                        variant="outline"
                                        size="icon"
                                        onClick={() => handleRegenerateTrait(layer, trait.id)}
                                        disabled={isGenerating || generatingLayerId !== null}
                                        className="royal-border h-8 w-8"
                                        title="Regenerate this trait only"
                                      >
                                        {generatingLayerId === `${layer.id}:${trait.id}` ? (
                                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                        ) : (
                                          <RefreshCw className="h-3.5 w-3.5" />
                                        )}
                                      </Button>
                                    </div>
                                    {trait.qualityWarnings?.length ? (
                                      <p className="flex items-start gap-1 text-[11px] text-amber-300">
                                        <AlertTriangle className="mt-0.5 h-3 w-3 flex-shrink-0" />
                                        {trait.qualityWarnings[0]}
                                      </p>
                                    ) : null}
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="collectionName">Collection Name</Label>
                      <Input
                        id="collectionName"
                        placeholder="Auto-filled from prompt if empty"
                        value={collectionName}
                        onChange={(e) => setCollectionName(e.target.value)}
                        className="royal-border"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="collectionSymbol">Symbol</Label>
                      <Input
                        id="collectionSymbol"
                        placeholder="Auto-filled"
                        value={collectionSymbol}
                        onChange={(e) => setCollectionSymbol(e.target.value)}
                        className="royal-border uppercase"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      placeholder="Describe your collection..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={2}
                      className="royal-border"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="maxSupply">Max Supply</Label>
                      <Input
                        id="maxSupply"
                        type="number"
                        value={maxSupply}
                        onChange={(e) => setMaxSupply(e.target.value)}
                        className="royal-border"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="mintPrice">Mint Price (ETH)</Label>
                      <Input
                        id="mintPrice"
                        type="text"
                        value={mintPrice}
                        onChange={(e) => setMintPrice(e.target.value)}
                        className="royal-border"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="royaltyPercentage">Royalty (%)</Label>
                      <Input
                        id="royaltyPercentage"
                        type="number"
                        value={royaltyPercentage}
                        onChange={(e) => setRoyaltyPercentage(e.target.value)}
                        className="royal-border"
                      />
                    </div>
                  </div>

                  {error && (
                    <div className="bg-red-500/10 border border-red-500/30 text-red-300 p-3 rounded-lg text-sm">
                      {error}
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <Button
                      onClick={handleTestConnection}
                      disabled={isGenerating}
                      variant="outline"
                      className="flex-1 royal-border"
                    >
                      Test Connection
                    </Button>
                    <Button
                      onClick={handleGenerate}
                      disabled={isGenerating}
                      className="flex-1 bg-amber-500 hover:bg-amber-600 text-white"
                    >
                      {isGenerating ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Generating Layers...
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4 mr-2" />
                          Generate Full Layer Kit
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {generatedResult || orderedGeneratedLayers.length ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="xl:sticky xl:top-24"
                >
                  <Card className="royal-card">
                    <CardHeader>
                      <CardTitle className="text-green-400">Generation Studio</CardTitle>
                      <CardDescription>
                        Stack layers, preview samples, save the kit, and export files.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {selectedPreviewLayers.length ? (
                        <div className="space-y-2">
                          <Label>Live Layer Composer</Label>
                          <div className="relative aspect-square overflow-hidden rounded-lg border border-royal-500/30 bg-black/30">
                            {selectedPreviewLayers.map((trait) => (
                              <img
                                key={trait.id}
                                src={trait.preview}
                                alt={trait.name}
                                className="absolute inset-0 h-full w-full object-contain"
                              />
                            ))}
                          </div>
                        </div>
                      ) : null}

                      {qualityWarnings.length ? (
                        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-200">
                          <div className="mb-1 flex items-center gap-2 font-medium">
                            <AlertTriangle className="h-4 w-4" />
                            Transparent quality warnings
                          </div>
                          <ul className="space-y-1">
                            {qualityWarnings.slice(0, 3).map((warning) => (
                              <li key={warning}>{warning}</li>
                            ))}
                          </ul>
                        </div>
                      ) : null}

                      {sampleCompositions.length ? (
                        <div className="space-y-2">
                          <Label>Sample NFTs</Label>
                          <div className="grid grid-cols-3 gap-2">
                            {sampleCompositions.map((sample) => (
                              <div
                                key={sample.id}
                                className="relative aspect-square overflow-hidden rounded-md border border-royal-500/30 bg-black/30"
                              >
                                {orderedGeneratedLayers.map((layer) => {
                                  const trait = layer.traits.find((item) => item.id === sample.traitIds[layer.id]);
                                  return trait ? (
                                    <img
                                      key={`${sample.id}-${trait.id}`}
                                      src={trait.preview}
                                      alt={trait.name}
                                      className="absolute inset-0 h-full w-full object-contain"
                                    />
                                  ) : null;
                                })}
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : null}

                      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-1 gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={generateSampleCompositions}
                          className="royal-border"
                        >
                          <Shuffle className="h-4 w-4 mr-2" />
                          Generate Samples
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={persistCurrentKit}
                          className="royal-border"
                        >
                          <Save className="h-4 w-4 mr-2" />
                          Save AI Kit
                        </Button>
                      </div>

                      {generatedResult?.bannerImageUrl && (
                        <div className="relative aspect-[16/9] rounded-lg overflow-hidden bg-royal-500/10">
                          <img
                            src={generatedResult.bannerImageUrl}
                            alt="Generated banner"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}

                      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-1 gap-3">
                        {generatedResult?.coverImageUrl && (
                          <div className="overflow-hidden rounded-lg border border-royal-500/30 bg-royal-500/10">
                            <div className="aspect-square">
                              <img
                                src={generatedResult.coverImageUrl}
                                alt="Generated cover"
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="px-3 py-2 text-xs text-muted-foreground">Cover image</div>
                          </div>
                        )}

                        {generatedResult?.imageUrl && generatedResult.imageUrl !== generatedResult.coverImageUrl && (
                          <div className="overflow-hidden rounded-lg border border-royal-500/30 bg-royal-500/10">
                            <div className="aspect-square">
                              <img
                                src={generatedResult.imageUrl}
                                alt="Generated NFT preview"
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="px-3 py-2 text-xs text-muted-foreground">Layer preview</div>
                          </div>
                        )}
                      </div>

                      <div className="space-y-2 text-sm">
                        <div className="grid grid-cols-3 gap-2 text-center text-xs">
                          <div className="rounded-md border border-royal-500/30 bg-black/20 p-2">
                            <div className="text-lg font-bold text-amber-400">{orderedGeneratedLayers.length}</div>
                            <div className="text-muted-foreground">Layers</div>
                          </div>
                          <div className="rounded-md border border-royal-500/30 bg-black/20 p-2">
                            <div className="text-lg font-bold text-amber-400">{generatedTraitCount}</div>
                            <div className="text-muted-foreground">Traits</div>
                          </div>
                          <div className="rounded-md border border-royal-500/30 bg-black/20 p-2">
                            <div className="text-lg font-bold text-amber-400">{sampleCompositions.length}</div>
                            <div className="text-muted-foreground">Samples</div>
                          </div>
                        </div>

                        {generatedResult?.generatorLayers?.length ? (
                          <div>
                            <span className="text-muted-foreground">Generated Layers:</span>
                            <p className="font-mono text-xs break-all text-amber-400">
                              {generatedResult.generatorLayers
                                .map((layer) => `${layer.name} (${layer.traits.length})`)
                                .join(', ')}
                            </p>
                          </div>
                        ) : null}

                        <div>
                          <span className="text-muted-foreground">Metadata CID:</span>
                          <p className="font-mono text-xs break-all text-amber-400">
                            {generatedResult?.metadataCID || generatedResult?.metadataUrl}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={downloadLayerZip}
                          disabled={isDownloadingZip}
                          className="royal-border"
                        >
                          {isDownloadingZip ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                          <Package className="h-4 w-4 mr-2" />
                          )}
                          Download Layer Folders
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={downloadMetadata}
                          className="royal-border"
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Download Metadata
                        </Button>
                      </div>

                      <div className="grid grid-cols-1 gap-2">
                        <Button
                          asChild
                          className="bg-amber-500 hover:bg-amber-600 text-white"
                        >
                          <Link href="/launchpad">
                            Continue to Launchpad
                          </Link>
                        </Button>
                        <p className="text-center text-xs text-muted-foreground">
                          Launchpad will open with this AI kit loaded so you can generate previews and deploy.
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  {savedDrafts.length ? (
                    <Card className="royal-card mt-4">
                      <CardHeader>
                        <CardTitle className="text-base">Saved AI Kits</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        {savedDrafts.slice(0, 4).map((draft) => (
                          <Button
                            key={draft.createdAt}
                            type="button"
                            variant="outline"
                            onClick={() => loadSavedKit(draft.createdAt)}
                            className="royal-border h-auto w-full justify-start p-2 text-left"
                          >
                            <span className="min-w-0">
                              <span className="block truncate text-sm">{draft.collectionName}</span>
                              <span className="block truncate text-xs text-muted-foreground">
                                {draft.generatorLayers?.length || 0} layers
                              </span>
                            </span>
                          </Button>
                        ))}
                      </CardContent>
                    </Card>
                  ) : null}
                </motion.div>
              ) : null}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
