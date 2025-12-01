import { NextRequest, NextResponse } from 'next/server';
import { getSwapQuote, getBridgeQuote, getStakingOptions, getLiquidityPools, getSupportedChains } from '@/lib/services/defiService';
import { type DefiChainKey } from '@/lib/chains';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const chain = searchParams.get('chain') as DefiChainKey;

    switch (action) {
      case 'swap': {
        const fromToken = searchParams.get('fromToken') || 'ETH';
        const toToken = searchParams.get('toToken') || 'USDC';
        const amount = searchParams.get('amount') || '1';
        const protocol = searchParams.get('protocol');

        const quote = await getSwapQuote(chain, fromToken, toToken, amount, protocol || undefined);
        return NextResponse.json({ quote });
      }

      case 'bridge': {
        const fromChain = searchParams.get('fromChain') || 'ethereum';
        const toChain = searchParams.get('toChain') || 'arbitrum';
        const token = searchParams.get('token') || 'ETH';
        const amount = searchParams.get('amount') || '1';

        const quote = await getBridgeQuote(fromChain, toChain, token, amount);
        return NextResponse.json({ quote });
      }

      case 'staking': {
        const options = await getStakingOptions(chain);
        return NextResponse.json({ options });
      }

      case 'liquidity': {
        const pools = await getLiquidityPools(chain);
        return NextResponse.json({ pools });
      }

      case 'chains': {
        const chains = getSupportedChains();
        return NextResponse.json({ chains });
      }

      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: swap, bridge, staking, liquidity, or chains' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('DeFi quote error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

