import { create } from 'zustand';

export type GameState = 'loading' | 'playing' | 'paused';
export type UIPanel = 'none' | 'inventory' | 'swap' | 'bridge' | 'staking' | 'liquidity' | 'nft' | 'npc-dialog';

interface PlayerPosition {
  x: number;
  y: number;
  z?: number;
}

// 다른 플레이어 정보
export interface OtherPlayer {
  address: string;
  name: string;
  x: number;
  y: number;
  z: number;
  lastActive: number;
}

// 채팅 메시지
export interface ChatMessage {
  sender: string;
  senderName?: string;
  message: string;
  timestamp: number;
}

interface GameStore {
  gameState: GameState;
  setGameState: (state: GameState) => void;
  
  activePanel: UIPanel;
  setActivePanel: (panel: UIPanel) => void;
  
  playerPosition: PlayerPosition;
  setPlayerPosition: (pos: PlayerPosition) => void;
  
  currentNPC: string | null;
  setCurrentNPC: (npc: string | null) => void;
  
  dialogText: string[];
  setDialogText: (text: string[]) => void;
  
  isGameReady: boolean;
  setGameReady: (ready: boolean) => void;
  
  // Wallet connection state
  isWalletConnected: boolean;
  setWalletConnected: (connected: boolean) => void;
  
  walletAddress: string | null;
  setWalletAddress: (address: string | null) => void;
  
  // Player name (registered on MegaETH)
  playerName: string | null;
  setPlayerName: (name: string | null) => void;
  isRegistered: boolean;
  setRegistered: (registered: boolean) => void;
  
  // Multiplayer state
  otherPlayers: Map<string, OtherPlayer>;
  setOtherPlayers: (players: Map<string, OtherPlayer>) => void;
  updateOtherPlayer: (player: OtherPlayer) => void;
  removeOtherPlayer: (address: string) => void;
  
  // Chat state
  chatMessages: ChatMessage[];
  addChatMessage: (message: ChatMessage) => void;
  setChatMessages: (messages: ChatMessage[]) => void;
  
  // Sync state
  lastSyncTime: number;
  setLastSyncTime: (time: number) => void;
  isSyncing: boolean;
  setSyncing: (syncing: boolean) => void;
}

export const useGameStore = create<GameStore>((set, get) => ({
  gameState: 'loading',
  setGameState: (state) => set({ gameState: state }),
  
  activePanel: 'none',
  setActivePanel: (panel) => set({ activePanel: panel }),
  
  playerPosition: { x: 400, y: 300, z: 0 },
  setPlayerPosition: (pos) => set({ playerPosition: pos }),
  
  currentNPC: null,
  setCurrentNPC: (npc) => set({ currentNPC: npc }),
  
  dialogText: [],
  setDialogText: (text) => set({ dialogText: text }),
  
  isGameReady: false,
  setGameReady: (ready) => set({ isGameReady: ready }),
  
  // Wallet connection state
  isWalletConnected: false,
  setWalletConnected: (connected) => set({ isWalletConnected: connected }),
  
  walletAddress: null,
  setWalletAddress: (address) => set({ walletAddress: address }),
  
  // Player name
  playerName: null,
  setPlayerName: (name) => set({ playerName: name }),
  isRegistered: false,
  setRegistered: (registered) => set({ isRegistered: registered }),
  
  // Multiplayer state
  otherPlayers: new Map(),
  setOtherPlayers: (players) => set({ otherPlayers: players }),
  updateOtherPlayer: (player) => {
    const current = get().otherPlayers;
    const updated = new Map(current);
    updated.set(player.address, player);
    set({ otherPlayers: updated });
  },
  removeOtherPlayer: (address) => {
    const current = get().otherPlayers;
    const updated = new Map(current);
    updated.delete(address);
    set({ otherPlayers: updated });
  },
  
  // Chat state
  chatMessages: [],
  addChatMessage: (message) => {
    const current = get().chatMessages;
    const updated = [...current, message].slice(-50); // Keep last 50 messages
    set({ chatMessages: updated });
  },
  setChatMessages: (messages) => set({ chatMessages: messages }),
  
  // Sync state
  lastSyncTime: 0,
  setLastSyncTime: (time) => set({ lastSyncTime: time }),
  isSyncing: false,
  setSyncing: (syncing) => set({ isSyncing: syncing }),
}));
