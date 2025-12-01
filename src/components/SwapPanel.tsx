'use client';

import { useState, useEffect } from 'react';
import { useGameStore } from '@/stores/gameStore';
import { EVM_CHAINS, SOLANA_CONFIG, SUI_CONFIG, DEFI_PROTOCOLS } from '@/lib/chains';

type ChainType = 'evm' | 'solana' | 'sui';
type EVMChainKey = keyof typeof EVM_CHAINS;

const TOKENS: Record<string, { symbol: string; name: string; icon: string }[]> = {
  ethereum: [
    { symbol: 'ETH', name: 'Ethereum', icon: '⟠' },
    { symbol: 'USDC', name: 'USD Coin', icon: '💵' },
    { symbol: 'USDT', name: 'Tether', icon: '💲' },
    { symbol: 'WBTC', name: 'Wrapped Bitcoin', icon: '₿' },
  ],
  arbitrum: [
    { symbol: 'ETH', name: 'Ethereum', icon: '⟠' },
    { symbol: 'USDC', name: 'USD Coin', icon: '💵' },
    { symbol: 'ARB', name: 'Arbitrum', icon: '🔵' },
    { symbol: 'GMX', name: 'GMX', icon: '📈' },
  ],
  base: [
    { symbol: 'ETH', name: 'Ethereum', icon: '⟠' },
    { symbol: 'USDC', name: 'USD Coin', icon: '💵' },
    { symbol: 'cbETH', name: 'Coinbase ETH', icon: '🔷' },
  ],
  polygon: [
    { symbol: 'MATIC', name: 'Polygon', icon: '💜' },
    { symbol: 'USDC', name: 'USD Coin', icon: '💵' },
    { symbol: 'WETH', name: 'Wrapped ETH', icon: '⟠' },
  ],
  solana: [
    { symbol: 'SOL', name: 'Solana', icon: '◎' },
    { symbol: 'USDC', name: 'USD Coin', icon: '💵' },
    { symbol: 'BONK', name: 'Bonk', icon: '🐕' },
    { symbol: 'JUP', name: 'Jupiter', icon: '🪐' },
  ],
  sui: [
    { symbol: 'SUI', name: 'Sui', icon: '💧' },
    { symbol: 'USDC', name: 'USD Coin', icon: '💵' },
    { symbol: 'CETUS', name: 'Cetus', icon: '🐋' },
  ],
};

export function SwapPanel() {
  const { activePanel, setActivePanel } = useGameStore();
  const [chainType, setChainType] = useState<ChainType>('evm');
  const [selectedChain, setSelectedChain] = useState<string>('ethereum');
  const [fromToken, setFromToken] = useState('ETH');
  const [toToken, setToToken] = useState('USDC');
  const [fromAmount, setFromAmount] = useState('');
  const [quote, setQuote] = useState<{ toAmount: string; priceImpact: number; fee: string } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Reset tokens when chain changes
    const tokens = TOKENS[selectedChain] || TOKENS.ethereum;
    setFromToken(tokens[0]?.symbol || 'ETH');
    setToToken(tokens[1]?.symbol || 'USDC');
    setQuote(null);
  }, [selectedChain]);

  useEffect(() => {
    // Fetch quote when amount changes
    const fetchQuote = async () => {
      if (!fromAmount || parseFloat(fromAmount) <= 0) {
        setQuote(null);
        return;
      }

      setLoading(true);
      try {
        const res = await fetch(
          `/api/defi/quote?action=swap&chain=${selectedChain}&fromToken=${fromToken}&toToken=${toToken}&amount=${fromAmount}`
        );
        const data = await res.json();
        if (data.quote) {
          setQuote(data.quote);
        }
      } catch (error) {
        console.error('Failed to fetch quote:', error);
      }
      setLoading(false);
    };

    const debounce = setTimeout(fetchQuote, 500);
    return () => clearTimeout(debounce);
  }, [fromAmount, fromToken, toToken, selectedChain]);

  if (activePanel !== 'swap') return null;

  const tokens = TOKENS[selectedChain] || TOKENS.ethereum;
  const protocols = DEFI_PROTOCOLS[selectedChain as keyof typeof DEFI_PROTOCOLS]?.filter(p => p.type === 'swap') || [];

  const handleSwap = () => {
    alert(`Swap on ${selectedChain.toUpperCase()}:\n${fromAmount} ${fromToken} → ${quote?.toAmount || '?'} ${toToken}\n\nThis will open your wallet to sign the transaction.`);
  };

  return (
    <div className="defi-panel">
      <div className="panel-header">
        <h2>🦄 Token Swap</h2>
        <button className="close-btn" onClick={() => setActivePanel('none')}>×</button>
      </div>

      <div className="npc-message">
        <div className="npc-avatar">🧙</div>
        <p>Select your chain and swap tokens across multiple networks!</p>
      </div>

      {/* Chain Type Selector */}
      <div className="chain-type-selector">
        <button 
          className={`chain-type-btn ${chainType === 'evm' ? 'active' : ''}`}
          onClick={() => { setChainType('evm'); setSelectedChain('ethereum'); }}
        >
          EVM Chains
        </button>
        <button 
          className={`chain-type-btn ${chainType === 'solana' ? 'active' : ''}`}
          onClick={() => { setChainType('solana'); setSelectedChain('solana'); }}
        >
          ◎ Solana
        </button>
        <button 
          className={`chain-type-btn ${chainType === 'sui' ? 'active' : ''}`}
          onClick={() => { setChainType('sui'); setSelectedChain('sui'); }}
        >
          💧 Sui
        </button>
      </div>

      {/* EVM Chain Selector */}
      {chainType === 'evm' && (
        <div className="evm-chain-selector">
          {Object.entries(EVM_CHAINS).slice(0, 5).map(([key, chain]) => (
            <button
              key={key}
              className={`evm-chain-btn ${selectedChain === key ? 'active' : ''}`}
              onClick={() => setSelectedChain(key)}
            >
              <span>{chain.icon}</span>
              <span>{chain.name}</span>
            </button>
          ))}
        </div>
      )}

      {/* Protocol Info */}
      {protocols.length > 0 && (
        <div className="protocol-badge">
          Using: {protocols[0].icon} {protocols[0].name}
        </div>
      )}

      <div className="swap-form">
        <div className="swap-input-group">
          <label>From</label>
          <div className="swap-input">
            <input
              type="number"
              placeholder="0.0"
              value={fromAmount}
              onChange={(e) => setFromAmount(e.target.value)}
            />
            <select value={fromToken} onChange={(e) => setFromToken(e.target.value)}>
              {tokens.map(t => (
                <option key={t.symbol} value={t.symbol}>{t.icon} {t.symbol}</option>
              ))}
            </select>
          </div>
        </div>

        <button className="swap-direction-btn" onClick={() => {
          setFromToken(toToken);
          setToToken(fromToken);
        }}>⇅</button>

        <div className="swap-input-group">
          <label>To</label>
          <div className="swap-input">
            <input 
              type="text" 
              placeholder={loading ? 'Loading...' : '0.0'} 
              value={quote?.toAmount || ''} 
              readOnly 
            />
            <select value={toToken} onChange={(e) => setToToken(e.target.value)}>
              {tokens.map(t => (
                <option key={t.symbol} value={t.symbol}>{t.icon} {t.symbol}</option>
              ))}
            </select>
          </div>
        </div>

        {quote && (
          <div className="swap-details">
            <div className="detail-row">
              <span>Rate</span>
              <span className="highlight">1 {fromToken} = {(parseFloat(quote.toAmount) / parseFloat(fromAmount)).toFixed(4)} {toToken}</span>
            </div>
            <div className="detail-row">
              <span>Price Impact</span>
              <span className={quote.priceImpact > 1 ? 'negative' : ''}>{quote.priceImpact.toFixed(2)}%</span>
            </div>
            <div className="detail-row">
              <span>Network Fee</span>
              <span>~${quote.fee}</span>
            </div>
          </div>
        )}

        <button 
          className="swap-btn" 
          onClick={handleSwap} 
          disabled={!fromAmount || !quote || loading}
        >
          {loading ? 'Getting Quote...' : `Swap on ${selectedChain.charAt(0).toUpperCase() + selectedChain.slice(1)}`}
        </button>
      </div>
    </div>
  );
}
