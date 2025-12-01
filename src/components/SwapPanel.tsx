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
    { symbol: 'GMX', name: 'GMX', icon: '📈', decimals: 18 },
  ],
  base: [
    { symbol: 'ETH', name: 'Ethereum', icon: '⟠', decimals: 18 },
    { symbol: 'USDC', name: 'USD Coin', icon: '💵', decimals: 6 },
    { symbol: 'cbETH', name: 'Coinbase ETH', icon: '🔷', decimals: 18 },
  ],
  polygon: [
    { symbol: 'MATIC', name: 'Polygon', icon: '💜', decimals: 18 },
    { symbol: 'USDC', name: 'USD Coin', icon: '💵', decimals: 6 },
    { symbol: 'WETH', name: 'Wrapped ETH', icon: '⟠', decimals: 18 },
  ],
  solana: [
    { symbol: 'SOL', name: 'Solana', icon: '◎', decimals: 9 },
    { symbol: 'USDC', name: 'USD Coin', icon: '💵', decimals: 6 },
    { symbol: 'BONK', name: 'Bonk', icon: '🐕', decimals: 5 },
    { symbol: 'JUP', name: 'Jupiter', icon: '🪐', decimals: 6 },
  ],
  sui: [
    { symbol: 'SUI', name: 'Sui', icon: '💧', decimals: 9 },
    { symbol: 'USDC', name: 'USD Coin', icon: '💵', decimals: 6 },
    { symbol: 'CETUS', name: 'Cetus', icon: '🐋', decimals: 9 },
  ],
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
  const [quote, setQuote] = useState<{ toAmount: string; priceImpact: number; fee: string; rate: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [swapping, setSwapping] = useState(false);
  const [txStatus, setTxStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle');

  useEffect(() => {
    const tokens = TOKENS[selectedChain] || TOKENS.ethereum;
    setFromToken(tokens[0]?.symbol || 'ETH');
    setToToken(tokens[1]?.symbol || 'USDC');
    setQuote(null);
  }, [selectedChain]);

  const fetchQuote = useCallback(async () => {
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
        const rate = parseFloat(data.quote.toAmount) / parseFloat(fromAmount);
        setQuote({ ...data.quote, rate });
      }
    } catch (error) {
      console.error('Failed to fetch quote:', error);
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
    if (!quote || !fromAmount) return;
    
    setSwapping(true);
    setTxStatus('pending');
    
    try {
      // Simulate swap transaction
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // In production, this would:
      // 1. Get the wallet from Privy
      // 2. Build transaction using LI.FI or 1inch
      // 3. Send transaction and wait for confirmation
      
      setTxStatus('success');
      setTimeout(() => {
        setTxStatus('idle');
        setFromAmount('');
        setQuote(null);
      }, 3000);
    } catch (error) {
      console.error('Swap failed:', error);
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
      {/* Decorative corners */}
      <div className="panel-corner top-left" />
      <div className="panel-corner top-right" />
      <div className="panel-corner bottom-left" />
      <div className="panel-corner bottom-right" />
      
      {/* Header */}
      <div className="rpg-panel-header">
        <div className="header-icon">⚗️</div>
        <h2>연금술사의 교환소</h2>
        <button className="rpg-close-btn" onClick={() => setActivePanel('none')}>
          <span>✕</span>
        </button>
      </div>

      {/* NPC Dialog */}
      <div className="rpg-npc-dialog">
        <div className="npc-portrait">
          <span>🧙‍♂️</span>
        </div>
        <div className="dialog-bubble">
          <p>"어서오게, 여행자여. 이곳에서 자네의 자산을 다른 형태로 변환할 수 있다네."</p>
        </div>
      </div>

      {/* Chain Selector */}
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

      {/* Protocol Badge */}
      {activeProtocol && (
        <div className="rpg-protocol-badge">
          <span className="badge-icon">{activeProtocol.icon}</span>
          <span className="badge-text">{activeProtocol.name} 사용 중</span>
        </div>
      )}

      {/* Swap Form */}
      <div className="rpg-swap-form">
        {/* From Token */}
        <div className="swap-token-box from">
          <div className="token-box-header">
            <span className="token-label">보내는 토큰</span>
            <span className="token-balance">잔액: 0.00</span>
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

        {/* Switch Button */}
        <button className="swap-switch-btn" onClick={switchTokens}>
          <span className="switch-icon">⇅</span>
        </button>

        {/* To Token */}
        <div className="swap-token-box to">
          <div className="token-box-header">
            <span className="token-label">받는 토큰</span>
          </div>
          <div className="token-input-row">
            <input
              type="text"
              placeholder={loading ? '계산 중...' : '0.0'}
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

        {/* Quote Details */}
        {quote && (
          <div className="rpg-quote-details">
            <div className="quote-row">
              <span className="quote-label">환율</span>
              <span className="quote-value">1 {fromToken} = {quote.rate.toFixed(4)} {toToken}</span>
            </div>
            <div className="quote-row">
              <span className="quote-label">가격 영향</span>
              <span className={`quote-value ${quote.priceImpact > 1 ? 'negative' : 'positive'}`}>
                {quote.priceImpact.toFixed(2)}%
              </span>
            </div>
            <div className="quote-row">
              <span className="quote-label">네트워크 수수료</span>
              <span className="quote-value">~${quote.fee}</span>
            </div>
          </div>
        )}

        {/* Swap Button */}
        <button 
          className={`rpg-action-btn ${swapping ? 'loading' : ''} ${txStatus}`}
          onClick={handleSwap}
          disabled={!fromAmount || !quote || loading || swapping || !authenticated}
        >
          {!authenticated ? (
            <span>지갑 연결 필요</span>
          ) : txStatus === 'pending' ? (
            <>
              <span className="btn-spinner" />
              <span>교환 진행 중...</span>
            </>
          ) : txStatus === 'success' ? (
            <>
              <span className="btn-icon">✓</span>
              <span>교환 완료!</span>
            </>
          ) : txStatus === 'error' ? (
            <>
              <span className="btn-icon">✕</span>
              <span>교환 실패</span>
            </>
          ) : loading ? (
            <span>시세 조회 중...</span>
          ) : (
            <>
              <span className="btn-icon">⚗️</span>
              <span>교환하기</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
