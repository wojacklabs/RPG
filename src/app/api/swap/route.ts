import { NextRequest, NextResponse } from 'next/server';

const CHAIN_IDS: Record<string, number> = {
  ethereum: 1,
  arbitrum: 42161,
  base: 8453,
  polygon: 137,
  optimism: 10,
};

const TOKEN_ADDRESSES: Record<string, Record<string, string>> = {
  ethereum: {
    ETH: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
    USDC: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    USDT: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
    WETH: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
    WBTC: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599',
  },
  arbitrum: {
    ETH: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
    USDC: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
    ARB: '0x912CE59144191C1204E64559FE8253a0e49E6548',
  },
  base: {
    ETH: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
    USDC: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
  },
  polygon: {
    MATIC: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
    USDC: '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359',
  },
};

const TOKEN_DECIMALS: Record<string, number> = {
  ETH: 18,
  MATIC: 18,
  USDC: 6,
  USDT: 6,
  WETH: 18,
  WBTC: 8,
  ARB: 18,
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { chain, fromToken, toToken, amount, walletAddress, slippage = 1 } = body;

    const apiKey = process.env.ONEINCH_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'ONEINCH_API_KEY not configured. Add it to .env.local' },
        { status: 500 }
      );
    }

    const chainId = CHAIN_IDS[chain];
    if (!chainId) {
      return NextResponse.json({ error: 'Unsupported chain' }, { status: 400 });
    }

    const fromTokenAddr = TOKEN_ADDRESSES[chain]?.[fromToken];
    const toTokenAddr = TOKEN_ADDRESSES[chain]?.[toToken];

    if (!fromTokenAddr || !toTokenAddr) {
      return NextResponse.json({ error: 'Unsupported token' }, { status: 400 });
    }

    const decimals = TOKEN_DECIMALS[fromToken] || 18;
    const amountWei = BigInt(Math.floor(parseFloat(amount) * Math.pow(10, decimals))).toString();

    const baseUrl = `https://api.1inch.dev/swap/v6.0/${chainId}`;
    const headers = {
      'Authorization': `Bearer ${apiKey}`,
      'Accept': 'application/json',
    };

    // Check if approval is needed (for non-native tokens)
    let needsApproval = false;
    let approveTransaction = null;

    if (fromToken !== 'ETH' && fromToken !== 'MATIC') {
      const allowanceRes = await fetch(
        `${baseUrl}/approve/allowance?tokenAddress=${fromTokenAddr}&walletAddress=${walletAddress}`,
        { headers }
      );

      if (allowanceRes.ok) {
        const allowanceData = await allowanceRes.json();
        if (BigInt(allowanceData.allowance) < BigInt(amountWei)) {
          needsApproval = true;

          // Get approve transaction
          const approveRes = await fetch(
            `${baseUrl}/approve/transaction?tokenAddress=${fromTokenAddr}&amount=${amountWei}`,
            { headers }
          );

          if (approveRes.ok) {
            approveTransaction = await approveRes.json();
          }
        }
      }
    }

    // Get swap transaction
    const swapUrl = `${baseUrl}/swap?src=${fromTokenAddr}&dst=${toTokenAddr}&amount=${amountWei}&from=${walletAddress}&slippage=${slippage}&disableEstimate=true`;
    
    const swapRes = await fetch(swapUrl, { headers });

    if (!swapRes.ok) {
      const errorText = await swapRes.text();
      console.error('1inch swap error:', errorText);
      return NextResponse.json(
        { error: `1inch API error: ${swapRes.status}` },
        { status: swapRes.status }
      );
    }

    const swapData = await swapRes.json();

    return NextResponse.json({
      needsApproval,
      approveTransaction,
      transaction: {
        from: walletAddress,
        to: swapData.tx.to,
        data: swapData.tx.data,
        value: swapData.tx.value || '0',
        gas: swapData.tx.gas?.toString() || '300000',
      },
    });

  } catch (error: any) {
    console.error('Swap API error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

