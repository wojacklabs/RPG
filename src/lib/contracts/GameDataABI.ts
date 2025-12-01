// MegaETH Game Data Contract ABI
// This contract stores player game data on MegaETH chain

export const GAME_DATA_ABI = [
  // Events
  {
    type: 'event',
    name: 'PlayerRegistered',
    inputs: [
      { name: 'walletAddress', type: 'address', indexed: true },
      { name: 'playerName', type: 'string', indexed: false },
      { name: 'timestamp', type: 'uint256', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'PlayerMoved',
    inputs: [
      { name: 'walletAddress', type: 'address', indexed: true },
      { name: 'x', type: 'int256', indexed: false },
      { name: 'y', type: 'int256', indexed: false },
      { name: 'z', type: 'int256', indexed: false },
      { name: 'timestamp', type: 'uint256', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'ChatMessage',
    inputs: [
      { name: 'walletAddress', type: 'address', indexed: true },
      { name: 'message', type: 'string', indexed: false },
      { name: 'timestamp', type: 'uint256', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'NPCInteraction',
    inputs: [
      { name: 'walletAddress', type: 'address', indexed: true },
      { name: 'npcId', type: 'string', indexed: false },
      { name: 'action', type: 'string', indexed: false },
      { name: 'timestamp', type: 'uint256', indexed: false },
    ],
  },

  // Read functions
  {
    type: 'function',
    name: 'getPlayer',
    stateMutability: 'view',
    inputs: [{ name: 'walletAddress', type: 'address' }],
    outputs: [
      { name: 'name', type: 'string' },
      { name: 'x', type: 'int256' },
      { name: 'y', type: 'int256' },
      { name: 'z', type: 'int256' },
      { name: 'lastActive', type: 'uint256' },
      { name: 'registered', type: 'bool' },
    ],
  },
  {
    type: 'function',
    name: 'getActivePlayers',
    stateMutability: 'view',
    inputs: [{ name: 'since', type: 'uint256' }],
    outputs: [{ name: 'players', type: 'address[]' }],
  },
  {
    type: 'function',
    name: 'getRecentChats',
    stateMutability: 'view',
    inputs: [{ name: 'count', type: 'uint256' }],
    outputs: [
      { name: 'senders', type: 'address[]' },
      { name: 'messages', type: 'string[]' },
      { name: 'timestamps', type: 'uint256[]' },
    ],
  },
  {
    type: 'function',
    name: 'getAllPlayers',
    stateMutability: 'view',
    inputs: [],
    outputs: [
      { name: 'addresses', type: 'address[]' },
      { name: 'names', type: 'string[]' },
      { name: 'xs', type: 'int256[]' },
      { name: 'ys', type: 'int256[]' },
      { name: 'zs', type: 'int256[]' },
      { name: 'lastActives', type: 'uint256[]' },
    ],
  },
  {
    type: 'function',
    name: 'getPlayerCount',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },

  // Write functions (called by admin wallet)
  {
    type: 'function',
    name: 'registerPlayer',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'walletAddress', type: 'address' },
      { name: 'playerName', type: 'string' },
    ],
    outputs: [],
  },
  {
    type: 'function',
    name: 'updatePlayerPosition',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'walletAddress', type: 'address' },
      { name: 'x', type: 'int256' },
      { name: 'y', type: 'int256' },
      { name: 'z', type: 'int256' },
    ],
    outputs: [],
  },
  {
    type: 'function',
    name: 'sendChat',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'walletAddress', type: 'address' },
      { name: 'message', type: 'string' },
    ],
    outputs: [],
  },
  {
    type: 'function',
    name: 'logNPCInteraction',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'walletAddress', type: 'address' },
      { name: 'npcId', type: 'string' },
      { name: 'action', type: 'string' },
    ],
    outputs: [],
  },
] as const;

// Contract address on MegaETH Testnet (to be deployed)
export const GAME_DATA_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_GAME_CONTRACT_ADDRESS || '0x0000000000000000000000000000000000000000';

