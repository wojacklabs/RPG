'use client';

import { usePrivy } from '@privy-io/react-auth';

export function WalletOverlay() {
  const { login } = usePrivy();

  return (
    <div className="wallet-overlay">
      <div className="login-panel">
        <div className="panel-glow" />
        
        <div className="game-title">
          <span className="title-deco left">━━</span>
          <h1>DeFi Quest</h1>
          <span className="title-deco right">━━</span>
        </div>

        <button className="enter-btn" onClick={login}>
          <span className="btn-text">Enter World</span>
          <span className="btn-shine" />
        </button>
      </div>
    </div>
  );
}
