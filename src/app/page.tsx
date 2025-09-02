'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { usePrivy } from '@privy-io/react-auth';
import { useGameStore } from '@/stores/gameStore';
import { Inventory } from '@/components/Inventory';
import { SwapPanel } from '@/components/SwapPanel';
import { BridgePanel } from '@/components/BridgePanel';
import { StakingPanel } from '@/components/StakingPanel';
import { LiquidityPanel } from '@/components/LiquidityPanel';
import { NFTPanel } from '@/components/NFTPanel';
import { WalletOverlay } from '@/components/WalletOverlay';

const Game3D = dynamic(
  () => import('@/components/Game3D').then(mod => mod.Game3D),
  { 
    ssr: false,
    loading: () => (
      <div className="game-loading">
        <div className="loading-spinner" />
        <p>Loading game...</p>
      </div>
    ),
  }
);

export default function Home() {
  const { ready, authenticated } = usePrivy();
  const { setActivePanel, activePanel, setGameReady, setWalletConnected } = useGameStore();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    setGameReady(true);
  }, [setGameReady]);

  // Sync wallet connection state
  useEffect(() => {
    if (ready) {
      setWalletConnected(authenticated);
    }
  }, [ready, authenticated, setWalletConnected]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'i' || e.key === 'I') {
        if (authenticated) {
          setActivePanel(activePanel === 'inventory' ? 'none' : 'inventory');
        }
      }
      if (e.key === 'Escape') {
        setActivePanel('none');
      }
    };

    const handleOpenPanel = (e: CustomEvent) => {
      const panelType = e.detail as string;
      if (!authenticated) {
        return;
      }
      switch (panelType) {
        case 'swap':
          setActivePanel('swap');
          break;
        case 'bridge':
          setActivePanel('bridge');
          break;
        case 'staking':
          setActivePanel('staking');
          break;
        case 'liquidity':
          setActivePanel('liquidity');
          break;
        case 'nft':
          setActivePanel('nft');
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('openPanel', handleOpenPanel as EventListener);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('openPanel', handleOpenPanel as EventListener);
    };
  }, [activePanel, setActivePanel, authenticated]);

  if (!isClient) {
    return (
      <div className="game-loading">
        <div className="loading-spinner" />
        <p>Initializing...</p>
      </div>
    );
  }

  return (
    <main className="game-page">
      <Game3D />
      
      {/* Wallet connection overlay - shows when not connected */}
      {ready && !authenticated && <WalletOverlay />}
      
      {/* DeFi panels - only accessible when wallet is connected */}
      {authenticated && (
        <>
          <Inventory />
          <SwapPanel />
          <BridgePanel />
          <StakingPanel />
          <LiquidityPanel />
          <NFTPanel />
        </>
      )}
    </main>
  );
}
