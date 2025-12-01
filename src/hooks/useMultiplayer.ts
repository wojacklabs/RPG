import { useEffect, useRef, useCallback } from 'react';
import { useGameStore, OtherPlayer, ChatMessage } from '@/stores/gameStore';

const SYNC_INTERVAL = 1000; // 1초마다 동기화 (MegaETH 블록타임 10ms이므로 충분)
const POSITION_UPDATE_THROTTLE = 500; // 위치 업데이트 쓰로틀 (500ms)
const INACTIVE_THRESHOLD = 60000; // 60초 이상 비활성 플레이어 제외

interface UseMultiplayerOptions {
  enabled?: boolean;
  onError?: (error: Error) => void;
}

export function useMultiplayer(options: UseMultiplayerOptions = {}) {
  const { enabled = true, onError } = options;
  
  const {
    walletAddress,
    isRegistered,
    playerPosition,
    setOtherPlayers,
    setChatMessages,
    setSyncing,
    setLastSyncTime,
    otherPlayers,
  } = useGameStore();

  const lastPositionUpdate = useRef<number>(0);
  const syncIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isUnmounted = useRef(false);

  // 다른 플레이어들과 채팅 동기화
  const syncFromChain = useCallback(async () => {
    if (!enabled || isUnmounted.current) return;

    try {
      setSyncing(true);

      // 모든 플레이어 데이터 가져오기
      const playersResponse = await fetch('/api/game/players');
      if (!playersResponse.ok) throw new Error('Failed to fetch players');
      
      const { players } = await playersResponse.json();
      
      // 현재 시간 기준 활성 플레이어만 필터링
      const now = Date.now();
      const activePlayers = new Map<string, OtherPlayer>();
      
      for (const player of players) {
        // 자신 제외
        if (player.address.toLowerCase() === walletAddress?.toLowerCase()) continue;
        
        // 비활성 플레이어 제외
        const lastActiveMs = player.lastActive * 1000;
        if (now - lastActiveMs > INACTIVE_THRESHOLD) continue;
        
        activePlayers.set(player.address.toLowerCase(), {
          address: player.address,
          name: player.name,
          x: player.x,
          y: player.y,
          z: player.z,
          lastActive: player.lastActive,
        });
      }
      
      setOtherPlayers(activePlayers);

      // 최근 채팅 가져오기
      const chatsResponse = await fetch('/api/game/chat?count=50');
      if (chatsResponse.ok) {
        const { chats } = await chatsResponse.json();
        
        const chatMessages: ChatMessage[] = chats.map((chat: {
          sender: string;
          message: string;
          timestamp: number;
        }) => ({
          sender: chat.sender,
          message: chat.message,
          timestamp: chat.timestamp,
        }));
        
        setChatMessages(chatMessages);
      }

      setLastSyncTime(Date.now());
    } catch (error) {
      console.error('Sync error:', error);
      onError?.(error as Error);
    } finally {
      setSyncing(false);
    }
  }, [enabled, walletAddress, setOtherPlayers, setChatMessages, setSyncing, setLastSyncTime, onError]);

  // 위치 업데이트 (쓰로틀링 적용)
  const updatePosition = useCallback(async (x: number, y: number, z: number = 0) => {
    if (!walletAddress || !isRegistered) return;

    const now = Date.now();
    if (now - lastPositionUpdate.current < POSITION_UPDATE_THROTTLE) return;
    
    lastPositionUpdate.current = now;

    try {
      const response = await fetch('/api/game/position', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress,
          x: Math.round(x),
          y: Math.round(y),
          z: Math.round(z),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update position');
      }
    } catch (error) {
      console.error('Position update error:', error);
      onError?.(error as Error);
    }
  }, [walletAddress, isRegistered, onError]);

  // 채팅 전송
  const sendChat = useCallback(async (message: string) => {
    if (!walletAddress || !isRegistered || !message.trim()) return false;

    try {
      const response = await fetch('/api/game/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress,
          message: message.trim(),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send chat');
      }

      // 즉시 동기화해서 자신의 메시지 포함
      await syncFromChain();
      return true;
    } catch (error) {
      console.error('Chat send error:', error);
      onError?.(error as Error);
      return false;
    }
  }, [walletAddress, isRegistered, syncFromChain, onError]);

  // 플레이어 등록
  const registerPlayer = useCallback(async (playerName: string) => {
    if (!walletAddress) return false;

    try {
      const response = await fetch('/api/game/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress,
          playerName,
        }),
      });

      const data = await response.json();
      
      if (response.status === 409) {
        // 이미 등록됨
        return true;
      }

      if (!response.ok) {
        throw new Error(data.error || 'Failed to register');
      }

      return true;
    } catch (error) {
      console.error('Registration error:', error);
      onError?.(error as Error);
      return false;
    }
  }, [walletAddress, onError]);

  // 플레이어 정보 조회
  const checkRegistration = useCallback(async () => {
    if (!walletAddress) return null;

    try {
      const response = await fetch(`/api/game/register?walletAddress=${walletAddress}`);
      const data = await response.json();
      
      if (data.registered) {
        return data.player;
      }
      return null;
    } catch (error) {
      console.error('Check registration error:', error);
      return null;
    }
  }, [walletAddress]);

  // 주기적 동기화 설정
  useEffect(() => {
    isUnmounted.current = false;

    if (enabled && isRegistered) {
      // 초기 동기화
      syncFromChain();
      
      // 주기적 동기화
      syncIntervalRef.current = setInterval(syncFromChain, SYNC_INTERVAL);
    }

    return () => {
      isUnmounted.current = true;
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
        syncIntervalRef.current = null;
      }
    };
  }, [enabled, isRegistered, syncFromChain]);

  // 위치 변경 시 자동 업데이트
  useEffect(() => {
    if (enabled && isRegistered && playerPosition) {
      updatePosition(playerPosition.x, playerPosition.y, playerPosition.z || 0);
    }
  }, [enabled, isRegistered, playerPosition, updatePosition]);

  return {
    otherPlayers: Array.from(otherPlayers.values()),
    updatePosition,
    sendChat,
    registerPlayer,
    checkRegistration,
    syncFromChain,
  };
}

