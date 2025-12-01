'use client';

import { useState, useEffect } from 'react';
import { useGameStore } from '@/stores/gameStore';
import { usePrivy } from '@privy-io/react-auth';

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
  const { authenticated } = usePrivy();
  const [selectedChain, setSelectedChain] = useState('ethereum');
  const [pools, setPools] = useState<LPPool[]>([]);
  const [selectedPool, setSelectedPool] = useState<LPPool | null>(null);
  const [amount0, setAmount0] = useState('');
  const [amount1, setAmount1] = useState('');
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState(false);
  const [txStatus, setTxStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle');

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

  const handleAddLiquidity = async () => {
    if (!selectedPool || !amount0 || !amount1) return;
    
    setAdding(true);
    setTxStatus('pending');
    
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      setTxStatus('success');
      setTimeout(() => {
        setTxStatus('idle');
        setAmount0('');
        setAmount1('');
      }, 3000);
    } catch (error) {
      setTxStatus('error');
      setTimeout(() => setTxStatus('idle'), 3000);
    }
    
    setAdding(false);
  };

  return (
    <div className="rpg-panel liquidity-panel-rpg">
      <div className="panel-corner top-left" />
      <div className="panel-corner top-right" />
      <div className="panel-corner bottom-left" />
      <div className="panel-corner bottom-right" />

      <div className="rpg-panel-header">
        <div className="header-icon">💰</div>
        <h2>상단의 금고</h2>
        <button className="rpg-close-btn" onClick={() => setActivePanel('none')}>
          <span>✕</span>
        </button>
      </div>

      <div className="rpg-npc-dialog">
        <div className="npc-portrait">
          <span>🏦</span>
        </div>
        <div className="dialog-bubble">
          <p>"우리 상단에 유동성을 제공하시면 거래 수수료를 나눠 드리지요. 함께 부를 쌓아보시겠소?"</p>
        </div>
      </div>

      {/* Chain Selector */}
      <div className="rpg-chain-selector">
        <div className="chain-tabs">
          {LP_CHAINS.map(chain => (
            <button
              key={chain.key}
              className={`chain-tab ${selectedChain === chain.key ? 'active' : ''}`}
              onClick={() => setSelectedChain(chain.key)}
            >
              <span className="tab-icon">{chain.icon}</span>
              <span>{chain.name}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="liquidity-form-rpg">
        {/* Pool Selection */}
        <div className="bridge-chain-box">
          <div className="chain-box-label">풀 선택</div>
          {loading ? (
            <div className="nft-loading-state" style={{ padding: '20px' }}>
              <div className="loading-spinner" />
            </div>
          ) : (
            <div className="pool-options-list">
              {pools.map((pool, index) => (
                <button
                  key={index}
                  className={`pool-option-rpg ${selectedPool?.pool === pool.pool ? 'active' : ''}`}
                  onClick={() => setSelectedPool(pool)}
                >
                  <div className="pool-left">
                    <span className="pool-pair">{pool.pool}</span>
                    <span className="pool-protocol">{pool.protocol}</span>
                  </div>
                  <div className="pool-right">
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
            <div className="lp-inputs-box">
              <div className="lp-input-box">
                <div className="chain-box-label">{selectedPool.token0} 금액</div>
                <div className="lp-input-row">
                  <input
                    type="number"
                    placeholder="0.0"
                    value={amount0}
                    onChange={(e) => setAmount0(e.target.value)}
                    className="lp-amount-input"
                  />
                  <div className="stake-token-label">{selectedPool.token0}</div>
                </div>
              </div>

              <div className="lp-plus-divider">+</div>

              <div className="lp-input-box">
                <div className="chain-box-label">{selectedPool.token1} 금액</div>
                <div className="lp-input-row">
                  <input
                    type="number"
                    placeholder="0.0"
                    value={amount1}
                    onChange={(e) => setAmount1(e.target.value)}
                    className="lp-amount-input"
                  />
                  <div className="stake-token-label">{selectedPool.token1}</div>
                </div>
              </div>
            </div>

            {/* Pool Details */}
            <div className="rpg-quote-details">
              <div className="quote-row">
                <span className="quote-label">풀</span>
                <span className="quote-value gold">{selectedPool.pool}</span>
              </div>
              <div className="quote-row">
                <span className="quote-label">프로토콜</span>
                <span className="quote-value">{selectedPool.protocol}</span>
              </div>
              <div className="quote-row">
                <span className="quote-label">풀 APY</span>
                <span className="quote-value positive">{selectedPool.apy}%</span>
              </div>
              <div className="quote-row">
                <span className="quote-label">수수료</span>
                <span className="quote-value">{selectedPool.fee}%</span>
              </div>
              <div className="quote-row">
                <span className="quote-label">총 예치금</span>
                <span className="quote-value">{selectedPool.tvl}</span>
              </div>
            </div>

            <button 
              className={`rpg-action-btn ${adding ? 'loading' : ''} ${txStatus}`}
              onClick={handleAddLiquidity}
              disabled={!amount0 || !amount1 || adding || !authenticated}
            >
              {!authenticated ? (
                <span>지갑 연결 필요</span>
              ) : txStatus === 'pending' ? (
                <>
                  <span className="btn-spinner" />
                  <span>유동성 추가 중...</span>
                </>
              ) : txStatus === 'success' ? (
                <>
                  <span className="btn-icon">✓</span>
                  <span>유동성 추가 완료!</span>
                </>
              ) : (
                <>
                  <span className="btn-icon">💰</span>
                  <span>유동성 추가</span>
                </>
              )}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
