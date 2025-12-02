'use client';

import { useState, useEffect, useCallback } from 'react';
import { useGameStore } from '@/stores/gameStore';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import {
  getQuote,
  checkAllowance,
  buildApprovalTx,
  buildSwapTx,
  getSupportedTokens,
  CHAIN_INFO,
  SUPPORTED_CHAIN_IDS,
  type UniswapQuote,
} from '@/lib/uniswap-client';

const TOKENS: Record<number, { symbol: string; name: string; icon: string }[]> = {
  1: [
    { symbol: 'ETH', name: 'Ethereum', icon: '⟠' },
    { symbol: 'USDC', name: 'USD Coin', icon: '💵' },
    { symbol: 'USDT', name: 'Tether', icon: '💲' },
    { symbol: 'WBTC', name: 'Wrapped BTC', icon: '₿' },
    { symbol: 'DAI', name: 'DAI', icon: '◈' },
  ],
  42161: [
    { symbol: 'ETH', name: 'Ethereum', icon: '⟠' },
    { symbol: 'USDC', name: 'USD Coin', icon: '💵' },
    { symbol: 'USDT', name: 'Tether', icon: '💲' },
    { symbol: 'ARB', name: 'Arbitrum', icon: '🔷' },
  ],
  8453: [
    { symbol: 'ETH', name: 'Ethereum', icon: '⟠' },
    { symbol: 'USDC', name: 'USD Coin', icon: '💵' },
  ],
  137: [
    { symbol: 'MATIC', name: 'Polygon', icon: '🟣' },
    { symbol: 'USDC', name: 'USD Coin', icon: '💵' },
    { symbol: 'USDT', name: 'Tether', icon: '💲' },
    { symbol: 'WETH', name: 'Wrapped ETH', icon: '⟠' },
  ],
  10: [
    { symbol: 'ETH', name: 'Ethereum', icon: '⟠' },
    { symbol: 'USDC', name: 'USD Coin', icon: '💵' },
    { symbol: 'OP', name: 'Optimism', icon: '🔴' },
  ],
};

export function SwapPanel() {
  const { activePanel, setActivePanel } = useGameStore();
  const { authenticated } = usePrivy();
  const { wallets } = useWallets();

  const [chainId, setChainId] = useState<number>(1);
  const [fromToken, setFromToken] = useState('ETH');
  const [toToken, setToToken] = useState('USDC');
  const [fromAmount, setFromAmount] = useState('');
  const [balance, setBalance] = useState<string>('0');
  const [quote, setQuote] = useState<UniswapQuote | null>(null);
  const [loading, setLoading] = useState(false);
  const [swapping, setSwapping] = useState(false);
  const [txStatus, setTxStatus] = useState<'idle' | 'switching' | 'approving' | 'swapping' | 'success' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

  const walletAddress = wallets?.[0]?.address;
  const chain = CHAIN_INFO[chainId];

  // Switch network and fetch balance
  const switchNetworkAndFetchBalance = useCallback(async (targetChainId: number) => {
    const wallet = wallets?.[0];
    if (!wallet || !walletAddress) return;

    try {
      setTxStatus('switching');
      const provider = await wallet.getEthereumProvider();

      // Switch network
      try {
        await provider.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: `0x${targetChainId.toString(16)}` }],
        });
      } catch (switchError: any) {
        // Chain not added, try adding it
        if (switchError.code === 4902) {
          throw new Error(`Please add ${CHAIN_INFO[targetChainId]?.name || 'this network'} to your wallet`);
        }
        throw switchError;
      }

      // Fetch balance
      const balanceHex = await provider.request({
        method: 'eth_getBalance',
        params: [walletAddress, 'latest'],
      });

      const balanceWei = BigInt(balanceHex);
      const balanceEth = Number(balanceWei) / 1e18;
      setBalance(balanceEth.toFixed(4));
      setTxStatus('idle');
    } catch (e: any) {
      console.error('Failed to switch network:', e);
      setError(e.message || 'Failed to switch network');
      setTxStatus('error');
    }
  }, [wallets, walletAddress]);

  // Initial balance fetch
  useEffect(() => {
    if (walletAddress) {
      switchNetworkAndFetchBalance(chainId);
    }
  }, [walletAddress, chainId, switchNetworkAndFetchBalance]);

  // Reset tokens when chain changes
  useEffect(() => {
    const tokens = TOKENS[chainId] || TOKENS[1];
    setFromToken(tokens[0]?.symbol || 'ETH');
    setToToken(tokens[1]?.symbol || 'USDC');
    setQuote(null);
    setError(null);
  }, [chainId]);

  // Fetch quote using wallet's provider
  const fetchQuote = useCallback(async () => {
    if (!fromAmount || parseFloat(fromAmount) <= 0 || !wallets?.[0]) {
      setQuote(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const wallet = wallets[0];
      const provider = await wallet.getEthereumProvider();

      const quoteResult = await getQuote(
        provider,
        chainId,
        fromToken,
        toToken,
        fromAmount
      );

      setQuote(quoteResult);
    } catch (e: any) {
      console.error('Quote error:', e);
      setError(e.message || 'Failed to get quote');
      setQuote(null);
    } finally {
      setLoading(false);
    }
  }, [fromAmount, fromToken, toToken, chainId, wallets]);

  useEffect(() => {
    const debounce = setTimeout(fetchQuote, 500);
    return () => clearTimeout(debounce);
  }, [fetchQuote]);

  const tokens = TOKENS[chainId] || TOKENS[1];

  const handleSwap = async () => {
    if (!quote || !walletAddress || !wallets?.[0]) return;

    const amountNum = parseFloat(fromAmount);
    const balanceNum = parseFloat(balance);

    // Native token balance check
    if ((fromToken === 'ETH' || fromToken === 'MATIC') && amountNum > balanceNum) {
      setError('Insufficient balance');
      return;
    }

    setSwapping(true);
    setError(null);
    setTxHash(null);

    try {
      const wallet = wallets[0];
      const provider = await wallet.getEthereumProvider();

      // Check if approval is needed
      const allowance = await checkAllowance(
        provider,
        chainId,
        fromToken,
        walletAddress,
        fromAmount
      );

      if (allowance.needsApproval) {
        setTxStatus('approving');
        const approvalTx = buildApprovalTx(chainId, fromToken);
        
        const approveTxHash = await provider.request({
          method: 'eth_sendTransaction',
          params: [{
            from: walletAddress,
            to: approvalTx.to,
            data: approvalTx.data,
          }],
        });

        // Wait for approval
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
      const swapTx = buildSwapTx(chainId, fromToken, toToken, fromAmount, walletAddress, quote);

      const swapTxHash = await provider.request({
        method: 'eth_sendTransaction',
        params: [{
          from: walletAddress,
          to: swapTx.to,
          data: swapTx.data,
          value: swapTx.value,
          gas: '0x493E0', // 300000
        }],
      });

      setTxHash(swapTxHash);
      setTxStatus('success');
      setFromAmount('');
      setQuote(null);

      // Refresh balance
      setTimeout(() => switchNetworkAndFetchBalance(chainId), 3000);
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
                {SUPPORTED_CHAIN_IDS.map((id) => (
                  <button
                    key={id}
                    onClick={() => setChainId(id)}
                    disabled={txStatus === 'switching'}
                    className={`px-3 py-2 rounded-lg text-sm transition-all ${
                      chainId === id
                        ? 'bg-amber-600 text-white'
                        : 'bg-stone-700 text-amber-200 hover:bg-stone-600'
                    } ${txStatus === 'switching' ? 'opacity-50' : ''}`}
                  >
                    {CHAIN_INFO[id].icon} {CHAIN_INFO[id].name}
                  </button>
                ))}
              </div>
            </div>

            {/* Balance */}
            <div className="text-right text-sm text-amber-300/70 mb-2">
              {txStatus === 'switching' ? (
                <span>Switching network...</span>
              ) : (
                <>Balance: {balance} {tokens[0]?.symbol || 'ETH'}</>
              )}
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
                    quote.amountOut
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
                  <span>Min. Received</span>
                  <span className="text-amber-100">{quote.amountOutMin} {toToken}</span>
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
              disabled={!quote || swapping || !fromAmount || txStatus === 'switching'}
              className="rpg-button w-full py-4 text-lg disabled:opacity-50"
            >
              {!authenticated
                ? 'Connect Wallet'
                : txStatus === 'switching'
                ? '⏳ Switching Network...'
                : swapping
                ? txStatus === 'approving'
                  ? '⏳ Approving Token...'
                  : '⏳ Swapping...'
                : !fromAmount
                ? 'Enter Amount'
                : loading
                ? 'Getting Quote...'
                : !quote
                ? error ? 'No Liquidity' : 'Enter Amount'
                : `Swap via Uniswap V3`}
            </button>

            {/* Protocol Info */}
            <div className="mt-4 text-center text-xs text-amber-300/50">
              Powered by Uniswap V3 • Direct Contract Interaction
            </div>
          </>
        )}
      </div>
    </div>
  );
}
