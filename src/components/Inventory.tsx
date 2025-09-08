'use client';

import { useGameStore } from '@/stores/gameStore';

export function Inventory() {
  const { activePanel, setActivePanel } = useGameStore();

  if (activePanel !== 'inventory') return null;

  const demoTokens = [
    { symbol: 'ETH', name: 'Ethereum', balance: '0.00', icon: '⟠' },
    { symbol: 'USDC', name: 'USD Coin', balance: '0.00', icon: '💵' },
  ];

  return (
    <div className="inventory-panel">
      <div className="panel-header">
        <h2>📦 Inventory</h2>
        <button className="close-btn" onClick={() => setActivePanel('none')}>×</button>
      </div>

      <div className="wallet-info">
        <span>👛</span>
        <span>Demo Mode - Connect wallet for real assets</span>
      </div>

      <div className="inventory-section">
        <h3>💰 Tokens</h3>
        <div className="token-list">
          {demoTokens.map((token, i) => (
            <div key={i} className="token-item">
              <span className="token-icon">{token.icon}</span>
              <div className="token-info">
                <span className="token-symbol">{token.symbol}</span>
                <span className="token-name">{token.name}</span>
              </div>
              <span className="token-balance">{token.balance}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="inventory-section">
        <h3>🎨 NFTs</h3>
        <div className="empty-state">
          <p>No NFTs found</p>
        </div>
      </div>
    </div>
  );
}
