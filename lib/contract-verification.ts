export interface ContractVerificationParams {
  name: string;
  symbol: string;
  contractURI: string;
  baseURI: string;
  unrevealedURI: string;
  maxSupply: string;
  mintPrice: string;
  maxMintPerWallet: string;
  mintStart: string;
  mintEnd: string;
  revealTime: string;
  royaltyReceiver: `0x${string}`;
  royaltyBps: string;
  allowlistRoot: `0x${string}`;
}

export interface VerificationResult {
  verified: boolean;
  explorerUrl: string;
  message: string;
}

export function serializeVerificationParams(params: {
  name: string;
  symbol: string;
  contractURI: string;
  baseURI: string;
  unrevealedURI: string;
  maxSupply: bigint;
  mintPrice: bigint;
  maxMintPerWallet: bigint;
  mintStart: bigint;
  mintEnd: bigint;
  revealTime: bigint;
  royaltyReceiver: `0x${string}`;
  royaltyBps: bigint;
  allowlistRoot: `0x${string}`;
}): ContractVerificationParams {
  return {
    ...params,
    maxSupply: params.maxSupply.toString(),
    mintPrice: params.mintPrice.toString(),
    maxMintPerWallet: params.maxMintPerWallet.toString(),
    mintStart: params.mintStart.toString(),
    mintEnd: params.mintEnd.toString(),
    revealTime: params.revealTime.toString(),
    royaltyBps: params.royaltyBps.toString(),
  };
}

export async function verifyDeployedContract(
  contractAddress: string,
  chainId: number,
  constructorParams: ContractVerificationParams,
): Promise<VerificationResult> {
  const explorerBase = chainId === 84532
    ? 'https://sepolia.basescan.org'
    : 'https://basescan.org';
  const explorerUrl = `${explorerBase}/address/${contractAddress}#code`;

  const submission = await fetch('/api/verify-contract', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contractAddress, networkChainId: chainId, constructorParams }),
  });
  const submissionData = await submission.json();

  if (!submission.ok) {
    throw new Error(submissionData.error || 'Contract verification could not be submitted.');
  }

  if (submissionData.verified) {
    return { verified: true, explorerUrl, message: 'Contract verified on BaseScan.' };
  }

  for (let attempt = 0; attempt < 24; attempt += 1) {
    await new Promise((resolve) => setTimeout(resolve, 5000));
    const statusResponse = await fetch(
      `/api/verify-contract?contractAddress=${encodeURIComponent(contractAddress)}&networkChainId=${chainId}`,
      { cache: 'no-store' },
    );
    const statusData = await statusResponse.json();

    if (statusResponse.ok && statusData.verified) {
      return { verified: true, explorerUrl, message: 'Contract verified on BaseScan.' };
    }
  }

  return {
    verified: false,
    explorerUrl: `${explorerBase}/address/${contractAddress}`,
    message: 'Verification was submitted and is still processing on BaseScan.',
  };
}
