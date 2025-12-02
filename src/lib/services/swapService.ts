// Swap Service using 1inch API
// Docs: https://portal.1inch.dev/documentation

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
    WETH: '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619',
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
};

export interface SwapQuote {
  fromToken: string;
  toToken: string;
  fromAmount: string;
  toAmount: string;
  toAmountMin: string;
  priceImpact: number;
  estimatedGas: string;
  protocols: string[];
}

export interface SwapTransaction {
  from: string;
  to: string;
  data: string;
  value: string;
  gas: string;
  gasPrice: string;
}

function getApiKey(): string {
  const key = process.env.ONEINCH_API_KEY;
  if (!key) {
    throw new Error('ONEINCH_API_KEY not configured');
  }
  return key;
}

function getBaseUrl(chainId: number): string {
  return `https://api.1inch.dev/swap/v6.0/${chainId}`;
}

export async function getSwapQuote(
  chain: string,
  fromTokenSymbol: string,
  toTokenSymbol: string,
  amount: string,
  walletAddress: string
): Promise<SwapQuote> {
  const chainId = CHAIN_IDS[chain];
  if (!chainId) throw new Error(`Unsupported chain: ${chain}`);

  const fromToken = TOKEN_ADDRESSES[chain]?.[fromTokenSymbol];
  const toToken = TOKEN_ADDRESSES[chain]?.[toTokenSymbol];
  if (!fromToken || !toToken) throw new Error('Invalid token');

  const decimals = TOKEN_DECIMALS[fromTokenSymbol] || 18;
  const amountWei = BigInt(Math.floor(parseFloat(amount) * Math.pow(10, decimals))).toString();

  const apiKey = getApiKey();
  const url = `${getBaseUrl(chainId)}/quote?src=${fromToken}&dst=${toToken}&amount=${amountWei}`;

  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`1inch API error: ${error}`);
  }

  const data = await response.json();
  const toDecimals = TOKEN_DECIMALS[toTokenSymbol] || 18;

  return {
    fromToken: fromTokenSymbol,
    toToken: toTokenSymbol,
    fromAmount: amount,
    toAmount: (Number(data.dstAmount) / Math.pow(10, toDecimals)).toFixed(6),
    toAmountMin: (Number(data.dstAmount) * 0.995 / Math.pow(10, toDecimals)).toFixed(6), // 0.5% slippage
    priceImpact: 0, // 1inch doesn't return this directly
    estimatedGas: data.gas || '200000',
    protocols: data.protocols?.flat().map((p: any) => p.name) || [],
  };
}

export async function buildSwapTransaction(
  chain: string,
  fromTokenSymbol: string,
  toTokenSymbol: string,
  amount: string,
  walletAddress: string,
  slippage: number = 1 // 1%
): Promise<SwapTransaction> {
  const chainId = CHAIN_IDS[chain];
  if (!chainId) throw new Error(`Unsupported chain: ${chain}`);

  const fromToken = TOKEN_ADDRESSES[chain]?.[fromTokenSymbol];
  const toToken = TOKEN_ADDRESSES[chain]?.[toTokenSymbol];
  if (!fromToken || !toToken) throw new Error('Invalid token');

  const decimals = TOKEN_DECIMALS[fromTokenSymbol] || 18;
  const amountWei = BigInt(Math.floor(parseFloat(amount) * Math.pow(10, decimals))).toString();

  const apiKey = getApiKey();
  const url = `${getBaseUrl(chainId)}/swap?src=${fromToken}&dst=${toToken}&amount=${amountWei}&from=${walletAddress}&slippage=${slippage}&disableEstimate=true`;

  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`1inch API error: ${error}`);
  }

  const data = await response.json();

  return {
    from: walletAddress,
    to: data.tx.to,
    data: data.tx.data,
    value: data.tx.value,
    gas: data.tx.gas.toString(),
    gasPrice: data.tx.gasPrice,
  };
}

export async function checkAllowance(
  chain: string,
  tokenSymbol: string,
  walletAddress: string
): Promise<string> {
  if (tokenSymbol === 'ETH' || tokenSymbol === 'MATIC') {
    return 'unlimited'; // Native tokens don't need approval
  }

  const chainId = CHAIN_IDS[chain];
  const tokenAddress = TOKEN_ADDRESSES[chain]?.[tokenSymbol];
  if (!chainId || !tokenAddress) throw new Error('Invalid chain or token');

  const apiKey = getApiKey();
  const url = `${getBaseUrl(chainId)}/approve/allowance?tokenAddress=${tokenAddress}&walletAddress=${walletAddress}`;

  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to check allowance');
  }

  const data = await response.json();
  return data.allowance;
}

export async function buildApproveTransaction(
  chain: string,
  tokenSymbol: string,
  amount?: string
): Promise<{ to: string; data: string }> {
  const chainId = CHAIN_IDS[chain];
  const tokenAddress = TOKEN_ADDRESSES[chain]?.[tokenSymbol];
  if (!chainId || !tokenAddress) throw new Error('Invalid chain or token');

  const apiKey = getApiKey();
  let url = `${getBaseUrl(chainId)}/approve/transaction?tokenAddress=${tokenAddress}`;
  if (amount) {
    const decimals = TOKEN_DECIMALS[tokenSymbol] || 18;
    const amountWei = BigInt(Math.floor(parseFloat(amount) * Math.pow(10, decimals))).toString();
    url += `&amount=${amountWei}`;
  }

  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to build approve transaction');
  }

  const data = await response.json();
  return {
    to: data.to,
    data: data.data,
  };
}

export function getSupportedChains(): string[] {
  return Object.keys(CHAIN_IDS);
}

export function getSupportedTokens(chain: string): string[] {
  return Object.keys(TOKEN_ADDRESSES[chain] || {});
}

