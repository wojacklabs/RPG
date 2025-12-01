import { NextRequest, NextResponse } from 'next/server';
import { updatePlayerPosition } from '@/lib/services/gameDataService';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { walletAddress, x, y, z } = body;

    if (!walletAddress || x === undefined || y === undefined || z === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Update position on MegaETH
    const txHash = await updatePlayerPosition(walletAddress, x, y, z);

    if (!txHash) {
      return NextResponse.json(
        { error: 'Failed to update position on-chain' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      txHash,
    });
  } catch (error) {
    console.error('Position update error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

