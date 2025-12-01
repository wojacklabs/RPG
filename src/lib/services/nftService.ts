// NFT Marketplace Service
// Handles NFT listing, buying, and collection browsing across multiple chains

import { NFT_MARKETPLACES, type NFTChainKey } from '../chains';

// ============================================
// Types
// ============================================
export interface NFTItem {
  id: string;
  name: string;
  description: string;
  image: string;
  collection: string;
  chain: string;
  price: string;
  currency: string;
  owner: string;
  marketplace: string;
  attributes?: { trait_type: string; value: string }[];
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

export interface NFTListingParams {
  nftAddress: string;
  tokenId: string;
  price: string;
  currency: string;
  chain: string;
}

// ============================================
// Mock Data for Demo
// ============================================
const MOCK_COLLECTIONS: Record<string, NFTCollection[]> = {
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
      address: '0x60E4d786628Fea6478F785A6d7e704777c86a7c6',
      name: 'Mutant Ape Yacht Club',
      symbol: 'MAYC',
      description: 'Mutant Apes from the BAYC collection',
      image: '🧟',
      chain: 'ethereum',
      floorPrice: '5.2',
      currency: 'ETH',
      totalSupply: 20000,
      owners: 12543,
      volume24h: '89.3',
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
  arbitrum: [
    {
      address: '0x17dacad7975960833f374622fad08b90ed67d1b5',
      name: 'Smol Brains',
      symbol: 'SMOL',
      description: 'Smol Brains are a dynamically generated NFT collection',
      image: '🧠',
      chain: 'arbitrum',
      floorPrice: '0.12',
      currency: 'ETH',
      totalSupply: 13421,
      owners: 3245,
      volume24h: '12.5',
    },
    {
      address: '0x3a8778a58993ba4b941f85684d74750043a4bb5f',
      name: 'Tales of Elleria',
      symbol: 'HEROES',
      description: 'Play-to-earn RPG heroes on Arbitrum',
      image: '⚔️',
      chain: 'arbitrum',
      floorPrice: '0.08',
      currency: 'ETH',
      totalSupply: 8000,
      owners: 2100,
      volume24h: '5.2',
    },
  ],
  base: [
    {
      address: '0xd4307e0acd12cf46fd6cf93bc264f5d5d1598792',
      name: 'Base, Pair',
      symbol: 'BASE',
      description: 'The official Base NFT collection',
      image: '🔷',
      chain: 'base',
      floorPrice: '0.025',
      currency: 'ETH',
      totalSupply: 10000,
      owners: 6234,
      volume24h: '8.9',
    },
  ],
  polygon: [
    {
      address: '0x22d5f9B75c524Fec1D6619787e582644CD4D7422',
      name: 'y00ts',
      symbol: 'Y00TS',
      description: 'y00ts migrated to Polygon',
      image: '👽',
      chain: 'polygon',
      floorPrice: '320',
      currency: 'MATIC',
      totalSupply: 15000,
      owners: 8765,
      volume24h: '45000',
    },
  ],
  solana: [
    {
      address: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263',
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
    {
      address: 'J1S9H3QjnRtBbbuD4HjPV6RpRhwuk4zKbxsnCHuTgh9w',
      name: 'Okay Bears',
      symbol: 'OKAY',
      description: 'Okay Bears is a culture shift',
      image: '🐻',
      chain: 'solana',
      floorPrice: '32',
      currency: 'SOL',
      totalSupply: 10000,
      owners: 5123,
      volume24h: '890',
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

const MOCK_NFTS: Record<string, NFTItem[]> = {
  ethereum: [
    {
      id: '1234',
      name: 'Bored Ape #1234',
      description: 'A unique Bored Ape',
      image: '🦍',
      collection: 'Bored Ape Yacht Club',
      chain: 'ethereum',
      price: '32.5',
      currency: 'ETH',
      owner: '0x1234...5678',
      marketplace: 'OpenSea',
      attributes: [
        { trait_type: 'Background', value: 'Blue' },
        { trait_type: 'Fur', value: 'Golden' },
      ],
    },
    {
      id: '5678',
      name: 'Azuki #5678',
      description: 'A unique Azuki character',
      image: '🎌',
      collection: 'Azuki',
      chain: 'ethereum',
      price: '12.8',
      currency: 'ETH',
      owner: '0xabcd...efgh',
      marketplace: 'Blur',
    },
  ],
  solana: [
    {
      id: 'mad123',
      name: 'Mad Lad #123',
      description: 'A mad lad from Backpack',
      image: '😎',
      collection: 'Mad Lads',
      chain: 'solana',
      price: '155',
      currency: 'SOL',
      owner: 'Abc1...xyz9',
      marketplace: 'Magic Eden',
    },
  ],
};

// ============================================
// API Functions
// ============================================

export async function getCollections(chainKey: NFTChainKey): Promise<NFTCollection[]> {
  try {
    // In production, call actual marketplace APIs
    // For now, return mock data
    return MOCK_COLLECTIONS[chainKey] || [];
  } catch (error) {
    console.error('Failed to fetch collections:', error);
    return MOCK_COLLECTIONS[chainKey] || [];
  }
}

export async function getCollectionNFTs(
  chainKey: NFTChainKey,
  collectionAddress: string,
  limit = 20
): Promise<NFTItem[]> {
  try {
    // In production, call actual marketplace APIs
    return MOCK_NFTS[chainKey] || [];
  } catch (error) {
    console.error('Failed to fetch NFTs:', error);
    return [];
  }
}

export async function getTrendingNFTs(chainKey: NFTChainKey): Promise<NFTItem[]> {
  try {
    return MOCK_NFTS[chainKey] || [];
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
    // In production, call actual APIs
    // Return empty for demo
    return [];
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
    const nfts = MOCK_NFTS[chainKey] || [];
    return nfts.find(n => n.id === tokenId) || null;
  } catch (error) {
    console.error('Failed to fetch NFT details:', error);
    return null;
  }
}

export function getMarketplacesForChain(chainKey: NFTChainKey) {
  return NFT_MARKETPLACES[chainKey] || [];
}

// ============================================
// Transaction Helpers (Mock)
// ============================================

export interface BuyNFTParams {
  chain: string;
  collection: string;
  tokenId: string;
  price: string;
  currency: string;
}

export async function prepareBuyTransaction(params: BuyNFTParams) {
  // In production, prepare actual transaction data
  return {
    to: params.collection,
    value: params.price,
    data: '0x', // Actual calldata would go here
  };
}

export async function prepareListTransaction(params: NFTListingParams) {
  // In production, prepare actual listing transaction
  return {
    marketplace: 'OpenSea',
    approval: {
      to: params.nftAddress,
      data: '0x', // Approval calldata
    },
    listing: {
      price: params.price,
      currency: params.currency,
      expiration: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
    },
  };
}

