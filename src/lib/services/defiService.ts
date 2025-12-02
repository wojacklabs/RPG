// Multi-chain DeFi Service
// Uses Uniswap V3 for swaps - No API Key Required

import { EVM_CHAINS, DEFI_PROTOCOLS, type EVMChainKey, type DefiChainKey } from '../chains';
import { getQuote as getUniswapQuote } from './uniswapService';

// ============================================
// Types
// ============================================
export interface SwapQuote {
  fromToken: string;
  toToken: string;
  fromAmount: string;
  toAmount: string;
  priceImpact: number;
  fee: string;
  route: string[];
  chainId: number;
  protocol: string;
}

export interface StakingInfo {
  protocol: string;
  token: string;
  apy: number;
  tvl: string;
  minStake: string;
  lockPeriod?: number;
}

export interface BridgeQuote {
  fromChain: string;
  toChain: string;
  token: string;
  amount: string;
  estimatedReceive: string;
  fee: string;
  estimatedTime: string;
}

export interface LPInfo {
  protocol: string;
  pool: string;
  token0: string;
  token1: string;
  apy: number;
  tvl: string;
  fee: number;
}

// ============================================
// Chain Configuration
// ============================================
const CHAIN_IDS: Record<string, number> = {
  ethereum: 1,
  arbitrum: 42161,
  base: 8453,
  polygon: 137,
  optimism: 10,
};

// ============================================
// Swap Functions - Using Uniswap V3
// ============================================
export async function getSwapQuote(
  chainKey: DefiChainKey,
  fromToken: string,
  toToken: string,
  amount: string,
  protocol?: string
): Promise<SwapQuote | null> {
  // Only EVM chains supported for Uniswap
  if (!CHAIN_IDS[chainKey]) {
    return getMockSwapQuote(chainKey, fromToken, toToken, amount);
  }

  try {
    const quote = await getUniswapQuote(chainKey, fromToken, toToken, amount);
    
    return {
      fromToken,
      toToken,
      fromAmount: amount,
      toAmount: quote.amountOut,
      priceImpact: quote.priceImpact,
      fee: (parseInt(quote.gasEstimate) * 30 / 1e9).toFixed(2), // Rough gas cost in USD
      route: [fromToken, toToken],
      chainId: CHAIN_IDS[chainKey],
      protocol: 'Uniswap V3',
    };
  } catch (error) {
    console.error('Uniswap quote error:', error);
    return getMockSwapQuote(chainKey, fromToken, toToken, amount);
  }
}

function getMockSwapQuote(
  chainKey: DefiChainKey,
  fromToken: string,
  toToken: string,
  amount: string
): SwapQuote {
  const rates: Record<string, Record<string, number>> = {
    ETH: { USDC: 3500, USDT: 3500, WBTC: 0.053, ARB: 3000, DAI: 3500 },
    USDC: { ETH: 0.000285, USDT: 1, WBTC: 0.0000151, DAI: 1 },
    MATIC: { USDC: 0.85, USDT: 0.85, WETH: 0.00024 },
    SOL: { USDC: 180, USDT: 180 },
    SUI: { USDC: 2.5, USDT: 2.5 },
    ARB: { ETH: 0.00033, USDC: 1.15 },
  };

  const rate = rates[fromToken]?.[toToken] || 1;
  const toAmount = (parseFloat(amount) * rate * 0.997).toFixed(6);

  return {
    fromToken,
    toToken,
    fromAmount: amount,
    toAmount,
    priceImpact: 0.3,
    fee: '0.50',
    route: [fromToken, toToken],
    chainId: CHAIN_IDS[chainKey] || 1,
    protocol: chainKey === 'solana' ? 'Jupiter' : chainKey === 'sui' ? 'Cetus' : 'Uniswap V3',
  };
}

// ============================================
// Bridge Functions
// ============================================
export async function getBridgeQuote(
  fromChain: string,
  toChain: string,
  token: string,
  amount: string
): Promise<BridgeQuote | null> {
  // For now, return estimates. In production, integrate with:
  // - Stargate
  // - Across
  // - Hop Protocol
  const fee = parseFloat(amount) * 0.001;
  return {
    fromChain,
    toChain,
    token,
    amount,
    estimatedReceive: (parseFloat(amount) - fee).toFixed(6),
    fee: fee.toFixed(6),
    estimatedTime: '5-15 minutes',
  };
}

// ============================================
// Staking Functions
// ============================================
export async function getStakingOptions(chainKey: DefiChainKey): Promise<StakingInfo[]> {
  const stakingData: Record<string, StakingInfo[]> = {
    ethereum: [
      { protocol: 'Lido', token: 'ETH', apy: 3.8, tvl: '$28.5B', minStake: '0.01' },
      { protocol: 'Rocket Pool', token: 'ETH', apy: 3.6, tvl: '$3.2B', minStake: '0.01' },
      { protocol: 'Frax', token: 'ETH', apy: 4.1, tvl: '$1.1B', minStake: '0.01' },
    ],
    arbitrum: [
      { protocol: 'GMX', token: 'GMX', apy: 12.5, tvl: '$450M', minStake: '1' },
      { protocol: 'Pendle', token: 'ETH', apy: 8.2, tvl: '$180M', minStake: '0.1' },
    ],
    base: [
      { protocol: 'Aerodrome', token: 'AERO', apy: 25.0, tvl: '$200M', minStake: '10' },
    ],
    polygon: [
      { protocol: 'Lido', token: 'MATIC', apy: 4.5, tvl: '$500M', minStake: '1' },
    ],
    solana: [
      { protocol: 'Marinade', token: 'SOL', apy: 7.2, tvl: '$1.2B', minStake: '0.1' },
      { protocol: 'Jito', token: 'SOL', apy: 7.8, tvl: '$800M', minStake: '0.1' },
    ],
    sui: [
      { protocol: 'Aftermath', token: 'SUI', apy: 4.5, tvl: '$120M', minStake: '1' },
    ],
  };

  return stakingData[chainKey] || [];
}

// ============================================
// Liquidity Pool Functions
// ============================================
export async function getLiquidityPools(chainKey: DefiChainKey): Promise<LPInfo[]> {
  const lpData: Record<string, LPInfo[]> = {
    ethereum: [
      { protocol: 'Uniswap V3', pool: 'ETH/USDC', token0: 'ETH', token1: 'USDC', apy: 18.5, tvl: '$320M', fee: 0.3 },
      { protocol: 'Uniswap V3', pool: 'ETH/USDT', token0: 'ETH', token1: 'USDT', apy: 15.2, tvl: '$180M', fee: 0.3 },
      { protocol: 'Curve', pool: '3pool', token0: 'USDC', token1: 'USDT', apy: 4.2, tvl: '$850M', fee: 0.04 },
    ],
    arbitrum: [
      { protocol: 'Uniswap V3', pool: 'ETH/USDC', token0: 'ETH', token1: 'USDC', apy: 22.3, tvl: '$85M', fee: 0.3 },
      { protocol: 'Camelot', pool: 'ETH/ARB', token0: 'ETH', token1: 'ARB', apy: 28.5, tvl: '$45M', fee: 0.3 },
    ],
    base: [
      { protocol: 'Uniswap V3', pool: 'ETH/USDC', token0: 'ETH', token1: 'USDC', apy: 25.1, tvl: '$65M', fee: 0.3 },
      { protocol: 'Aerodrome', pool: 'ETH/USDC', token0: 'ETH', token1: 'USDC', apy: 32.1, tvl: '$28M', fee: 0.3 },
    ],
    polygon: [
      { protocol: 'Uniswap V3', pool: 'MATIC/USDC', token0: 'MATIC', token1: 'USDC', apy: 12.0, tvl: '$40M', fee: 0.3 },
    ],
    solana: [
      { protocol: 'Raydium', pool: 'SOL/USDC', token0: 'SOL', token1: 'USDC', apy: 28.5, tvl: '$85M', fee: 0.25 },
      { protocol: 'Orca', pool: 'SOL/USDC', token0: 'SOL', token1: 'USDC', apy: 22.3, tvl: '$120M', fee: 0.3 },
    ],
    sui: [
      { protocol: 'Cetus', pool: 'SUI/USDC', token0: 'SUI', token1: 'USDC', apy: 45.2, tvl: '$15M', fee: 0.25 },
    ],
  };

  return lpData[chainKey] || [];
}

// ============================================
// Utility Functions
// ============================================
export function getProtocolsForChain(chainKey: DefiChainKey) {
  return DEFI_PROTOCOLS[chainKey] || [];
}

export function getSupportedChains() {
  return {
    evm: Object.entries(EVM_CHAINS).map(([key, chain]) => ({
      key,
      ...chain,
    })),
    solana: { key: 'solana', name: 'Solana', icon: '◎' },
    sui: { key: 'sui', name: 'Sui', icon: '💧' },
  };
}

export function getChainId(chainKey: string): number {
  return CHAIN_IDS[chainKey] || 1;
}
