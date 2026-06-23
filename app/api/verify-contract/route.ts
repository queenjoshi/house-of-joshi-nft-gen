import { NextRequest, NextResponse } from 'next/server';
import { ROYAL_NFT_SOURCE_CODE, COMPILER_VERSION, CONTRACT_NAME } from '@/lib/contracts/contract-source';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { contractAddress, networkChainId } = body;

    if (!contractAddress) {
      return NextResponse.json(
        { error: 'Contract address is required' },
        { status: 400 }
      );
    }

    const explorerBase = networkChainId === 84532
      ? 'https://sepolia.basescan.org'
      : 'https://basescan.org';
    const apiKey = process.env.NEXT_PUBLIC_BASESCAN_API_KEY || '';

    // Submit verification request to BaseScan
    const verifyResponse = await fetch(`${explorerBase}/api`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        module: 'contract',
        action: 'verifysourcecode',
        apikey: apiKey,
        contractaddress: contractAddress,
        sourceCode: ROYAL_NFT_SOURCE_CODE,
        codeformat: 'solidity-single-file',
        contractname: CONTRACT_NAME,
        compilerversion: COMPILER_VERSION,
        optimizationUsed: '0',
        runs: '200',
        constructorArguements: '',
        licenseType: '3',
      }),
    });

    const verifyData = await verifyResponse.json();

    if (verifyData.status === '1') {
      return NextResponse.json({
        success: true,
        message: 'Verification submitted successfully',
        result: verifyData.result,
        guid: verifyData.result,
      });
    } else {
      return NextResponse.json(
        { error: verifyData.message || 'Verification submission failed' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const contractAddress = searchParams.get('contractAddress');
    const networkChainId = parseInt(searchParams.get('networkChainId') || '8453');

    if (!contractAddress) {
      return NextResponse.json(
        { error: 'Contract address is required' },
        { status: 400 }
      );
    }

    const explorerBase = networkChainId === 84532
      ? 'https://sepolia.basescan.org'
      : 'https://basescan.org';
    const apiKey = process.env.NEXT_PUBLIC_BASESCAN_API_KEY || '';

    // Check verification status
    const statusResponse = await fetch(
      `${explorerBase}/api?module=contract&action=getsourcecode&address=${contractAddress}&apikey=${apiKey}`
    );
    const statusData = await statusResponse.json();

    if (statusData.status === '1' && statusData.result[0]?.SourceCode) {
      return NextResponse.json({
        success: true,
        verified: true,
        contract: {
          contract_address: contractAddress,
          source_code: statusData.result[0].SourceCode,
          compiler_version: statusData.result[0].CompilerVersion,
          optimization_enabled: statusData.result[0].OptimizationUsed,
        }
      });
    } else {
      return NextResponse.json({
        success: true,
        verified: false,
        contract: {
          contract_address: contractAddress,
        }
      });
    }
  } catch (error) {
    console.error('Get error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
