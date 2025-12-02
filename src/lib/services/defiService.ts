// Multi-chain DeFi Service
// Uses 1inch API for swaps when ONEINCH_API_KEY is configured
// Falls back to mock data otherwise

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
// Chain & Token Configuration
// ============================================
const CHAIN_IDS: Record<string, number> = {
  ethereum: 1,
  arbitrum: 42161,
  base: 8453,
  polygon: 137,
  optimism: 10,
};

const TOKEN_ADDRESSES: Record<string, Record<string, string>> = {
  ethereum: {
    ETH: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
    USDC: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    USDT: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
    WETH: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
    WBTC: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599',
  },
  arbitrum: {
    ETH: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
    USDC: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
    USDT: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9',
    ARB: '0x912CE59144191C1204E64559FE8253a0e49E6548',
  },
  base: {
    ETH: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
    USDC: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
  },
  polygon: {
    MATIC: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
    USDC: '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359',
    USDT: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F',
  },
  optimism: {
    ETH: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
    USDC: '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85',
    OP: '0x4200000000000000000000000000000000000042',
  },
};

const TOKEN_DECIMALS: Record<string, number> = {
  ETH: 18,
  MATIC: 18,
  USDC: 6,
  USDT: 6,
  WETH: 18,
  WBTC: 8,
  ARB: 18,
  OP: 18,
  SOL: 9,
  SUI: 9,
};

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
  const apiKey = process.env.ONEINCH_API_KEY;
  
  // If API key is configured, use 1inch API
  if (apiKey && CHAIN_IDS[chainKey]) {
    try {
      const chainId = CHAIN_IDS[chainKey];
      const fromTokenAddr = TOKEN_ADDRESSES[chainKey]?.[fromToken];
      const toTokenAddr = TOKEN_ADDRESSES[chainKey]?.[toToken];
      
      if (!fromTokenAddr || !toTokenAddr) {
        throw new Error('Token not supported');
      }

      const decimals = TOKEN_DECIMALS[fromToken] || 18;
      const amountWei = BigInt(Math.floor(parseFloat(amount) * Math.pow(10, decimals))).toString();

      const url = `https://api.1inch.dev/swap/v6.0/${chainId}/quote?src=${fromTokenAddr}&dst=${toTokenAddr}&amount=${amountWei}`;
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Accept': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        const toDecimals = TOKEN_DECIMALS[toToken] || 18;
        const toAmount = (Number(data.dstAmount) / Math.pow(10, toDecimals)).toFixed(6);
        const gasUsd = (Number(data.gas || 200000) * 30 * 1e-9).toFixed(2); // Rough estimate

        return {
          fromToken,
          toToken,
          fromAmount: amount,
          toAmount,
          priceImpact: 0.1, // 1inch doesn't return this
          fee: gasUsd,
          route: [fromToken, toToken],
          chainId,
          protocol: '1inch',
        };
      }
    } catch (error) {
      console.error('1inch API error:', error);
    }
  }

  // Fallback to mock data
  return getMockSwapQuote(chainKey, fromToken, toToken, amount);
}

function getMockSwapQuote(
  chainKey: DefiChainKey,
  fromToken: string,
  toToken: string,
  amount: string
): SwapQuote {
  const rates: Record<string, Record<string, number>> = {
    ETH: { USDC: 3500, USDT: 3500, WBTC: 0.053, ARB: 3000 },
    USDC: { ETH: 0.000285, USDT: 1, WBTC: 0.0000151 },
    MATIC: { USDC: 0.85, USDT: 0.85 },
    SOL: { USDC: 180, USDT: 180 },
    SUI: { USDC: 2.5, USDT: 2.5 },
  };

  const rate = rates[fromToken]?.[toToken] || 1;
  const toAmount = (parseFloat(amount) * rate * 0.997).toFixed(6);

  return {
    fromToken,
    toToken,
    fromAmount: amount,
    toAmount,
    priceImpact: 0.3,
    fee: (parseFloat(amount) * 0.003).toFixed(6),
    route: [fromToken, toToken],
    chainId: CHAIN_IDS[chainKey] || 1,
    protocol: DEFI_PROTOCOLS[chainKey]?.[0]?.name || 'DEX',
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
  const lifiApiKey = process.env.LIFI_API_KEY;
  
  // If LI.FI API key is configured, use it
  if (lifiApiKey) {
    try {
      const fromChainId = CHAIN_IDS[fromChain];
      const toChainId = CHAIN_IDS[toChain];
      
      if (!fromChainId || !toChainId) {
        throw new Error('Chain not supported');
      }

      const fromToken = TOKEN_ADDRESSES[fromChain]?.[token];
      const toToken = TOKEN_ADDRESSES[toChain]?.[token];
      
      if (!fromToken || !toToken) {
        throw new Error('Token not supported');
      }

      const decimals = TOKEN_DECIMALS[token] || 18;
      const amountWei = BigInt(Math.floor(parseFloat(amount) * Math.pow(10, decimals))).toString();

      const response = await fetch('https://li.quest/v1/quote', {
        method: 'GET',
        headers: {
          'x-lifi-api-key': lifiApiKey,
          'Accept': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        return {
          fromChain,
          toChain,
          token,
          amount,
          estimatedReceive: data.estimate?.toAmount || amount,
          fee: data.estimate?.feeCosts?.[0]?.amountUSD || '0',
          estimatedTime: `${data.estimate?.executionDuration || 10} minutes`,
        };
      }
    } catch (error) {
      console.error('LI.FI API error:', error);
    }
  }

  // Fallback to mock data
  return getMockBridgeQuote(fromChain, toChain, token, amount);
}

function getMockBridgeQuote(
  fromChain: string,
  toChain: string,
  token: string,
  amount: string
): BridgeQuote {
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
  // In production, fetch from protocol APIs
  // For now, return representative data
  const stakingData: Record<string, StakingInfo[]> = {
    ethereum: [
      { protocol: 'Lido', token: 'ETH', apy: 3.8, tvl: '$28.5B', minStake: '0.01' },
      { protocol: 'Rocket Pool', token: 'ETH', apy: 3.6, tvl: '$3.2B', minStake: '0.01' },
      { protocol: 'Frax', token: 'ETH', apy: 4.1, tvl: '$1.1B', minStake: '0.01' },
    ],
    arbitrum: [
      { protocol: 'GMX', token: 'GMX', apy: 12.5, tvl: '$450M', minStake: '1' },
      { protocol: 'Pendle', token: 'PENDLE', apy: 8.2, tvl: '$180M', minStake: '10' },
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
  // In production, fetch from protocol APIs
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
    polygon: [
      { protocol: 'QuickSwap', pool: 'MATIC/USDC', token0: 'MATIC', token1: 'USDC', apy: 15.0, tvl: '$50M', fee: 0.3 },
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

export function getTokenAddress(chainKey: string, tokenSymbol: string): string | undefined {
  return TOKEN_ADDRESSES[chainKey]?.[tokenSymbol];
}

export function getTokenDecimals(tokenSymbol: string): number {
  return TOKEN_DECIMALS[tokenSymbol] || 18;
}
