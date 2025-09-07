import * as Phaser from 'phaser';
import { NPC_TYPES } from '../config';

type NPCTypeKey = keyof typeof NPC_TYPES;

export class NPC extends Phaser.Physics.Arcade.Sprite {
  private npcType: (typeof NPC_TYPES)[NPCTypeKey];
  private interactionIcon: Phaser.GameObjects.Sprite;
  private nameText: Phaser.GameObjects.Text;
  private isPlayerNear: boolean = false;
  private shadow: Phaser.GameObjects.Ellipse;

  constructor(scene: Phaser.Scene, x: number, y: number, typeKey: NPCTypeKey) {
    const npcType = NPC_TYPES[typeKey];
    super(scene, x, y, npcType.sprite);
    
    this.npcType = npcType;
    
    scene.add.existing(this);
    scene.physics.add.existing(this, true);
    
    const body = this.body as Phaser.Physics.Arcade.StaticBody;
    body.setSize(20, 16);
    body.setOffset(6, 32);
    
    this.shadow = scene.add.ellipse(x, y + 20, 26, 10, 0x000000, 0.25);
    this.shadow.setDepth(y - 1);
    
    this.nameText = scene.add.text(x, y - 32, this.npcType.name, {
      fontSize: '12px',
      fontFamily: 'Georgia, serif',
      color: '#ffffff',
      stroke: '#1a1a2e',
      strokeThickness: 3,
    }).setOrigin(0.5);
    this.nameText.setDepth(y + 100);

    this.interactionIcon = scene.add.sprite(x, y - 48, 'icon_interact');
    this.interactionIcon.setVisible(false);
    this.interactionIcon.setDepth(y + 101);
  }

  showInteractionPrompt(): void {
    if (this.isPlayerNear) return;
    this.isPlayerNear = true;
    this.interactionIcon.setVisible(true);
    
    this.scene.tweens.add({
      targets: this.interactionIcon,
      y: this.y - 56,
      duration: 500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  hideInteractionPrompt(): void {
    if (!this.isPlayerNear) return;
    this.isPlayerNear = false;
    this.scene.tweens.killTweensOf(this.interactionIcon);
    this.interactionIcon.setVisible(false);
    this.interactionIcon.y = this.y - 48;
  }

  getDialogs(): string[] {
    return [...this.npcType.dialogs];
  }

  getAction(): string {
    return this.npcType.action;
  }

  getNPCId(): string {
    return this.npcType.id;
  }

  getNPCName(): string {
    return this.npcType.name;
  }

  update(): void {
  }

  destroy(fromScene?: boolean): void {
    this.shadow?.destroy();
    this.nameText?.destroy();
    this.interactionIcon?.destroy();
    super.destroy(fromScene);
  }
}
