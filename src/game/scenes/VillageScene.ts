import * as Phaser from 'phaser';
import { Player } from '../entities/Player';
import { NPC } from '../entities/NPC';
import { GAME_CONFIG, NPC_TYPES } from '../config';

type NPCTypeKey = keyof typeof NPC_TYPES;

interface MapObject {
  x: number;
  y: number;
  texture: string;
  originY?: number;
  scale?: number;
}

export class VillageScene extends Phaser.Scene {
  private player!: Player;
  private npcs: NPC[] = [];
  private nearestNPC: NPC | null = null;
  private groundLayer!: Phaser.GameObjects.Container;
  private objectLayer!: Phaser.GameObjects.Container;
  private uiLayer!: Phaser.GameObjects.Container;
  private dialogContainer!: Phaser.GameObjects.Container;
  private dialogText!: Phaser.GameObjects.Text;
  private dialogName!: Phaser.GameObjects.Text;
  private isDialogOpen: boolean = false;
  private currentDialogIndex: number = 0;
  private currentDialogs: string[] = [];
  private minimap!: Phaser.GameObjects.Graphics;
  private minimapBase!: Phaser.GameObjects.Graphics;
  private minimapConfig = { x: 0, y: 0, w: 160, h: 120 };
  private lastPlayerPos = { x: 0, y: 0 };
  private proximityCheckCounter = 0;

  constructor() {
    super({ key: 'VillageScene' });
  }

  create(): void {
    const mapW = GAME_CONFIG.MAP_WIDTH * GAME_CONFIG.TILE_SIZE;
    const mapH = GAME_CONFIG.MAP_HEIGHT * GAME_CONFIG.TILE_SIZE;
    
    this.physics.world.setBounds(0, 0, mapW, mapH);
    
    this.groundLayer = this.add.container(0, 0);
    this.objectLayer = this.add.container(0, 0);
    this.uiLayer = this.add.container(0, 0);
    
    this.createTerrain();
    this.createBuildings();
    this.createDecorations();
    this.createPlayer();
    this.createNPCs();
    this.createUI();
    this.setupCamera();
    
    this.game.events.emit('sceneReady');
  }

  private createTerrain(): void {
    const ts = GAME_CONFIG.TILE_SIZE;
    const mw = GAME_CONFIG.MAP_WIDTH;
    const mh = GAME_CONFIG.MAP_HEIGHT;

    for (let y = 0; y < mh; y++) {
      for (let x = 0; x < mw; x++) {
        const px = x * ts + ts / 2;
        const py = y * ts + ts / 2;
        
        let texture = 'grass_0';
        
        const isMainPath = (y >= 28 && y <= 31) || 
                          (x >= 38 && x <= 41 && y >= 15 && y <= 44);
        
        const isSidePath = (y >= 20 && y <= 23 && x >= 15 && x <= 64) ||
                          (y >= 36 && y <= 39 && x >= 15 && x <= 64) ||
                          (x >= 18 && x <= 21 && y >= 20 && y <= 39) ||
                          (x >= 58 && x <= 61 && y >= 20 && y <= 39);
        
        const isWater = (x <= 5 && y >= 45) || 
                       (x >= 74 && y >= 45) ||
                       (y >= 55) ||
                       (x <= 3 && y >= 40) ||
                       (x >= 76 && y >= 40);
        
        const isStone = (y <= 2) || (y >= 57);

        if (isMainPath || isSidePath) {
          texture = `path_${Phaser.Math.Between(0, 2)}`;
        } else if (isWater) {
          texture = 'water';
        } else if (isStone) {
          texture = 'stone';
        } else {
          const noise = Phaser.Math.Between(0, 10);
          if (noise < 6) texture = 'grass_0';
          else if (noise < 8) texture = 'grass_1';
          else if (noise < 9) texture = 'grass_2';
          else texture = 'grass_3';
        }

        const tile = this.add.sprite(px, py, texture);
        this.groundLayer.add(tile);
      }
    }

    for (let i = 36; i <= 43; i++) {
      const bridgeY = 50;
      if (i >= 38 && i <= 41) {
        const bridge = this.add.sprite(i * ts + ts/2, bridgeY * ts + ts/2, 'bridge');
        this.groundLayer.add(bridge);
      }
    }
  }

  private createBuildings(): void {
    const ts = GAME_CONFIG.TILE_SIZE;
    
    const buildings: MapObject[] = [
      { x: 12, y: 14, texture: 'building_house' },
      { x: 25, y: 14, texture: 'building_house' },
      { x: 55, y: 14, texture: 'building_house' },
      { x: 68, y: 14, texture: 'building_house' },
      
      { x: 12, y: 26, texture: 'building_shop' },
      { x: 68, y: 26, texture: 'building_shop' },
      
      { x: 12, y: 42, texture: 'building_house' },
      { x: 25, y: 42, texture: 'building_house' },
      { x: 55, y: 42, texture: 'building_house' },
      { x: 68, y: 42, texture: 'building_house' },
      
      { x: 40, y: 18, texture: 'building_house', scale: 1.2 },
      
      { x: 40, y: 24, texture: 'well' },
    ];

    buildings.forEach(b => {
      const sprite = this.add.sprite(b.x * ts, b.y * ts, b.texture);
      sprite.setOrigin(0.5, 0.9);
      sprite.setDepth(b.y * ts);
      if (b.scale) sprite.setScale(b.scale);
      this.objectLayer.add(sprite);
    });
  }

  private createDecorations(): void {
    const ts = GAME_CONFIG.TILE_SIZE;

    const trees: {x: number, y: number}[] = [];
    
    for (let i = 8; i < 72; i += 6) {
      if (i < 35 || i > 45) {
        trees.push({ x: i, y: 6 });
        trees.push({ x: i, y: 52 });
      }
    }
    
    for (let i = 8; i < 55; i += 5) {
      if (i < 25 || i > 35) {
        trees.push({ x: 6, y: i });
        trees.push({ x: 73, y: i });
      }
    }

    trees.push({ x: 30, y: 22 }, { x: 50, y: 22 });
    trees.push({ x: 30, y: 38 }, { x: 50, y: 38 });

    trees.forEach(t => {
      const tree = this.add.sprite(t.x * ts, t.y * ts, 'tree');
      tree.setOrigin(0.5, 0.95);
      tree.setDepth(t.y * ts + 32);
      this.objectLayer.add(tree);
    });

    const bushPositions = [
      { x: 15, y: 18 }, { x: 65, y: 18 },
      { x: 15, y: 32 }, { x: 65, y: 32 },
      { x: 35, y: 16 }, { x: 45, y: 16 },
    ];

    bushPositions.forEach(b => {
      const bush = this.add.sprite(b.x * ts, b.y * ts, 'bush');
      bush.setOrigin(0.5, 0.9);
      bush.setDepth(b.y * ts);
      this.objectLayer.add(bush);
    });

    for (let i = 0; i < 40; i++) {
      const fx = Phaser.Math.Between(8, 72) * ts;
      const fy = Phaser.Math.Between(8, 50) * ts;
      
      const onPath = (fy/ts >= 28 && fy/ts <= 31) || 
                    (fx/ts >= 38 && fx/ts <= 41);
      if (onPath) continue;
      
      const flower = this.add.sprite(fx, fy, `flower_${Phaser.Math.Between(0, 2)}`);
      flower.setOrigin(0.5, 0.9);
      flower.setDepth(fy);
      this.objectLayer.add(flower);
    }

    for (let i = 0; i < 15; i++) {
      const rx = Phaser.Math.Between(8, 72) * ts;
      const ry = Phaser.Math.Between(8, 50) * ts;
      const rock = this.add.sprite(rx, ry, 'rock');
      rock.setOrigin(0.5, 0.9);
      rock.setDepth(ry);
      this.objectLayer.add(rock);
    }

    const signPositions = [
      { x: 35, y: 29 },
      { x: 20, y: 21 },
      { x: 60, y: 21 },
    ];

    signPositions.forEach(s => {
      const sign = this.add.sprite(s.x * ts, s.y * ts, 'sign');
      sign.setOrigin(0.5, 0.9);
      sign.setDepth(s.y * ts);
      this.objectLayer.add(sign);
    });

    for (let fy = 10; fy <= 48; fy += 8) {
      const fenceL = this.add.sprite(9 * ts, fy * ts, 'fence');
      const fenceR = this.add.sprite(71 * ts, fy * ts, 'fence');
      fenceL.setDepth(fy * ts);
      fenceR.setDepth(fy * ts);
      this.objectLayer.add(fenceL);
      this.objectLayer.add(fenceR);
    }
  }

  private createPlayer(): void {
    const startX = 40 * GAME_CONFIG.TILE_SIZE;
    const startY = 30 * GAME_CONFIG.TILE_SIZE;
    
    this.player = new Player(this, startX, startY);
    this.player.setInteractCallback(() => this.handleInteraction());
  }

  private createNPCs(): void {
    const ts = GAME_CONFIG.TILE_SIZE;
    
    const npcPositions: { x: number; y: number; type: NPCTypeKey }[] = [
      { x: 20, y: 30, type: 'SWAP_MERCHANT' },
      { x: 60, y: 30, type: 'BRIDGE_SAILOR' },
      { x: 20, y: 35, type: 'STAKING_SAGE' },
      { x: 60, y: 35, type: 'LP_GUILDMASTER' },
      { x: 40, y: 22, type: 'VILLAGE_ELDER' },
      { x: 40, y: 35, type: 'NFT_ARTIST' },
    ];

    npcPositions.forEach(pos => {
      const npc = new NPC(this, pos.x * ts, pos.y * ts, pos.type);
      npc.setDepth(npc.y);
      this.npcs.push(npc);
      this.physics.add.collider(this.player, npc);
    });
  }

  private createUI(): void {
    const { width, height } = this.cameras.main;

    const dialogBg = this.add.graphics();
    dialogBg.fillStyle(0x1a1a2e, 0.95);
    dialogBg.fillRoundedRect(40, height - 160, width - 80, 140, 12);
    dialogBg.lineStyle(3, 0xe8b838, 1);
    dialogBg.strokeRoundedRect(40, height - 160, width - 80, 140, 12);
    dialogBg.setScrollFactor(0);

    this.dialogName = this.add.text(70, height - 145, '', {
      fontSize: '20px',
      fontFamily: 'Georgia, serif',
      color: '#e8b838',
    }).setScrollFactor(0);

    this.dialogText = this.add.text(70, height - 115, '', {
      fontSize: '18px',
      fontFamily: 'Georgia, serif',
      color: '#f0f0f0',
      wordWrap: { width: width - 160 },
      lineSpacing: 6,
    }).setScrollFactor(0);

    const continueHint = this.add.text(width - 80, height - 40, '[SPACE]', {
      fontSize: '14px',
      fontFamily: 'monospace',
      color: '#e8b838',
    }).setScrollFactor(0).setOrigin(1, 0.5);

    this.dialogContainer = this.add.container(0, 0, [dialogBg, this.dialogName, this.dialogText, continueHint]);
    this.dialogContainer.setDepth(10000);
    this.dialogContainer.setVisible(false);

    const topBar = this.add.graphics();
    topBar.fillStyle(0x1a1a2e, 0.9);
    topBar.fillRoundedRect(10, 10, 200, 40, 8);
    topBar.lineStyle(2, 0xe8b838, 1);
    topBar.strokeRoundedRect(10, 10, 200, 40, 8);
    topBar.setScrollFactor(0);
    topBar.setDepth(9999);

    const locationText = this.add.text(25, 22, '📍 DeFi 마을', {
      fontSize: '18px',
      fontFamily: 'Georgia, serif',
      color: '#f0f0f0',
    }).setScrollFactor(0).setDepth(9999);

    this.createMinimap();
  }

  private createMinimap(): void {
    const { width } = this.cameras.main;
    const mmW = 160, mmH = 120;
    const mmX = width - mmW - 15;
    const mmY = 15;

    this.minimapConfig = { x: mmX, y: mmY, w: mmW, h: mmH };

    const mmBg = this.add.graphics();
    mmBg.fillStyle(0x1a1a2e, 0.85);
    mmBg.fillRoundedRect(mmX - 5, mmY - 5, mmW + 10, mmH + 10, 8);
    mmBg.lineStyle(2, 0xe8b838, 1);
    mmBg.strokeRoundedRect(mmX - 5, mmY - 5, mmW + 10, mmH + 10, 8);
    mmBg.setScrollFactor(0);
    mmBg.setDepth(9998);

    this.minimapBase = this.add.graphics();
    this.minimapBase.setScrollFactor(0);
    this.minimapBase.setDepth(9999);
    this.drawMinimapBase();

    this.minimap = this.add.graphics();
    this.minimap.setScrollFactor(0);
    this.minimap.setDepth(10000);
  }

  private drawMinimapBase(): void {
    const { x: mmX, y: mmY, w: mmW, h: mmH } = this.minimapConfig;

    this.minimapBase.fillStyle(0x4a8c50, 1);
    this.minimapBase.fillRect(mmX, mmY, mmW, mmH);

    this.minimapBase.fillStyle(0xc4a070, 1);
    const pathY1 = mmY + (28/60) * mmH;
    const pathY2 = mmY + (31/60) * mmH;
    this.minimapBase.fillRect(mmX, pathY1, mmW, pathY2 - pathY1);
    
    const pathX1 = mmX + (38/80) * mmW;
    const pathX2 = mmX + (41/80) * mmW;
    this.minimapBase.fillRect(pathX1, mmY + (15/60) * mmH, pathX2 - pathX1, (29/60) * mmH);

    this.minimapBase.fillStyle(0x4080b0, 1);
    this.minimapBase.fillRect(mmX, mmY + (55/60) * mmH, mmW, (5/60) * mmH);
    this.minimapBase.fillRect(mmX, mmY + (45/60) * mmH, (5/80) * mmW, (10/60) * mmH);
    this.minimapBase.fillRect(mmX + (74/80) * mmW, mmY + (45/60) * mmH, (6/80) * mmW, (10/60) * mmH);

    this.minimapBase.fillStyle(0x8b6040, 1);
    const buildings = [[12, 14], [25, 14], [55, 14], [68, 14], [40, 18],
                       [12, 26], [68, 26], [12, 42], [25, 42], [55, 42], [68, 42]];
    buildings.forEach(([bx, by]) => {
      const x = mmX + (bx/80) * mmW;
      const y = mmY + (by/60) * mmH;
      this.minimapBase.fillRect(x - 3, y - 3, 6, 6);
    });
  }

  private updateMinimapPlayer(): void {
    const { x: mmX, y: mmY, w: mmW, h: mmH } = this.minimapConfig;
    const mapW = GAME_CONFIG.MAP_WIDTH * GAME_CONFIG.TILE_SIZE;
    const mapH = GAME_CONFIG.MAP_HEIGHT * GAME_CONFIG.TILE_SIZE;

    this.minimap.clear();

    const px = mmX + (this.player.x / mapW) * mmW;
    const py = mmY + (this.player.y / mapH) * mmH;
    
    this.minimap.fillStyle(0x50ff50, 1);
    this.minimap.fillCircle(px, py, 4);
    this.minimap.lineStyle(1, 0xffffff, 1);
    this.minimap.strokeCircle(px, py, 4);

    this.npcs.forEach(npc => {
      const nx = mmX + (npc.x / mapW) * mmW;
      const ny = mmY + (npc.y / mapH) * mmH;
      this.minimap.fillStyle(0xffff50, 1);
      this.minimap.fillCircle(nx, ny, 3);
    });
  }

  private setupCamera(): void {
    const mapW = GAME_CONFIG.MAP_WIDTH * GAME_CONFIG.TILE_SIZE;
    const mapH = GAME_CONFIG.MAP_HEIGHT * GAME_CONFIG.TILE_SIZE;
    
    this.cameras.main.setBounds(0, 0, mapW, mapH);
    this.cameras.main.startFollow(this.player, true, 0.08, 0.08);
    this.cameras.main.setZoom(1.5);
  }

  private handleInteraction(): void {
    if (this.isDialogOpen) {
      this.advanceDialog();
      return;
    }

    if (this.nearestNPC) {
      this.openDialog(this.nearestNPC);
    }
  }

  private openDialog(npc: NPC): void {
    this.isDialogOpen = true;
    this.currentDialogs = npc.getDialogs();
    this.currentDialogIndex = 0;
    this.player.stopMovement();

    this.dialogContainer.setVisible(true);
    this.dialogName.setText(`💬 ${npc.getNPCName()}`);
    this.showCurrentDialog();
  }

  private showCurrentDialog(): void {
    if (this.currentDialogs[this.currentDialogIndex]) {
      this.dialogText.setText(this.currentDialogs[this.currentDialogIndex]);
    }
  }

  private advanceDialog(): void {
    this.currentDialogIndex++;
    
    if (this.currentDialogIndex >= this.currentDialogs.length) {
      this.closeDialog();
      
      if (this.nearestNPC) {
        const action = this.nearestNPC.getAction();
        if (action !== 'none') {
          this.game.events.emit('openPanel', action);
        }
      }
    } else {
      this.showCurrentDialog();
    }
  }

  private closeDialog(): void {
    this.isDialogOpen = false;
    this.currentDialogIndex = 0;
    this.currentDialogs = [];
    this.dialogContainer.setVisible(false);
  }

  private checkNPCProximity(): void {
    let closestNPC: NPC | null = null;
    let closestDistance: number = GAME_CONFIG.INTERACTION_DISTANCE;

    for (const npc of this.npcs) {
      const distance = Phaser.Math.Distance.Between(
        this.player.x, this.player.y,
        npc.x, npc.y
      );

      if (distance < closestDistance) {
        closestDistance = distance;
        closestNPC = npc;
      }
    }

    if (closestNPC !== this.nearestNPC) {
      if (this.nearestNPC) {
        this.nearestNPC.hideInteractionPrompt();
      }
      this.nearestNPC = closestNPC;
      if (closestNPC) {
        closestNPC.showInteractionPrompt();
      }
    }
  }

  update(): void {
    if (!this.isDialogOpen) {
      this.player.update();
      this.player.setDepth(this.player.y);
    }
    
    this.proximityCheckCounter++;
    if (this.proximityCheckCounter >= 6) {
      this.proximityCheckCounter = 0;
      this.checkNPCProximity();
    }
    
    const dx = Math.abs(this.player.x - this.lastPlayerPos.x);
    const dy = Math.abs(this.player.y - this.lastPlayerPos.y);
    if (dx > 2 || dy > 2) {
      this.lastPlayerPos.x = this.player.x;
      this.lastPlayerPos.y = this.player.y;
      this.updateMinimapPlayer();
    }
  }
}
