import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const sourceModulePath = resolve(projectRoot, 'lib/contracts/contract-source.ts');
const outputPath = resolve(projectRoot, 'contracts/HOJNFTGen.sol');
const moduleText = readFileSync(sourceModulePath, 'utf8');
const declaration = 'export const ROYAL_NFT_SOURCE_CODE = `';
const sourceStart = moduleText.indexOf(declaration);

if (sourceStart === -1) {
  throw new Error('ROYAL_NFT_SOURCE_CODE declaration was not found.');
}

const contentStart = sourceStart + declaration.length;
const contentEnd = moduleText.indexOf('`;\n\nexport const COMPILER_VERSION', contentStart);

if (contentEnd === -1) {
  throw new Error('ROYAL_NFT_SOURCE_CODE closing marker was not found.');
}

mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, `${moduleText.slice(contentStart, contentEnd).trimEnd()}\n`, 'utf8');
console.log(`Exported ${outputPath}`);
