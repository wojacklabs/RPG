import { NextRequest, NextResponse } from 'next/server';
import { 
  getQuote, 
  buildSwapTransaction, 
  checkAllowance, 
  buildApprovalTransaction,
  getSupportedChains,
  getSupportedTokens,
} from '@/lib/services/uniswapService';

export const dynamic = 'force-dynamic';

// GET - Get swap quote
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const chain = searchParams.get('chain') || 'ethereum';
    const tokenIn = searchParams.get('tokenIn') || 'ETH';
    const tokenOut = searchParams.get('tokenOut') || 'USDC';
    const amount = searchParams.get('amount') || '1';

    // Return supported chains/tokens
    if (searchParams.get('action') === 'supported') {
      return NextResponse.json({
        chains: getSupportedChains(),
        tokens: getSupportedTokens(chain),
      });
    }

    const quote = await getQuote(chain, tokenIn, tokenOut, amount);

    return NextResponse.json({
      quote: {
        fromToken: tokenIn,
        toToken: tokenOut,
        fromAmount: amount,
        toAmount: quote.amountOut,
        toAmountMin: quote.amountOutMin,
        priceImpact: quote.priceImpact,
        gasEstimate: quote.gasEstimate,
        path: quote.path,
        protocol: 'Uniswap V3',
      },
    });
  } catch (error: any) {
    console.error('Quote error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get quote' },
      { status: 500 }
    );
  }
}

// POST - Build swap transaction
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { chain, fromToken, toToken, amount, walletAddress, slippage = 0.5 } = body;

    if (!chain || !fromToken || !toToken || !amount || !walletAddress) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Check if approval is needed
    const allowanceCheck = await checkAllowance(chain, fromToken, walletAddress, amount);

    let approveTransaction = null;
    if (allowanceCheck.needsApproval) {
      approveTransaction = buildApprovalTransaction(chain, fromToken);
    }

    // Build swap transaction
    const swapTx = await buildSwapTransaction({
      chain,
      tokenIn: fromToken,
      tokenOut: toToken,
      amountIn: amount,
      recipient: walletAddress,
      slippagePercent: slippage,
    });

    return NextResponse.json({
      needsApproval: allowanceCheck.needsApproval,
      approveTransaction,
      transaction: swapTx,
      protocol: 'Uniswap V3',
    });
  } catch (error: any) {
    console.error('Swap build error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to build swap transaction' },
      { status: 500 }
    );
  }
}
