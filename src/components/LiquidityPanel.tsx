'use client';

import { useState, useEffect } from 'react';
import { useGameStore } from '@/stores/gameStore';

interface LPPool {
  protocol: string;
  pool: string;
  token0: string;
  token1: string;
  apy: number;
  tvl: string;
  fee: number;
}

const LP_CHAINS = [
  { key: 'ethereum', name: 'Ethereum', icon: '⟠' },
  { key: 'arbitrum', name: 'Arbitrum', icon: '🔵' },
  { key: 'base', name: 'Base', icon: '🔷' },
  { key: 'solana', name: 'Solana', icon: '◎' },
  { key: 'sui', name: 'Sui', icon: '💧' },
];

export function LiquidityPanel() {
  const { activePanel, setActivePanel } = useGameStore();
  const [selectedChain, setSelectedChain] = useState('ethereum');
  const [pools, setPools] = useState<LPPool[]>([]);
  const [selectedPool, setSelectedPool] = useState<LPPool | null>(null);
  const [amount0, setAmount0] = useState('');
  const [amount1, setAmount1] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchPools = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/defi/quote?action=liquidity&chain=${selectedChain}`);
        const data = await res.json();
        if (data.pools) {
          setPools(data.pools);
          setSelectedPool(data.pools[0] || null);
        }
      } catch (error) {
        console.error('Failed to fetch LP pools:', error);
      }
      setLoading(false);
    };

    fetchPools();
  }, [selectedChain]);

  if (activePanel !== 'liquidity') return null;

  const handleAddLiquidity = () => {
    if (!selectedPool) return;
    alert(`Add Liquidity to ${selectedPool.pool} on ${selectedPool.protocol}\n\n${amount0} ${selectedPool.token0}\n${amount1} ${selectedPool.token1}\n\nThis will open your wallet to sign the transaction.`);
  };

  return (
    <div className="defi-panel">
      <div className="panel-header">
        <h2>💰 Liquidity Pools</h2>
        <button className="close-btn" onClick={() => setActivePanel('none')}>×</button>
      </div>

      <div className="npc-message">
        <div className="npc-avatar">🏦</div>
        <p>Provide liquidity and earn trading fees from swaps!</p>
      </div>

      {/* Chain Selector */}
      <div className="chain-type-selector">
        {LP_CHAINS.map(chain => (
          <button
            key={chain.key}
            className={`chain-type-btn ${selectedChain === chain.key ? 'active' : ''}`}
            onClick={() => setSelectedChain(chain.key)}
          >
            {chain.icon} {chain.name}
          </button>
        ))}
      </div>

      <div className="liquidity-form">
        {/* Pool Selection */}
        <div className="pool-options">
          <label>Select Pool</label>
          {loading ? (
            <div className="loading-text">Loading pools...</div>
          ) : (
            <div className="pool-list">
              {pools.map((pool, index) => (
                <button
                  key={index}
                  className={`pool-option ${selectedPool?.pool === pool.pool ? 'active' : ''}`}
                  onClick={() => setSelectedPool(pool)}
                >
                  <div className="pool-info">
                    <span className="pool-name">{pool.pool}</span>
                    <span className="pool-protocol">{pool.protocol}</span>
                  </div>
                  <div className="pool-stats">
                    <span className="pool-apy">{pool.apy}% APY</span>
                    <span className="pool-tvl">TVL: {pool.tvl}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {selectedPool && (
          <>
            {/* Token Inputs */}
            <div className="lp-inputs">
              <div className="lp-input-group">
                <label>{selectedPool.token0} Amount</label>
                <div className="lp-input">
                  <input
                    type="number"
                    placeholder="0.0"
                    value={amount0}
                    onChange={(e) => setAmount0(e.target.value)}
                  />
                  <span className="token-label">{selectedPool.token0}</span>
                </div>
              </div>

              <div className="plus-icon">+</div>

              <div className="lp-input-group">
                <label>{selectedPool.token1} Amount</label>
                <div className="lp-input">
                  <input
                    type="number"
                    placeholder="0.0"
                    value={amount1}
                    onChange={(e) => setAmount1(e.target.value)}
                  />
                  <span className="token-label">{selectedPool.token1}</span>
                </div>
              </div>
            </div>

            {/* Pool Details */}
            <div className="liquidity-details">
              <div className="detail-row">
                <span>Pool</span>
                <span className="highlight">{selectedPool.pool}</span>
              </div>
              <div className="detail-row">
                <span>Protocol</span>
                <span>{selectedPool.protocol}</span>
              </div>
              <div className="detail-row">
                <span>Pool APY</span>
                <span className="positive">{selectedPool.apy}%</span>
              </div>
              <div className="detail-row">
                <span>Pool Fee</span>
                <span>{selectedPool.fee}%</span>
              </div>
              <div className="detail-row">
                <span>Total Value Locked</span>
                <span>{selectedPool.tvl}</span>
              </div>
            </div>

            <button 
              className="liquidity-btn" 
              onClick={handleAddLiquidity}
              disabled={!amount0 || !amount1}
            >
              Add Liquidity
            </button>
          </>
        )}
      </div>
    </div>
  );
}
