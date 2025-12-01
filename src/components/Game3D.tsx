'use client';

import { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore, OtherPlayer } from '@/stores/gameStore';
import { useMultiplayer } from '@/hooks/useMultiplayer';

const WORLD_SIZE = 120;

// Korean Traditional Roof (기와지붕)
function KoreanRoof({ width, depth, color = '#2a2a2a' }: { width: number; depth: number; color?: string }) {
  return (
    <group>
      {/* Main roof layers */}
      <mesh position={[0, 0, 0]} castShadow>
        <boxGeometry args={[width + 1.5, 0.3, depth + 1.5]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <mesh position={[0, 0.25, 0]} castShadow>
        <boxGeometry args={[width + 1, 0.25, depth + 1]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <mesh position={[0, 0.45, 0]} castShadow>
        <boxGeometry args={[width + 0.5, 0.2, depth + 0.5]} />
        <meshStandardMaterial color={color} />
      </mesh>
      {/* Roof edges curved up effect */}
      <mesh position={[(width + 1.5) / 2, -0.1, 0]} rotation={[0, 0, 0.2]} castShadow>
        <boxGeometry args={[0.4, 0.2, depth + 1.5]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <mesh position={[-(width + 1.5) / 2, -0.1, 0]} rotation={[0, 0, -0.2]} castShadow>
        <boxGeometry args={[0.4, 0.2, depth + 1.5]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <mesh position={[0, -0.1, (depth + 1.5) / 2]} rotation={[0.2, 0, 0]} castShadow>
        <boxGeometry args={[width + 1.5, 0.2, 0.4]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <mesh position={[0, -0.1, -(depth + 1.5) / 2]} rotation={[-0.2, 0, 0]} castShadow>
        <boxGeometry args={[width + 1.5, 0.2, 0.4]} />
        <meshStandardMaterial color={color} />
      </mesh>
    </group>
  );
}

// Korean Traditional Building (한옥 스타일 건물)
function KoreanBuilding({ 
  position, 
  size = [6, 4, 5],
  roofColor = '#3a2a1a',
  wallColor = '#f5e6c8',
  name,
  icon
}: { 
  position: [number, number, number]; 
  size?: [number, number, number];
  roofColor?: string;
  wallColor?: string;
  name: string;
  icon: string;
}) {
  const [width, height, depth] = size;
  
  return (
    <group position={position}>
      {/* Foundation */}
      <mesh position={[0, 0.15, 0]} castShadow receiveShadow>
        <boxGeometry args={[width + 0.5, 0.3, depth + 0.5]} />
        <meshStandardMaterial color="#808080" />
      </mesh>
      
      {/* Floor platform */}
      <mesh position={[0, 0.4, 0]} castShadow>
        <boxGeometry args={[width + 0.3, 0.2, depth + 0.3]} />
        <meshStandardMaterial color="#c4a060" />
      </mesh>
      
      {/* Main wall structure */}
      <mesh position={[0, height / 2 + 0.5, 0]} castShadow>
        <boxGeometry args={[width, height, depth]} />
        <meshStandardMaterial color={wallColor} />
      </mesh>
      
      {/* Door frame */}
      <mesh position={[0, 1.5, depth / 2 + 0.01]} castShadow>
        <boxGeometry args={[1.8, 2.5, 0.15]} />
        <meshStandardMaterial color="#4a3020" />
      </mesh>
      
      {/* Door opening (dark) */}
      <mesh position={[0, 1.3, depth / 2 + 0.02]}>
        <boxGeometry args={[1.4, 2.1, 0.1]} />
        <meshStandardMaterial color="#1a1008" />
      </mesh>
      
      {/* Window left */}
      <mesh position={[-width / 2 + 0.8, height / 2 + 0.5, depth / 2 + 0.01]}>
        <boxGeometry args={[1, 1.2, 0.1]} />
        <meshStandardMaterial color="#d4c4a0" />
      </mesh>
      
      {/* Window right */}
      <mesh position={[width / 2 - 0.8, height / 2 + 0.5, depth / 2 + 0.01]}>
        <boxGeometry args={[1, 1.2, 0.1]} />
        <meshStandardMaterial color="#d4c4a0" />
      </mesh>
      
      {/* Wooden pillars at corners */}
      {[[-width / 2, depth / 2], [width / 2, depth / 2], [-width / 2, -depth / 2], [width / 2, -depth / 2]].map((pos, i) => (
        <mesh key={i} position={[pos[0], height / 2 + 0.5, pos[1]]} castShadow>
          <boxGeometry args={[0.35, height + 0.3, 0.35]} />
          <meshStandardMaterial color="#5a4030" />
        </mesh>
      ))}
      
      {/* Roof structure */}
      <group position={[0, height + 0.8, 0]}>
        <KoreanRoof width={width} depth={depth} color={roofColor} />
      </group>
      
      {/* Sign board */}
      <mesh position={[0, height + 0.3, depth / 2 + 0.3]}>
        <boxGeometry args={[2.5, 0.6, 0.15]} />
        <meshStandardMaterial color="#3a2a1a" />
      </mesh>
      
      {/* Shop lanterns */}
      <pointLight position={[-width / 2 - 0.5, 2, depth / 2 + 0.5]} color="#ffaa50" intensity={3} distance={8} />
      <pointLight position={[width / 2 + 0.5, 2, depth / 2 + 0.5]} color="#ffaa50" intensity={3} distance={8} />
      
      {/* Lantern meshes */}
      {[-1, 1].map((side) => (
        <group key={side} position={[side * (width / 2 + 0.3), 2.5, depth / 2 + 0.3]}>
          <mesh castShadow>
            <boxGeometry args={[0.5, 0.8, 0.5]} />
            <meshStandardMaterial color="#ff6030" emissive="#ff4020" emissiveIntensity={0.5} />
          </mesh>
          <mesh position={[0, 0.5, 0]}>
            <boxGeometry args={[0.15, 0.3, 0.15]} />
            <meshStandardMaterial color="#3a2a1a" />
          </mesh>
        </group>
      ))}
    </group>
  );
}

// NPC Character with Korean traditional clothing style
function NPCCharacter({ 
  position, 
  color, 
  name, 
  isNearby,
  onClick
}: { 
  position: [number, number, number]; 
  color: string; 
  name: string;
  isNearby: boolean;
  onClick: () => void;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);

  useFrame((state) => {
    if (groupRef.current) {
      // Subtle idle animation
      groupRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 1.5) * 0.05;
    }
  });

  return (
    <group 
      ref={groupRef} 
      position={position}
      onClick={onClick}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      {/* Feet */}
      <mesh position={[-0.15, 0.1, 0]} castShadow>
        <boxGeometry args={[0.25, 0.2, 0.35]} />
        <meshStandardMaterial color="#2a2a2a" />
      </mesh>
      <mesh position={[0.15, 0.1, 0]} castShadow>
        <boxGeometry args={[0.25, 0.2, 0.35]} />
        <meshStandardMaterial color="#2a2a2a" />
      </mesh>
      
      {/* Legs (Hanbok pants) */}
      <mesh position={[-0.15, 0.5, 0]} castShadow>
        <boxGeometry args={[0.35, 0.7, 0.35]} />
        <meshStandardMaterial color="#f0f0f0" />
      </mesh>
      <mesh position={[0.15, 0.5, 0]} castShadow>
        <boxGeometry args={[0.35, 0.7, 0.35]} />
        <meshStandardMaterial color="#f0f0f0" />
      </mesh>
      
      {/* Body (Jeogori - Korean traditional top) */}
      <mesh position={[0, 1.2, 0]} castShadow>
        <boxGeometry args={[0.9, 1, 0.5]} />
        <meshStandardMaterial color={color} />
      </mesh>
      
      {/* Belt */}
      <mesh position={[0, 0.85, 0]} castShadow>
        <boxGeometry args={[0.95, 0.15, 0.55]} />
        <meshStandardMaterial color="#8a6040" />
      </mesh>
      
      {/* Arms */}
      <mesh position={[-0.55, 1.2, 0]} castShadow>
        <boxGeometry args={[0.3, 0.8, 0.3]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <mesh position={[0.55, 1.2, 0]} castShadow>
        <boxGeometry args={[0.3, 0.8, 0.3]} />
        <meshStandardMaterial color={color} />
      </mesh>
      
      {/* Hands */}
      <mesh position={[-0.55, 0.7, 0]} castShadow>
        <boxGeometry args={[0.22, 0.25, 0.22]} />
        <meshStandardMaterial color="#e8c8a0" />
      </mesh>
      <mesh position={[0.55, 0.7, 0]} castShadow>
        <boxGeometry args={[0.22, 0.25, 0.22]} />
        <meshStandardMaterial color="#e8c8a0" />
      </mesh>
      
      {/* Head */}
      <mesh position={[0, 1.95, 0]} castShadow>
        <boxGeometry args={[0.55, 0.55, 0.5]} />
        <meshStandardMaterial color="#e8c8a0" />
      </mesh>
      
      {/* Gat (Korean traditional hat) */}
      <mesh position={[0, 2.35, 0]} castShadow>
        <cylinderGeometry args={[0.5, 0.5, 0.15, 8]} />
        <meshStandardMaterial color="#1a1a1a" />
      </mesh>
      <mesh position={[0, 2.5, 0]} castShadow>
        <cylinderGeometry args={[0.25, 0.28, 0.3, 8]} />
        <meshStandardMaterial color="#1a1a1a" />
      </mesh>
      
      {/* Eyes */}
      <mesh position={[-0.12, 2, 0.26]}>
        <boxGeometry args={[0.08, 0.08, 0.02]} />
        <meshStandardMaterial color="#1a1a1a" />
      </mesh>
      <mesh position={[0.12, 2, 0.26]}>
        <boxGeometry args={[0.08, 0.08, 0.02]} />
        <meshStandardMaterial color="#1a1a1a" />
      </mesh>
      
      {/* Interaction indicator */}
      {(isNearby || hovered) && (
        <group position={[0, 3.2, 0]}>
          {/* Speech bubble */}
          <mesh>
            <boxGeometry args={[0.5, 0.4, 0.1]} />
            <meshStandardMaterial color="#ffffff" />
          </mesh>
          <mesh position={[0, -0.3, 0]}>
            <boxGeometry args={[0.15, 0.2, 0.1]} />
            <meshStandardMaterial color="#ffffff" />
          </mesh>
          {/* Exclamation mark */}
          <mesh position={[0, 0.05, 0.06]}>
            <boxGeometry args={[0.08, 0.2, 0.02]} />
            <meshStandardMaterial color="#ffcc00" />
          </mesh>
          <mesh position={[0, -0.12, 0.06]}>
            <boxGeometry args={[0.08, 0.08, 0.02]} />
            <meshStandardMaterial color="#ffcc00" />
          </mesh>
        </group>
      )}
      
      {/* NPC light */}
      <pointLight position={[0, 2, 1]} color={color} intensity={2} distance={5} />
    </group>
  );
}

// Other Player Character (multiplayer)
function OtherPlayerCharacter({ 
  position, 
  name,
  color = '#a05050'
}: { 
  position: [number, number, number]; 
  name: string;
  color?: string;
}) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 1.2) * 0.03;
    }
  });

  return (
    <group ref={groupRef} position={position}>
      {/* Shadow */}
      <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.4, 16]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.2} />
      </mesh>
      
      {/* Feet */}
      <mesh position={[-0.12, 0.1, 0]} castShadow>
        <boxGeometry args={[0.2, 0.18, 0.28]} />
        <meshStandardMaterial color="#2a2020" />
      </mesh>
      <mesh position={[0.12, 0.1, 0]} castShadow>
        <boxGeometry args={[0.2, 0.18, 0.28]} />
        <meshStandardMaterial color="#2a2020" />
      </mesh>
      
      {/* Legs */}
      <mesh position={[-0.12, 0.45, 0]} castShadow>
        <boxGeometry args={[0.28, 0.55, 0.28]} />
        <meshStandardMaterial color="#505050" />
      </mesh>
      <mesh position={[0.12, 0.45, 0]} castShadow>
        <boxGeometry args={[0.28, 0.55, 0.28]} />
        <meshStandardMaterial color="#505050" />
      </mesh>
      
      {/* Body */}
      <mesh position={[0, 1.05, 0]} castShadow>
        <boxGeometry args={[0.75, 0.8, 0.4]} />
        <meshStandardMaterial color={color} />
      </mesh>
      
      {/* Arms */}
      <mesh position={[-0.45, 1, 0]} castShadow>
        <boxGeometry args={[0.22, 0.6, 0.22]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <mesh position={[0.45, 1, 0]} castShadow>
        <boxGeometry args={[0.22, 0.6, 0.22]} />
        <meshStandardMaterial color={color} />
      </mesh>
      
      {/* Head */}
      <mesh position={[0, 1.7, 0]} castShadow>
        <boxGeometry args={[0.45, 0.45, 0.4]} />
        <meshStandardMaterial color="#e8c8a0" />
      </mesh>
      
      {/* Hair */}
      <mesh position={[0, 1.92, -0.03]} castShadow>
        <boxGeometry args={[0.48, 0.25, 0.44]} />
        <meshStandardMaterial color="#3a2a20" />
      </mesh>
      
      {/* Eyes */}
      <mesh position={[-0.08, 1.72, 0.21]}>
        <boxGeometry args={[0.06, 0.05, 0.02]} />
        <meshStandardMaterial color="#1a1a1a" />
      </mesh>
      <mesh position={[0.08, 1.72, 0.21]}>
        <boxGeometry args={[0.06, 0.05, 0.02]} />
        <meshStandardMaterial color="#1a1a1a" />
      </mesh>
      
      {/* Name tag above head */}
      <group position={[0, 2.3, 0]}>
        <mesh>
          <boxGeometry args={[1.2, 0.3, 0.05]} />
          <meshStandardMaterial color="#1a1a2e" transparent opacity={0.8} />
        </mesh>
      </group>
    </group>
  );
}

// Player Character
function Player({ position, direction }: { position: [number, number, number]; direction: number }) {
  const groupRef = useRef<THREE.Group>(null);
  const [walkPhase, setWalkPhase] = useState(0);
  const lastPos = useRef(position);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = -direction + Math.PI;
      
      // Check if moving
      const isMoving = lastPos.current[0] !== position[0] || lastPos.current[2] !== position[2];
      if (isMoving) {
        setWalkPhase(Math.sin(state.clock.elapsedTime * 12) * 0.2);
      } else {
        setWalkPhase(0);
      }
      lastPos.current = position;
    }
  });

  return (
    <group ref={groupRef} position={position}>
      {/* Shadow */}
      <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.5, 16]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.3} />
      </mesh>
      
      {/* Feet */}
      <mesh position={[-0.15, 0.12 + Math.max(0, walkPhase), 0]} castShadow>
        <boxGeometry args={[0.22, 0.2, 0.32]} />
        <meshStandardMaterial color="#3a3020" />
      </mesh>
      <mesh position={[0.15, 0.12 + Math.max(0, -walkPhase), 0]} castShadow>
        <boxGeometry args={[0.22, 0.2, 0.32]} />
        <meshStandardMaterial color="#3a3020" />
      </mesh>
      
      {/* Legs */}
      <mesh position={[-0.15, 0.5, 0]} castShadow>
        <boxGeometry args={[0.3, 0.6, 0.3]} />
        <meshStandardMaterial color="#4080b0" />
      </mesh>
      <mesh position={[0.15, 0.5, 0]} castShadow>
        <boxGeometry args={[0.3, 0.6, 0.3]} />
        <meshStandardMaterial color="#4080b0" />
      </mesh>
      
      {/* Body */}
      <mesh position={[0, 1.15, 0]} castShadow>
        <boxGeometry args={[0.85, 0.9, 0.45]} />
        <meshStandardMaterial color="#3070a0" />
      </mesh>
      
      {/* Belt */}
      <mesh position={[0, 0.85, 0]} castShadow>
        <boxGeometry args={[0.9, 0.12, 0.5]} />
        <meshStandardMaterial color="#c09040" />
      </mesh>
      
      {/* Arms */}
      <mesh position={[-0.52, 1.1 + walkPhase * 0.5, 0]} castShadow>
        <boxGeometry args={[0.25, 0.7, 0.25]} />
        <meshStandardMaterial color="#3070a0" />
      </mesh>
      <mesh position={[0.52, 1.1 - walkPhase * 0.5, 0]} castShadow>
        <boxGeometry args={[0.25, 0.7, 0.25]} />
        <meshStandardMaterial color="#3070a0" />
      </mesh>
      
      {/* Hands */}
      <mesh position={[-0.52, 0.65, 0]} castShadow>
        <boxGeometry args={[0.2, 0.22, 0.2]} />
        <meshStandardMaterial color="#e8c8a0" />
      </mesh>
      <mesh position={[0.52, 0.65, 0]} castShadow>
        <boxGeometry args={[0.2, 0.22, 0.2]} />
        <meshStandardMaterial color="#e8c8a0" />
      </mesh>
      
      {/* Head */}
      <mesh position={[0, 1.85, 0]} castShadow>
        <boxGeometry args={[0.5, 0.5, 0.45]} />
        <meshStandardMaterial color="#e8c8a0" />
      </mesh>
      
      {/* Hair */}
      <mesh position={[0, 2.1, -0.05]} castShadow>
        <boxGeometry args={[0.55, 0.3, 0.5]} />
        <meshStandardMaterial color="#2a2020" />
      </mesh>
      
      {/* Eyes */}
      <mesh position={[-0.1, 1.88, 0.24]}>
        <boxGeometry args={[0.08, 0.06, 0.02]} />
        <meshStandardMaterial color="#1a1a1a" />
      </mesh>
      <mesh position={[0.1, 1.88, 0.24]}>
        <boxGeometry args={[0.08, 0.06, 0.02]} />
        <meshStandardMaterial color="#1a1a1a" />
      </mesh>
    </group>
  );
}

// Korean Tree (Pine tree style)
function KoreanTree({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {/* Trunk */}
      <mesh position={[0, 1.5, 0]} castShadow>
        <boxGeometry args={[0.6, 3, 0.6]} />
        <meshStandardMaterial color="#5a4030" />
      </mesh>
      
      {/* Foliage layers */}
      <mesh position={[0, 3.5, 0]} castShadow>
        <boxGeometry args={[2.5, 1.2, 2.5]} />
        <meshStandardMaterial color="#2a5a3a" />
      </mesh>
      <mesh position={[0, 4.5, 0]} castShadow>
        <boxGeometry args={[2, 1, 2]} />
        <meshStandardMaterial color="#3a6a4a" />
      </mesh>
      <mesh position={[0, 5.3, 0]} castShadow>
        <boxGeometry args={[1.4, 0.8, 1.4]} />
        <meshStandardMaterial color="#4a7a5a" />
      </mesh>
      <mesh position={[0, 5.9, 0]} castShadow>
        <boxGeometry args={[0.8, 0.6, 0.8]} />
        <meshStandardMaterial color="#5a8a6a" />
      </mesh>
    </group>
  );
}

// Stone lantern (돌등)
function StoneLantern({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {/* Base */}
      <mesh position={[0, 0.15, 0]} castShadow>
        <boxGeometry args={[0.8, 0.3, 0.8]} />
        <meshStandardMaterial color="#707070" />
      </mesh>
      
      {/* Pillar */}
      <mesh position={[0, 0.8, 0]} castShadow>
        <boxGeometry args={[0.35, 1, 0.35]} />
        <meshStandardMaterial color="#808080" />
      </mesh>
      
      {/* Light chamber */}
      <mesh position={[0, 1.5, 0]} castShadow>
        <boxGeometry args={[0.6, 0.5, 0.6]} />
        <meshStandardMaterial color="#606060" />
      </mesh>
      
      {/* Light opening */}
      <mesh position={[0, 1.5, 0.31]}>
        <boxGeometry args={[0.3, 0.3, 0.02]} />
        <meshStandardMaterial color="#ffcc80" emissive="#ff8040" emissiveIntensity={0.8} />
      </mesh>
      
      {/* Roof */}
      <mesh position={[0, 1.9, 0]} castShadow>
        <boxGeometry args={[0.8, 0.15, 0.8]} />
        <meshStandardMaterial color="#505050" />
      </mesh>
      <mesh position={[0, 2.05, 0]} castShadow>
        <boxGeometry args={[0.5, 0.15, 0.5]} />
        <meshStandardMaterial color="#505050" />
      </mesh>
      
      <pointLight position={[0, 1.5, 0]} color="#ffaa60" intensity={2} distance={6} />
    </group>
  );
}

// Stone wall (돌담)
function StoneWall({ start, end, height = 1.5 }: { start: [number, number]; end: [number, number]; height?: number }) {
  const length = Math.sqrt(Math.pow(end[0] - start[0], 2) + Math.pow(end[1] - start[1], 2));
  const angle = Math.atan2(end[1] - start[1], end[0] - start[0]);
  const midX = (start[0] + end[0]) / 2;
  const midZ = (start[1] + end[1]) / 2;
  
  return (
    <group position={[midX, height / 2, midZ]} rotation={[0, -angle, 0]}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[length, height, 0.6]} />
        <meshStandardMaterial color="#a0a090" />
      </mesh>
      {/* Stone texture details */}
      {Array.from({ length: Math.floor(length / 1.5) }).map((_, i) => (
        <mesh key={i} position={[(i - length / 3) * 1.2, 0.2, 0.31]} castShadow>
          <boxGeometry args={[0.8, 0.4, 0.05]} />
          <meshStandardMaterial color="#909080" />
        </mesh>
      ))}
    </group>
  );
}

// Well (우물)
function Well({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {/* Base */}
      <mesh position={[0, 0.4, 0]} castShadow>
        <cylinderGeometry args={[1.2, 1.3, 0.8, 8]} />
        <meshStandardMaterial color="#808080" />
      </mesh>
      
      {/* Inner dark */}
      <mesh position={[0, 0.5, 0]}>
        <cylinderGeometry args={[0.8, 0.8, 0.6, 8]} />
        <meshStandardMaterial color="#1a2030" />
      </mesh>
      
      {/* Posts */}
      <mesh position={[-0.8, 1.5, 0]} castShadow>
        <boxGeometry args={[0.2, 2.2, 0.2]} />
        <meshStandardMaterial color="#5a4030" />
      </mesh>
      <mesh position={[0.8, 1.5, 0]} castShadow>
        <boxGeometry args={[0.2, 2.2, 0.2]} />
        <meshStandardMaterial color="#5a4030" />
      </mesh>
      
      {/* Roof beam */}
      <mesh position={[0, 2.6, 0]} castShadow>
        <boxGeometry args={[2, 0.15, 0.3]} />
        <meshStandardMaterial color="#4a3020" />
      </mesh>
      
      {/* Small roof */}
      <mesh position={[0, 2.8, 0]} castShadow>
        <boxGeometry args={[2.2, 0.1, 1.2]} />
        <meshStandardMaterial color="#3a2a1a" />
      </mesh>
    </group>
  );
}

// Ground with better texture
function Ground() {
  const grassTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d')!;
    
    // Base grass color
    ctx.fillStyle = '#4a8c50';
    ctx.fillRect(0, 0, 128, 128);
    
    // Grass variations
    for (let i = 0; i < 300; i++) {
      const x = Math.random() * 128;
      const y = Math.random() * 128;
      const shade = Math.random();
      if (shade > 0.7) {
        ctx.fillStyle = '#5a9c60';
      } else if (shade > 0.4) {
        ctx.fillStyle = '#4a8c50';
      } else {
        ctx.fillStyle = '#3a7c40';
      }
      ctx.fillRect(x, y, 2 + Math.random() * 2, 3 + Math.random() * 4);
    }
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(60, 60);
    return texture;
  }, []);

  // Path texture
  const pathTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d')!;
    
    ctx.fillStyle = '#b0a080';
    ctx.fillRect(0, 0, 64, 64);
    
    for (let i = 0; i < 50; i++) {
      const x = Math.random() * 64;
      const y = Math.random() * 64;
      ctx.fillStyle = Math.random() > 0.5 ? '#a09070' : '#c0b090';
      ctx.fillRect(x, y, 3, 3);
    }
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(10, 10);
    return texture;
  }, []);

  return (
    <group>
      {/* Main grass ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[WORLD_SIZE, WORLD_SIZE]} />
        <meshStandardMaterial map={grassTexture} />
      </mesh>
      
      {/* Village center path */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]} receiveShadow>
        <planeGeometry args={[25, 25]} />
        <meshStandardMaterial map={pathTexture} />
      </mesh>
      
      {/* Path to buildings */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-12, 0.01, 0]} receiveShadow>
        <planeGeometry args={[8, 3]} />
        <meshStandardMaterial map={pathTexture} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[12, 0.01, 0]} receiveShadow>
        <planeGeometry args={[8, 3]} />
        <meshStandardMaterial map={pathTexture} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, -12]} receiveShadow>
        <planeGeometry args={[3, 8]} />
        <meshStandardMaterial map={pathTexture} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 12]} receiveShadow>
        <planeGeometry args={[3, 8]} />
        <meshStandardMaterial map={pathTexture} />
      </mesh>
    </group>
  );
}

// Camera controller - fixed smooth following
function CameraController({ target }: { target: THREE.Vector3 }) {
  const { camera } = useThree();
  const currentPos = useRef(new THREE.Vector3(0, 15, 15));
  const currentLookAt = useRef(new THREE.Vector3(0, 0, 0));

  useFrame(() => {
    // Target camera position
    const targetCamPos = new THREE.Vector3(
      target.x,
      target.y + 18,
      target.z + 14
    );
    
    // Smooth camera movement (higher value = less smooth but less shake)
    currentPos.current.lerp(targetCamPos, 0.08);
    currentLookAt.current.lerp(target, 0.1);
    
    camera.position.copy(currentPos.current);
    camera.lookAt(currentLookAt.current);
  });

  return null;
}

// NPC data type
interface NPCData {
  id: string;
  position: [number, number, number];
  color: string;
  name: string;
  action: string;
  dialogs: string[];
}

// Main Game Scene
interface GameSceneProps {
  playerPos: THREE.Vector3;
  playerDir: number;
  npcs: NPCData[];
  nearNPC: string | null;
  onNPCClick: (npc: NPCData) => void;
  otherPlayers: OtherPlayer[];
}

function GameScene({ playerPos, playerDir, npcs, nearNPC, onNPCClick, otherPlayers }: GameSceneProps) {
  const trees = useMemo(() => {
    const positions: [number, number, number][] = [];
    // Trees around the village
    for (let i = 0; i < 35; i++) {
      const angle = (i / 35) * Math.PI * 2;
      const radius = 30 + Math.random() * 20;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      positions.push([x, 0, z]);
    }
    return positions;
  }, []);

  const lanterns = useMemo(() => {
    return [
      [-8, 0, -2] as [number, number, number],
      [8, 0, -2] as [number, number, number],
      [-8, 0, 5] as [number, number, number],
      [8, 0, 5] as [number, number, number],
      [0, 0, -8] as [number, number, number],
      [0, 0, 8] as [number, number, number],
    ];
  }, []);

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.4} />
      <directionalLight 
        position={[30, 50, 20]} 
        intensity={1}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={150}
        shadow-camera-left={-60}
        shadow-camera-right={60}
        shadow-camera-top={60}
        shadow-camera-bottom={-60}
      />
      <hemisphereLight args={['#87ceeb', '#4a8c50', 0.3]} />
      
      <CameraController target={playerPos} />
      <Ground />
      
      {/* Player */}
      <Player position={[playerPos.x, playerPos.y, playerPos.z]} direction={playerDir} />
      
      {/* Other Players (Multiplayer) */}
      {otherPlayers.map((player) => (
        <OtherPlayerCharacter
          key={player.address}
          position={[player.x, 0, player.y]}
          name={player.name}
          color={`hsl(${parseInt(player.address.slice(2, 8), 16) % 360}, 60%, 50%)`}
        />
      ))}
      
      {/* Buildings */}
      <KoreanBuilding 
        position={[-18, 0, -8]} 
        size={[7, 4.5, 6]}
        roofColor="#2a2020"
        wallColor="#f5e8d0"
        name="Swap Shop"
        icon="💱"
      />
      <KoreanBuilding 
        position={[18, 0, -8]} 
        size={[7, 4.5, 6]}
        roofColor="#2a1a2a"
        wallColor="#e8e0f0"
        name="Bridge Port"
        icon="🌉"
      />
      <KoreanBuilding 
        position={[-18, 0, 12]} 
        size={[7, 4.5, 6]}
        roofColor="#1a2a20"
        wallColor="#e0f0e8"
        name="Staking Temple"
        icon="🏛️"
      />
      <KoreanBuilding 
        position={[18, 0, 12]} 
        size={[7, 4.5, 6]}
        roofColor="#2a2a1a"
        wallColor="#f0f0d8"
        name="LP Guild"
        icon="💰"
      />
      
      {/* NPCs in front of buildings */}
      {npcs.map((npc) => (
        <NPCCharacter
          key={npc.id}
          position={npc.position}
          color={npc.color}
          name={npc.name}
          isNearby={nearNPC === npc.id}
          onClick={() => onNPCClick(npc)}
        />
      ))}
      
      {/* Trees */}
      {trees.map((pos, i) => (
        <KoreanTree key={`tree-${i}`} position={pos} />
      ))}
      
      {/* Stone lanterns */}
      {lanterns.map((pos, i) => (
        <StoneLantern key={`lantern-${i}`} position={pos} />
      ))}
      
      {/* Well in center */}
      <Well position={[0, 0, 0]} />
      
      {/* Stone walls */}
      <StoneWall start={[-25, -15]} end={[-25, 18]} height={1.2} />
      <StoneWall start={[25, -15]} end={[25, 18]} height={1.2} />
      <StoneWall start={[-25, -15]} end={[25, -15]} height={1.2} />
      <StoneWall start={[-25, 18]} end={[25, 18]} height={1.2} />
      
      {/* Sky color */}
      <fog attach="fog" args={['#a8c8e8', 40, 100]} />
    </>
  );
}

// Main Game Component
export function Game3D() {
  const [playerPos, setPlayerPos] = useState(() => new THREE.Vector3(0, 0, 5));
  const [playerDir, setPlayerDir] = useState(0);
  const keysPressed = useRef<Set<string>>(new Set());
  const [nearNPC, setNearNPC] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [currentDialog, setCurrentDialog] = useState({ name: '', text: '', action: '' });
  const { 
    isWalletConnected, 
    walletAddress,
    isRegistered, 
    setRegistered,
    playerName,
    setPlayerName,
    setPlayerPosition,
  } = useGameStore();
  
  // Registration modal state
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [registerName, setRegisterName] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  
  // Chat state
  const [chatInput, setChatInput] = useState('');
  const [showChat, setShowChat] = useState(false);
  
  // Multiplayer hook
  const { 
    otherPlayers, 
    registerPlayer, 
    checkRegistration,
    sendChat,
  } = useMultiplayer({ enabled: isWalletConnected && isRegistered });
  
  // Check registration on wallet connect
  useEffect(() => {
    if (isWalletConnected && walletAddress) {
      checkRegistration().then(player => {
        if (player) {
          setRegistered(true);
          setPlayerName(player.name);
        } else {
          setShowRegisterModal(true);
        }
      });
    }
  }, [isWalletConnected, walletAddress, checkRegistration, setRegistered, setPlayerName]);
  
  // Sync player position to store for multiplayer
  useEffect(() => {
    setPlayerPosition({ x: playerPos.x, y: playerPos.z, z: 0 });
  }, [playerPos, setPlayerPosition]);
  
  // Handle registration
  const handleRegister = async () => {
    if (!registerName.trim() || registerName.length > 32) return;
    
    setIsRegistering(true);
    const success = await registerPlayer(registerName.trim());
    setIsRegistering(false);
    
    if (success) {
      setRegistered(true);
      setPlayerName(registerName.trim());
      setShowRegisterModal(false);
    }
  };
  
  // Handle chat send
  const handleSendChat = async () => {
    if (!chatInput.trim()) return;
    
    await sendChat(chatInput.trim());
    setChatInput('');
  };

  const npcs: NPCData[] = useMemo(() => [
    { 
      id: 'swap', 
      position: [-18, 0, -1] as [number, number, number], 
      color: '#4080a0', 
      name: 'Swap Merchant', 
      action: 'swap', 
      dialogs: ['Welcome, traveler!', 'I can exchange your tokens.', 'What would you like to swap?'] 
    },
    { 
      id: 'bridge', 
      position: [18, 0, -1] as [number, number, number], 
      color: '#a04080', 
      name: 'Bridge Keeper', 
      action: 'bridge', 
      dialogs: ['Need to cross chains?', 'I can help transfer your assets.', 'Which chain do you want?'] 
    },
    { 
      id: 'stake', 
      position: [-18, 0, 19] as [number, number, number], 
      color: '#40a040', 
      name: 'Staking Master', 
      action: 'staking', 
      dialogs: ['Greetings, seeker.', 'Stake your tokens for rewards.', 'Ready to begin?'] 
    },
    { 
      id: 'lp', 
      position: [18, 0, 19] as [number, number, number], 
      color: '#a0a040', 
      name: 'LP Guild Master', 
      action: 'liquidity', 
      dialogs: ['Join our guild!', 'Provide liquidity, earn fees.', 'Interested?'] 
    },
  ], []);

  const handleNPCClick = useCallback((npc: NPCData) => {
    setDialogOpen(true);
    setCurrentDialog({
      name: npc.name,
      text: npc.dialogs[Math.floor(Math.random() * npc.dialogs.length)],
      action: npc.action
    });
  }, []);

  // Keyboard input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysPressed.current.add(e.key.toLowerCase());
      
      if (e.key === ' ' && nearNPC && isWalletConnected) {
        const npc = npcs.find(n => n.id === nearNPC);
        if (npc) {
          handleNPCClick(npc);
        }
      }
      
      if (e.key === 'Escape') {
        setDialogOpen(false);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed.current.delete(e.key.toLowerCase());
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [nearNPC, npcs, handleNPCClick, isWalletConnected]);

  // Game loop
  useEffect(() => {
    let animationId: number;
    const speed = 0.18;

    const gameLoop = () => {
      if (!dialogOpen) {
        let dx = 0;
        let dz = 0;

        if (keysPressed.current.has('w') || keysPressed.current.has('arrowup')) dz -= 1;
        if (keysPressed.current.has('s') || keysPressed.current.has('arrowdown')) dz += 1;
        if (keysPressed.current.has('a') || keysPressed.current.has('arrowleft')) dx -= 1;
        if (keysPressed.current.has('d') || keysPressed.current.has('arrowright')) dx += 1;

        if (dx !== 0 || dz !== 0) {
          const len = Math.sqrt(dx * dx + dz * dz);
          dx /= len;
          dz /= len;

          setPlayerPos(prev => {
            const newX = Math.max(-50, Math.min(50, prev.x + dx * speed));
            const newZ = Math.max(-50, Math.min(50, prev.z + dz * speed));
            return new THREE.Vector3(newX, 0, newZ);
          });

          setPlayerDir(Math.atan2(dx, dz));
        }
      }

      // Check NPC proximity
      let closest: string | null = null;
      let closestDist = 5;
      
      npcs.forEach(npc => {
        const dist = Math.sqrt(
          Math.pow(playerPos.x - npc.position[0], 2) +
          Math.pow(playerPos.z - npc.position[2], 2)
        );
        if (dist < closestDist) {
          closestDist = dist;
          closest = npc.id;
        }
      });
      
      setNearNPC(closest);

      animationId = requestAnimationFrame(gameLoop);
    };

    animationId = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(animationId);
  }, [dialogOpen, npcs, playerPos]);

  return (
    <div className="game-3d-container">
      <Canvas shadows>
        <color attach="background" args={['#87ceeb']} />
        <GameScene 
          playerPos={playerPos}
          playerDir={playerDir}
          npcs={npcs}
          nearNPC={nearNPC}
          onNPCClick={handleNPCClick}
          otherPlayers={otherPlayers}
        />
      </Canvas>

      {/* HUD */}
      <div className="game-hud">
        <div className="hud-left">
          <div className="hud-location">
            <span>📍 DeFi Village</span>
          </div>
          {isWalletConnected && (
            <div className="hud-status">
              <span className="status-dot connected" />
              <span>{playerName || 'Connected'}</span>
            </div>
          )}
          {otherPlayers.length > 0 && (
            <div className="hud-players">
              <span>👥 {otherPlayers.length} online</span>
            </div>
          )}
        </div>
        <div className="hud-minimap">
          <div 
            className="minimap-player"
            style={{
              left: `${50 + (playerPos.x / 100) * 100}%`,
              top: `${50 + (playerPos.z / 100) * 100}%`
            }}
          />
          {npcs.map(npc => (
            <div 
              key={npc.id}
              className="minimap-npc"
              style={{
                left: `${50 + (npc.position[0] / 100) * 100}%`,
                top: `${50 + (npc.position[2] / 100) * 100}%`,
                backgroundColor: npc.color
              }}
            />
          ))}
          {/* Buildings on minimap */}
          <div className="minimap-building" style={{ left: '32%', top: '35%', backgroundColor: '#5a4030' }} />
          <div className="minimap-building" style={{ left: '68%', top: '35%', backgroundColor: '#5a4030' }} />
          <div className="minimap-building" style={{ left: '32%', top: '62%', backgroundColor: '#5a4030' }} />
          <div className="minimap-building" style={{ left: '68%', top: '62%', backgroundColor: '#5a4030' }} />
        </div>
      </div>

      <div className="game-controls">
        <span>WASD / Arrow Keys - Move</span>
        <span>SPACE - Talk</span>
        <span>ESC - Close</span>
      </div>

      {nearNPC && !dialogOpen && (
        <div className="interaction-prompt">
          {isWalletConnected ? 'Press SPACE to talk' : 'Connect wallet to interact'}
        </div>
      )}

      {dialogOpen && (
        <div className="dialog-box">
          <div className="dialog-header">
            <span className="dialog-name">{currentDialog.name}</span>
            <button className="dialog-close" onClick={() => setDialogOpen(false)}>×</button>
          </div>
          <p className="dialog-text">{currentDialog.text}</p>
          <div className="dialog-actions">
            {isWalletConnected ? (
              <>
                <button 
                  className="dialog-btn primary"
                  onClick={() => {
                    setDialogOpen(false);
                    window.dispatchEvent(new CustomEvent('openPanel', { detail: currentDialog.action }));
                  }}
                >
                  Open {currentDialog.action.charAt(0).toUpperCase() + currentDialog.action.slice(1)}
                </button>
                <button className="dialog-btn" onClick={() => setDialogOpen(false)}>
                  Maybe later
                </button>
              </>
            ) : (
              <button className="dialog-btn" onClick={() => setDialogOpen(false)}>
                Close (Connect wallet to interact)
              </button>
            )}
          </div>
        </div>
      )}

      {/* Registration Modal */}
      {showRegisterModal && (
        <div className="modal-overlay">
          <div className="modal-content register-modal">
            <h2>🎮 Enter the Village</h2>
            <p>Register your character on MegaETH to join the multiplayer world.</p>
            <input
              type="text"
              placeholder="Enter your name (max 32 chars)"
              value={registerName}
              onChange={(e) => setRegisterName(e.target.value.slice(0, 32))}
              className="register-input"
              disabled={isRegistering}
            />
            <div className="modal-actions">
              <button 
                className="dialog-btn primary"
                onClick={handleRegister}
                disabled={isRegistering || !registerName.trim()}
              >
                {isRegistering ? 'Registering on MegaETH...' : 'Register'}
              </button>
              <button 
                className="dialog-btn"
                onClick={() => setShowRegisterModal(false)}
                disabled={isRegistering}
              >
                Play Offline
              </button>
            </div>
            <p className="modal-hint">Your position and chat will be recorded on-chain!</p>
          </div>
        </div>
      )}

      {/* Chat UI */}
      {isRegistered && (
        <div className={`chat-container ${showChat ? 'open' : ''}`}>
          <button 
            className="chat-toggle"
            onClick={() => setShowChat(!showChat)}
          >
            💬 {showChat ? 'Hide' : 'Chat'}
          </button>
          {showChat && (
            <div className="chat-panel">
              <div className="chat-messages">
                {useGameStore.getState().chatMessages.slice(-10).map((msg, i) => (
                  <div key={i} className="chat-message">
                    <span className="chat-sender">
                      {msg.sender.slice(0, 6)}...{msg.sender.slice(-4)}:
                    </span>
                    <span className="chat-text">{msg.message}</span>
                  </div>
                ))}
              </div>
              <div className="chat-input-container">
                <input
                  type="text"
                  placeholder="Type a message..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value.slice(0, 200))}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendChat()}
                  className="chat-input"
                />
                <button onClick={handleSendChat} className="chat-send">Send</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
