'use client';

import { useState, useEffect } from 'react';
import { useGameStore } from '@/stores/gameStore';
import { EVM_CHAINS, SOLANA_CONFIG, SUI_CONFIG } from '@/lib/chains';

const ALL_CHAINS = [
  { key: 'ethereum', name: 'Ethereum', icon: '⟠', type: 'evm' },
  { key: 'arbitrum', name: 'Arbitrum', icon: '🔵', type: 'evm' },
  { key: 'base', name: 'Base', icon: '🔷', type: 'evm' },
  { key: 'polygon', name: 'Polygon', icon: '💜', type: 'evm' },
  { key: 'optimism', name: 'Optimism', icon: '🔴', type: 'evm' },
  { key: 'bsc', name: 'BNB Chain', icon: '🟡', type: 'evm' },
  { key: 'solana', name: 'Solana', icon: '◎', type: 'solana' },
  { key: 'sui', name: 'Sui', icon: '💧', type: 'sui' },
];

const BRIDGE_TOKENS = ['ETH', 'USDC', 'USDT'];

export function BridgePanel() {
  const { activePanel, setActivePanel } = useGameStore();
  const [fromChain, setFromChain] = useState('ethereum');
  const [toChain, setToChain] = useState('arbitrum');
  const [token, setToken] = useState('ETH');
  const [amount, setAmount] = useState('');
  const [quote, setQuote] = useState<{ estimatedReceive: string; fee: string; estimatedTime: string } | null>(null);
  const [loading, setLoading] = useState(false);

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

  const handleBridge = () => {
    alert(`Bridge ${amount} ${token}\nFrom: ${fromChainInfo?.name}\nTo: ${toChainInfo?.name}\n\nEstimated receive: ${quote?.estimatedReceive} ${token}\nFee: ${quote?.fee} ${token}\nTime: ${quote?.estimatedTime}`);
  };

  return (
    <div className="defi-panel">
      <div className="panel-header">
        <h2>🌉 Cross-Chain Bridge</h2>
        <button className="close-btn" onClick={() => setActivePanel('none')}>×</button>
      </div>

      <div className="npc-message">
        <div className="npc-avatar">🚢</div>
        <p>Transfer your assets across different blockchains seamlessly!</p>
      </div>

      <div className="bridge-form">
        {/* From Chain */}
        <div className="bridge-input-group">
          <label>From Chain</label>
          <div className="chain-grid">
            {ALL_CHAINS.map(chain => (
              <button
                key={chain.key}
                className={`chain-option ${fromChain === chain.key ? 'active' : ''} ${toChain === chain.key ? 'disabled' : ''}`}
                onClick={() => fromChain !== chain.key && toChain !== chain.key && setFromChain(chain.key)}
                disabled={toChain === chain.key}
              >
                <span className="chain-icon">{chain.icon}</span>
                <span className="chain-name">{chain.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Swap Direction */}
        <div className="bridge-direction">
          <button 
            className="bridge-direction-btn"
            onClick={() => {
              const temp = fromChain;
              setFromChain(toChain);
              setToChain(temp);
            }}
          >
            ⇅ Swap
          </button>
        </div>

        {/* To Chain */}
        <div className="bridge-input-group">
          <label>To Chain</label>
          <div className="chain-grid">
            {ALL_CHAINS.map(chain => (
              <button
                key={chain.key}
                className={`chain-option ${toChain === chain.key ? 'active' : ''} ${fromChain === chain.key ? 'disabled' : ''}`}
                onClick={() => toChain !== chain.key && fromChain !== chain.key && setToChain(chain.key)}
                disabled={fromChain === chain.key}
              >
                <span className="chain-icon">{chain.icon}</span>
                <span className="chain-name">{chain.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Token & Amount */}
        <div className="bridge-input-group">
          <label>Token & Amount</label>
          <div className="bridge-input">
            <input
              type="number"
              placeholder="0.0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
            <select value={token} onChange={(e) => setToken(e.target.value)}>
              {BRIDGE_TOKENS.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Quote Details */}
        {quote && (
          <div className="bridge-details">
            <div className="detail-row">
              <span>You will receive</span>
              <span className="highlight">{quote.estimatedReceive} {token}</span>
            </div>
            <div className="detail-row">
              <span>Bridge Fee</span>
              <span>{quote.fee} {token}</span>
            </div>
            <div className="detail-row">
              <span>Estimated Time</span>
              <span>{quote.estimatedTime}</span>
            </div>
            <div className="detail-row">
              <span>Route</span>
              <span>{fromChainInfo?.icon} → {toChainInfo?.icon}</span>
            </div>
          </div>
        )}

        <button 
          className="bridge-btn" 
          onClick={handleBridge}
          disabled={!amount || !quote || loading || fromChain === toChain}
        >
          {loading ? 'Getting Quote...' : `Bridge to ${toChainInfo?.name}`}
        </button>
      </div>
    </div>
  );
}
