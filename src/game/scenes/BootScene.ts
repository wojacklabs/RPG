import * as Phaser from 'phaser';
import { GAME_CONFIG, KOREAN_PALETTE } from '../config';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload(): void {
    this.createLoadingUI();
    this.generateAllAssets();
  }

  private createLoadingUI(): void {
    const { width, height } = this.cameras.main;
    
    const bg = this.add.graphics();
    bg.fillStyle(0x1a1a2e, 1);
    bg.fillRect(0, 0, width, height);
    
    const progressBox = this.add.graphics();
    progressBox.fillStyle(0x2d2d44, 1);
    progressBox.fillRoundedRect(width/2 - 200, height/2 - 20, 400, 40, 8);
    
    const progressBar = this.add.graphics();
    
    const title = this.add.text(width/2, height/2 - 80, 'DeFi Village', {
      fontSize: '48px',
      fontFamily: 'Georgia, serif',
      color: '#e8b838',
    }).setOrigin(0.5);
    
    const subtitle = this.add.text(width/2, height/2 - 40, 'Loading...', {
      fontSize: '18px',
      fontFamily: 'Georgia, serif', 
      color: '#a0a0b0',
    }).setOrigin(0.5);

    this.load.on('progress', (value: number) => {
      progressBar.clear();
      progressBar.fillStyle(0xe8b838, 1);
      progressBar.fillRoundedRect(width/2 - 195, height/2 - 15, 390 * value, 30, 6);
    });
  }

  private generateAllAssets(): void {
    this.generateTileset();
    this.generatePlayerSprite();
    this.generateNPCSprites();
    this.generateBuildingSprites();
    this.generateDecorationSprites();
    this.generateUISprites();
  }

  private generateTileset(): void {
    const size = GAME_CONFIG.TILE_SIZE;
    const p = KOREAN_PALETTE;

    for (let variant = 0; variant < 4; variant++) {
      const g = this.make.graphics({ x: 0, y: 0 });
      const baseColor = variant === 0 ? p.grass.base : 
                        variant === 1 ? p.grass.dark : 
                        variant === 2 ? p.grass.light : p.grass.accent;
      g.fillStyle(baseColor, 1);
      g.fillRect(0, 0, size, size);
      
      const detailColor = variant < 2 ? p.grass.light : p.grass.dark;
      g.fillStyle(detailColor, 1);
      for (let i = 0; i < 6; i++) {
        const x = Phaser.Math.Between(2, size - 4);
        const y = Phaser.Math.Between(2, size - 4);
        g.fillRect(x, y, 2, Phaser.Math.Between(3, 6));
      }
      g.generateTexture(`grass_${variant}`, size, size);
      g.destroy();
    }

    for (let variant = 0; variant < 3; variant++) {
      const g = this.make.graphics({ x: 0, y: 0 });
      g.fillStyle(p.path.base, 1);
      g.fillRect(0, 0, size, size);
      
      g.fillStyle(p.path.dark, 1);
      for (let i = 0; i < 4; i++) {
        const x = Phaser.Math.Between(4, size - 8);
        const y = Phaser.Math.Between(4, size - 8);
        g.fillRect(x, y, Phaser.Math.Between(3, 6), Phaser.Math.Between(3, 6));
      }
      g.fillStyle(p.path.light, 1);
      for (let i = 0; i < 3; i++) {
        const x = Phaser.Math.Between(2, size - 6);
        const y = Phaser.Math.Between(2, size - 6);
        g.fillRect(x, y, Phaser.Math.Between(2, 4), Phaser.Math.Between(2, 4));
      }
      g.generateTexture(`path_${variant}`, size, size);
      g.destroy();
    }

    const waterG = this.make.graphics({ x: 0, y: 0 });
    waterG.fillStyle(p.water.base, 1);
    waterG.fillRect(0, 0, size, size);
    waterG.fillStyle(p.water.light, 0.5);
    waterG.fillRect(4, 6, size - 8, 3);
    waterG.fillRect(8, 18, size - 16, 3);
    waterG.fillRect(2, 28, size - 4, 2);
    waterG.generateTexture('water', size, size);
    waterG.destroy();

    const bridgeG = this.make.graphics({ x: 0, y: 0 });
    bridgeG.fillStyle(p.wood.base, 1);
    bridgeG.fillRect(0, 0, size, size);
    bridgeG.fillStyle(p.wood.dark, 1);
    for (let i = 0; i < size; i += 8) {
      bridgeG.fillRect(i, 0, 2, size);
    }
    bridgeG.fillStyle(p.wood.light, 1);
    bridgeG.fillRect(0, 0, size, 2);
    bridgeG.fillRect(0, size - 2, size, 2);
    bridgeG.generateTexture('bridge', size, size);
    bridgeG.destroy();

    const stoneG = this.make.graphics({ x: 0, y: 0 });
    stoneG.fillStyle(p.stone.base, 1);
    stoneG.fillRect(0, 0, size, size);
    stoneG.fillStyle(p.stone.dark, 1);
    stoneG.fillRect(0, size/2 - 1, size, 2);
    stoneG.fillRect(size/2 - 1, 0, 2, size);
    stoneG.fillStyle(p.stone.light, 1);
    stoneG.fillRect(2, 2, 4, 4);
    stoneG.fillRect(size - 8, size/2 + 4, 4, 4);
    stoneG.generateTexture('stone', size, size);
    stoneG.destroy();
  }

  private generatePlayerSprite(): void {
    const fw = 32, fh = 48;
    const g = this.make.graphics({ x: 0, y: 0 });
    const p = KOREAN_PALETTE;

    // Row order: DOWN(0), LEFT(1), RIGHT(2), UP(3)
    // DOWN = facing player (eyes visible)
    // UP = facing away (back of head)
    for (let dir = 0; dir < 4; dir++) {
      for (let frame = 0; frame < 4; frame++) {
        const x = frame * fw;
        const y = dir * fh;
        const walkOffset = Math.sin(frame * Math.PI / 2) * 2;
        const legOffset = frame % 2 === 0 ? 0 : 2;

        // Shadow
        g.fillStyle(p.skin.shadow, 1);
        g.fillEllipse(x + fw/2, y + fh - 4, 20, 8);

        // Legs
        g.fillStyle(0x3a3020, 1);
        g.fillRect(x + 10, y + 40 - walkOffset, 5, 8 + legOffset);
        g.fillRect(x + 17, y + 40 - walkOffset + legOffset, 5, 8 - legOffset);

        // Body
        g.fillStyle(p.clothes.blue.base, 1);
        g.fillRect(x + 8, y + 24 - walkOffset, 16, 18);
        g.fillStyle(p.clothes.blue.dark, 1);
        g.fillRect(x + 8, y + 24 - walkOffset, 3, 18);
        g.fillStyle(p.clothes.blue.light, 1);
        g.fillRect(x + 21, y + 24 - walkOffset, 3, 18);

        // Arms
        const armSwing = frame % 2 === 0 ? -2 : 2;
        g.fillStyle(p.skin.base, 1);
        g.fillRect(x + 4, y + 26 - walkOffset + armSwing, 4, 12);
        g.fillRect(x + 24, y + 26 - walkOffset - armSwing, 4, 12);

        // Head
        g.fillStyle(p.skin.base, 1);
        g.fillCircle(x + fw/2, y + 16 - walkOffset, 10);
        g.fillStyle(p.skin.shadow, 1);
        g.fillCircle(x + fw/2 + 3, y + 18 - walkOffset, 3);

        // Face details based on direction
        // In 2D RPG: pressing UP moves character up = shows back of head
        // pressing DOWN moves character down = shows face
        if (dir === 3) {
          // dir=3 used for DOWN animation - facing player, eyes visible
          g.fillStyle(0x202020, 1);
          g.fillCircle(x + 13, y + 14 - walkOffset, 2);
          g.fillCircle(x + 19, y + 14 - walkOffset, 2);
          g.fillStyle(0xffffff, 1);
          g.fillCircle(x + 12, y + 13 - walkOffset, 1);
          g.fillCircle(x + 18, y + 13 - walkOffset, 1);
        } else if (dir === 0) {
          // dir=0 used for UP animation - facing away, back of head
          g.fillStyle(0x202020, 1);
          g.fillRect(x + 10, y + 8 - walkOffset, 12, 8);
        } else {
          // LEFT/RIGHT - side profile
          g.fillStyle(0x202020, 1);
          const eyeX = dir === 1 ? 12 : 18;
          g.fillCircle(x + eyeX, y + 14 - walkOffset, 2);
        }

        // Hair
        g.fillStyle(0x202020, 1);
        g.fillRect(x + 8, y + 4 - walkOffset, 16, 10);
        g.fillStyle(0x303030, 1);
        g.fillRect(x + 10, y + 2 - walkOffset, 12, 6);
      }
    }

    // Generate texture and add frames manually
    g.generateTexture('player', fw * 4, fh * 4);
    g.destroy();

    // Add frames to the texture
    // Phaser sprite sheet layout: frames 0-3 = row 0 (DOWN), 4-7 = row 1 (LEFT), etc.
    const texture = this.textures.get('player');
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 4; col++) {
        const frameIndex = row * 4 + col;
        texture.add(frameIndex, 0, col * fw, row * fh, fw, fh);
      }
    }
  }

  private generateNPCSprites(): void {
    const fw = 32, fh = 48;
    const p = KOREAN_PALETTE;
    
    const npcConfigs = [
      { key: 'npc_merchant', clothes: p.clothes.red, hat: 0x8b4513 },
      { key: 'npc_sailor', clothes: p.clothes.blue, hat: 0x1a3a5a },
      { key: 'npc_sage', clothes: p.clothes.white, hat: 0x4a3048 },
      { key: 'npc_guild', clothes: p.clothes.green, hat: 0x2a5a3a },
      { key: 'npc_elder', clothes: p.clothes.purple, hat: 0x3a2048 },
      { key: 'npc_artist', clothes: { base: 0xff6b9d, dark: 0xc44d7a, light: 0xff8fb8 }, hat: 0xffd700 },
    ];

    npcConfigs.forEach(config => {
      const g = this.make.graphics({ x: 0, y: 0 });

      g.fillStyle(p.skin.shadow, 1);
      g.fillEllipse(fw/2, fh - 4, 22, 10);

      g.fillStyle(0x3a3020, 1);
      g.fillRect(10, 40, 5, 8);
      g.fillRect(17, 40, 5, 8);

      g.fillStyle(config.clothes.base, 1);
      g.fillRect(8, 24, 16, 18);
      g.fillStyle(config.clothes.dark, 1);
      g.fillRect(8, 24, 3, 18);
      g.fillStyle(config.clothes.light, 1);
      g.fillRect(21, 24, 3, 18);

      g.fillStyle(p.skin.base, 1);
      g.fillRect(4, 26, 4, 10);
      g.fillRect(24, 26, 4, 10);

      g.fillStyle(p.skin.base, 1);
      g.fillCircle(fw/2, 16, 10);

      g.fillStyle(0x202020, 1);
      g.fillCircle(13, 14, 2);
      g.fillCircle(19, 14, 2);
      g.fillStyle(0xffffff, 1);
      g.fillCircle(12, 13, 1);
      g.fillCircle(18, 13, 1);

      g.fillStyle(config.hat, 1);
      g.fillRect(6, 2, 20, 12);
      g.fillStyle(Phaser.Display.Color.ValueToColor(config.hat).lighten(20).color, 1);
      g.fillRect(10, 0, 12, 8);

      g.generateTexture(config.key, fw, fh);
      g.destroy();
    });
  }

  private generateBuildingSprites(): void {
    const p = KOREAN_PALETTE;

    const houseG = this.make.graphics({ x: 0, y: 0 });
    const hw = 96, hh = 80;
    
    houseG.fillStyle(p.wood.base, 1);
    houseG.fillRect(8, 32, 80, 48);
    houseG.fillStyle(p.wood.dark, 1);
    houseG.fillRect(8, 32, 4, 48);
    houseG.fillRect(84, 32, 4, 48);
    houseG.fillStyle(p.wood.light, 1);
    for (let i = 0; i < 80; i += 16) {
      houseG.fillRect(10 + i, 34, 2, 44);
    }

    houseG.fillStyle(p.roof.base, 1);
    houseG.beginPath();
    houseG.moveTo(hw/2, 4);
    houseG.lineTo(0, 36);
    houseG.lineTo(hw, 36);
    houseG.closePath();
    houseG.fillPath();
    
    houseG.fillStyle(p.roof.dark, 1);
    houseG.beginPath();
    houseG.moveTo(hw/2, 4);
    houseG.lineTo(0, 36);
    houseG.lineTo(hw/2, 28);
    houseG.closePath();
    houseG.fillPath();

    houseG.fillStyle(p.roof.tile, 1);
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 8 - row; col++) {
        const rx = 8 + row * 6 + col * 10;
        const ry = 12 + row * 6;
        houseG.fillRect(rx, ry, 8, 4);
      }
    }

    houseG.fillStyle(0x4a3020, 1);
    houseG.fillRect(40, 52, 16, 28);
    houseG.fillStyle(0x3a2010, 1);
    houseG.fillRect(47, 52, 2, 28);

    houseG.fillStyle(0x87ceeb, 1);
    houseG.fillRect(16, 44, 14, 14);
    houseG.fillRect(66, 44, 14, 14);
    houseG.fillStyle(p.wood.dark, 1);
    houseG.fillRect(22, 44, 2, 14);
    houseG.fillRect(16, 50, 14, 2);
    houseG.fillRect(72, 44, 2, 14);
    houseG.fillRect(66, 50, 14, 2);

    houseG.generateTexture('building_house', hw, hh);
    houseG.destroy();

    const shopG = this.make.graphics({ x: 0, y: 0 });
    const sw = 80, sh = 72;
    
    shopG.fillStyle(p.wood.base, 1);
    shopG.fillRect(4, 28, 72, 44);
    
    shopG.fillStyle(0xc04040, 1);
    shopG.fillRect(0, 20, 80, 12);
    shopG.fillStyle(0xe8b838, 1);
    shopG.fillRect(4, 22, 72, 2);

    shopG.fillStyle(p.roof.base, 1);
    shopG.beginPath();
    shopG.moveTo(sw/2, 0);
    shopG.lineTo(0, 24);
    shopG.lineTo(sw, 24);
    shopG.closePath();
    shopG.fillPath();

    shopG.fillStyle(0x87ceeb, 1);
    shopG.fillRect(8, 36, 24, 20);
    shopG.fillRect(48, 36, 24, 20);
    
    shopG.fillStyle(0x4a3020, 1);
    shopG.fillRect(36, 44, 8, 28);

    shopG.generateTexture('building_shop', sw, sh);
    shopG.destroy();

    const wellG = this.make.graphics({ x: 0, y: 0 });
    
    wellG.fillStyle(p.stone.base, 1);
    wellG.fillRect(4, 20, 40, 20);
    wellG.fillStyle(p.stone.dark, 1);
    wellG.fillRect(4, 20, 40, 4);
    wellG.fillStyle(p.stone.light, 1);
    wellG.fillRect(8, 36, 32, 4);

    wellG.fillStyle(p.water.base, 1);
    wellG.fillEllipse(24, 28, 28, 12);
    wellG.fillStyle(p.water.light, 1);
    wellG.fillEllipse(20, 26, 8, 4);

    wellG.fillStyle(p.wood.base, 1);
    wellG.fillRect(8, 4, 4, 20);
    wellG.fillRect(36, 4, 4, 20);
    wellG.fillRect(6, 0, 36, 6);
    
    wellG.fillStyle(p.wood.dark, 1);
    wellG.fillRect(20, 2, 8, 4);

    wellG.generateTexture('well', 48, 44);
    wellG.destroy();
  }

  private generateDecorationSprites(): void {
    const p = KOREAN_PALETTE;

    const treeG = this.make.graphics({ x: 0, y: 0 });
    
    treeG.fillStyle(p.skin.shadow, 1);
    treeG.fillEllipse(24, 92, 24, 8);

    treeG.fillStyle(p.wood.base, 1);
    treeG.fillRect(20, 56, 8, 40);
    treeG.fillStyle(p.wood.dark, 1);
    treeG.fillRect(20, 56, 2, 40);
    treeG.fillStyle(p.wood.light, 1);
    treeG.fillRect(26, 56, 2, 40);

    treeG.fillStyle(p.grass.dark, 1);
    treeG.fillCircle(24, 40, 22);
    treeG.fillCircle(14, 48, 16);
    treeG.fillCircle(34, 48, 16);
    
    treeG.fillStyle(p.grass.base, 1);
    treeG.fillCircle(24, 36, 18);
    treeG.fillCircle(16, 44, 12);
    treeG.fillCircle(32, 44, 12);
    
    treeG.fillStyle(p.grass.light, 1);
    treeG.fillCircle(24, 28, 12);
    treeG.fillCircle(18, 38, 8);
    treeG.fillCircle(30, 38, 8);
    
    treeG.fillStyle(p.grass.accent, 1);
    treeG.fillCircle(24, 22, 8);
    treeG.fillCircle(20, 32, 4);
    treeG.fillCircle(28, 32, 4);

    treeG.generateTexture('tree', 48, 96);
    treeG.destroy();

    const bushG = this.make.graphics({ x: 0, y: 0 });
    bushG.fillStyle(p.skin.shadow, 1);
    bushG.fillEllipse(16, 30, 20, 6);
    bushG.fillStyle(p.grass.dark, 1);
    bushG.fillCircle(16, 20, 14);
    bushG.fillCircle(8, 24, 10);
    bushG.fillCircle(24, 24, 10);
    bushG.fillStyle(p.grass.base, 1);
    bushG.fillCircle(16, 16, 10);
    bushG.fillCircle(10, 20, 8);
    bushG.fillCircle(22, 20, 8);
    bushG.fillStyle(p.grass.light, 1);
    bushG.fillCircle(16, 12, 6);
    bushG.generateTexture('bush', 32, 32);
    bushG.destroy();

    const flowerColors = [0xe04040, 0xe8b838, 0x4080e0];
    flowerColors.forEach((color, i) => {
      const flowerG = this.make.graphics({ x: 0, y: 0 });
      flowerG.fillStyle(p.grass.base, 1);
      flowerG.fillRect(6, 12, 4, 12);
      flowerG.fillStyle(color, 1);
      flowerG.fillCircle(8, 8, 6);
      flowerG.fillStyle(0xffff80, 1);
      flowerG.fillCircle(8, 8, 2);
      flowerG.generateTexture(`flower_${i}`, 16, 24);
      flowerG.destroy();
    });

    const rockG = this.make.graphics({ x: 0, y: 0 });
    rockG.fillStyle(p.stone.dark, 1);
    rockG.fillEllipse(12, 14, 20, 12);
    rockG.fillStyle(p.stone.base, 1);
    rockG.fillEllipse(12, 12, 18, 10);
    rockG.fillStyle(p.stone.light, 1);
    rockG.fillEllipse(10, 10, 6, 4);
    rockG.generateTexture('rock', 24, 20);
    rockG.destroy();

    const signG = this.make.graphics({ x: 0, y: 0 });
    signG.fillStyle(p.wood.base, 1);
    signG.fillRect(12, 24, 8, 20);
    signG.fillRect(2, 4, 28, 22);
    signG.fillStyle(p.wood.dark, 1);
    signG.fillRect(2, 4, 2, 22);
    signG.fillStyle(p.wood.light, 1);
    signG.fillRect(28, 4, 2, 22);
    signG.fillStyle(0x202020, 1);
    signG.fillRect(6, 10, 20, 3);
    signG.fillRect(6, 16, 14, 3);
    signG.generateTexture('sign', 32, 44);
    signG.destroy();

    const fenceG = this.make.graphics({ x: 0, y: 0 });
    fenceG.fillStyle(p.wood.base, 1);
    fenceG.fillRect(0, 8, 32, 4);
    fenceG.fillRect(0, 18, 32, 4);
    fenceG.fillRect(2, 4, 4, 20);
    fenceG.fillRect(14, 4, 4, 20);
    fenceG.fillRect(26, 4, 4, 20);
    fenceG.fillStyle(p.wood.dark, 1);
    fenceG.fillRect(2, 4, 1, 20);
    fenceG.fillRect(14, 4, 1, 20);
    fenceG.fillRect(26, 4, 1, 20);
    fenceG.generateTexture('fence', 32, 28);
    fenceG.destroy();
  }

  private generateUISprites(): void {
    const interactG = this.make.graphics({ x: 0, y: 0 });
    interactG.fillStyle(0xe8b838, 1);
    interactG.fillCircle(12, 12, 10);
    interactG.fillStyle(0x1a1a2e, 1);
    interactG.fillRect(10, 5, 4, 9);
    interactG.fillRect(10, 16, 4, 3);
    interactG.generateTexture('icon_interact', 24, 24);
    interactG.destroy();

    const arrowG = this.make.graphics({ x: 0, y: 0 });
    arrowG.fillStyle(0xe8b838, 1);
    arrowG.beginPath();
    arrowG.moveTo(8, 0);
    arrowG.lineTo(16, 12);
    arrowG.lineTo(0, 12);
    arrowG.closePath();
    arrowG.fillPath();
    arrowG.generateTexture('arrow_down', 16, 12);
    arrowG.destroy();
  }

  create(): void {
    this.scene.start('VillageScene');
  }
}
