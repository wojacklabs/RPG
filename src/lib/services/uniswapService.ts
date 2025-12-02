// Uniswap V3 Swap Service - No API Key Required
// Direct contract interaction using Uniswap SDK

import { ethers } from 'ethers';

// Uniswap V3 Contract Addresses (same across most chains)
const UNISWAP_CONTRACTS: Record<string, { router: string; quoter: string }> = {
  ethereum: {
    router: '0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45', // SwapRouter02
    quoter: '0x61fFE014bA17989E743c5F6cB21bF9697530B21e', // QuoterV2
  },
  arbitrum: {
    router: '0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45',
    quoter: '0x61fFE014bA17989E743c5F6cB21bF9697530B21e',
  },
  base: {
    router: '0x2626664c2603336E57B271c5C0b26F421741e481', // Universal Router
    quoter: '0x3d4e44Eb1374240CE5F1B871ab261CD16335B76a',
  },
  polygon: {
    router: '0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45',
    quoter: '0x61fFE014bA17989E743c5F6cB21bF9697530B21e',
  },
  optimism: {
    router: '0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45',
    quoter: '0x61fFE014bA17989E743c5F6cB21bF9697530B21e',
  },
};

// Token addresses per chain
const TOKENS: Record<string, Record<string, { address: string; decimals: number }>> = {
  ethereum: {
    ETH: { address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', decimals: 18 }, // WETH
    WETH: { address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', decimals: 18 },
    USDC: { address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', decimals: 6 },
    USDT: { address: '0xdAC17F958D2ee523a2206206994597C13D831ec7', decimals: 6 },
    WBTC: { address: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599', decimals: 8 },
    DAI: { address: '0x6B175474E89094C44Da98b954EescdeCB5BE69a8', decimals: 18 },
  },
  arbitrum: {
    ETH: { address: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1', decimals: 18 }, // WETH
    WETH: { address: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1', decimals: 18 },
    USDC: { address: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831', decimals: 6 },
    USDT: { address: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9', decimals: 6 },
    ARB: { address: '0x912CE59144191C1204E64559FE8253a0e49E6548', decimals: 18 },
  },
  base: {
    ETH: { address: '0x4200000000000000000000000000000000000006', decimals: 18 }, // WETH
    WETH: { address: '0x4200000000000000000000000000000000000006', decimals: 18 },
    USDC: { address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', decimals: 6 },
  },
  polygon: {
    MATIC: { address: '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270', decimals: 18 }, // WMATIC
    WMATIC: { address: '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270', decimals: 18 },
    USDC: { address: '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359', decimals: 6 },
    USDT: { address: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F', decimals: 6 },
    WETH: { address: '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619', decimals: 18 },
  },
  optimism: {
    ETH: { address: '0x4200000000000000000000000000000000000006', decimals: 18 }, // WETH
    WETH: { address: '0x4200000000000000000000000000000000000006', decimals: 18 },
    USDC: { address: '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85', decimals: 6 },
    OP: { address: '0x4200000000000000000000000000000000000042', decimals: 18 },
  },
};

// RPC URLs (public endpoints)
const RPC_URLS: Record<string, string> = {
  ethereum: process.env.NEXT_PUBLIC_RPC_ETHEREUM || 'https://eth.llamarpc.com',
  arbitrum: process.env.NEXT_PUBLIC_RPC_ARBITRUM || 'https://arb1.arbitrum.io/rpc',
  base: process.env.NEXT_PUBLIC_RPC_BASE || 'https://mainnet.base.org',
  polygon: process.env.NEXT_PUBLIC_RPC_POLYGON || 'https://polygon-rpc.com',
  optimism: process.env.NEXT_PUBLIC_RPC_OPTIMISM || 'https://mainnet.optimism.io',
};

// QuoterV2 ABI (minimal)
const QUOTER_ABI = [
  'function quoteExactInputSingle((address tokenIn, address tokenOut, uint256 amountIn, uint24 fee, uint160 sqrtPriceLimitX96)) external returns (uint256 amountOut, uint160 sqrtPriceX96After, uint32 initializedTicksCrossed, uint256 gasEstimate)',
];

// SwapRouter02 ABI (minimal)
const ROUTER_ABI = [
  'function exactInputSingle((address tokenIn, address tokenOut, uint24 fee, address recipient, uint256 amountIn, uint256 amountOutMinimum, uint160 sqrtPriceLimitX96)) external payable returns (uint256 amountOut)',
  'function multicall(uint256 deadline, bytes[] calldata data) external payable returns (bytes[] memory)',
];

// ERC20 ABI for approvals
const ERC20_ABI = [
  'function approve(address spender, uint256 amount) external returns (bool)',
  'function allowance(address owner, address spender) external view returns (uint256)',
];

export interface UniswapQuote {
  amountOut: string;
  amountOutMin: string;
  priceImpact: number;
  gasEstimate: string;
  path: string;
}

export interface UniswapSwapParams {
  chain: string;
  tokenIn: string;
  tokenOut: string;
  amountIn: string;
  recipient: string;
  slippagePercent?: number;
}

function getProvider(chain: string): ethers.providers.JsonRpcProvider {
  const rpcUrl = RPC_URLS[chain];
  if (!rpcUrl) throw new Error(`Unsupported chain: ${chain}`);
  return new ethers.providers.JsonRpcProvider(rpcUrl);
}

export async function getQuote(
  chain: string,
  tokenInSymbol: string,
  tokenOutSymbol: string,
  amountIn: string
): Promise<UniswapQuote> {
  const contracts = UNISWAP_CONTRACTS[chain];
  const tokenIn = TOKENS[chain]?.[tokenInSymbol];
  const tokenOut = TOKENS[chain]?.[tokenOutSymbol];

  if (!contracts || !tokenIn || !tokenOut) {
    throw new Error('Unsupported chain or token');
  }

  const provider = getProvider(chain);
  const quoter = new ethers.Contract(contracts.quoter, QUOTER_ABI, provider);

  const amountInWei = ethers.utils.parseUnits(amountIn, tokenIn.decimals);

  // Try different fee tiers (0.05%, 0.3%, 1%)
  const feeTiers = [500, 3000, 10000];
  let bestQuote = null;
  let bestAmountOut = ethers.BigNumber.from(0);

  for (const fee of feeTiers) {
    try {
      const params = {
        tokenIn: tokenIn.address,
        tokenOut: tokenOut.address,
        amountIn: amountInWei,
        fee,
        sqrtPriceLimitX96: 0,
      };

      const result = await quoter.callStatic.quoteExactInputSingle(params);
      
      if (result.amountOut.gt(bestAmountOut)) {
        bestAmountOut = result.amountOut;
        bestQuote = {
          amountOut: result.amountOut,
          gasEstimate: result.gasEstimate || ethers.BigNumber.from(200000),
          fee,
        };
      }
    } catch (e) {
      // Pool with this fee tier might not exist
      continue;
    }
  }

  if (!bestQuote) {
    throw new Error('No liquidity available for this pair');
  }

  const amountOutFormatted = ethers.utils.formatUnits(bestQuote.amountOut, tokenOut.decimals);
  const slippage = 0.5; // 0.5% default slippage
  const amountOutMin = bestQuote.amountOut.mul(1000 - slippage * 10).div(1000);

  return {
    amountOut: amountOutFormatted,
    amountOutMin: ethers.utils.formatUnits(amountOutMin, tokenOut.decimals),
    priceImpact: 0.1, // Would need TWAP oracle for accurate calculation
    gasEstimate: bestQuote.gasEstimate.toString(),
    path: `${tokenInSymbol} -> ${tokenOutSymbol} (${bestQuote.fee / 10000}% pool)`,
  };
}

export async function buildSwapTransaction(
  params: UniswapSwapParams
): Promise<{
  to: string;
  data: string;
  value: string;
  gasLimit: string;
}> {
  const { chain, tokenIn: tokenInSymbol, tokenOut: tokenOutSymbol, amountIn, recipient, slippagePercent = 0.5 } = params;

  const contracts = UNISWAP_CONTRACTS[chain];
  const tokenIn = TOKENS[chain]?.[tokenInSymbol];
  const tokenOut = TOKENS[chain]?.[tokenOutSymbol];

  if (!contracts || !tokenIn || !tokenOut) {
    throw new Error('Unsupported chain or token');
  }

  const provider = getProvider(chain);
  const router = new ethers.Contract(contracts.router, ROUTER_ABI, provider);

  const amountInWei = ethers.utils.parseUnits(amountIn, tokenIn.decimals);
  
  // Get quote first
  const quote = await getQuote(chain, tokenInSymbol, tokenOutSymbol, amountIn);
  const amountOutMin = ethers.utils.parseUnits(quote.amountOutMin, tokenOut.decimals);

  // Determine fee tier from quote path
  const feeMatch = quote.path.match(/(\d+\.?\d*)% pool/);
  const fee = feeMatch ? parseFloat(feeMatch[1]) * 10000 : 3000;

  // Check if input is native token (ETH/MATIC)
  const isNativeInput = tokenInSymbol === 'ETH' || tokenInSymbol === 'MATIC';

  const swapParams = {
    tokenIn: tokenIn.address,
    tokenOut: tokenOut.address,
    fee,
    recipient,
    amountIn: amountInWei,
    amountOutMinimum: amountOutMin,
    sqrtPriceLimitX96: 0,
  };

  const deadline = Math.floor(Date.now() / 1000) + 60 * 20; // 20 minutes
  const swapData = router.interface.encodeFunctionData('exactInputSingle', [swapParams]);
  const multicallData = router.interface.encodeFunctionData('multicall', [deadline, [swapData]]);

  return {
    to: contracts.router,
    data: multicallData,
    value: isNativeInput ? amountInWei.toHexString() : '0x0',
    gasLimit: '300000',
  };
}

export async function checkAllowance(
  chain: string,
  tokenSymbol: string,
  owner: string,
  amount: string
): Promise<{ needsApproval: boolean; currentAllowance: string }> {
  // Native tokens don't need approval
  if (tokenSymbol === 'ETH' || tokenSymbol === 'MATIC') {
    return { needsApproval: false, currentAllowance: 'unlimited' };
  }

  const contracts = UNISWAP_CONTRACTS[chain];
  const token = TOKENS[chain]?.[tokenSymbol];

  if (!contracts || !token) {
    throw new Error('Unsupported chain or token');
  }

  const provider = getProvider(chain);
  const tokenContract = new ethers.Contract(token.address, ERC20_ABI, provider);

  const allowance = await tokenContract.allowance(owner, contracts.router);
  const amountWei = ethers.utils.parseUnits(amount, token.decimals);

  return {
    needsApproval: allowance.lt(amountWei),
    currentAllowance: ethers.utils.formatUnits(allowance, token.decimals),
  };
}

export function buildApprovalTransaction(
  chain: string,
  tokenSymbol: string
): { to: string; data: string } {
  const contracts = UNISWAP_CONTRACTS[chain];
  const token = TOKENS[chain]?.[tokenSymbol];

  if (!contracts || !token) {
    throw new Error('Unsupported chain or token');
  }

  const tokenInterface = new ethers.utils.Interface(ERC20_ABI);
  const data = tokenInterface.encodeFunctionData('approve', [
    contracts.router,
    ethers.constants.MaxUint256, // Unlimited approval
  ]);

  return {
    to: token.address,
    data,
  };
}

export function getSupportedChains(): string[] {
  return Object.keys(UNISWAP_CONTRACTS);
}

export function getSupportedTokens(chain: string): string[] {
  return Object.keys(TOKENS[chain] || {});
}

