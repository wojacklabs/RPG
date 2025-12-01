// NFT Marketplace Service
// Real API integration with Reservoir (EVM) and Magic Eden (Solana)

import { NFT_MARKETPLACES, type NFTChainKey } from '../chains';

// ============================================
// Types
// ============================================
export interface NFTItem {
  id: string;
  tokenId: string;
  name: string;
  description: string;
  image: string;
  collection: string;
  collectionAddress: string;
  chain: string;
  price: string;
  currency: string;
  owner: string;
  marketplace: string;
  attributes?: { trait_type: string; value: string }[];
  buyUrl?: string;
}

export interface NFTCollection {
  address: string;
  name: string;
  symbol: string;
  description: string;
  image: string;
  chain: string;
  floorPrice: string;
  currency: string;
  totalSupply: number;
  owners: number;
  volume24h: string;
}

// ============================================
// API Configuration
// ============================================
const RESERVOIR_BASE_URLS: Record<string, string> = {
  ethereum: 'https://api.reservoir.tools',
  arbitrum: 'https://api-arbitrum.reservoir.tools',
  base: 'https://api-base.reservoir.tools',
  polygon: 'https://api-polygon.reservoir.tools',
  optimism: 'https://api-optimism.reservoir.tools',
};

const MAGIC_EDEN_BASE_URL = 'https://api-mainnet.magiceden.dev/v2';

const CURRENCY_MAP: Record<string, string> = {
  ethereum: 'ETH',
  arbitrum: 'ETH',
  base: 'ETH',
  polygon: 'MATIC',
  optimism: 'ETH',
  solana: 'SOL',
  sui: 'SUI',
};

// ============================================
// Reservoir API (EVM Chains)
// ============================================

async function fetchReservoirCollections(chain: string): Promise<NFTCollection[]> {
  const baseUrl = RESERVOIR_BASE_URLS[chain];
  if (!baseUrl) return [];

  try {
    const response = await fetch(
      `${baseUrl}/collections/v7?sortBy=1DayVolume&limit=20`,
      {
        headers: {
          'accept': 'application/json',
          'x-api-key': process.env.RESERVOIR_API_KEY || 'demo-api-key',
        },
        next: { revalidate: 60 }, // Cache for 1 minute
      }
    );

    if (!response.ok) {
      console.error(`Reservoir API error: ${response.status}`);
      return [];
    }

    const data = await response.json();
    
    return (data.collections || []).map((c: any) => ({
      address: c.id || c.primaryContract,
      name: c.name || 'Unknown',
      symbol: c.symbol || '',
      description: c.description || '',
      image: c.image || '🖼️',
      chain,
      floorPrice: c.floorAsk?.price?.amount?.decimal?.toFixed(4) || '0',
      currency: CURRENCY_MAP[chain],
      totalSupply: c.tokenCount || 0,
      owners: c.ownerCount || 0,
      volume24h: c.volume?.['1day']?.toFixed(2) || '0',
    }));
  } catch (error) {
    console.error('Reservoir collections error:', error);
    return [];
  }
}

async function fetchReservoirNFTs(
  chain: string,
  collectionAddress?: string,
  limit = 20
): Promise<NFTItem[]> {
  const baseUrl = RESERVOIR_BASE_URLS[chain];
  if (!baseUrl) return [];

  try {
    let url = `${baseUrl}/tokens/v7?limit=${limit}&sortBy=floorAskPrice&includeAttributes=true`;
    if (collectionAddress) {
      url += `&collection=${collectionAddress}`;
    }

    const response = await fetch(url, {
      headers: {
        'accept': 'application/json',
        'x-api-key': process.env.RESERVOIR_API_KEY || 'demo-api-key',
      },
      next: { revalidate: 30 },
    });

    if (!response.ok) {
      console.error(`Reservoir tokens API error: ${response.status}`);
      return [];
    }

    const data = await response.json();

    return (data.tokens || [])
      .filter((t: any) => t.market?.floorAsk?.price) // Only listed tokens
      .map((t: any) => ({
        id: `${t.token?.contract}-${t.token?.tokenId}`,
        tokenId: t.token?.tokenId || '',
        name: t.token?.name || `#${t.token?.tokenId}`,
        description: t.token?.description || '',
        image: t.token?.image || t.token?.imageSmall || '🖼️',
        collection: t.token?.collection?.name || 'Unknown',
        collectionAddress: t.token?.contract || '',
        chain,
        price: t.market?.floorAsk?.price?.amount?.decimal?.toFixed(4) || '0',
        currency: CURRENCY_MAP[chain],
        owner: t.token?.owner?.slice(0, 6) + '...' + t.token?.owner?.slice(-4) || 'Unknown',
        marketplace: t.market?.floorAsk?.source?.name || 'OpenSea',
        attributes: (t.token?.attributes || []).map((a: any) => ({
          trait_type: a.key,
          value: a.value,
        })),
        buyUrl: t.market?.floorAsk?.source?.url || '',
      }));
  } catch (error) {
    console.error('Reservoir NFTs error:', error);
    return [];
  }
}

async function getReservoirBuyPath(
  chain: string,
  collectionAddress: string,
  tokenId: string,
  buyer: string
): Promise<any> {
  const baseUrl = RESERVOIR_BASE_URLS[chain];
  if (!baseUrl) return null;

  try {
    const response = await fetch(`${baseUrl}/execute/buy/v7`, {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'content-type': 'application/json',
        'x-api-key': process.env.RESERVOIR_API_KEY || 'demo-api-key',
      },
      body: JSON.stringify({
        items: [{ token: `${collectionAddress}:${tokenId}`, quantity: 1 }],
        taker: buyer,
        skipBalanceCheck: true,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Reservoir buy error:', error);
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error('Reservoir buy path error:', error);
    return null;
  }
}

// ============================================
// Magic Eden API (Solana)
// ============================================

async function fetchMagicEdenCollections(): Promise<NFTCollection[]> {
  try {
    // Magic Eden popular collections
    const response = await fetch(
      `${MAGIC_EDEN_BASE_URL}/marketplace/popular_collections?timeRange=1d&limit=20`,
      {
        headers: {
          'accept': 'application/json',
        },
        next: { revalidate: 60 },
      }
    );

    if (!response.ok) {
      console.error(`Magic Eden collections error: ${response.status}`);
      return [];
    }

    const data = await response.json();

    return (data || []).map((c: any) => ({
      address: c.collectionSymbol || c.symbol,
      name: c.name || 'Unknown',
      symbol: c.symbol || '',
      description: c.description || '',
      image: c.image || '🖼️',
      chain: 'solana',
      floorPrice: (c.floorPrice / 1e9).toFixed(2) || '0',
      currency: 'SOL',
      totalSupply: c.totalItems || 0,
      owners: c.uniqueHolders || 0,
      volume24h: ((c.volumeAll || 0) / 1e9).toFixed(2),
    }));
  } catch (error) {
    console.error('Magic Eden collections error:', error);
    return [];
  }
}

async function fetchMagicEdenNFTs(
  collectionSymbol?: string,
  limit = 20
): Promise<NFTItem[]> {
  try {
    let url: string;
    if (collectionSymbol) {
      url = `${MAGIC_EDEN_BASE_URL}/collections/${collectionSymbol}/listings?limit=${limit}`;
    } else {
      url = `${MAGIC_EDEN_BASE_URL}/marketplace/listings?limit=${limit}`;
    }

    const response = await fetch(url, {
      headers: { 'accept': 'application/json' },
      next: { revalidate: 30 },
    });

    if (!response.ok) {
      console.error(`Magic Eden NFTs error: ${response.status}`);
      return [];
    }

    const data = await response.json();

    return (data || []).map((item: any) => ({
      id: item.tokenMint,
      tokenId: item.tokenMint,
      name: item.extra?.name || `#${item.tokenMint?.slice(0, 8)}`,
      description: '',
      image: item.extra?.img || '🖼️',
      collection: collectionSymbol || 'Unknown',
      collectionAddress: collectionSymbol || '',
      chain: 'solana',
      price: (item.price / 1e9).toFixed(2),
      currency: 'SOL',
      owner: item.seller?.slice(0, 4) + '...' + item.seller?.slice(-4) || 'Unknown',
      marketplace: 'Magic Eden',
      attributes: (item.extra?.attributes || []).map((a: any) => ({
        trait_type: a.trait_type,
        value: a.value,
      })),
      buyUrl: `https://magiceden.io/item-details/${item.tokenMint}`,
    }));
  } catch (error) {
    console.error('Magic Eden NFTs error:', error);
    return [];
  }
}

// ============================================
// Fallback Mock Data (for demo/testing)
// ============================================
const FALLBACK_COLLECTIONS: Record<string, NFTCollection[]> = {
  ethereum: [
    {
      address: '0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D',
      name: 'Bored Ape Yacht Club',
      symbol: 'BAYC',
      description: 'A collection of 10,000 unique Bored Ape NFTs',
      image: '🦍',
      chain: 'ethereum',
      floorPrice: '28.5',
      currency: 'ETH',
      totalSupply: 10000,
      owners: 5432,
      volume24h: '245.8',
    },
    {
      address: '0xED5AF388653567Af2F388E6224dC7C4b3241C544',
      name: 'Azuki',
      symbol: 'AZUKI',
      description: 'Azuki starts with a collection of 10,000 avatars',
      image: '🎌',
      chain: 'ethereum',
      floorPrice: '8.9',
      currency: 'ETH',
      totalSupply: 10000,
      owners: 4521,
      volume24h: '156.2',
    },
  ],
  solana: [
    {
      address: 'mad_lads',
      name: 'Mad Lads',
      symbol: 'MAD',
      description: 'Mad Lads by Backpack',
      image: '😎',
      chain: 'solana',
      floorPrice: '145',
      currency: 'SOL',
      totalSupply: 10000,
      owners: 4532,
      volume24h: '2340',
    },
  ],
  sui: [
    {
      address: '0x8f74a7d632191e29956f3c1f8dbe2cc7e9d32b49',
      name: 'Sui Punks',
      symbol: 'SPUNK',
      description: 'First punk collection on Sui',
      image: '👾',
      chain: 'sui',
      floorPrice: '12',
      currency: 'SUI',
      totalSupply: 5000,
      owners: 2345,
      volume24h: '450',
    },
  ],
};

// ============================================
// Public API Functions
// ============================================

export async function getCollections(chainKey: NFTChainKey): Promise<NFTCollection[]> {
  try {
    // EVM chains - use Reservoir
    if (RESERVOIR_BASE_URLS[chainKey]) {
      const collections = await fetchReservoirCollections(chainKey);
      if (collections.length > 0) return collections;
    }

    // Solana - use Magic Eden
    if (chainKey === 'solana') {
      const collections = await fetchMagicEdenCollections();
      if (collections.length > 0) return collections;
    }

    // Fallback to mock data
    return FALLBACK_COLLECTIONS[chainKey] || [];
  } catch (error) {
    console.error('Failed to fetch collections:', error);
    return FALLBACK_COLLECTIONS[chainKey] || [];
  }
}

export async function getCollectionNFTs(
  chainKey: NFTChainKey,
  collectionAddress: string,
  limit = 20
): Promise<NFTItem[]> {
  try {
    // EVM chains - use Reservoir
    if (RESERVOIR_BASE_URLS[chainKey]) {
      return await fetchReservoirNFTs(chainKey, collectionAddress, limit);
    }

    // Solana - use Magic Eden
    if (chainKey === 'solana') {
      return await fetchMagicEdenNFTs(collectionAddress, limit);
    }

    return [];
  } catch (error) {
    console.error('Failed to fetch NFTs:', error);
    return [];
  }
}

export async function getTrendingNFTs(chainKey: NFTChainKey): Promise<NFTItem[]> {
  try {
    // EVM chains - use Reservoir
    if (RESERVOIR_BASE_URLS[chainKey]) {
      return await fetchReservoirNFTs(chainKey, undefined, 20);
    }

    // Solana - use Magic Eden
    if (chainKey === 'solana') {
      return await fetchMagicEdenNFTs(undefined, 20);
    }

    return [];
  } catch (error) {
    console.error('Failed to fetch trending NFTs:', error);
    return [];
  }
}

export async function getUserNFTs(
  chainKey: NFTChainKey,
  userAddress: string
): Promise<NFTItem[]> {
  try {
    const baseUrl = RESERVOIR_BASE_URLS[chainKey];
    if (!baseUrl) return [];

    const response = await fetch(
      `${baseUrl}/users/${userAddress}/tokens/v10?limit=50`,
      {
        headers: {
          'accept': 'application/json',
          'x-api-key': process.env.RESERVOIR_API_KEY || 'demo-api-key',
        },
      }
    );

    if (!response.ok) return [];

    const data = await response.json();
    
    return (data.tokens || []).map((t: any) => ({
      id: `${t.token?.contract}-${t.token?.tokenId}`,
      tokenId: t.token?.tokenId || '',
      name: t.token?.name || `#${t.token?.tokenId}`,
      description: t.token?.description || '',
      image: t.token?.image || '🖼️',
      collection: t.token?.collection?.name || 'Unknown',
      collectionAddress: t.token?.contract || '',
      chain: chainKey,
      price: t.market?.floorAsk?.price?.amount?.decimal?.toFixed(4) || 'Not listed',
      currency: CURRENCY_MAP[chainKey],
      owner: userAddress,
      marketplace: '',
    }));
  } catch (error) {
    console.error('Failed to fetch user NFTs:', error);
    return [];
  }
}

export async function getNFTDetails(
  chainKey: NFTChainKey,
  collectionAddress: string,
  tokenId: string
): Promise<NFTItem | null> {
  try {
    const baseUrl = RESERVOIR_BASE_URLS[chainKey];
    if (!baseUrl) return null;

    const response = await fetch(
      `${baseUrl}/tokens/v7?tokens=${collectionAddress}:${tokenId}&includeAttributes=true`,
      {
        headers: {
          'accept': 'application/json',
          'x-api-key': process.env.RESERVOIR_API_KEY || 'demo-api-key',
        },
      }
    );

    if (!response.ok) return null;

    const data = await response.json();
    const t = data.tokens?.[0];
    if (!t) return null;

    return {
      id: `${t.token?.contract}-${t.token?.tokenId}`,
      tokenId: t.token?.tokenId || '',
      name: t.token?.name || `#${t.token?.tokenId}`,
      description: t.token?.description || '',
      image: t.token?.image || '🖼️',
      collection: t.token?.collection?.name || 'Unknown',
      collectionAddress: t.token?.contract || '',
      chain: chainKey,
      price: t.market?.floorAsk?.price?.amount?.decimal?.toFixed(4) || '0',
      currency: CURRENCY_MAP[chainKey],
      owner: t.token?.owner || 'Unknown',
      marketplace: t.market?.floorAsk?.source?.name || '',
      attributes: (t.token?.attributes || []).map((a: any) => ({
        trait_type: a.key,
        value: a.value,
      })),
    };
  } catch (error) {
    console.error('Failed to fetch NFT details:', error);
    return null;
  }
}

export function getMarketplacesForChain(chainKey: NFTChainKey) {
  return NFT_MARKETPLACES[chainKey] || [];
}

// ============================================
// Transaction Helpers
// ============================================

export interface BuyNFTParams {
  chain: string;
  collectionAddress: string;
  tokenId: string;
  buyer: string;
}

export async function getBuyTransaction(params: BuyNFTParams) {
  const { chain, collectionAddress, tokenId, buyer } = params;

  // For EVM chains, use Reservoir
  if (RESERVOIR_BASE_URLS[chain]) {
    return await getReservoirBuyPath(chain, collectionAddress, tokenId, buyer);
  }

  // For Solana, return Magic Eden URL (client-side redirect)
  if (chain === 'solana') {
    return {
      type: 'redirect',
      url: `https://magiceden.io/item-details/${tokenId}`,
    };
  }

  return null;
}
