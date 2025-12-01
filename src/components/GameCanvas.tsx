'use client';

import { useEffect, useRef, useState } from 'react';
import * as Phaser from 'phaser';
import { createPhaserConfig } from '@/game/config';
import { BootScene } from '@/game/scenes/BootScene';
import { VillageScene } from '@/game/scenes/VillageScene';
import { useGameStore } from '@/stores/gameStore';

interface GameCanvasProps {
  onNPCInteraction?: (data: { npcId: string; npcName: string; action: string }) => void;
  onOpenPanel?: (panelType: string) => void;
}

export function GameCanvas({ onNPCInteraction, onOpenPanel }: GameCanvasProps) {
  const gameRef = useRef<Phaser.Game | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const { setGameReady, setGameState } = useGameStore();

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!containerRef.current) return;
    if (gameRef.current) return;

    const container = containerRef.current;
    const width = container.clientWidth || 1280;
    const height = container.clientHeight || 720;

    const config = createPhaserConfig(
      'game-container',
      width,
      height,
      [BootScene, VillageScene]
    );

    gameRef.current = new Phaser.Game(config);

    gameRef.current.events.on('sceneReady', () => {
      setIsLoaded(true);
      setGameReady(true);
      setGameState('playing');
    });

    gameRef.current.events.on('npcInteraction', (data: { npcId: string; npcName: string; action: string }) => {
      onNPCInteraction?.(data);
    });

    gameRef.current.events.on('openPanel', (panelType: string) => {
      onOpenPanel?.(panelType);
    });

    const timer = setTimeout(() => setIsLoaded(true), 3000);

    return () => {
      clearTimeout(timer);
      if (gameRef.current) {
        gameRef.current.destroy(true);
        gameRef.current = null;
      }
    };
  }, []);

  return (
    <div className="game-wrapper">
      <div 
        id="game-container" 
        ref={containerRef}
        className="game-container"
      />
      {!isLoaded && (
        <div className="loading-overlay">
          <div className="loading-spinner large" />
          <p>게임 로딩 중...</p>
        </div>
      )}
    </div>
  );
}
