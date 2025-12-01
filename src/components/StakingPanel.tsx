'use client';

import { useState, useEffect } from 'react';
import { useGameStore } from '@/stores/gameStore';
import { usePrivy } from '@privy-io/react-auth';

interface StakingOption {
  protocol: string;
  token: string;
  apy: number;
  tvl: string;
  minStake: string;
}

const STAKING_CHAINS = [
  { key: 'ethereum', name: 'Ethereum', icon: '⟠' },
  { key: 'arbitrum', name: 'Arbitrum', icon: '🔵' },
  { key: 'solana', name: 'Solana', icon: '◎' },
  { key: 'sui', name: 'Sui', icon: '💧' },
];

export function StakingPanel() {
  const { activePanel, setActivePanel } = useGameStore();
  const { authenticated } = usePrivy();
  const [selectedChain, setSelectedChain] = useState('ethereum');
  const [stakingOptions, setStakingOptions] = useState<StakingOption[]>([]);
  const [selectedOption, setSelectedOption] = useState<StakingOption | null>(null);
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [staking, setStaking] = useState(false);
  const [txStatus, setTxStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle');

  useEffect(() => {
    const fetchOptions = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/defi/quote?action=staking&chain=${selectedChain}`);
        const data = await res.json();
        if (data.options) {
          setStakingOptions(data.options);
          setSelectedOption(data.options[0] || null);
        }
      } catch (error) {
        console.error('Failed to fetch staking options:', error);
      }
      setLoading(false);
    };

    fetchOptions();
  }, [selectedChain]);

  if (activePanel !== 'staking') return null;

  const handleStake = async () => {
    if (!selectedOption || !amount) return;
    
    setStaking(true);
    setTxStatus('pending');
    
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      setTxStatus('success');
      setTimeout(() => {
        setTxStatus('idle');
        setAmount('');
      }, 3000);
    } catch (error) {
      setTxStatus('error');
      setTimeout(() => setTxStatus('idle'), 3000);
    }
    
    setStaking(false);
  };

  const monthlyEarnings = selectedOption && amount 
    ? (parseFloat(amount) * selectedOption.apy / 100 / 12).toFixed(4)
    : '0';

  return (
    <div className="rpg-panel staking-panel-rpg">
      <div className="panel-corner top-left" />
      <div className="panel-corner top-right" />
      <div className="panel-corner bottom-left" />
      <div className="panel-corner bottom-right" />

      <div className="rpg-panel-header">
        <div className="header-icon">💎</div>
        <h2>도사의 수련장</h2>
        <button className="rpg-close-btn" onClick={() => setActivePanel('none')}>
          <span>✕</span>
        </button>
      </div>

      <div className="rpg-npc-dialog">
        <div className="npc-portrait">
          <span>🧙‍♂️</span>
        </div>
        <div className="dialog-bubble">
          <p>"허허, 자네도 수련을 하러 왔는가? 토큰을 맡기면 시간이 흐를수록 보상이 쌓이지."</p>
        </div>
      </div>

      {/* Chain Selector */}
      <div className="rpg-chain-selector">
        <div className="chain-tabs">
          {STAKING_CHAINS.map(chain => (
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

      <div className="staking-form-rpg">
        {/* Staking Options */}
        <div className="bridge-chain-box">
          <div className="chain-box-label">프로토콜 선택</div>
          {loading ? (
            <div className="nft-loading-state" style={{ padding: '20px' }}>
              <div className="loading-spinner" />
            </div>
          ) : (
            <div className="staking-options-list">
              {stakingOptions.map((option, index) => (
                <button
                  key={index}
                  className={`staking-option-rpg ${selectedOption?.protocol === option.protocol ? 'active' : ''}`}
                  onClick={() => setSelectedOption(option)}
                >
                  <div className="option-left">
                    <span className="option-protocol">{option.protocol}</span>
                    <span className="option-token">스테이킹: {option.token}</span>
                  </div>
                  <div className="option-right">
                    <span className="option-apy">{option.apy}% APY</span>
                    <span className="option-tvl">TVL: {option.tvl}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {selectedOption && (
          <>
            {/* Amount Input */}
            <div className="stake-amount-box">
              <div className="chain-box-label">스테이킹 금액 (최소: {selectedOption.minStake})</div>
              <div className="stake-input-row">
                <input
                  type="number"
                  placeholder="0.0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="stake-amount-input"
                />
                <div className="stake-token-label">{selectedOption.token}</div>
              </div>
            </div>

            {/* Details */}
            <div className="rpg-quote-details">
              <div className="quote-row">
                <span className="quote-label">프로토콜</span>
                <span className="quote-value gold">{selectedOption.protocol}</span>
              </div>
              <div className="quote-row">
                <span className="quote-label">연간 수익률</span>
                <span className="quote-value positive">{selectedOption.apy}%</span>
              </div>
              <div className="quote-row">
                <span className="quote-label">예상 월 수익</span>
                <span className="quote-value positive">{monthlyEarnings} {selectedOption.token}</span>
              </div>
              <div className="quote-row">
                <span className="quote-label">총 예치금</span>
                <span className="quote-value">{selectedOption.tvl}</span>
              </div>
            </div>

            <button 
              className={`rpg-action-btn ${staking ? 'loading' : ''} ${txStatus}`}
              onClick={handleStake}
              disabled={!amount || parseFloat(amount) < parseFloat(selectedOption.minStake) || staking || !authenticated}
            >
              {!authenticated ? (
                <span>지갑 연결 필요</span>
              ) : txStatus === 'pending' ? (
                <>
                  <span className="btn-spinner" />
                  <span>스테이킹 중...</span>
                </>
              ) : txStatus === 'success' ? (
                <>
                  <span className="btn-icon">✓</span>
                  <span>스테이킹 완료!</span>
                </>
              ) : (
                <>
                  <span className="btn-icon">💎</span>
                  <span>{selectedOption.token} 스테이킹</span>
                </>
              )}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
