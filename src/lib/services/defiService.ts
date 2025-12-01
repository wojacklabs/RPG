// Multi-chain DeFi Service
// Handles swap, staking, bridge, and liquidity across EVM, Solana, and Sui chains

import { createPublicClient, http } from 'viem';
import { mainnet } from 'viem/chains';
import { EVM_CHAINS, DEFI_PROTOCOLS, type EVMChainKey, type DefiChainKey } from '../chains';

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
// EVM Public Client Factory
// ============================================
function getEvmClient(chainKey: EVMChainKey) {
  const chain = EVM_CHAINS[chainKey];
  return createPublicClient({
    chain: mainnet, // Use mainnet as base for type compatibility
    transport: http(chain.rpcUrl),
  });
}

// ============================================
// Swap Functions
// ============================================
export async function getSwapQuote(
  chainKey: DefiChainKey,
  fromToken: string,
  toToken: string,
  amount: string,
  protocol?: string
): Promise<SwapQuote | null> {
  try {
    // Use LI.FI API for cross-chain swap quotes
    const response = await fetch('https://li.quest/v1/quote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fromChain: chainKey === 'solana' ? 'SOL' : chainKey === 'sui' ? 'SUI' : getChainIdFromKey(chainKey),
        toChain: chainKey === 'solana' ? 'SOL' : chainKey === 'sui' ? 'SUI' : getChainIdFromKey(chainKey),
        fromToken,
        toToken,
        fromAmount: amount,
      }),
    });

    if (!response.ok) {
      // Fallback to mock data for demo
      return getMockSwapQuote(chainKey, fromToken, toToken, amount);
    }

    const data = await response.json();
    return {
      fromToken,
      toToken,
      fromAmount: amount,
      toAmount: data.estimate?.toAmount || '0',
      priceImpact: data.estimate?.priceImpact || 0.3,
      fee: data.estimate?.feeCosts?.[0]?.amount || '0',
      route: [fromToken, toToken],
      chainId: getChainIdFromKey(chainKey),
      protocol: protocol || 'LI.FI',
    };
  } catch (error) {
    console.error('Failed to get swap quote:', error);
    return getMockSwapQuote(chainKey, fromToken, toToken, amount);
  }
}

function getMockSwapQuote(
  chainKey: DefiChainKey,
  fromToken: string,
  toToken: string,
  amount: string
): SwapQuote {
  // Mock exchange rates
  const rates: Record<string, Record<string, number>> = {
    ETH: { USDC: 3500, USDT: 3500, WBTC: 0.053 },
    USDC: { ETH: 0.000285, USDT: 1, WBTC: 0.0000151 },
    SOL: { USDC: 180, USDT: 180 },
  };

  const rate = rates[fromToken]?.[toToken] || 1;
  const toAmount = (parseFloat(amount) * rate * 0.997).toFixed(6); // 0.3% slippage

  return {
    fromToken,
    toToken,
    fromAmount: amount,
    toAmount,
    priceImpact: 0.3,
    fee: (parseFloat(amount) * 0.003).toFixed(6),
    route: [fromToken, toToken],
    chainId: getChainIdFromKey(chainKey),
    protocol: DEFI_PROTOCOLS[chainKey]?.[0]?.name || 'DEX',
  };
}

// ============================================
// Staking Functions
// ============================================
export async function getStakingOptions(chainKey: DefiChainKey): Promise<StakingInfo[]> {
  const protocols = DEFI_PROTOCOLS[chainKey]?.filter(p => p.type === 'staking' || p.type === 'yield') || [];

  // Mock staking data (in production, fetch from protocol APIs)
  const stakingData: Record<string, StakingInfo[]> = {
    ethereum: [
      { protocol: 'Lido', token: 'ETH', apy: 3.8, tvl: '$28.5B', minStake: '0.01' },
      { protocol: 'Rocket Pool', token: 'ETH', apy: 3.6, tvl: '$3.2B', minStake: '0.01' },
    ],
    arbitrum: [
      { protocol: 'GMX', token: 'GMX', apy: 12.5, tvl: '$450M', minStake: '1' },
      { protocol: 'Pendle', token: 'PENDLE', apy: 8.2, tvl: '$180M', minStake: '10' },
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
// Bridge Functions
// ============================================
export async function getBridgeQuote(
  fromChain: string,
  toChain: string,
  token: string,
  amount: string
): Promise<BridgeQuote | null> {
  try {
    // Use LI.FI API for bridge quotes
    const response = await fetch('https://li.quest/v1/quote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fromChain,
        toChain,
        fromToken: token,
        toToken: token,
        fromAmount: amount,
      }),
    });

    if (!response.ok) {
      return getMockBridgeQuote(fromChain, toChain, token, amount);
    }

    const data = await response.json();
    return {
      fromChain,
      toChain,
      token,
      amount,
      estimatedReceive: data.estimate?.toAmount || amount,
      fee: data.estimate?.feeCosts?.[0]?.amount || '0',
      estimatedTime: `${data.estimate?.executionDuration || 5} minutes`,
    };
  } catch (error) {
    console.error('Failed to get bridge quote:', error);
    return getMockBridgeQuote(fromChain, toChain, token, amount);
  }
}

function getMockBridgeQuote(
  fromChain: string,
  toChain: string,
  token: string,
  amount: string
): BridgeQuote {
  const fee = parseFloat(amount) * 0.001; // 0.1% bridge fee
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
// Liquidity Pool Functions
// ============================================
export async function getLiquidityPools(chainKey: DefiChainKey): Promise<LPInfo[]> {
  const protocols = DEFI_PROTOCOLS[chainKey]?.filter(p => p.type === 'swap') || [];

  // Mock LP data (in production, fetch from protocol APIs)
  const lpData: Record<string, LPInfo[]> = {
    ethereum: [
      { protocol: 'Uniswap V3', pool: 'ETH/USDC', token0: 'ETH', token1: 'USDC', apy: 18.5, tvl: '$320M', fee: 0.3 },
      { protocol: 'Curve', pool: '3pool', token0: 'USDC', token1: 'USDT', apy: 4.2, tvl: '$850M', fee: 0.04 },
    ],
    arbitrum: [
      { protocol: 'Camelot', pool: 'ETH/USDC', token0: 'ETH', token1: 'USDC', apy: 25.3, tvl: '$45M', fee: 0.3 },
      { protocol: 'GMX', pool: 'GLP', token0: 'ETH', token1: 'USDC', apy: 15.8, tvl: '$380M', fee: 0 },
    ],
    base: [
      { protocol: 'Aerodrome', pool: 'ETH/USDC', token0: 'ETH', token1: 'USDC', apy: 32.1, tvl: '$28M', fee: 0.3 },
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
function getChainIdFromKey(chainKey: DefiChainKey): number {
  if (chainKey === 'solana' || chainKey === 'sui') return 0;
  return EVM_CHAINS[chainKey as EVMChainKey]?.id || 1;
}

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

