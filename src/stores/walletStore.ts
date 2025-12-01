import { create } from 'zustand';

export interface TokenBalance {
  symbol: string;
  name: string;
  balance: string;
  decimals: number;
  address: string;
  chainId: number;
  logoURI?: string;
  usdValue?: number;
}

export interface NFTItem {
  tokenId: string;
  name: string;
  description?: string;
  image: string;
  contractAddress: string;
  chainId: number;
  collection?: string;
}

interface WalletStore {
  address: string | null;
  setAddress: (address: string | null) => void;
  
  isConnected: boolean;
  setIsConnected: (connected: boolean) => void;
  
  tokens: TokenBalance[];
  setTokens: (tokens: TokenBalance[]) => void;
  
  nfts: NFTItem[];
  setNFTs: (nfts: NFTItem[]) => void;
  
  selectedChainId: number;
  setSelectedChainId: (chainId: number) => void;
  
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

export const useWalletStore = create<WalletStore>((set) => ({
  address: null,
  setAddress: (address) => set({ address }),
  
  isConnected: false,
  setIsConnected: (connected) => set({ isConnected: connected }),
  
  tokens: [],
  setTokens: (tokens) => set({ tokens }),
  
  nfts: [],
  setNFTs: (nfts) => set({ nfts }),
  
  selectedChainId: 6342,
  setSelectedChainId: (chainId) => set({ selectedChainId: chainId }),
  
  isLoading: false,
  setIsLoading: (loading) => set({ isLoading: loading }),
}));

