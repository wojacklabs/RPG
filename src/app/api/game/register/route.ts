import { NextRequest, NextResponse } from 'next/server';
import { registerPlayer, getPlayerData } from '@/lib/services/gameDataService';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { walletAddress, playerName } = body;

    if (!walletAddress || !playerName) {
      return NextResponse.json(
        { error: 'Missing walletAddress or playerName' },
        { status: 400 }
      );
    }

    // Check if player already exists
    const existingPlayer = await getPlayerData(walletAddress);
    if (existingPlayer) {
      return NextResponse.json(
        { error: 'Player already registered', player: existingPlayer },
        { status: 409 }
      );
    }

    // Register new player on MegaETH
    const txHash = await registerPlayer(walletAddress, playerName);

    if (!txHash) {
      return NextResponse.json(
        { error: 'Failed to register player on-chain' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      txHash,
      message: `Player "${playerName}" registered on MegaETH`,
    });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const walletAddress = searchParams.get('walletAddress');

    if (!walletAddress) {
      return NextResponse.json(
        { error: 'Missing walletAddress parameter' },
        { status: 400 }
      );
    }

    const playerData = await getPlayerData(walletAddress);

    if (!playerData) {
      return NextResponse.json(
        { registered: false },
        { status: 200 }
      );
    }

    return NextResponse.json({
      registered: true,
      player: playerData,
    });
  } catch (error) {
    console.error('Get player error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

