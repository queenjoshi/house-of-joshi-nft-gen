import { keccak256, stringToHex } from 'viem';

export type GeneratorTrait = {
  id: string;
  name: string;
  weight: number;
};

export type GeneratorLayer = {
  id: string;
  name: string;
  traits: GeneratorTrait[];
};

export type GeneratorRule = {
  id: string;
  type: 'exclude' | 'require';
  sourceTraitId: string;
  targetTraitId: string;
};

export type GeneratedDNA = {
  tokenId: number;
  dna: string;
  traits: Array<{
    layerId: string;
    layerName: string;
    traitId: string;
    traitName: string;
  }>;
};

export type GenerationPlan = {
  seed: string;
  requestedSupply: number;
  generatedSupply: number;
  theoreticalCombinations: number;
  attempts: number;
  items: GeneratedDNA[];
  manifestHash: `0x${string}`;
};

export type GenerationSimulation = {
  requestedSupply: number;
  generatedSupply: number;
  theoreticalCombinations: number;
  duplicateRisk: 'none' | 'low' | 'medium' | 'high';
  utilizationPercentage: number;
  occurrenceByTrait: Record<string, number>;
  warnings: string[];
};

function seedToUint32(seed: string) {
  let hash = 2166136261;
  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function createRandom(seed: string) {
  let state = seedToUint32(seed) || 1;
  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function selectWeightedTrait(traits: GeneratorTrait[], random: () => number) {
  const totalWeight = traits.reduce((sum, trait) => sum + Math.max(1, trait.weight), 0);
  let cursor = random() * totalWeight;

  for (const trait of traits) {
    cursor -= Math.max(1, trait.weight);
    if (cursor <= 0) return trait;
  }

  return traits[traits.length - 1];
}

function selectionIsValid(selectedTraitIds: Set<string>, rules: GeneratorRule[]) {
  return rules.every((rule) => {
    const hasSource = selectedTraitIds.has(rule.sourceTraitId);
    const hasTarget = selectedTraitIds.has(rule.targetTraitId);

    if (rule.type === 'exclude') return !(hasSource && hasTarget);
    return !hasSource || hasTarget;
  });
}

function calculateDuplicateRisk(utilization: number): GenerationSimulation['duplicateRisk'] {
  if (utilization <= 25) return 'none';
  if (utilization <= 50) return 'low';
  if (utilization <= 80) return 'medium';
  return 'high';
}

export function calculateTheoreticalCombinations(layers: GeneratorLayer[]) {
  if (!layers.length || layers.some((layer) => layer.traits.length === 0)) return 0;
  return layers.reduce((product, layer) => product * layer.traits.length, 1);
}

export function createGenerationPlan({
  layers,
  requestedSupply,
  seed,
  rules = [],
}: {
  layers: GeneratorLayer[];
  requestedSupply: number;
  seed: string;
  rules?: GeneratorRule[];
}): GenerationPlan {
  const theoreticalCombinations = calculateTheoreticalCombinations(layers);
  if (!theoreticalCombinations) {
    throw new Error('Every layer needs at least one trait before generation.');
  }
  if (!Number.isInteger(requestedSupply) || requestedSupply <= 0) {
    throw new Error('Collection supply must be a positive whole number.');
  }
  if (requestedSupply > theoreticalCombinations) {
    throw new Error(
      `Supply exceeds the ${theoreticalCombinations.toLocaleString()} theoretical unique combinations.`,
    );
  }

  const random = createRandom(seed);
  const usedDNA = new Set<string>();
  const items: GeneratedDNA[] = [];
  const maxAttempts = Math.max(requestedSupply * 250, 5000);
  let attempts = 0;

  while (items.length < requestedSupply && attempts < maxAttempts) {
    attempts += 1;
    const selected = layers.map((layer) => ({
      layer,
      trait: selectWeightedTrait(layer.traits, random),
    }));
    const selectedIds = new Set(selected.map(({ trait }) => trait.id));
    if (!selectionIsValid(selectedIds, rules)) continue;

    const dna = selected.map(({ layer, trait }) => `${layer.id}:${trait.id}`).join('|');
    if (usedDNA.has(dna)) continue;
    usedDNA.add(dna);

    items.push({
      tokenId: items.length,
      dna,
      traits: selected.map(({ layer, trait }) => ({
        layerId: layer.id,
        layerName: layer.name,
        traitId: trait.id,
        traitName: trait.name,
      })),
    });
  }

  if (items.length !== requestedSupply) {
    throw new Error(
      `Only ${items.length.toLocaleString()} valid unique combinations could be generated. Review trait rules or lower supply.`,
    );
  }

  const manifest = {
    version: 1,
    seed,
    requestedSupply,
    layers: layers.map((layer) => ({
      id: layer.id,
      name: layer.name,
      traits: layer.traits.map((trait) => ({
        id: trait.id,
        name: trait.name,
        weight: trait.weight,
      })),
    })),
    rules,
    dna: items.map((item) => item.dna),
  };

  return {
    seed,
    requestedSupply,
    generatedSupply: items.length,
    theoreticalCombinations,
    attempts,
    items,
    manifestHash: keccak256(stringToHex(JSON.stringify(manifest))),
  };
}

export function simulateGeneration(plan: GenerationPlan): GenerationSimulation {
  const occurrenceByTrait: Record<string, number> = {};
  for (const item of plan.items) {
    for (const trait of item.traits) {
      occurrenceByTrait[trait.traitId] = (occurrenceByTrait[trait.traitId] || 0) + 1;
    }
  }

  const utilizationPercentage = plan.theoreticalCombinations
    ? (plan.generatedSupply / plan.theoreticalCombinations) * 100
    : 0;
  const warnings: string[] = [];
  if (utilizationPercentage > 80) {
    warnings.push('Supply uses more than 80% of all theoretical combinations; restrictive rules may prevent completion.');
  }
  if (plan.attempts > plan.generatedSupply * 20) {
    warnings.push('Generation required many retries; review extreme rarity weights or incompatible traits.');
  }

  return {
    requestedSupply: plan.requestedSupply,
    generatedSupply: plan.generatedSupply,
    theoreticalCombinations: plan.theoreticalCombinations,
    duplicateRisk: calculateDuplicateRisk(utilizationPercentage),
    utilizationPercentage,
    occurrenceByTrait,
    warnings,
  };
}
