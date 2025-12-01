// Local Game Service
// Single player mode - stores game data in localStorage

const STORAGE_KEY = 'defi_rpg_save';

// ============================================
// Types
// ============================================
export interface PlayerData {
  id: string;
  name: string;
  position: { x: number; y: number };
  stats: {
    level: number;
    experience: number;
    gold: number;
  };
  inventory: InventoryItem[];
  completedQuests: string[];
  unlockedAreas: string[];
  lastSaved: number;
}

export interface InventoryItem {
  id: string;
  name: string;
  type: 'token' | 'nft' | 'item';
  quantity: number;
  metadata?: Record<string, unknown>;
}

export interface GameSettings {
  soundEnabled: boolean;
  musicVolume: number;
  sfxVolume: number;
  language: string;
}

export interface SaveData {
  player: PlayerData;
  settings: GameSettings;
  version: string;
}

// ============================================
// Default Values
// ============================================
const DEFAULT_PLAYER: PlayerData = {
  id: crypto.randomUUID?.() || `player_${Date.now()}`,
  name: 'Hero',
  position: { x: 40 * 32, y: 30 * 32 },
  stats: {
    level: 1,
    experience: 0,
    gold: 100,
  },
  inventory: [
    { id: 'eth_starter', name: 'ETH', type: 'token', quantity: 0.1 },
    { id: 'usdc_starter', name: 'USDC', type: 'token', quantity: 100 },
  ],
  completedQuests: [],
  unlockedAreas: ['village'],
  lastSaved: Date.now(),
};

const DEFAULT_SETTINGS: GameSettings = {
  soundEnabled: true,
  musicVolume: 0.7,
  sfxVolume: 0.8,
  language: 'ko',
};

const CURRENT_VERSION = '1.0.0';

// ============================================
// Storage Functions
// ============================================
export function saveGame(player: Partial<PlayerData>, settings?: Partial<GameSettings>): boolean {
  try {
    const existing = loadGame();
    const saveData: SaveData = {
      player: {
        ...existing.player,
        ...player,
        lastSaved: Date.now(),
      },
      settings: {
        ...existing.settings,
        ...settings,
      },
      version: CURRENT_VERSION,
    };
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(saveData));
    return true;
  } catch (error) {
    console.error('Failed to save game:', error);
    return false;
  }
}

export function loadGame(): SaveData {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) {
      return {
        player: { ...DEFAULT_PLAYER },
        settings: { ...DEFAULT_SETTINGS },
        version: CURRENT_VERSION,
      };
    }
    
    const data = JSON.parse(saved) as SaveData;
    
    // Migration logic for future versions
    if (data.version !== CURRENT_VERSION) {
      return migrateData(data);
    }
    
    return data;
  } catch (error) {
    console.error('Failed to load game:', error);
    return {
      player: { ...DEFAULT_PLAYER },
      settings: { ...DEFAULT_SETTINGS },
      version: CURRENT_VERSION,
    };
  }
}

export function resetGame(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export function hasSaveData(): boolean {
  return localStorage.getItem(STORAGE_KEY) !== null;
}

// ============================================
// Player Functions
// ============================================
export function updatePlayerPosition(x: number, y: number): void {
  saveGame({ position: { x, y } });
}

export function updatePlayerStats(stats: Partial<PlayerData['stats']>): void {
  const current = loadGame().player.stats;
  saveGame({ stats: { ...current, ...stats } });
}

export function addToInventory(item: InventoryItem): void {
  const current = loadGame().player.inventory;
  const existingIndex = current.findIndex(i => i.id === item.id);
  
  if (existingIndex >= 0) {
    current[existingIndex].quantity += item.quantity;
  } else {
    current.push(item);
  }
  
  saveGame({ inventory: current });
}

export function removeFromInventory(itemId: string, quantity: number): boolean {
  const current = loadGame().player.inventory;
  const existingIndex = current.findIndex(i => i.id === itemId);
  
  if (existingIndex < 0) return false;
  
  if (current[existingIndex].quantity < quantity) return false;
  
  current[existingIndex].quantity -= quantity;
  
  if (current[existingIndex].quantity <= 0) {
    current.splice(existingIndex, 1);
  }
  
  saveGame({ inventory: current });
  return true;
}

export function completeQuest(questId: string, reward?: { gold?: number; exp?: number; items?: InventoryItem[] }): void {
  const game = loadGame();
  
  if (game.player.completedQuests.includes(questId)) return;
  
  const updates: Partial<PlayerData> = {
    completedQuests: [...game.player.completedQuests, questId],
  };
  
  if (reward) {
    const newStats = { ...game.player.stats };
    if (reward.gold) newStats.gold += reward.gold;
    if (reward.exp) {
      newStats.experience += reward.exp;
      // Level up logic
      const expNeeded = newStats.level * 100;
      if (newStats.experience >= expNeeded) {
        newStats.level += 1;
        newStats.experience -= expNeeded;
      }
    }
    updates.stats = newStats;
    
    if (reward.items) {
      reward.items.forEach(item => addToInventory(item));
    }
  }
  
  saveGame(updates);
}

export function unlockArea(areaId: string): void {
  const game = loadGame();
  if (!game.player.unlockedAreas.includes(areaId)) {
    saveGame({ unlockedAreas: [...game.player.unlockedAreas, areaId] });
  }
}

// ============================================
// Migration
// ============================================
function migrateData(oldData: SaveData): SaveData {
  // Add migration logic here for future versions
  return {
    ...oldData,
    version: CURRENT_VERSION,
  };
}

// ============================================
// Export save/import save for backup
// ============================================
export function exportSave(): string {
  const data = loadGame();
  return btoa(JSON.stringify(data));
}

export function importSave(encoded: string): boolean {
  try {
    const data = JSON.parse(atob(encoded)) as SaveData;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return true;
  } catch {
    return false;
  }
}

