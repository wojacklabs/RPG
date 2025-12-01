'use client';

import { useState, useEffect } from 'react';
import { useGameStore } from '@/stores/gameStore';

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
  const [selectedChain, setSelectedChain] = useState('ethereum');
  const [stakingOptions, setStakingOptions] = useState<StakingOption[]>([]);
  const [selectedOption, setSelectedOption] = useState<StakingOption | null>(null);
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);

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

  const handleStake = () => {
    if (!selectedOption) return;
    alert(`Stake ${amount} ${selectedOption.token} on ${selectedOption.protocol}\n\nExpected APY: ${selectedOption.apy}%\n\nThis will open your wallet to sign the transaction.`);
  };

  return (
    <div className="defi-panel">
      <div className="panel-header">
        <h2>💎 Staking</h2>
        <button className="close-btn" onClick={() => setActivePanel('none')}>×</button>
      </div>

      <div className="npc-message">
        <div className="npc-avatar">🧙‍♂️</div>
        <p>Stake your tokens and earn passive rewards across multiple chains!</p>
      </div>

      {/* Chain Selector */}
      <div className="chain-type-selector">
        {STAKING_CHAINS.map(chain => (
          <button
            key={chain.key}
            className={`chain-type-btn ${selectedChain === chain.key ? 'active' : ''}`}
            onClick={() => setSelectedChain(chain.key)}
          >
            {chain.icon} {chain.name}
          </button>
        ))}
      </div>

      <div className="staking-form">
        {/* Staking Options */}
        <div className="staking-options">
          <label>Select Protocol</label>
          {loading ? (
            <div className="loading-text">Loading options...</div>
          ) : (
            <div className="option-list">
              {stakingOptions.map((option, index) => (
                <button
                  key={index}
                  className={`staking-option ${selectedOption?.protocol === option.protocol ? 'active' : ''}`}
                  onClick={() => setSelectedOption(option)}
                >
                  <div className="option-info">
                    <span className="option-name">{option.protocol}</span>
                    <span className="option-token">Stake: {option.token}</span>
                  </div>
                  <div className="option-stats">
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
            <div className="stake-input-group">
              <label>Amount to Stake</label>
              <div className="stake-input">
                <input
                  type="number"
                  placeholder={`Min: ${selectedOption.minStake}`}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
                <span className="token-label">{selectedOption.token}</span>
              </div>
            </div>

            {/* Staking Details */}
            <div className="staking-details">
              <div className="detail-row">
                <span>Protocol</span>
                <span className="highlight">{selectedOption.protocol}</span>
              </div>
              <div className="detail-row">
                <span>Annual Yield</span>
                <span className="positive">{selectedOption.apy}%</span>
              </div>
              <div className="detail-row">
                <span>Est. Monthly Earnings</span>
                <span className="positive">
                  {amount ? (parseFloat(amount) * selectedOption.apy / 100 / 12).toFixed(4) : '0'} {selectedOption.token}
                </span>
              </div>
              <div className="detail-row">
                <span>Total Value Locked</span>
                <span>{selectedOption.tvl}</span>
              </div>
            </div>

            <button 
              className="stake-btn" 
              onClick={handleStake}
              disabled={!amount || parseFloat(amount) < parseFloat(selectedOption.minStake)}
            >
              Stake {selectedOption.token}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
