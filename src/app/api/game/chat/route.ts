import { NextRequest, NextResponse } from 'next/server';
import { sendChatMessage, getRecentChats } from '@/lib/services/gameDataService';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { walletAddress, message } = body;

    if (!walletAddress || !message) {
      return NextResponse.json(
        { error: 'Missing walletAddress or message' },
        { status: 400 }
      );
    }

    // Validate message length
    if (message.length > 200) {
      return NextResponse.json(
        { error: 'Message too long (max 200 characters)' },
        { status: 400 }
      );
    }

    // Send chat to MegaETH
    const txHash = await sendChatMessage(walletAddress, message);

    if (!txHash) {
      return NextResponse.json(
        { error: 'Failed to send chat on-chain' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      txHash,
    });
  } catch (error) {
    console.error('Chat error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const count = parseInt(searchParams.get('count') || '50');

    const chats = await getRecentChats(count);

    return NextResponse.json({
      chats,
    });
  } catch (error) {
    console.error('Get chats error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

