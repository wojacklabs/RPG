import { NextRequest, NextResponse } from 'next/server';
import { 
  getCollections, 
  getCollectionNFTs, 
  getTrendingNFTs,
  getNFTDetails,
  type NFTChainKey 
} from '@/lib/services/nftService';

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

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('NFT API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

