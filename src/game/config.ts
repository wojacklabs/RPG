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
    name: '교환 상인',
    sprite: 'npc_merchant',
    color: 'red',
    dialogs: [
      '어서오시게, 나그네.',
      '이곳에서 다양한 토큰을 교환할 수 있다네.',
      '어떤 것을 교환하고 싶은가?',
    ],
    action: 'swap',
  },
  BRIDGE_SAILOR: {
    id: 'bridge_sailor',
    name: '뱃사공',
    sprite: 'npc_sailor',
    color: 'blue',
    dialogs: [
      '험한 바다를 건너고 싶으신가?',
      '다른 대륙으로 자산을 옮길 수 있소.',
      '어느 대륙으로 가시겠소?',
    ],
    action: 'bridge',
  },
  STAKING_SAGE: {
    id: 'staking_sage',
    name: '도사',
    sprite: 'npc_sage',
    color: 'white',
    dialogs: [
      '허허, 자네도 수련을 하러 왔는가?',
      '토큰을 예치하면 시간이 흐를수록 보상이 쌓이지.',
      '장기적인 수련을 원하는가?',
    ],
    action: 'staking',
  },
  LP_GUILDMASTER: {
    id: 'lp_guildmaster',
    name: '상단장',
    sprite: 'npc_guild',
    color: 'green',
    dialogs: [
      '우리 상단에 가입할 의향이 있으신가?',
      '유동성을 제공하면 거래 수수료를 나눠 받을 수 있소.',
      '함께 부를 쌓아보시겠소?',
    ],
    action: 'liquidity',
  },
  VILLAGE_ELDER: {
    id: 'village_elder',
    name: '촌장',
    sprite: 'npc_elder',
    color: 'purple',
    dialogs: [
      '어서오게, 이곳은 DeFi 마을이라네.',
      '이 마을에서는 다양한 온체인 활동을 할 수 있지.',
      '마을을 둘러보고 상인들과 이야기해보게.',
    ],
    action: 'none',
  },
  NFT_ARTIST: {
    id: 'nft_artist',
    name: 'NFT 화가',
    sprite: 'npc_artist',
    color: 'blue',
    dialogs: [
      '환영합니다, 예술의 세계로!',
      '이곳에서는 다양한 체인의 NFT를 거래할 수 있습니다.',
      '희귀한 컬렉션을 구경해 보시겠어요?',
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
