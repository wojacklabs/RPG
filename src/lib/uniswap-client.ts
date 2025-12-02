// Uniswap V3 Client-side Service
// Uses wallet's provider directly - no external RPC needed

import { ethers } from 'ethers';

// Uniswap V3 Contract Addresses
const UNISWAP_CONTRACTS: Record<number, { router: string; quoter: string }> = {
  1: { // Ethereum
    router: '0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45',
    quoter: '0x61fFE014bA17989E743c5F6cB21bF9697530B21e',
  },
  42161: { // Arbitrum
    router: '0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45',
    quoter: '0x61fFE014bA17989E743c5F6cB21bF9697530B21e',
  },
  8453: { // Base
    router: '0x2626664c2603336E57B271c5C0b26F421741e481',
    quoter: '0x3d4e44Eb1374240CE5F1B871ab261CD16335B76a',
  },
  137: { // Polygon
    router: '0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45',
    quoter: '0x61fFE014bA17989E743c5F6cB21bF9697530B21e',
  },
  10: { // Optimism
    router: '0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45',
    quoter: '0x61fFE014bA17989E743c5F6cB21bF9697530B21e',
  },
};

// Token addresses per chainId
const TOKENS: Record<number, Record<string, { address: string; decimals: number }>> = {
  1: { // Ethereum
    ETH: { address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', decimals: 18 },
    WETH: { address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', decimals: 18 },
    USDC: { address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', decimals: 6 },
    USDT: { address: '0xdAC17F958D2ee523a2206206994597C13D831ec7', decimals: 6 },
    WBTC: { address: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599', decimals: 8 },
    DAI: { address: '0x6B175474E89094C44Da98b954EedeAC495271d0F', decimals: 18 },
  },
  42161: { // Arbitrum
    ETH: { address: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1', decimals: 18 },
    WETH: { address: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1', decimals: 18 },
    USDC: { address: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831', decimals: 6 },
    USDT: { address: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9', decimals: 6 },
    ARB: { address: '0x912CE59144191C1204E64559FE8253a0e49E6548', decimals: 18 },
  },
  8453: { // Base
    ETH: { address: '0x4200000000000000000000000000000000000006', decimals: 18 },
    WETH: { address: '0x4200000000000000000000000000000000000006', decimals: 18 },
    USDC: { address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', decimals: 6 },
  },
  137: { // Polygon
    MATIC: { address: '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270', decimals: 18 },
    WMATIC: { address: '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270', decimals: 18 },
    USDC: { address: '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359', decimals: 6 },
    USDT: { address: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F', decimals: 6 },
    WETH: { address: '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619', decimals: 18 },
  },
  10: { // Optimism
    ETH: { address: '0x4200000000000000000000000000000000000006', decimals: 18 },
    WETH: { address: '0x4200000000000000000000000000000000000006', decimals: 18 },
    USDC: { address: '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85', decimals: 6 },
    OP: { address: '0x4200000000000000000000000000000000000042', decimals: 18 },
  },
};

// QuoterV2 interface
const QUOTER_V2_INTERFACE = new ethers.utils.Interface([
  'function quoteExactInputSingle(tuple(address tokenIn, address tokenOut, uint256 amountIn, uint24 fee, uint160 sqrtPriceLimitX96) params) external returns (uint256 amountOut, uint160 sqrtPriceX96After, uint32 initializedTicksCrossed, uint256 gasEstimate)',
]);

// SwapRouter02 interface
const ROUTER_INTERFACE = new ethers.utils.Interface([
  'function exactInputSingle(tuple(address tokenIn, address tokenOut, uint24 fee, address recipient, uint256 amountIn, uint256 amountOutMinimum, uint160 sqrtPriceLimitX96) params) external payable returns (uint256 amountOut)',
  'function multicall(uint256 deadline, bytes[] data) external payable returns (bytes[] memory)',
]);

const ERC20_INTERFACE = new ethers.utils.Interface([
  'function approve(address spender, uint256 amount) external returns (bool)',
  'function allowance(address owner, address spender) external view returns (uint256)',
]);

export interface UniswapQuote {
  amountOut: string;
  amountOutMin: string;
  priceImpact: number;
  path: string;
  fee: number;
}

// Call Quoter using wallet's provider
async function callQuoter(
  provider: ethers.providers.Web3Provider,
  quoterAddress: string,
  tokenIn: string,
  tokenOut: string,
  amountIn: ethers.BigNumber,
  fee: number
): Promise<ethers.BigNumber | null> {
  try {
    const callData = QUOTER_V2_INTERFACE.encodeFunctionData('quoteExactInputSingle', [
      {
        tokenIn,
        tokenOut,
        amountIn,
        fee,
        sqrtPriceLimitX96: 0,
      },
    ]);

    const result = await provider.call({
      to: quoterAddress,
      data: callData,
    });

    const decoded = ethers.utils.defaultAbiCoder.decode(
      ['uint256', 'uint160', 'uint32', 'uint256'],
      result
    );

    return decoded[0] as ethers.BigNumber;
  } catch {
    return null;
  }
}

export async function getQuote(
  walletProvider: any, // Privy wallet provider
  chainId: number,
  tokenInSymbol: string,
  tokenOutSymbol: string,
  amountIn: string
): Promise<UniswapQuote> {
  const contracts = UNISWAP_CONTRACTS[chainId];
  const tokens = TOKENS[chainId];
  const tokenIn = tokens?.[tokenInSymbol];
  const tokenOut = tokens?.[tokenOutSymbol];

  if (!contracts) {
    throw new Error(`Chain ${chainId} not supported`);
  }

  if (!tokenIn) {
    throw new Error(`Token ${tokenInSymbol} not found on chain ${chainId}`);
  }

  if (!tokenOut) {
    throw new Error(`Token ${tokenOutSymbol} not found on chain ${chainId}`);
  }

  const provider = new ethers.providers.Web3Provider(walletProvider);
  const amountInWei = ethers.utils.parseUnits(amountIn, tokenIn.decimals);

  // Try different fee tiers
  const feeTiers = [100, 500, 3000, 10000];
  let bestAmountOut: ethers.BigNumber | null = null;
  let bestFee = 3000;

  for (const fee of feeTiers) {
    const amountOut = await callQuoter(
      provider,
      contracts.quoter,
      tokenIn.address,
      tokenOut.address,
      amountInWei,
      fee
    );

    if (amountOut && (!bestAmountOut || amountOut.gt(bestAmountOut))) {
      bestAmountOut = amountOut;
      bestFee = fee;
    }
  }

  if (!bestAmountOut || bestAmountOut.isZero()) {
    throw new Error(`No liquidity for ${tokenInSymbol}/${tokenOutSymbol}`);
  }

  const amountOutFormatted = ethers.utils.formatUnits(bestAmountOut, tokenOut.decimals);
  const amountOutMin = bestAmountOut.mul(995).div(1000); // 0.5% slippage

  return {
    amountOut: parseFloat(amountOutFormatted).toFixed(6),
    amountOutMin: ethers.utils.formatUnits(amountOutMin, tokenOut.decimals),
    priceImpact: 0.1,
    path: `${tokenInSymbol} → ${tokenOutSymbol} (${bestFee / 10000}% fee)`,
    fee: bestFee,
  };
}

export async function checkAllowance(
  walletProvider: any,
  chainId: number,
  tokenSymbol: string,
  owner: string,
  amount: string
): Promise<{ needsApproval: boolean; currentAllowance: string }> {
  // Native tokens don't need approval
  if (tokenSymbol === 'ETH' || tokenSymbol === 'MATIC') {
    return { needsApproval: false, currentAllowance: 'unlimited' };
  }

  const contracts = UNISWAP_CONTRACTS[chainId];
  const token = TOKENS[chainId]?.[tokenSymbol];

  if (!contracts || !token) {
    throw new Error('Unsupported chain or token');
  }

  const provider = new ethers.providers.Web3Provider(walletProvider);
  const tokenContract = new ethers.Contract(token.address, ERC20_INTERFACE, provider);

  const allowance = await tokenContract.allowance(owner, contracts.router);
  const amountWei = ethers.utils.parseUnits(amount, token.decimals);

  return {
    needsApproval: allowance.lt(amountWei),
    currentAllowance: ethers.utils.formatUnits(allowance, token.decimals),
  };
}

export function buildApprovalTx(
  chainId: number,
  tokenSymbol: string
): { to: string; data: string } {
  const contracts = UNISWAP_CONTRACTS[chainId];
  const token = TOKENS[chainId]?.[tokenSymbol];

  if (!contracts || !token) {
    throw new Error('Unsupported chain or token');
  }

  const data = ERC20_INTERFACE.encodeFunctionData('approve', [
    contracts.router,
    ethers.constants.MaxUint256,
  ]);

  return { to: token.address, data };
}

export function buildSwapTx(
  chainId: number,
  tokenInSymbol: string,
  tokenOutSymbol: string,
  amountIn: string,
  recipient: string,
  quote: UniswapQuote
): { to: string; data: string; value: string } {
  const contracts = UNISWAP_CONTRACTS[chainId];
  const tokenIn = TOKENS[chainId]?.[tokenInSymbol];
  const tokenOut = TOKENS[chainId]?.[tokenOutSymbol];

  if (!contracts || !tokenIn || !tokenOut) {
    throw new Error('Unsupported chain or token');
  }

  const amountInWei = ethers.utils.parseUnits(amountIn, tokenIn.decimals);
  const amountOutMin = ethers.utils.parseUnits(quote.amountOutMin, tokenOut.decimals);

  const isNativeInput = tokenInSymbol === 'ETH' || tokenInSymbol === 'MATIC';

  const swapParams = {
    tokenIn: tokenIn.address,
    tokenOut: tokenOut.address,
    fee: quote.fee,
    recipient,
    amountIn: amountInWei,
    amountOutMinimum: amountOutMin,
    sqrtPriceLimitX96: 0,
  };

  const deadline = Math.floor(Date.now() / 1000) + 60 * 20;
  const swapData = ROUTER_INTERFACE.encodeFunctionData('exactInputSingle', [swapParams]);
  const multicallData = ROUTER_INTERFACE.encodeFunctionData('multicall', [deadline, [swapData]]);

  return {
    to: contracts.router,
    data: multicallData,
    value: isNativeInput ? amountInWei.toHexString() : '0x0',
  };
}

export function getSupportedTokens(chainId: number): string[] {
  return Object.keys(TOKENS[chainId] || {});
}

export function getTokenInfo(chainId: number, symbol: string) {
  return TOKENS[chainId]?.[symbol];
}

export const CHAIN_INFO: Record<number, { name: string; icon: string; explorer: string }> = {
  1: { name: 'Ethereum', icon: '⟠', explorer: 'https://etherscan.io/tx/' },
  42161: { name: 'Arbitrum', icon: '🔷', explorer: 'https://arbiscan.io/tx/' },
  8453: { name: 'Base', icon: '🔵', explorer: 'https://basescan.org/tx/' },
  137: { name: 'Polygon', icon: '🟣', explorer: 'https://polygonscan.com/tx/' },
  10: { name: 'Optimism', icon: '🔴', explorer: 'https://optimistic.etherscan.io/tx/' },
};

export const SUPPORTED_CHAIN_IDS = [1, 42161, 8453, 137, 10];

