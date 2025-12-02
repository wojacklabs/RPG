'use client';

import { useState, useEffect, useCallback } from 'react';
import { useGameStore } from '@/stores/gameStore';
import { usePrivy, useWallets } from '@privy-io/react-auth';

type ChainType = 'evm' | 'solana' | 'sui';

// Uniswap V3 Supported Chains & Tokens
const CHAINS = {
  ethereum: { name: 'Ethereum', icon: '⟠', chainId: 1, explorer: 'https://etherscan.io/tx/' },
  arbitrum: { name: 'Arbitrum', icon: '🔷', chainId: 42161, explorer: 'https://arbiscan.io/tx/' },
  base: { name: 'Base', icon: '🔵', chainId: 8453, explorer: 'https://basescan.org/tx/' },
  polygon: { name: 'Polygon', icon: '🟣', chainId: 137, explorer: 'https://polygonscan.com/tx/' },
  optimism: { name: 'Optimism', icon: '🔴', chainId: 10, explorer: 'https://optimistic.etherscan.io/tx/' },
};

const TOKENS: Record<string, { symbol: string; name: string; icon: string }[]> = {
  ethereum: [
    { symbol: 'ETH', name: 'Ethereum', icon: '⟠' },
    { symbol: 'USDC', name: 'USD Coin', icon: '💵' },
    { symbol: 'USDT', name: 'Tether', icon: '💲' },
    { symbol: 'WBTC', name: 'Wrapped BTC', icon: '₿' },
    { symbol: 'DAI', name: 'DAI', icon: '◈' },
  ],
  arbitrum: [
    { symbol: 'ETH', name: 'Ethereum', icon: '⟠' },
    { symbol: 'USDC', name: 'USD Coin', icon: '💵' },
    { symbol: 'USDT', name: 'Tether', icon: '💲' },
    { symbol: 'ARB', name: 'Arbitrum', icon: '🔷' },
  ],
  base: [
    { symbol: 'ETH', name: 'Ethereum', icon: '⟠' },
    { symbol: 'USDC', name: 'USD Coin', icon: '💵' },
  ],
  polygon: [
    { symbol: 'MATIC', name: 'Polygon', icon: '🟣' },
    { symbol: 'USDC', name: 'USD Coin', icon: '💵' },
    { symbol: 'USDT', name: 'Tether', icon: '💲' },
    { symbol: 'WETH', name: 'Wrapped ETH', icon: '⟠' },
  ],
  optimism: [
    { symbol: 'ETH', name: 'Ethereum', icon: '⟠' },
    { symbol: 'USDC', name: 'USD Coin', icon: '💵' },
    { symbol: 'OP', name: 'Optimism', icon: '🔴' },
  ],
};

export function SwapPanel() {
  const { activePanel, setActivePanel } = useGameStore();
  const { authenticated } = usePrivy();
  const { wallets } = useWallets();

  const [selectedChain, setSelectedChain] = useState<string>('ethereum');
  const [fromToken, setFromToken] = useState('ETH');
  const [toToken, setToToken] = useState('USDC');
  const [fromAmount, setFromAmount] = useState('');
  const [balance, setBalance] = useState<string>('0');
  const [quote, setQuote] = useState<{ toAmount: string; path: string; priceImpact: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [swapping, setSwapping] = useState(false);
  const [txStatus, setTxStatus] = useState<'idle' | 'approving' | 'swapping' | 'success' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

  const walletAddress = wallets?.[0]?.address;
  const chain = CHAINS[selectedChain as keyof typeof CHAINS];

  // Fetch wallet balance
  useEffect(() => {
    const fetchBalance = async () => {
      if (!walletAddress) return;
      try {
        const wallet = wallets?.[0];
        if (!wallet) return;

        const provider = await wallet.getEthereumProvider();
        await provider.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: `0x${chain.chainId.toString(16)}` }],
        });

        const balanceHex = await provider.request({
          method: 'eth_getBalance',
          params: [walletAddress, 'latest'],
        });

        const balanceWei = BigInt(balanceHex);
        const balanceEth = Number(balanceWei) / 1e18;
        setBalance(balanceEth.toFixed(4));
      } catch (e) {
        console.error('Failed to fetch balance:', e);
      }
    };

    if (walletAddress) fetchBalance();
  }, [walletAddress, selectedChain, wallets]);

  // Reset tokens when chain changes
  useEffect(() => {
    const tokens = TOKENS[selectedChain] || TOKENS.ethereum;
    setFromToken(tokens[0]?.symbol || 'ETH');
    setToToken(tokens[1]?.symbol || 'USDC');
    setQuote(null);
    setError(null);
  }, [selectedChain]);

  // Fetch Uniswap quote
  const fetchQuote = useCallback(async () => {
    if (!fromAmount || parseFloat(fromAmount) <= 0) {
      setQuote(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(
        `/api/swap?chain=${selectedChain}&tokenIn=${fromToken}&tokenOut=${toToken}&amount=${fromAmount}`
      );
      const data = await res.json();

      if (data.error) {
        setError(data.error);
        setQuote(null);
      } else {
        setQuote({
          toAmount: data.quote.toAmount,
          path: data.quote.path,
          priceImpact: data.quote.priceImpact,
        });
      }
    } catch (e) {
      setError('Failed to get quote');
    } finally {
      setLoading(false);
    }
  }, [fromAmount, fromToken, toToken, selectedChain]);

  useEffect(() => {
    const debounce = setTimeout(fetchQuote, 500);
    return () => clearTimeout(debounce);
  }, [fetchQuote]);

  const tokens = TOKENS[selectedChain] || TOKENS.ethereum;

  const handleSwap = async () => {
    if (!quote || !walletAddress) return;

    const amountNum = parseFloat(fromAmount);
    const balanceNum = parseFloat(balance);

    // Native token check
    if ((fromToken === 'ETH' || fromToken === 'MATIC') && amountNum > balanceNum) {
      setError('Insufficient balance');
      return;
    }

    setSwapping(true);
    setError(null);
    setTxHash(null);

    try {
      const wallet = wallets?.[0];
      if (!wallet) throw new Error('Wallet not connected');

      const provider = await wallet.getEthereumProvider();

      // Build swap transaction
      const res = await fetch('/api/swap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chain: selectedChain,
          fromToken,
          toToken,
          amount: fromAmount,
          walletAddress,
          slippage: 0.5,
        }),
      });

      const data = await res.json();
      if (data.error) throw new Error(data.error);

      // Handle approval if needed
      if (data.needsApproval && data.approveTransaction) {
        setTxStatus('approving');
        const approveTxHash = await provider.request({
          method: 'eth_sendTransaction',
          params: [{
            from: walletAddress,
            to: data.approveTransaction.to,
            data: data.approveTransaction.data,
          }],
        });
        
        // Wait for approval confirmation
        let confirmed = false;
        while (!confirmed) {
          await new Promise(r => setTimeout(r, 2000));
          const receipt = await provider.request({
            method: 'eth_getTransactionReceipt',
            params: [approveTxHash],
          });
          if (receipt) confirmed = true;
        }
      }

      // Execute swap
      setTxStatus('swapping');
      const swapTxHash = await provider.request({
        method: 'eth_sendTransaction',
        params: [{
          from: walletAddress,
          to: data.transaction.to,
          data: data.transaction.data,
          value: data.transaction.value,
          gas: `0x${parseInt(data.transaction.gasLimit).toString(16)}`,
        }],
      });

      setTxHash(swapTxHash);
      setTxStatus('success');
      setFromAmount('');
      setQuote(null);
    } catch (e: any) {
      console.error('Swap error:', e);
      setError(e.message || 'Swap failed');
      setTxStatus('error');
    } finally {
      setSwapping(false);
    }
  };

  const switchTokens = () => {
    setFromToken(toToken);
    setToToken(fromToken);
    setFromAmount('');
    setQuote(null);
  };

  if (activePanel !== 'swap') return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="rpg-panel w-[480px] max-h-[85vh] overflow-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🔄</span>
            <div>
              <h2 className="text-xl font-bold text-amber-100">Uniswap V3</h2>
              <p className="text-sm text-amber-300/70">Token Swap</p>
            </div>
          </div>
          <button
            onClick={() => setActivePanel('none')}
            className="rpg-button-secondary w-10 h-10 flex items-center justify-center"
          >
            ✕
          </button>
        </div>

        {/* Wallet Status */}
        {!authenticated ? (
          <div className="text-center py-8">
            <p className="text-amber-200 mb-4">Connect wallet to swap</p>
          </div>
        ) : (
          <>
            {/* Chain Select */}
            <div className="mb-4">
              <label className="block text-amber-300/70 text-sm mb-2">Network</label>
              <div className="flex gap-2 flex-wrap">
                {Object.entries(CHAINS).map(([key, c]) => (
                  <button
                    key={key}
                    onClick={() => setSelectedChain(key)}
                    className={`px-3 py-2 rounded-lg text-sm transition-all ${
                      selectedChain === key
                        ? 'bg-amber-600 text-white'
                        : 'bg-stone-700 text-amber-200 hover:bg-stone-600'
                    }`}
                  >
                    {c.icon} {c.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Balance */}
            <div className="text-right text-sm text-amber-300/70 mb-2">
              Balance: {balance} {tokens[0]?.symbol || 'ETH'}
            </div>

            {/* From Token */}
            <div className="bg-stone-800/50 rounded-xl p-4 mb-2">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-amber-300/70">From</span>
                <button
                  onClick={() => setFromAmount(balance)}
                  className="text-xs text-amber-400 hover:text-amber-300"
                >
                  MAX
                </button>
              </div>
              <div className="flex gap-3">
                <select
                  value={fromToken}
                  onChange={(e) => {
                    setFromToken(e.target.value);
                    if (e.target.value === toToken) {
                      const other = tokens.find(t => t.symbol !== e.target.value);
                      if (other) setToToken(other.symbol);
                    }
                  }}
                  className="bg-stone-700 text-amber-100 rounded-lg px-3 py-2 outline-none"
                >
                  {tokens.map((t) => (
                    <option key={t.symbol} value={t.symbol}>
                      {t.icon} {t.symbol}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  value={fromAmount}
                  onChange={(e) => setFromAmount(e.target.value)}
                  placeholder="0.0"
                  className="flex-1 bg-transparent text-2xl text-amber-100 text-right outline-none"
                />
              </div>
            </div>

            {/* Switch Button */}
            <div className="flex justify-center -my-2 relative z-10">
              <button
                onClick={switchTokens}
                className="bg-stone-700 hover:bg-stone-600 rounded-full p-2 transition-all"
              >
                ⇅
              </button>
            </div>

            {/* To Token */}
            <div className="bg-stone-800/50 rounded-xl p-4 mt-2 mb-4">
              <div className="text-sm text-amber-300/70 mb-2">To</div>
              <div className="flex gap-3">
                <select
                  value={toToken}
                  onChange={(e) => {
                    setToToken(e.target.value);
                    if (e.target.value === fromToken) {
                      const other = tokens.find(t => t.symbol !== e.target.value);
                      if (other) setFromToken(other.symbol);
                    }
                  }}
                  className="bg-stone-700 text-amber-100 rounded-lg px-3 py-2 outline-none"
                >
                  {tokens.map((t) => (
                    <option key={t.symbol} value={t.symbol}>
                      {t.icon} {t.symbol}
                    </option>
                  ))}
                </select>
                <div className="flex-1 text-2xl text-amber-100 text-right">
                  {loading ? (
                    <span className="text-amber-300/50">Loading...</span>
                  ) : quote ? (
                    quote.toAmount
                  ) : (
                    <span className="text-amber-300/30">0.0</span>
                  )}
                </div>
              </div>
            </div>

            {/* Quote Info */}
            {quote && (
              <div className="bg-stone-800/30 rounded-lg p-3 mb-4 text-sm">
                <div className="flex justify-between text-amber-300/70">
                  <span>Route</span>
                  <span className="text-amber-100">{quote.path}</span>
                </div>
                <div className="flex justify-between text-amber-300/70">
                  <span>Price Impact</span>
                  <span className={quote.priceImpact > 1 ? 'text-red-400' : 'text-green-400'}>
                    ~{quote.priceImpact}%
                  </span>
                </div>
                <div className="flex justify-between text-amber-300/70">
                  <span>Protocol</span>
                  <span className="text-amber-100">Uniswap V3</span>
                </div>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="bg-red-900/30 border border-red-500/50 rounded-lg p-3 mb-4 text-red-300 text-sm">
                {error}
              </div>
            )}

            {/* Success */}
            {txStatus === 'success' && txHash && (
              <div className="bg-green-900/30 border border-green-500/50 rounded-lg p-3 mb-4">
                <p className="text-green-300 text-sm mb-2">✓ Swap completed!</p>
                <a
                  href={`${chain.explorer}${txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-amber-400 text-xs hover:underline break-all"
                >
                  View: {txHash.slice(0, 16)}...{txHash.slice(-8)}
                </a>
              </div>
            )}

            {/* Swap Button */}
            <button
              onClick={handleSwap}
              disabled={!quote || swapping || !fromAmount}
              className="rpg-button w-full py-4 text-lg disabled:opacity-50"
            >
              {!authenticated
                ? 'Connect Wallet'
                : swapping
                ? txStatus === 'approving'
                  ? '⏳ Approving...'
                  : '⏳ Swapping...'
                : !fromAmount
                ? 'Enter Amount'
                : !quote
                ? 'Loading Quote...'
                : `Swap via Uniswap V3`}
            </button>

            {/* Protocol Info */}
            <div className="mt-4 text-center text-xs text-amber-300/50">
              Powered by Uniswap V3 • No API Key Required
            </div>
          </>
        )}
      </div>
    </div>
  );
}
