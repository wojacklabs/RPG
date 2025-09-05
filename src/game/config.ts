import * as Phaser from 'phaser';

export const GAME_CONFIG = {
  TILE_SIZE: 32,
  MAP_WIDTH: 80,
  MAP_HEIGHT: 60,
  PLAYER_SPEED: 160,
  PLAYER_WIDTH: 32,
  PLAYER_HEIGHT: 48,
  INTERACTION_DISTANCE: 50,
  CAMERA_LERP: 0.1,
} as const;

export const DIRECTIONS = {
  DOWN: 0,
  LEFT: 1,
  RIGHT: 2,
  UP: 3,
} as const;

export const TILE_TYPES = {
  GRASS: 0,
  GRASS_DARK: 1,
  GRASS_LIGHT: 2,
  PATH: 3,
  PATH_EDGE: 4,
  WATER: 5,
  WATER_EDGE: 6,
  BRIDGE: 7,
  STONE: 8,
  FLOWER_RED: 9,
  FLOWER_YELLOW: 10,
  FLOWER_BLUE: 11,
} as const;

export const KOREAN_PALETTE = {
  grass: { base: 0x4a8c50, dark: 0x3a7040, light: 0x5a9c60, accent: 0x6ab070 },
  path: { base: 0xc4a070, dark: 0xa48050, light: 0xd4b080, edge: 0x8a6a40 },
  water: { base: 0x4080b0, dark: 0x306090, light: 0x50a0d0, shallow: 0x60b0e0 },
  wood: { base: 0x8b6040, dark: 0x6b4020, light: 0xab8060, plank: 0x9b7050 },
  stone: { base: 0x808080, dark: 0x606060, light: 0xa0a0a0 },
  roof: { base: 0xc04030, dark: 0xa02020, light: 0xe06050, tile: 0xb03828 },
  skin: { base: 0xf0d0a0, shadow: 0xd0b080 },
  clothes: {
    blue: { base: 0x4080c0, dark: 0x2060a0, light: 0x60a0e0 },
    red: { base: 0xc04040, dark: 0xa02020, light: 0xe06060 },
    green: { base: 0x40a050, dark: 0x208030, light: 0x60c070 },
    white: { base: 0xf0e8d8, dark: 0xd0c8b8, light: 0xffffff },
    purple: { base: 0x8050a0, dark: 0x603080, light: 0xa070c0 },
  },
} as const;

export const NPC_TYPES = {
  SWAP_MERCHANT: {
    id: 'swap_merchant',
    name: 'Token Merchant',
    sprite: 'npc_merchant',
    color: 'red',
    dialogs: [
      'Welcome, traveler.',
      'You can swap various tokens here.',
      'What would you like to exchange?',
    ],
    action: 'swap',
  },
  BRIDGE_SAILOR: {
    id: 'bridge_sailor',
    name: 'Bridge Sailor',
    sprite: 'npc_sailor',
    color: 'blue',
    dialogs: [
      'Want to cross the vast seas?',
      'I can help you move assets to other chains.',
      'Where would you like to go?',
    ],
    action: 'bridge',
  },
  STAKING_SAGE: {
    id: 'staking_sage',
    name: 'Staking Sage',
    sprite: 'npc_sage',
    color: 'white',
    dialogs: [
      'Ah, you seek enlightenment?',
      'Stake your tokens and watch your rewards grow.',
      'Are you ready for long-term growth?',
    ],
    action: 'staking',
  },
  LP_GUILDMASTER: {
    id: 'lp_guildmaster',
    name: 'Guild Master',
    sprite: 'npc_guild',
    color: 'green',
    dialogs: [
      'Interested in joining our guild?',
      'Provide liquidity and earn trading fees.',
      'Shall we build wealth together?',
    ],
    action: 'liquidity',
  },
  VILLAGE_ELDER: {
    id: 'village_elder',
    name: 'Village Elder',
    sprite: 'npc_elder',
    color: 'purple',
    dialogs: [
      'Welcome to DeFi Village.',
      'Many on-chain activities await you here.',
      'Explore the village and talk to the merchants.',
    ],
    action: 'none',
  },
  NFT_ARTIST: {
    id: 'nft_artist',
    name: 'NFT Artist',
    sprite: 'npc_artist',
    color: 'blue',
    dialogs: [
      'Welcome to the world of art!',
      'Browse and trade NFTs across multiple chains.',
      'Care to see some rare collections?',
    ],
    action: 'nft',
  },
} as const;

export function createPhaserConfig(
  parent: string,
  width: number,
  height: number,
  scenes: Phaser.Types.Scenes.SceneType[]
): Phaser.Types.Core.GameConfig {
  return {
    type: Phaser.AUTO,
    parent,
    width,
    height,
    pixelArt: true,
    roundPixels: true,
    antialias: false,
    backgroundColor: '#1a1a2e',
    physics: {
      default: 'arcade',
      arcade: {
        gravity: { x: 0, y: 0 },
        debug: false,
      },
    },
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    scene: scenes,
    render: {
      pixelArt: true,
      antialias: false,
    },
  };
}
