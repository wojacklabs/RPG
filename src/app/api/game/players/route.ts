import { NextResponse } from 'next/server';
import { getAllPlayers } from '@/lib/services/gameDataService';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const players = await getAllPlayers();

    return NextResponse.json({
      players,
      count: players.length,
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error('Get players error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

