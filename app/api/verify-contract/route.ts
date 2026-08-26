import { NextRequest, NextResponse } from 'next/server';
import { encodeAbiParameters, isAddress } from 'viem';
import {
  COMPILER_VERSION,
  COMPILER_OPTIMIZATION_RUNS,
  ROYAL_NFT_CONTRACT_NAME,
  getRoyalNFTSourceCode,
} from '@/lib/contracts/contract-source';
import type { ContractVerificationParams } from '@/lib/contract-verification';

const ETHERSCAN_API_URL = 'https://api.etherscan.io/v2/api';
const SUPPORTED_CHAIN_IDS = new Set([8453, 84532]);

function getApiKey() {
  return process.env.ETHERSCAN_API_KEY
    || process.env.BASESCAN_API_KEY
    || '';
}

function parseChainId(value: unknown) {
  const chainId = Number(value || 8453);
  return SUPPORTED_CHAIN_IDS.has(chainId) ? chainId : null;
}

function encodeConstructorArguments(params: ContractVerificationParams) {
  return encodeAbiParameters(
    [{
      type: 'tuple',
      components: [
        { name: 'name', type: 'string' },
        { name: 'symbol', type: 'string' },
        { name: 'contractURI', type: 'string' },
        { name: 'baseURI', type: 'string' },
        { name: 'unrevealedURI', type: 'string' },
        { name: 'maxSupply', type: 'uint256' },
        { name: 'mintPrice', type: 'uint256' },
        { name: 'maxMintPerWallet', type: 'uint256' },
        { name: 'mintStart', type: 'uint64' },
        { name: 'mintEnd', type: 'uint64' },
        { name: 'revealTime', type: 'uint64' },
        { name: 'royaltyReceiver', type: 'address' },
        { name: 'royaltyBps', type: 'uint96' },
        { name: 'allowlistRoot', type: 'bytes32' },
      ],
    }],
    [{
      ...params,
      maxSupply: BigInt(params.maxSupply),
      mintPrice: BigInt(params.mintPrice),
      maxMintPerWallet: BigInt(params.maxMintPerWallet),
      mintStart: BigInt(params.mintStart),
      mintEnd: BigInt(params.mintEnd),
      revealTime: BigInt(params.revealTime),
      royaltyBps: BigInt(params.royaltyBps),
    }],
  ).slice(2);
}

async function getVerificationStatus(contractAddress: string, chainId: number, apiKey: string) {
  const query = new URLSearchParams({
    chainid: String(chainId),
    module: 'contract',
    action: 'getsourcecode',
    address: contractAddress,
    apikey: apiKey,
  });
  const response = await fetch(`${ETHERSCAN_API_URL}?${query}`, { cache: 'no-store' });
  const data = await response.json();
  return data.status === '1' && Boolean(data.result?.[0]?.SourceCode);
}

export async function POST(request: NextRequest) {
  try {
    const { contractAddress, networkChainId, constructorParams } = await request.json();
    const chainId = parseChainId(networkChainId);
    const apiKey = getApiKey();

    if (!contractAddress || !isAddress(contractAddress)) {
      return NextResponse.json({ error: 'A valid contract address is required.' }, { status: 400 });
    }
    if (!chainId) {
      return NextResponse.json({ error: 'Only Base and Base Sepolia are supported.' }, { status: 400 });
    }
    if (!constructorParams) {
      return NextResponse.json({ error: 'Constructor parameters are required.' }, { status: 400 });
    }
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Server verification is not configured. Set ETHERSCAN_API_KEY.' },
        { status: 503 },
      );
    }

    if (await getVerificationStatus(contractAddress, chainId, apiKey)) {
      return NextResponse.json({ success: true, verified: true, message: 'Already verified.' });
    }

    const body = new URLSearchParams({
      chainid: String(chainId),
      module: 'contract',
      action: 'verifysourcecode',
      apikey: apiKey,
      contractaddress: contractAddress,
      sourceCode: getRoyalNFTSourceCode(),
      codeformat: 'solidity-single-file',
      contractname: ROYAL_NFT_CONTRACT_NAME,
      compilerversion: COMPILER_VERSION,
      optimizationUsed: '1',
      runs: String(COMPILER_OPTIMIZATION_RUNS),
      constructorArguments: encodeConstructorArguments(constructorParams),
      evmVersion: 'default',
      licenseType: '3',
    });
    const response = await fetch(ETHERSCAN_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    });
    const data = await response.json();
    const alreadyVerified = String(data.result || '').toLowerCase().includes('already verified');

    if (data.status !== '1' && !alreadyVerified) {
      return NextResponse.json(
        { error: data.result || data.message || 'Verification submission failed.' },
        { status: 502 },
      );
    }

    return NextResponse.json({
      success: true,
      verified: alreadyVerified,
      guid: alreadyVerified ? null : data.result,
      message: alreadyVerified ? 'Already verified.' : 'Verification submitted.',
    });
  } catch (error) {
    console.error('Contract verification submission failed:', error);
    return NextResponse.json({ error: 'Contract verification failed.' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const contractAddress = searchParams.get('contractAddress') || '';
    const chainId = parseChainId(searchParams.get('networkChainId'));
    const apiKey = getApiKey();

    if (!isAddress(contractAddress) || !chainId) {
      return NextResponse.json({ error: 'Invalid contract address or chain.' }, { status: 400 });
    }
    if (!apiKey) {
      return NextResponse.json({ error: 'Server verification is not configured.' }, { status: 503 });
    }

    const verified = await getVerificationStatus(contractAddress, chainId, apiKey);
    return NextResponse.json({ success: true, verified, contractAddress });
  } catch (error) {
    console.error('Contract verification status check failed:', error);
    return NextResponse.json({ error: 'Could not check contract verification.' }, { status: 500 });
  }
}
