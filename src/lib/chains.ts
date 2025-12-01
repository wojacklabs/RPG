import { defineChain } from 'viem';

// ============================================
// MegaETH - Game Data Storage Chain
// ============================================
export const megaethTestnet = defineChain({
  id: 6342,
  name: 'MegaETH Testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'Ether',
    symbol: 'ETH',
  },
  rpcUrls: {
    default: {
      http: [
        'https://carrot.megaeth.com/rpc',
        'https://6342.rpc.thirdweb.com',
      ],
      webSocket: ['wss://carrot.megaeth.com/ws'],
    },
  },
  blockExplorers: {
    default: {
      name: 'MegaETH Explorer',
      url: 'https://megaexplorer.xyz',
    },
  },
  testnet: true,
});

// ============================================
// EVM Chains for DeFi
// ============================================
export const EVM_CHAINS = {
  ethereum: {
    id: 1,
    name: 'Ethereum',
    icon: '⟠',
    nativeCurrency: { symbol: 'ETH', decimals: 18 },
    rpcUrl: 'https://eth.llamarpc.com',
    explorer: 'https://etherscan.io',
  },
  arbitrum: {
    id: 42161,
    name: 'Arbitrum',
    icon: '🔵',
    nativeCurrency: { symbol: 'ETH', decimals: 18 },
    rpcUrl: 'https://arb1.arbitrum.io/rpc',
    explorer: 'https://arbiscan.io',
  },
  base: {
    id: 8453,
    name: 'Base',
    icon: '🔷',
    nativeCurrency: { symbol: 'ETH', decimals: 18 },
    rpcUrl: 'https://mainnet.base.org',
    explorer: 'https://basescan.org',
  },
  polygon: {
    id: 137,
    name: 'Polygon',
    icon: '💜',
    nativeCurrency: { symbol: 'MATIC', decimals: 18 },
    rpcUrl: 'https://polygon-rpc.com',
    explorer: 'https://polygonscan.com',
  },
  optimism: {
    id: 10,
    name: 'Optimism',
    icon: '🔴',
    nativeCurrency: { symbol: 'ETH', decimals: 18 },
    rpcUrl: 'https://mainnet.optimism.io',
    explorer: 'https://optimistic.etherscan.io',
  },
  bsc: {
    id: 56,
    name: 'BNB Chain',
    icon: '🟡',
    nativeCurrency: { symbol: 'BNB', decimals: 18 },
    rpcUrl: 'https://bsc-dataseed.binance.org',
    explorer: 'https://bscscan.com',
  },
  avalanche: {
    id: 43114,
    name: 'Avalanche',
    icon: '🔺',
    nativeCurrency: { symbol: 'AVAX', decimals: 18 },
    rpcUrl: 'https://api.avax.network/ext/bc/C/rpc',
    explorer: 'https://snowtrace.io',
  },
} as const;

// ============================================
// Solana Chain
// ============================================
export const SOLANA_CONFIG = {
  name: 'Solana',
  icon: '◎',
  nativeCurrency: { symbol: 'SOL', decimals: 9 },
  rpcUrl: 'https://api.mainnet-beta.solana.com',
  explorer: 'https://solscan.io',
} as const;

// ============================================
// Sui Chain
// ============================================
export const SUI_CONFIG = {
  name: 'Sui',
  icon: '💧',
  nativeCurrency: { symbol: 'SUI', decimals: 9 },
  rpcUrl: 'https://fullnode.mainnet.sui.io',
  explorer: 'https://suiscan.xyz',
} as const;

// ============================================
// DeFi Protocols by Chain
// ============================================
export const DEFI_PROTOCOLS = {
  // Ethereum Mainnet
  ethereum: [
    { name: 'Uniswap', type: 'swap', icon: '🦄', address: '0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45' },
    { name: 'Aave V3', type: 'lending', icon: '👻', address: '0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2' },
    { name: 'Lido', type: 'staking', icon: '🌊', address: '0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84' },
    { name: 'Curve', type: 'swap', icon: '🔄', address: '0xbEbc44782C7dB0a1A60Cb6fe97d0b483032FF1C7' },
    { name: 'Compound', type: 'lending', icon: '🏦', address: '0xc3d688B66703497DAA19211EEdff47f25384cdc3' },
  ],
  // Arbitrum
  arbitrum: [
    { name: 'GMX', type: 'perp', icon: '📈', address: '0x489ee077994B6658eAfA855C308275EAd8097C4A' },
    { name: 'Camelot', type: 'swap', icon: '⚔️', address: '0xc873fEcbd354f5A56E00E710B90EF4201db2448d' },
    { name: 'Radiant', type: 'lending', icon: '✨', address: '0x2032b9A8e9F7e76768CA9271003d3e43E1616B1F' },
    { name: 'Pendle', type: 'yield', icon: '🎯', address: '0x0c880f6761F1af8d9Aa9C466984b80DAb9a8c9e8' },
    { name: 'Uniswap', type: 'swap', icon: '🦄', address: '0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45' },
  ],
  // Base
  base: [
    { name: 'Aerodrome', type: 'swap', icon: '✈️', address: '0xcF77a3Ba9A5CA399B7c97c74d54e5b1Beb874E43' },
    { name: 'Moonwell', type: 'lending', icon: '🌙', address: '0xfBb21d0380beE3312B33c4353c8936a0F13EF26C' },
    { name: 'Extra Finance', type: 'leverage', icon: '💎', address: '0xBB505c54D71E9e599cB8435b4F0cEEc05fC71cbf' },
    { name: 'BaseSwap', type: 'swap', icon: '🔷', address: '0x327Df1E6de05895d2ab08513aaDD9313Fe505d86' },
    { name: 'Uniswap', type: 'swap', icon: '🦄', address: '0x2626664c2603336E57B271c5C0b26F421741e481' },
  ],
  // Polygon
  polygon: [
    { name: 'QuickSwap', type: 'swap', icon: '⚡', address: '0xa5E0829CaCEd8fFDD4De3c43696c57F7D7A678ff' },
    { name: 'Aave V3', type: 'lending', icon: '👻', address: '0x794a61358D6845594F94dc1DB02A252b5b4814aD' },
    { name: 'Balancer', type: 'swap', icon: '⚖️', address: '0xBA12222222228d8Ba445958a75a0704d566BF2C8' },
    { name: 'Beefy', type: 'yield', icon: '🐮', address: '0xfbf0E5E67766eb7F8f1D0D36bABb6CB5fD1aAA64' },
    { name: 'Uniswap', type: 'swap', icon: '🦄', address: '0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45' },
  ],
  // Solana
  solana: [
    { name: 'Jupiter', type: 'swap', icon: '🪐', programId: 'JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4' },
    { name: 'Marinade', type: 'staking', icon: '🥩', programId: 'MarBmsSgKXdrN1egZf5sqe1TMai9K1rChYNDJgjq7aD' },
    { name: 'Raydium', type: 'swap', icon: '☀️', programId: '675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8' },
    { name: 'Drift', type: 'perp', icon: '🌊', programId: 'dRiftyHA39MWEi3m9aunc5MzRF1JYuBsbn6VPcn33UH' },
    { name: 'Kamino', type: 'lending', icon: '🏠', programId: 'KLend2g3cP87ber41VxkPgzgBHVwdvxWmJN53KQAb9b' },
  ],
  // Sui
  sui: [
    { name: 'Cetus', type: 'swap', icon: '🐋', packageId: '0x1eabed72c53feb3805120a081dc15963c204dc8d091542592abaf7a35689b2fb' },
    { name: 'Turbos', type: 'swap', icon: '⚡', packageId: '0x91bfbc386a41afcfd9b2533058d7e915a1d3829089cc268ff4333d54d6339ca1' },
    { name: 'Scallop', type: 'lending', icon: '🐚', packageId: '0xefe8b36d5b2e43728cc323298626b83177803521d195cfb11e15b910e892fddf' },
    { name: 'NAVI', type: 'lending', icon: '🧭', packageId: '0x834a86970ae93a73faf4fff16ae40bdb72b91c47be585fff0f7c789e25cc9d0d' },
    { name: 'Aftermath', type: 'swap', icon: '💫', packageId: '0xdc15721baa82ba64822d585a7349a1508f76d94e7a9e0f0c2d238e4bf0d31d97' },
  ],
} as const;

// ============================================
// NFT Marketplaces by Chain
// ============================================
export const NFT_MARKETPLACES = {
  ethereum: [
    { name: 'OpenSea', icon: '🌊', apiBase: 'https://api.opensea.io/v2', type: 'general' },
    { name: 'Blur', icon: '💨', apiBase: 'https://api.blur.io', type: 'trading' },
    { name: 'LooksRare', icon: '💎', apiBase: 'https://api.looksrare.org', type: 'rewards' },
  ],
  arbitrum: [
    { name: 'OpenSea', icon: '🌊', apiBase: 'https://api.opensea.io/v2', type: 'general' },
    { name: 'Stratos', icon: '⚡', apiBase: 'https://api.stratosnft.io', type: 'general' },
  ],
  base: [
    { name: 'OpenSea', icon: '🌊', apiBase: 'https://api.opensea.io/v2', type: 'general' },
    { name: 'Mintify', icon: '🎨', apiBase: 'https://api.mintify.xyz', type: 'general' },
  ],
  polygon: [
    { name: 'OpenSea', icon: '🌊', apiBase: 'https://api.opensea.io/v2', type: 'general' },
    { name: 'Rarible', icon: '🎭', apiBase: 'https://api.rarible.org', type: 'general' },
  ],
  optimism: [
    { name: 'OpenSea', icon: '🌊', apiBase: 'https://api.opensea.io/v2', type: 'general' },
    { name: 'Quix', icon: '🖼️', apiBase: 'https://api.quix.co', type: 'general' },
  ],
  solana: [
    { name: 'Magic Eden', icon: '🪄', apiBase: 'https://api-mainnet.magiceden.dev/v2', type: 'general' },
    { name: 'Tensor', icon: '📐', apiBase: 'https://api.tensor.so', type: 'trading' },
  ],
  sui: [
    { name: 'BlueMove', icon: '🔵', apiBase: 'https://api.bluemove.net', type: 'general' },
    { name: 'Clutchy', icon: '🎮', apiBase: 'https://api.clutchy.io', type: 'gaming' },
  ],
} as const;

// ============================================
// Bridge Protocols
// ============================================
export const BRIDGE_PROTOCOLS = {
  lifi: {
    name: 'LI.FI',
    icon: '🔗',
    apiBase: 'https://li.quest/v1',
    supportedChains: ['ethereum', 'arbitrum', 'base', 'polygon', 'optimism', 'bsc', 'avalanche'],
  },
  stargate: {
    name: 'Stargate',
    icon: '⭐',
    apiBase: 'https://api.stargate.finance',
    supportedChains: ['ethereum', 'arbitrum', 'base', 'polygon', 'optimism', 'bsc', 'avalanche'],
  },
  wormhole: {
    name: 'Wormhole',
    icon: '🕳️',
    apiBase: 'https://api.wormholescan.io',
    supportedChains: ['ethereum', 'solana', 'sui', 'arbitrum', 'base', 'polygon'],
  },
} as const;

// Supported chains for wallet connection
export const supportedChains = {
  megaethTestnet,
} as const;

// Chain type definitions
export type EVMChainKey = keyof typeof EVM_CHAINS;
export type DefiChainKey = keyof typeof DEFI_PROTOCOLS;
export type NFTChainKey = keyof typeof NFT_MARKETPLACES;
