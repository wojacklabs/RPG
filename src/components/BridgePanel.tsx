'use client';

import { useState, useEffect } from 'react';
import { useGameStore } from '@/stores/gameStore';
import { usePrivy } from '@privy-io/react-auth';

const ALL_CHAINS = [
  { key: 'ethereum', name: 'Ethereum', icon: '⟠' },
  { key: 'arbitrum', name: 'Arbitrum', icon: '🔵' },
  { key: 'base', name: 'Base', icon: '🔷' },
  { key: 'polygon', name: 'Polygon', icon: '💜' },
  { key: 'optimism', name: 'Optimism', icon: '🔴' },
  { key: 'solana', name: 'Solana', icon: '◎' },
  { key: 'sui', name: 'Sui', icon: '💧' },
];

const BRIDGE_TOKENS = [
  { symbol: 'ETH', name: 'Ethereum', icon: '⟠' },
  { symbol: 'USDC', name: 'USD Coin', icon: '💵' },
  { symbol: 'USDT', name: 'Tether', icon: '💲' },
];

export function BridgePanel() {
  const { activePanel, setActivePanel } = useGameStore();
  const { authenticated } = usePrivy();
  const [fromChain, setFromChain] = useState('ethereum');
  const [toChain, setToChain] = useState('arbitrum');
  const [token, setToken] = useState('ETH');
  const [amount, setAmount] = useState('');
  const [quote, setQuote] = useState<{ estimatedReceive: string; fee: string; estimatedTime: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [bridging, setBridging] = useState(false);
  const [txStatus, setTxStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle');

  useEffect(() => {
    const fetchQuote = async () => {
      if (!amount || parseFloat(amount) <= 0 || fromChain === toChain) {
        setQuote(null);
        return;
      }

      setLoading(true);
      try {
        const res = await fetch(
          `/api/defi/quote?action=bridge&fromChain=${fromChain}&toChain=${toChain}&token=${token}&amount=${amount}`
        );
        const data = await res.json();
        if (data.quote) {
          setQuote(data.quote);
        }
      } catch (error) {
        console.error('Failed to fetch bridge quote:', error);
      }
      setLoading(false);
    };

    const debounce = setTimeout(fetchQuote, 500);
    return () => clearTimeout(debounce);
  }, [amount, fromChain, toChain, token]);

  if (activePanel !== 'bridge') return null;

  const fromChainInfo = ALL_CHAINS.find(c => c.key === fromChain);
  const toChainInfo = ALL_CHAINS.find(c => c.key === toChain);

  const handleBridge = async () => {
    if (!quote || !amount) return;
    
    setBridging(true);
    setTxStatus('pending');
    
    try {
      await new Promise(resolve => setTimeout(resolve, 3000));
      setTxStatus('success');
      setTimeout(() => {
        setTxStatus('idle');
        setAmount('');
        setQuote(null);
      }, 3000);
    } catch (error) {
      setTxStatus('error');
      setTimeout(() => setTxStatus('idle'), 3000);
    }
    
    setBridging(false);
  };

  const swapChains = () => {
    const temp = fromChain;
    setFromChain(toChain);
    setToChain(temp);
  };

  return (
    <div className="rpg-panel bridge-panel-rpg">
      <div className="panel-corner top-left" />
      <div className="panel-corner top-right" />
      <div className="panel-corner bottom-left" />
      <div className="panel-corner bottom-right" />

      <div className="rpg-panel-header">
        <div className="header-icon">🌉</div>
        <h2>Dimensional Bridge</h2>
        <button className="rpg-close-btn" onClick={() => setActivePanel('none')}>
          <span>✕</span>
        </button>
      </div>

      <div className="rpg-npc-dialog">
        <div className="npc-portrait">
          <span>🚢</span>
        </div>
        <div className="dialog-bubble">
          <p>"Through this magical bridge, you can transfer your assets to other realms. Where shall we go?"</p>
        </div>
      </div>

      <div className="bridge-form-rpg">
        <div className="bridge-chain-box">
          <div className="chain-box-label">From Chain</div>
          <div className="chain-grid-rpg">
            {ALL_CHAINS.map(chain => (
              <button
                key={chain.key}
                className={`chain-btn-rpg ${fromChain === chain.key ? 'active' : ''} ${toChain === chain.key ? 'disabled' : ''}`}
                onClick={() => fromChain !== chain.key && toChain !== chain.key && setFromChain(chain.key)}
                disabled={toChain === chain.key}
              >
                <span className="chain-icon">{chain.icon}</span>
                <span className="chain-name">{chain.name}</span>
              </button>
            ))}
          </div>
        </div>

        <button className="bridge-switch-btn" onClick={swapChains}>
          <span>⇅</span>
        </button>

        <div className="bridge-chain-box">
          <div className="chain-box-label">To Chain</div>
          <div className="chain-grid-rpg">
            {ALL_CHAINS.map(chain => (
              <button
                key={chain.key}
                className={`chain-btn-rpg ${toChain === chain.key ? 'active to' : ''} ${fromChain === chain.key ? 'disabled' : ''}`}
                onClick={() => toChain !== chain.key && fromChain !== chain.key && setToChain(chain.key)}
                disabled={fromChain === chain.key}
              >
                <span className="chain-icon">{chain.icon}</span>
                <span className="chain-name">{chain.name}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="bridge-amount-box">
          <div className="chain-box-label">Amount to Transfer</div>
          <div className="bridge-input-row">
            <input
              type="number"
              placeholder="0.0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="bridge-amount-input"
            />
            <select 
              value={token} 
              onChange={(e) => setToken(e.target.value)}
              className="bridge-token-select"
            >
              {BRIDGE_TOKENS.map(t => (
                <option key={t.symbol} value={t.symbol}>{t.icon} {t.symbol}</option>
              ))}
            </select>
          </div>
        </div>

        {quote && (
          <div className="rpg-quote-details">
            <div className="quote-row">
              <span className="quote-label">You Receive</span>
              <span className="quote-value gold">{quote.estimatedReceive} {token}</span>
            </div>
            <div className="quote-row">
              <span className="quote-label">Bridge Fee</span>
              <span className="quote-value">{quote.fee} {token}</span>
            </div>
            <div className="quote-row">
              <span className="quote-label">Est. Time</span>
              <span className="quote-value">{quote.estimatedTime}</span>
            </div>
            <div className="quote-row">
              <span className="quote-label">Route</span>
              <span className="quote-value">{fromChainInfo?.icon} → {toChainInfo?.icon}</span>
            </div>
          </div>
        )}

        <button 
          className={`rpg-action-btn ${bridging ? 'loading' : ''} ${txStatus}`}
          onClick={handleBridge}
          disabled={!amount || !quote || loading || bridging || fromChain === toChain || !authenticated}
        >
          {!authenticated ? (
            <span>Connect Wallet</span>
          ) : txStatus === 'pending' ? (
            <>
              <span className="btn-spinner" />
              <span>Bridging...</span>
            </>
          ) : txStatus === 'success' ? (
            <>
              <span className="btn-icon">✓</span>
              <span>Bridge Complete!</span>
            </>
          ) : loading ? (
            <span>Getting Quote...</span>
          ) : (
            <>
              <span className="btn-icon">🌉</span>
              <span>Bridge to {toChainInfo?.name}</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
