'use client';

import { useGameStore } from '@/stores/gameStore';

interface GameUIProps {
  onOpenInventory: () => void;
  onDisconnect: () => void;
}

export function GameUI({ onOpenInventory, onDisconnect }: GameUIProps) {
  const { isGameReady } = useGameStore();

  if (!isGameReady) return null;

  return (
    <div className="game-ui-overlay">
      <div className="top-bar">
        <div className="location-info">
          <span className="location-icon">📍</span>
          <span className="location-name">DeFi Village</span>
        </div>

        <div className="wallet-display demo-mode">
          <span className="wallet-icon">🎮</span>
          <span className="wallet-address">Demo Mode</span>
        </div>
      </div>

      <div className="bottom-bar">
        <div className="action-buttons">
          <button className="action-btn inventory-btn" onClick={onOpenInventory}>
            <span className="btn-icon">📦</span>
            <span className="btn-label">Inventory</span>
            <span className="btn-key">[I]</span>
          </button>
          
          <button className="action-btn map-btn" disabled>
            <span className="btn-icon">🗺️</span>
            <span className="btn-label">Map</span>
            <span className="btn-key">[M]</span>
          </button>
          
          <button className="action-btn settings-btn" disabled>
            <span className="btn-icon">⚙️</span>
            <span className="btn-label">Settings</span>
            <span className="btn-key">[ESC]</span>
          </button>
        </div>

        <div className="control-hints">
          <span className="hint">Move: WASD / Arrow Keys</span>
          <span className="hint">Interact: SPACE</span>
        </div>
      </div>
    </div>
  );
}
