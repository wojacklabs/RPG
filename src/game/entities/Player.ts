import * as Phaser from 'phaser';
import { GAME_CONFIG, DIRECTIONS } from '../config';

export class Player extends Phaser.Physics.Arcade.Sprite {
  private cursors: Phaser.Types.Input.Keyboard.CursorKeys | null = null;
  private wasdKeys: { W: Phaser.Input.Keyboard.Key; A: Phaser.Input.Keyboard.Key; S: Phaser.Input.Keyboard.Key; D: Phaser.Input.Keyboard.Key } | null = null;
  private currentDirection: number = DIRECTIONS.DOWN;
  private isMoving: boolean = false;
  private interactKey: Phaser.Input.Keyboard.Key | null = null;
  private onInteract?: () => void;
  private shadow: Phaser.GameObjects.Ellipse;
  private readonly FRICTION = 600;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'player');
    
    scene.add.existing(this);
    scene.physics.add.existing(this);
    
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setCollideWorldBounds(true);
    body.setSize(16, 12);
    body.setOffset(8, 36);
    body.setMaxVelocity(GAME_CONFIG.PLAYER_SPEED, GAME_CONFIG.PLAYER_SPEED);
    body.setDrag(this.FRICTION, this.FRICTION);
    
    this.shadow = scene.add.ellipse(x, y + 20, 24, 10, 0x000000, 0.3);
    this.shadow.setDepth(this.y - 1);
    
    this.setupInput();
    this.createAnimations();
    this.play('idle_down');
  }

  private setupInput(): void {
    const keyboard = this.scene.input.keyboard;
    if (!keyboard) return;
    
    this.cursors = keyboard.createCursorKeys();
    this.wasdKeys = {
      W: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      A: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      S: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      D: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
    };
    
    this.interactKey = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.interactKey.on('down', () => {
      if (this.onInteract) this.onInteract();
    });
  }

  private createAnimations(): void {
    // Spritesheet layout: row0=UP(back), row1=LEFT, row2=RIGHT, row3=DOWN(face)
    // Map direction names to correct rows
    const dirToRow: Record<string, number> = {
      'down': 3,  // row 3 = facing player (eyes visible)
      'left': 1,  // row 1
      'right': 2, // row 2
      'up': 0,    // row 0 = facing away (back of head)
    };
    
    Object.entries(dirToRow).forEach(([dir, row]) => {
      const startFrame = row * 4;
      
      if (!this.scene.anims.exists(`walk_${dir}`)) {
        // Create frames array manually for compatibility
        const frames = [
          { key: 'player', frame: startFrame },
          { key: 'player', frame: startFrame + 1 },
          { key: 'player', frame: startFrame + 2 },
          { key: 'player', frame: startFrame + 3 },
        ];
        
        this.scene.anims.create({
          key: `walk_${dir}`,
          frames: frames,
          frameRate: 10,
          repeat: -1,
        });
      }
      
      if (!this.scene.anims.exists(`idle_${dir}`)) {
        this.scene.anims.create({
          key: `idle_${dir}`,
          frames: [{ key: 'player', frame: startFrame }],
          frameRate: 1,
        });
      }
    });
  }

  setInteractCallback(callback: () => void): void {
    this.onInteract = callback;
  }

  update(): void {
    if (!this.cursors || !this.wasdKeys) return;

    const body = this.body as Phaser.Physics.Arcade.Body;
    
    const up = this.cursors.up.isDown || this.wasdKeys.W.isDown;
    const down = this.cursors.down.isDown || this.wasdKeys.S.isDown;
    const left = this.cursors.left.isDown || this.wasdKeys.A.isDown;
    const right = this.cursors.right.isDown || this.wasdKeys.D.isDown;

    let vx = 0;
    let vy = 0;

    if (left) vx = -1;
    else if (right) vx = 1;
    
    if (up) vy = -1;
    else if (down) vy = 1;

    if (vx !== 0 && vy !== 0) {
      vx *= 0.707;
      vy *= 0.707;
    }

    const speed = GAME_CONFIG.PLAYER_SPEED;
    
    if (vx !== 0 || vy !== 0) {
      body.setVelocity(vx * speed, vy * speed);
      
      // vy < 0 = moving up on screen = character facing away (UP direction)
      // vy > 0 = moving down on screen = character facing player (DOWN direction)
      if (vy < 0) this.currentDirection = DIRECTIONS.UP;
      else if (vy > 0) this.currentDirection = DIRECTIONS.DOWN;
      else if (vx < 0) this.currentDirection = DIRECTIONS.LEFT;
      else if (vx > 0) this.currentDirection = DIRECTIONS.RIGHT;
      
      const dirName = this.getDirectionName();
      const animKey = `walk_${dirName}`;
      if (this.anims.currentAnim?.key !== animKey) {
        this.play(animKey, true);
      }
      this.isMoving = true;
      
      this.shadow.setPosition(this.x, this.y + 20);
      this.shadow.setDepth(this.y - 1);
    } else {
      body.setVelocity(0, 0);
      
      if (this.isMoving) {
        const dirName = this.getDirectionName();
        this.play(`idle_${dirName}`, true);
        this.isMoving = false;
      }
    }
  }

  private getDirectionName(): string {
    switch (this.currentDirection) {
      case DIRECTIONS.UP: return 'up';
      case DIRECTIONS.LEFT: return 'left';
      case DIRECTIONS.RIGHT: return 'right';
      default: return 'down';
    }
  }

  stopMovement(): void {
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setVelocity(0, 0);
    this.isMoving = false;
    this.play(`idle_${this.getDirectionName()}`, true);
  }

  destroy(fromScene?: boolean): void {
    if (this.shadow) this.shadow.destroy();
    super.destroy(fromScene);
  }
}
