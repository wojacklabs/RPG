'use client';

import { useState, useEffect, useCallback } from 'react';
import { useGameStore } from '@/stores/gameStore';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { EVM_CHAINS, DEFI_PROTOCOLS } from '@/lib/chains';

type ChainType = 'evm' | 'solana' | 'sui';

const TOKENS: Record<string, { symbol: string; name: string; icon: string; decimals: number }[]> = {
  ethereum: [
    { symbol: 'ETH', name: 'Ethereum', icon: '⟠', decimals: 18 },
    { symbol: 'USDC', name: 'USD Coin', icon: '💵', decimals: 6 },
    { symbol: 'USDT', name: 'Tether', icon: '💲', decimals: 6 },
    { symbol: 'WBTC', name: 'Wrapped Bitcoin', icon: '₿', decimals: 8 },
  ],
  arbitrum: [
    { symbol: 'ETH', name: 'Ethereum', icon: '⟠', decimals: 18 },
    { symbol: 'USDC', name: 'USD Coin', icon: '💵', decimals: 6 },
    { symbol: 'ARB', name: 'Arbitrum', icon: '🔵', decimals: 18 },
  ],
  base: [
    { symbol: 'ETH', name: 'Ethereum', icon: '⟠', decimals: 18 },
    { symbol: 'USDC', name: 'USD Coin', icon: '💵', decimals: 6 },
  ],
  polygon: [
    { symbol: 'MATIC', name: 'Polygon', icon: '💜', decimals: 18 },
    { symbol: 'USDC', name: 'USD Coin', icon: '💵', decimals: 6 },
  ],
  solana: [
    { symbol: 'SOL', name: 'Solana', icon: '◎', decimals: 9 },
    { symbol: 'USDC', name: 'USD Coin', icon: '💵', decimals: 6 },
  ],
  sui: [
    { symbol: 'SUI', name: 'Sui', icon: '💧', decimals: 9 },
    { symbol: 'USDC', name: 'USD Coin', icon: '💵', decimals: 6 },
  ],
};

const CHAIN_IDS: Record<string, number> = {
  ethereum: 1,
  arbitrum: 42161,
  base: 8453,
  polygon: 137,
  optimism: 10,
};

export function SwapPanel() {
  const { activePanel, setActivePanel } = useGameStore();
  const { authenticated } = usePrivy();
  const { wallets } = useWallets();
  
  const [chainType, setChainType] = useState<ChainType>('evm');
  const [selectedChain, setSelectedChain] = useState<string>('ethereum');
  const [fromToken, setFromToken] = useState('ETH');
  const [toToken, setToToken] = useState('USDC');
  const [fromAmount, setFromAmount] = useState('');
  const [balance, setBalance] = useState<string>('0');
  const [quote, setQuote] = useState<{ toAmount: string; priceImpact: number; fee: string; rate: number; protocol: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [swapping, setSwapping] = useState(false);
  const [txStatus, setTxStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

  const walletAddress = wallets?.[0]?.address;

  // Fetch balance
  useEffect(() => {
    const fetchBalance = async () => {
      if (!walletAddress || chainType !== 'evm') {
        setBalance('0');
        return;
      }

      try {
        const wallet = wallets?.[0];
        if (!wallet) return;
        
        const provider = await wallet.getEthereumProvider();
        const chainId = CHAIN_IDS[selectedChain];
        
        try {
          await provider.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: `0x${chainId.toString(16)}` }],
          });
        } catch (switchError: any) {
          if (switchError.code === 4902) {
            console.log('Chain not added to wallet');
          }
        }

        const balanceHex = await provider.request({
          method: 'eth_getBalance',
          params: [walletAddress, 'latest'],
        }) as string;
        
        const balanceWei = BigInt(balanceHex);
        const balanceEth = Number(balanceWei) / 1e18;
        setBalance(balanceEth.toFixed(4));
      } catch (err) {
        console.error('Failed to fetch balance:', err);
        setBalance('0');
      }
    };

    fetchBalance();
  }, [walletAddress, selectedChain, chainType, wallets]);

  useEffect(() => {
    const tokens = TOKENS[selectedChain] || TOKENS.ethereum;
    setFromToken(tokens[0]?.symbol || 'ETH');
    setToToken(tokens[1]?.symbol || 'USDC');
    setQuote(null);
    setError(null);
  }, [selectedChain]);

  const fetchQuote = useCallback(async () => {
    if (!fromAmount || parseFloat(fromAmount) <= 0) {
      setQuote(null);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/defi/quote?action=swap&chain=${selectedChain}&fromToken=${fromToken}&toToken=${toToken}&amount=${fromAmount}`
      );
      const data = await res.json();
      if (data.quote) {
        const rate = parseFloat(data.quote.toAmount) / parseFloat(fromAmount);
        setQuote({ 
          toAmount: data.quote.toAmount,
          priceImpact: data.quote.priceImpact,
          fee: data.quote.fee,
          rate,
          protocol: data.quote.protocol,
        });
      }
    } catch (err) {
      console.error('Failed to fetch quote:', err);
    }
    setLoading(false);
  }, [fromAmount, fromToken, toToken, selectedChain]);

  useEffect(() => {
    const debounce = setTimeout(fetchQuote, 500);
    return () => clearTimeout(debounce);
  }, [fetchQuote]);

  if (activePanel !== 'swap') return null;

  const tokens = TOKENS[selectedChain] || TOKENS.ethereum;
  const protocols = DEFI_PROTOCOLS[selectedChain as keyof typeof DEFI_PROTOCOLS]?.filter(p => p.type === 'swap') || [];
  const activeProtocol = protocols[0];

  const handleSwap = async () => {
    if (!quote || !fromAmount || !walletAddress) return;
    
    const amountNum = parseFloat(fromAmount);
    const balanceNum = parseFloat(balance);
    
    if (amountNum > balanceNum) {
      setError(`Insufficient balance. You have ${balance} ${fromToken}`);
      return;
    }

    if (chainType !== 'evm') {
      setError('Only EVM chains supported. Use Jupiter for Solana.');
      return;
    }

    setSwapping(true);
    setTxStatus('pending');
    setError(null);
    setTxHash(null);
    
    try {
      const wallet = wallets?.[0];
      if (!wallet) throw new Error('No wallet connected');

      const provider = await wallet.getEthereumProvider();
      
      // Get swap transaction from API
      const res = await fetch('/api/swap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chain: selectedChain,
          fromToken,
          toToken,
          amount: fromAmount,
          walletAddress,
          slippage: 1,
        }),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        throw new Error(data.error || 'Failed to build swap transaction');
      }

      // Check if approval is needed
      if (data.needsApproval && data.approveTransaction) {
        setError('Token approval needed. Approving...');
        
        const approveTxHash = await provider.request({
          method: 'eth_sendTransaction',
          params: [{
            from: walletAddress,
            to: data.approveTransaction.to,
            data: data.approveTransaction.data,
          }],
        });
        
        console.log('Approval tx:', approveTxHash);
        // Wait for approval confirmation
        await new Promise(resolve => setTimeout(resolve, 5000));
      }

      // Execute swap
      const swapTxHash = await provider.request({
        method: 'eth_sendTransaction',
        params: [{
          from: walletAddress,
          to: data.transaction.to,
          data: data.transaction.data,
          value: data.transaction.value,
          gas: `0x${parseInt(data.transaction.gas).toString(16)}`,
        }],
      }) as string;
      
      setTxHash(swapTxHash);
      setTxStatus('success');
      
      setTimeout(() => {
        setTxStatus('idle');
        setFromAmount('');
        setQuote(null);
        setTxHash(null);
      }, 5000);

    } catch (err: any) {
      console.error('Swap error:', err);
      setError(err.message || 'Swap failed');
      setTxStatus('error');
      setTimeout(() => setTxStatus('idle'), 3000);
    }
    
    setSwapping(false);
  };

  const switchTokens = () => {
    setFromToken(toToken);
    setToToken(fromToken);
    setFromAmount(quote?.toAmount || '');
  };

  return (
    <div className="rpg-panel swap-panel">
      <div className="panel-corner top-left" />
      <div className="panel-corner top-right" />
      <div className="panel-corner bottom-left" />
      <div className="panel-corner bottom-right" />
      
      <div className="rpg-panel-header">
        <div className="header-icon">⚗️</div>
        <h2>Alchemist's Exchange</h2>
        <button className="rpg-close-btn" onClick={() => setActivePanel('none')}>
          <span>✕</span>
        </button>
      </div>

      <div className="rpg-npc-dialog">
        <div className="npc-portrait">
          <span>🧙‍♂️</span>
        </div>
        <div className="dialog-bubble">
          <p>"Swap tokens using {quote?.protocol || '1inch'} aggregator."</p>
        </div>
      </div>

      <div className="rpg-chain-selector">
        <div className="chain-tabs">
          <button 
            className={`chain-tab ${chainType === 'evm' ? 'active' : ''}`}
            onClick={() => { setChainType('evm'); setSelectedChain('ethereum'); }}
          >
            <span className="tab-icon">🔗</span>
            <span>EVM</span>
          </button>
          <button 
            className={`chain-tab ${chainType === 'solana' ? 'active' : ''}`}
            onClick={() => { setChainType('solana'); setSelectedChain('solana'); }}
          >
            <span className="tab-icon">◎</span>
            <span>Solana</span>
          </button>
          <button 
            className={`chain-tab ${chainType === 'sui' ? 'active' : ''}`}
            onClick={() => { setChainType('sui'); setSelectedChain('sui'); }}
          >
            <span className="tab-icon">💧</span>
            <span>Sui</span>
          </button>
        </div>

        {chainType === 'evm' && (
          <div className="chain-network-selector">
            {Object.entries(EVM_CHAINS).slice(0, 5).map(([key, chain]) => (
              <button
                key={key}
                className={`network-btn ${selectedChain === key ? 'active' : ''}`}
                onClick={() => setSelectedChain(key)}
              >
                <span className="network-icon">{chain.icon}</span>
                <span className="network-name">{chain.name}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {activeProtocol && (
        <div className="rpg-protocol-badge">
          <span className="badge-icon">{activeProtocol.icon}</span>
          <span className="badge-text">Via {quote?.protocol || activeProtocol.name}</span>
        </div>
      )}

      <div className="rpg-swap-form">
        <div className="swap-token-box from">
          <div className="token-box-header">
            <span className="token-label">From</span>
            <span className="token-balance">Balance: {balance} {tokens[0]?.symbol}</span>
          </div>
          <div className="token-input-row">
            <input
              type="number"
              placeholder="0.0"
              value={fromAmount}
              onChange={(e) => setFromAmount(e.target.value)}
              className="token-amount-input"
            />
            <div className="token-selector">
              <select value={fromToken} onChange={(e) => setFromToken(e.target.value)}>
                {tokens.map(t => (
                  <option key={t.symbol} value={t.symbol}>{t.icon} {t.symbol}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <button className="swap-switch-btn" onClick={switchTokens}>
          <span className="switch-icon">⇅</span>
        </button>

        <div className="swap-token-box to">
          <div className="token-box-header">
            <span className="token-label">To</span>
          </div>
          <div className="token-input-row">
            <input
              type="text"
              placeholder={loading ? 'Calculating...' : '0.0'}
              value={quote?.toAmount || ''}
              readOnly
              className="token-amount-input"
            />
            <div className="token-selector">
              <select value={toToken} onChange={(e) => setToToken(e.target.value)}>
                {tokens.map(t => (
                  <option key={t.symbol} value={t.symbol}>{t.icon} {t.symbol}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {quote && (
          <div className="rpg-quote-details">
            <div className="quote-row">
              <span className="quote-label">Rate</span>
              <span className="quote-value">1 {fromToken} = {quote.rate.toFixed(4)} {toToken}</span>
            </div>
            <div className="quote-row">
              <span className="quote-label">Price Impact</span>
              <span className={`quote-value ${quote.priceImpact > 1 ? 'negative' : 'positive'}`}>
                {quote.priceImpact.toFixed(2)}%
              </span>
            </div>
            <div className="quote-row">
              <span className="quote-label">Est. Gas</span>
              <span className="quote-value">~${quote.fee}</span>
            </div>
          </div>
        )}

        {error && (
          <div className="buy-error-message">
            ⚠️ {error}
          </div>
        )}

        {txHash && (
          <div className="buy-success-message">
            ✓ Tx: {txHash.slice(0, 10)}...{txHash.slice(-8)}
          </div>
        )}

        <button 
          className={`rpg-action-btn ${swapping ? 'loading' : ''} ${txStatus}`}
          onClick={handleSwap}
          disabled={!fromAmount || !quote || loading || swapping || !authenticated}
        >
          {!authenticated ? (
            <span>Connect Wallet</span>
          ) : txStatus === 'pending' ? (
            <>
              <span className="btn-spinner" />
              <span>Swapping...</span>
            </>
          ) : txStatus === 'success' ? (
            <>
              <span className="btn-icon">✓</span>
              <span>Swap Complete!</span>
            </>
          ) : txStatus === 'error' ? (
            <>
              <span className="btn-icon">✕</span>
              <span>Swap Failed</span>
            </>
          ) : loading ? (
            <span>Getting Quote...</span>
          ) : (
            <>
              <span className="btn-icon">⚗️</span>
              <span>Swap</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
