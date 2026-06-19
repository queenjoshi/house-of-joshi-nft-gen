import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface VerifyRequest {
  contractAddress: string;
  contractName: string;
  sourceCode: string;
  compilerVersion: string;
  constructorArgs?: string;
  chainId: number;
}

function getBasescanApiUrl(chainId: number): string {
  switch (chainId) {
    case 8453:
      return "https://api.basescan.org/api";
    case 84532:
      return "https://api-sepolia.basescan.org/api";
    default:
      return "https://api.basescan.org/api";
  }
}

function getBasescanExplorerUrl(chainId: number): string {
  switch (chainId) {
    case 8453:
      return "https://basescan.org";
    case 84532:
      return "https://sepolia.basescan.org";
    default:
      return "https://basescan.org";
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const body: VerifyRequest = await req.json();
    const {
      contractAddress,
      contractName,
      sourceCode,
      compilerVersion,
      constructorArgs,
      chainId,
    } = body;

    if (!contractAddress || !contractName || !sourceCode || !compilerVersion) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const apiUrl = getBasescanApiUrl(chainId);
    const apiKey = Deno.env.get("BASESCAN_API_KEY") || "";

    // Step 1: Submit verification
    const formData = new URLSearchParams();
    formData.append("module", "contract");
    formData.append("action", "verifysourcecode");
    formData.append("apikey", apiKey);
    formData.append("contractaddress", contractAddress);
    formData.append("sourceCode", sourceCode);
    formData.append("codeformat", "solidity-single-file");
    formData.append("contractname", contractName);
    formData.append("compilerversion", compilerVersion);
    formData.append("optimizationUsed", "1");
    formData.append("runs", "200");
    if (constructorArgs) {
      formData.append("constructorArguements", constructorArgs);
    }

    const verifyRes = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: formData.toString(),
    });

    const verifyData = await verifyRes.json();

    if (verifyData.status !== "1") {
      // Check if already verified
      if (verifyData.result?.toLowerCase?.().includes("already verified")) {
        return new Response(
          JSON.stringify({
            success: true,
            alreadyVerified: true,
            message: "Contract is already verified",
            explorerUrl: `${getBasescanExplorerUrl(chainId)}/address/${contractAddress}#code`,
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({
          success: false,
          error: verifyData.result || "Verification submission failed",
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const guid = verifyData.result;

    // Step 2: Poll for verification status
    let attempts = 0;
    const maxAttempts = 10;
    const delayMs = 5000;

    while (attempts < maxAttempts) {
      await new Promise((r) => setTimeout(r, delayMs));
      attempts++;

      const checkParams = new URLSearchParams({
        module: "contract",
        action: "checkverifystatus",
        apikey: apiKey,
        guid,
      });

      const checkRes = await fetch(`${apiUrl}?${checkParams.toString()}`);
      const checkData = await checkRes.json();

      if (checkData.result === "Pass - Verified") {
        return new Response(
          JSON.stringify({
            success: true,
            message: "Contract verified successfully",
            explorerUrl: `${getBasescanExplorerUrl(chainId)}/address/${contractAddress}#code`,
            guid,
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (
        checkData.result?.toLowerCase?.().includes("already verified") ||
        checkData.result?.toLowerCase?.().includes("pass - already verified")
      ) {
        return new Response(
          JSON.stringify({
            success: true,
            alreadyVerified: true,
            message: "Contract is already verified",
            explorerUrl: `${getBasescanExplorerUrl(chainId)}/address/${contractAddress}#code`,
            guid,
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (
        checkData.result?.toLowerCase?.().includes("fail") &&
        !checkData.result?.toLowerCase?.().includes("pending")
      ) {
        return new Response(
          JSON.stringify({
            success: false,
            error: checkData.result,
            guid,
          }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Timed out but submission was accepted
    return new Response(
      JSON.stringify({
        success: true,
        pending: true,
        message: "Verification submitted and is being processed",
        explorerUrl: `${getBasescanExplorerUrl(chainId)}/address/${contractAddress}#code`,
        guid,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
