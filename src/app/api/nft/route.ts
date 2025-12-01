import { NextRequest, NextResponse } from 'next/server';
import { 
  getCollections, 
  getCollectionNFTs, 
  getTrendingNFTs,
  getNFTDetails,
  getUserNFTs,
  getBuyTransaction,
} from '@/lib/services/nftService';
import { type NFTChainKey } from '@/lib/chains';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const action = searchParams.get('action');
  const chain = (searchParams.get('chain') || 'ethereum') as NFTChainKey;

  try {
    switch (action) {
      case 'collections': {
        const collections = await getCollections(chain);
        return NextResponse.json({ collections });
      }

      case 'nfts': {
        const collectionAddress = searchParams.get('collection');
        if (collectionAddress) {
          const nfts = await getCollectionNFTs(chain, collectionAddress);
          return NextResponse.json({ nfts });
        }
        const trending = await getTrendingNFTs(chain);
        return NextResponse.json({ nfts: trending });
      }

      case 'details': {
        const collection = searchParams.get('collection');
        const tokenId = searchParams.get('tokenId');
        if (!collection || !tokenId) {
          return NextResponse.json({ error: 'Missing collection or tokenId' }, { status: 400 });
        }
        const nft = await getNFTDetails(chain, collection, tokenId);
        return NextResponse.json({ nft });
      }

      case 'user': {
        const address = searchParams.get('address');
        if (!address) {
          return NextResponse.json({ error: 'Missing user address' }, { status: 400 });
        }
        const nfts = await getUserNFTs(chain, address);
        return NextResponse.json({ nfts });
      }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('NFT API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, chain, collectionAddress, tokenId, buyer } = body;

    if (action === 'buy') {
      if (!chain || !collectionAddress || !tokenId || !buyer) {
        return NextResponse.json(
          { error: 'Missing required parameters' },
          { status: 400 }
        );
      }

      const txData = await getBuyTransaction({
        chain,
        collectionAddress,
        tokenId,
        buyer,
      });

      if (!txData) {
        return NextResponse.json(
          { error: 'Failed to prepare buy transaction' },
          { status: 500 }
        );
      }

      return NextResponse.json({ transaction: txData });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('NFT POST API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
