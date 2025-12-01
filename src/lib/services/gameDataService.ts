// MegaETH Game Data Service
// Uses server wallet to manage game data on-chain

import { createPublicClient, createWalletClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { megaethTestnet } from '../chains';
import { GAME_DATA_ABI, GAME_DATA_CONTRACT_ADDRESS } from '../contracts/GameDataABI';

// Server-side only - Admin wallet for game data management
const ADMIN_PRIVATE_KEY = process.env.MEGAETH_ADMIN_PRIVATE_KEY;

// Public client for reading data
export const megaethPublicClient = createPublicClient({
  chain: megaethTestnet,
  transport: http(),
});

// Create admin wallet client (server-side only)
function getAdminWalletClient() {
  if (!ADMIN_PRIVATE_KEY) {
    throw new Error('MEGAETH_ADMIN_PRIVATE_KEY not configured');
  }
  
  const account = privateKeyToAccount(ADMIN_PRIVATE_KEY as `0x${string}`);
  
  return createWalletClient({
    account,
    chain: megaethTestnet,
    transport: http(),
  });
}

// Player data interface
export interface PlayerData {
  name: string;
  x: number;
  y: number;
  z: number;
  lastActive: number;
  registered: boolean;
}

// Chat message interface
export interface ChatMessage {
  sender: string;
  message: string;
  timestamp: number;
}

// Read player data from MegaETH
export async function getPlayerData(walletAddress: string): Promise<PlayerData | null> {
  try {
    const result = await megaethPublicClient.readContract({
      address: GAME_DATA_CONTRACT_ADDRESS as `0x${string}`,
      abi: GAME_DATA_ABI,
      functionName: 'getPlayer',
      args: [walletAddress as `0x${string}`],
    });

    const [name, x, y, z, lastActive, registered] = result as [string, bigint, bigint, bigint, bigint, boolean];
    
    if (!registered) return null;
    
    return {
      name,
      x: Number(x),
      y: Number(y),
      z: Number(z),
      lastActive: Number(lastActive),
      registered,
    };
  } catch (error) {
    console.error('Failed to get player data:', error);
    return null;
  }
}

// Get active players
export async function getActivePlayers(sinceTimestamp: number): Promise<string[]> {
  try {
    const result = await megaethPublicClient.readContract({
      address: GAME_DATA_CONTRACT_ADDRESS as `0x${string}`,
      abi: GAME_DATA_ABI,
      functionName: 'getActivePlayers',
      args: [BigInt(sinceTimestamp)],
    });
    
    return result as string[];
  } catch (error) {
    console.error('Failed to get active players:', error);
    return [];
  }
}

// Get recent chat messages
export async function getRecentChats(count: number): Promise<ChatMessage[]> {
  try {
    const result = await megaethPublicClient.readContract({
      address: GAME_DATA_CONTRACT_ADDRESS as `0x${string}`,
      abi: GAME_DATA_ABI,
      functionName: 'getRecentChats',
      args: [BigInt(count)],
    });

    const [senders, messages, timestamps] = result as [string[], string[], bigint[]];
    
    return senders.map((sender, i) => ({
      sender,
      message: messages[i],
      timestamp: Number(timestamps[i]),
    }));
  } catch (error) {
    console.error('Failed to get recent chats:', error);
    return [];
  }
}

// Register new player (server-side only)
export async function registerPlayer(walletAddress: string, playerName: string): Promise<string | null> {
  try {
    const client = getAdminWalletClient();
    
    const hash = await client.writeContract({
      address: GAME_DATA_CONTRACT_ADDRESS as `0x${string}`,
      abi: GAME_DATA_ABI,
      functionName: 'registerPlayer',
      args: [walletAddress as `0x${string}`, playerName],
    });

    return hash;
  } catch (error) {
    console.error('Failed to register player:', error);
    return null;
  }
}

// Update player position (server-side only)
export async function updatePlayerPosition(
  walletAddress: string,
  x: number,
  y: number,
  z: number
): Promise<string | null> {
  try {
    const client = getAdminWalletClient();
    
    const hash = await client.writeContract({
      address: GAME_DATA_CONTRACT_ADDRESS as `0x${string}`,
      abi: GAME_DATA_ABI,
      functionName: 'updatePlayerPosition',
      args: [walletAddress as `0x${string}`, BigInt(Math.round(x * 100)), BigInt(Math.round(y * 100)), BigInt(Math.round(z * 100))],
    });

    return hash;
  } catch (error) {
    console.error('Failed to update player position:', error);
    return null;
  }
}

// Send chat message (server-side only)
export async function sendChatMessage(walletAddress: string, message: string): Promise<string | null> {
  try {
    const client = getAdminWalletClient();
    
    const hash = await client.writeContract({
      address: GAME_DATA_CONTRACT_ADDRESS as `0x${string}`,
      abi: GAME_DATA_ABI,
      functionName: 'sendChat',
      args: [walletAddress as `0x${string}`, message],
    });

    return hash;
  } catch (error) {
    console.error('Failed to send chat:', error);
    return null;
  }
}

// Log NPC interaction (server-side only)
export async function logNPCInteraction(
  walletAddress: string,
  npcId: string,
  action: string
): Promise<string | null> {
  try {
    const client = getAdminWalletClient();
    
    const hash = await client.writeContract({
      address: GAME_DATA_CONTRACT_ADDRESS as `0x${string}`,
      abi: GAME_DATA_ABI,
      functionName: 'logNPCInteraction',
      args: [walletAddress as `0x${string}`, npcId, action],
    });

    return hash;
  } catch (error) {
    console.error('Failed to log NPC interaction:', error);
    return null;
  }
}

// Get all players (for multiplayer sync)
export interface AllPlayersData {
  address: string;
  name: string;
  x: number;
  y: number;
  z: number;
  lastActive: number;
}

export async function getAllPlayers(): Promise<AllPlayersData[]> {
  try {
    const result = await megaethPublicClient.readContract({
      address: GAME_DATA_CONTRACT_ADDRESS as `0x${string}`,
      abi: GAME_DATA_ABI,
      functionName: 'getAllPlayers',
      args: [],
    });

    const [addresses, names, xs, ys, zs, lastActives] = result as [
      string[],
      string[],
      bigint[],
      bigint[],
      bigint[],
      bigint[]
    ];

    return addresses.map((address, i) => ({
      address,
      name: names[i],
      x: Number(xs[i]) / 100, // Convert back from scaled int
      y: Number(ys[i]) / 100,
      z: Number(zs[i]) / 100,
      lastActive: Number(lastActives[i]),
    }));
  } catch (error) {
    console.error('Failed to get all players:', error);
    return [];
  }
}

