'use client';

import { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore, OtherPlayer } from '@/stores/gameStore';
import { useMultiplayer } from '@/hooks/useMultiplayer';

const WORLD_SIZE = 200;

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
      groupRef.current.rotation.y = direction;
      
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

// Hill (언덕)
function Hill({ position, size = [15, 4, 15], color = '#4a9050' }: { 
  position: [number, number, number]; 
  size?: [number, number, number];
  color?: string;
}) {
  return (
    <group position={position}>
      <mesh castShadow receiveShadow>
        <sphereGeometry args={[size[0] / 2, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color={color} />
      </mesh>
      {/* Grass details on hill */}
      {Array.from({ length: 8 }).map((_, i) => (
        <mesh key={i} position={[
          (Math.random() - 0.5) * size[0] * 0.7,
          size[1] * 0.3 + Math.random() * 0.5,
          (Math.random() - 0.5) * size[2] * 0.7
        ]} castShadow>
          <coneGeometry args={[0.3, 0.8, 4]} />
          <meshStandardMaterial color="#3a8040" />
        </mesh>
      ))}
    </group>
  );
}

// Stream (개천)
function Stream({ points }: { points: [number, number][] }) {
  const streamShape = useMemo(() => {
    const shape = new THREE.Shape();
    shape.moveTo(points[0][0], points[0][1]);
    for (let i = 1; i < points.length; i++) {
      shape.lineTo(points[i][0], points[i][1]);
    }
    // Create width
    for (let i = points.length - 1; i >= 0; i--) {
      shape.lineTo(points[i][0] + 3, points[i][1] + 0.5);
    }
    shape.closePath();
    return shape;
  }, [points]);

  return (
    <group>
      {/* Water base */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]}>
        <shapeGeometry args={[streamShape]} />
        <meshStandardMaterial 
          color="#4080a0" 
          transparent 
          opacity={0.8}
          metalness={0.3}
          roughness={0.2}
        />
      </mesh>
      {/* Water surface reflection */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]}>
        <shapeGeometry args={[streamShape]} />
        <meshStandardMaterial 
          color="#80c0e0" 
          transparent 
          opacity={0.4}
        />
      </mesh>
      {/* Stream bed */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.3, 0]}>
        <shapeGeometry args={[streamShape]} />
        <meshStandardMaterial color="#506070" />
      </mesh>
      {/* Rocks in stream */}
      {points.filter((_, i) => i % 3 === 0).map((point, i) => (
        <mesh key={i} position={[point[0] + 1.5, -0.1, point[1]]} castShadow>
          <sphereGeometry args={[0.3 + Math.random() * 0.3, 6, 6]} />
          <meshStandardMaterial color="#707080" />
        </mesh>
      ))}
    </group>
  );
}

// Wooden Bridge (나무 다리)
function WoodenBridge({ position, rotation = 0, length = 6 }: { 
  position: [number, number, number]; 
  rotation?: number;
  length?: number;
}) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {/* Main planks */}
      <mesh position={[0, 0.3, 0]} castShadow>
        <boxGeometry args={[length, 0.15, 2.5]} />
        <meshStandardMaterial color="#6a5040" />
      </mesh>
      {/* Plank details */}
      {Array.from({ length: Math.floor(length / 0.5) }).map((_, i) => (
        <mesh key={i} position={[-length/2 + i * 0.5 + 0.25, 0.38, 0]} castShadow>
          <boxGeometry args={[0.45, 0.02, 2.4]} />
          <meshStandardMaterial color={i % 2 === 0 ? '#5a4030' : '#7a6050'} />
        </mesh>
      ))}
      {/* Support posts */}
      <mesh position={[-length/2 + 0.3, -0.3, -1]} castShadow>
        <boxGeometry args={[0.3, 1.2, 0.3]} />
        <meshStandardMaterial color="#4a3020" />
      </mesh>
      <mesh position={[-length/2 + 0.3, -0.3, 1]} castShadow>
        <boxGeometry args={[0.3, 1.2, 0.3]} />
        <meshStandardMaterial color="#4a3020" />
      </mesh>
      <mesh position={[length/2 - 0.3, -0.3, -1]} castShadow>
        <boxGeometry args={[0.3, 1.2, 0.3]} />
        <meshStandardMaterial color="#4a3020" />
      </mesh>
      <mesh position={[length/2 - 0.3, -0.3, 1]} castShadow>
        <boxGeometry args={[0.3, 1.2, 0.3]} />
        <meshStandardMaterial color="#4a3020" />
      </mesh>
      {/* Railings */}
      <mesh position={[0, 0.8, -1.1]} castShadow>
        <boxGeometry args={[length, 0.1, 0.1]} />
        <meshStandardMaterial color="#5a4030" />
      </mesh>
      <mesh position={[0, 0.8, 1.1]} castShadow>
        <boxGeometry args={[length, 0.1, 0.1]} />
        <meshStandardMaterial color="#5a4030" />
      </mesh>
      {/* Railing posts */}
      {[-length/2 + 0.5, 0, length/2 - 0.5].map((x, i) => (
        <group key={i}>
          <mesh position={[x, 0.55, -1.1]} castShadow>
            <boxGeometry args={[0.1, 0.5, 0.1]} />
            <meshStandardMaterial color="#4a3020" />
          </mesh>
          <mesh position={[x, 0.55, 1.1]} castShadow>
            <boxGeometry args={[0.1, 0.5, 0.1]} />
            <meshStandardMaterial color="#4a3020" />
          </mesh>
        </group>
      ))}
    </group>
  );
}

// Large Rock (바위)
function LargeRock({ position, scale = 1 }: { position: [number, number, number]; scale?: number }) {
  return (
    <group position={position} scale={scale}>
      <mesh castShadow>
        <dodecahedronGeometry args={[1.5, 0]} />
        <meshStandardMaterial color="#808090" flatShading />
      </mesh>
      <mesh position={[0.8, -0.3, 0.5]} castShadow>
        <dodecahedronGeometry args={[0.8, 0]} />
        <meshStandardMaterial color="#707080" flatShading />
      </mesh>
      <mesh position={[-0.5, -0.4, -0.6]} castShadow>
        <dodecahedronGeometry args={[0.6, 0]} />
        <meshStandardMaterial color="#909098" flatShading />
      </mesh>
    </group>
  );
}

// Flower Patch (꽃밭)
function FlowerPatch({ position, radius = 3 }: { position: [number, number, number]; radius?: number }) {
  const flowers = useMemo(() => {
    const arr = [];
    const colors = ['#ff6b8a', '#ffb366', '#ffff66', '#66b3ff', '#ff66ff', '#ffffff'];
    for (let i = 0; i < 20; i++) {
      const angle = Math.random() * Math.PI * 2;
      const r = Math.random() * radius;
      arr.push({
        x: Math.cos(angle) * r,
        z: Math.sin(angle) * r,
        color: colors[Math.floor(Math.random() * colors.length)],
        height: 0.3 + Math.random() * 0.3
      });
    }
    return arr;
  }, [radius]);

  return (
    <group position={position}>
      {flowers.map((f, i) => (
        <group key={i} position={[f.x, f.height / 2, f.z]}>
          {/* Stem */}
          <mesh>
            <cylinderGeometry args={[0.02, 0.02, f.height, 4]} />
            <meshStandardMaterial color="#228b22" />
          </mesh>
          {/* Flower */}
          <mesh position={[0, f.height / 2 + 0.05, 0]}>
            <sphereGeometry args={[0.08, 6, 6]} />
            <meshStandardMaterial color={f.color} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

// Bamboo Grove (대나무 숲)
function BambooGrove({ position, count = 8 }: { position: [number, number, number]; count?: number }) {
  const bamboos = useMemo(() => {
    const arr = [];
    for (let i = 0; i < count; i++) {
      arr.push({
        x: (Math.random() - 0.5) * 6,
        z: (Math.random() - 0.5) * 6,
        height: 5 + Math.random() * 4,
        segments: 4 + Math.floor(Math.random() * 3)
      });
    }
    return arr;
  }, [count]);

  return (
    <group position={position}>
      {bamboos.map((b, i) => (
        <group key={i} position={[b.x, 0, b.z]}>
          {/* Bamboo segments */}
          {Array.from({ length: b.segments }).map((_, j) => (
            <group key={j}>
              <mesh position={[0, j * (b.height / b.segments) + b.height / b.segments / 2, 0]} castShadow>
                <cylinderGeometry args={[0.15, 0.18, b.height / b.segments - 0.1, 8]} />
                <meshStandardMaterial color="#7cb342" />
              </mesh>
              {/* Node */}
              <mesh position={[0, (j + 1) * (b.height / b.segments), 0]} castShadow>
                <cylinderGeometry args={[0.2, 0.2, 0.1, 8]} />
                <meshStandardMaterial color="#558b2f" />
              </mesh>
            </group>
          ))}
          {/* Leaves at top */}
          {[0, 1, 2].map((l) => (
            <mesh key={l} position={[
              Math.cos(l * 2) * 0.5, 
              b.height + 0.5, 
              Math.sin(l * 2) * 0.5
            ]} rotation={[0.5, l * 2, 0]} castShadow>
              <coneGeometry args={[0.4, 1.5, 4]} />
              <meshStandardMaterial color="#8bc34a" />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
}

// Rice Paddy (논)
function RicePaddy({ position, size = [12, 12] }: { position: [number, number, number]; size?: [number, number] }) {
  return (
    <group position={position}>
      {/* Water */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.15, 0]}>
        <planeGeometry args={size} />
        <meshStandardMaterial color="#6090a0" transparent opacity={0.6} metalness={0.2} roughness={0.3} />
      </mesh>
      {/* Mud border */}
      <mesh position={[0, -0.1, -size[1]/2]} castShadow>
        <boxGeometry args={[size[0] + 0.5, 0.3, 0.5]} />
        <meshStandardMaterial color="#6a5a4a" />
      </mesh>
      <mesh position={[0, -0.1, size[1]/2]} castShadow>
        <boxGeometry args={[size[0] + 0.5, 0.3, 0.5]} />
        <meshStandardMaterial color="#6a5a4a" />
      </mesh>
      <mesh position={[-size[0]/2, -0.1, 0]} castShadow>
        <boxGeometry args={[0.5, 0.3, size[1]]} />
        <meshStandardMaterial color="#6a5a4a" />
      </mesh>
      <mesh position={[size[0]/2, -0.1, 0]} castShadow>
        <boxGeometry args={[0.5, 0.3, size[1]]} />
        <meshStandardMaterial color="#6a5a4a" />
      </mesh>
      {/* Rice plants */}
      {Array.from({ length: 40 }).map((_, i) => (
        <mesh key={i} position={[
          (Math.random() - 0.5) * (size[0] - 1),
          0.2,
          (Math.random() - 0.5) * (size[1] - 1)
        ]}>
          <coneGeometry args={[0.1, 0.6, 4]} />
          <meshStandardMaterial color="#7cb342" />
        </mesh>
      ))}
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
      
      {/* Village center path - larger */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]} receiveShadow>
        <planeGeometry args={[35, 35]} />
        <meshStandardMaterial map={pathTexture} />
      </mesh>
      
      {/* Path to buildings */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-20, 0.01, 0]} receiveShadow>
        <planeGeometry args={[15, 3]} />
        <meshStandardMaterial map={pathTexture} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[20, 0.01, 0]} receiveShadow>
        <planeGeometry args={[15, 3]} />
        <meshStandardMaterial map={pathTexture} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, -18]} receiveShadow>
        <planeGeometry args={[3, 12]} />
        <meshStandardMaterial map={pathTexture} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 18]} receiveShadow>
        <planeGeometry args={[3, 12]} />
        <meshStandardMaterial map={pathTexture} />
      </mesh>
      
      {/* Outer paths */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-30, 0.01, -15]} receiveShadow>
        <planeGeometry args={[10, 3]} />
        <meshStandardMaterial map={pathTexture} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[30, 0.01, -15]} receiveShadow>
        <planeGeometry args={[10, 3]} />
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
    // Inner ring of trees around the village
    for (let i = 0; i < 40; i++) {
      const angle = (i / 40) * Math.PI * 2;
      const radius = 38 + Math.random() * 15;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      // Avoid stream area (x around 35-50)
      if (x < 32 || x > 52) {
        positions.push([x, 0, z]);
      }
    }
    // Outer ring of trees
    for (let i = 0; i < 60; i++) {
      const angle = (i / 60) * Math.PI * 2;
      const radius = 60 + Math.random() * 25;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      // Avoid stream area
      if (x < 32 || x > 52) {
        positions.push([x, 0, z]);
      }
    }
    // Forest clusters
    for (let i = 0; i < 25; i++) {
      positions.push([-65 + Math.random() * 15, 0, -40 + Math.random() * 30]);
      positions.push([65 + Math.random() * 15, 0, -30 + Math.random() * 25]);
    }
    return positions;
  }, []);

  const lanterns = useMemo(() => {
    return [
      // Village center
      [-12, 0, -5] as [number, number, number],
      [12, 0, -5] as [number, number, number],
      [-12, 0, 8] as [number, number, number],
      [12, 0, 8] as [number, number, number],
      [0, 0, -10] as [number, number, number],
      [0, 0, 12] as [number, number, number],
      // Near buildings
      [-18, 0, -12] as [number, number, number],
      [18, 0, -12] as [number, number, number],
      [-18, 0, 18] as [number, number, number],
      [18, 0, 18] as [number, number, number],
      // Path lights
      [-30, 0, 0] as [number, number, number],
      [30, 0, 0] as [number, number, number],
      [0, 0, -25] as [number, number, number],
      [0, 0, 25] as [number, number, number],
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
      
      {/* Buildings - expanded layout */}
      <KoreanBuilding 
        position={[-25, 0, -12]} 
        size={[8, 5, 7]}
        roofColor="#2a2020"
        wallColor="#f5e8d0"
        name="Swap Shop"
        icon="💱"
      />
      <KoreanBuilding 
        position={[25, 0, -12]} 
        size={[8, 5, 7]}
        roofColor="#2a1a2a"
        wallColor="#e8e0f0"
        name="Bridge Port"
        icon="🌉"
      />
      <KoreanBuilding 
        position={[-25, 0, 18]} 
        size={[8, 5, 7]}
        roofColor="#1a2a20"
        wallColor="#e0f0e8"
        name="Staking Temple"
        icon="🏛️"
      />
      <KoreanBuilding 
        position={[25, 0, 18]} 
        size={[8, 5, 7]}
        roofColor="#2a2a1a"
        wallColor="#f0f0d8"
        name="LP Guild"
        icon="💰"
      />
      <KoreanBuilding 
        position={[0, 0, -20]} 
        size={[8, 5, 7]}
        roofColor="#3a1a2a"
        wallColor="#ffe8f0"
        name="NFT Gallery"
        icon="🖼️"
      />
      
      {/* Hills around the village */}
      <Hill position={[-55, 0, -30]} size={[20, 6, 18]} color="#4a9050" />
      <Hill position={[55, 0, -25]} size={[18, 5, 16]} color="#3a8040" />
      <Hill position={[-50, 0, 40]} size={[22, 7, 20]} color="#4a9050" />
      <Hill position={[50, 0, 45]} size={[16, 5, 14]} color="#3a8040" />
      <Hill position={[0, 0, 55]} size={[25, 8, 22]} color="#4a9050" />
      <Hill position={[-60, 0, 5]} size={[15, 4, 15]} color="#3a8040" />
      <Hill position={[60, 0, 10]} size={[18, 5, 16]} color="#4a9050" />
      
      {/* Stream running through the eastern side */}
      <Stream points={[
        [40, -60], [42, -45], [38, -30], [40, -15], 
        [45, 0], [42, 15], [38, 30], [40, 45], [42, 60]
      ]} />
      
      {/* Wooden bridges over stream */}
      <WoodenBridge position={[41, 0, -15]} rotation={Math.PI / 2} length={7} />
      <WoodenBridge position={[41, 0, 30]} rotation={Math.PI / 2} length={7} />
      
      {/* Large rocks scattered around */}
      <LargeRock position={[-45, 0, -20]} scale={1.2} />
      <LargeRock position={[48, 0, 35]} scale={0.9} />
      <LargeRock position={[-38, 0, 45]} scale={1.1} />
      <LargeRock position={[35, 0, -45]} scale={0.8} />
      <LargeRock position={[-55, 0, 25]} scale={1.0} />
      
      {/* Flower patches */}
      <FlowerPatch position={[-15, 0, -35]} radius={4} />
      <FlowerPatch position={[15, 0, -35]} radius={3} />
      <FlowerPatch position={[-30, 0, 30]} radius={5} />
      <FlowerPatch position={[30, 0, 35]} radius={4} />
      <FlowerPatch position={[0, 0, 40]} radius={3} />
      
      {/* Bamboo groves */}
      <BambooGrove position={[-45, 0, 15]} count={10} />
      <BambooGrove position={[50, 0, -40]} count={8} />
      <BambooGrove position={[-55, 0, -45]} count={12} />
      
      {/* Rice paddies in the distance */}
      <RicePaddy position={[-50, 0, 55]} size={[15, 12]} />
      <RicePaddy position={[55, 0, 50]} size={[12, 10]} />
      <RicePaddy position={[-60, 0, -55]} size={[14, 11]} />
      
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
      
      {/* Stone walls - expanded village boundary */}
      <StoneWall start={[-35, -28]} end={[-35, 32]} height={1.2} />
      <StoneWall start={[35, -28]} end={[35, 32]} height={1.2} />
      <StoneWall start={[-35, -28]} end={[35, -28]} height={1.2} />
      <StoneWall start={[-35, 32]} end={[35, 32]} height={1.2} />
      
      {/* Inner decorative walls */}
      <StoneWall start={[-15, -18]} end={[-25, -18]} height={0.8} />
      <StoneWall start={[15, -18]} end={[25, -18]} height={0.8} />
      
      {/* Sky color - extended for larger world */}
      <fog attach="fog" args={['#a8c8e8', 60, 150]} />
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
      position: [-25, 0, -4] as [number, number, number], 
      color: '#4080a0', 
      name: 'Swap Merchant', 
      action: 'swap', 
      dialogs: ['Welcome, traveler!', 'I can exchange your tokens.', 'What would you like to swap?'] 
    },
    { 
      id: 'bridge', 
      position: [25, 0, -4] as [number, number, number], 
      color: '#a04080', 
      name: 'Bridge Keeper', 
      action: 'bridge', 
      dialogs: ['Need to cross chains?', 'I can help transfer your assets.', 'Which chain do you want?'] 
    },
    { 
      id: 'stake', 
      position: [-25, 0, 26] as [number, number, number], 
      color: '#40a040', 
      name: 'Staking Master', 
      action: 'staking', 
      dialogs: ['Greetings, seeker.', 'Stake your tokens for rewards.', 'Ready to begin?'] 
    },
    { 
      id: 'lp', 
      position: [25, 0, 26] as [number, number, number], 
      color: '#a0a040', 
      name: 'LP Guild Master', 
      action: 'liquidity', 
      dialogs: ['Join our guild!', 'Provide liquidity, earn fees.', 'Interested?'] 
    },
    { 
      id: 'nft', 
      position: [0, 0, -12] as [number, number, number], 
      color: '#ff6b9d', 
      name: 'NFT Artist', 
      action: 'nft', 
      dialogs: ['Looking for rare NFTs?', 'I have collections from all chains!', 'Want to browse?'] 
    },
    { 
      id: 'elder', 
      position: [0, 0, 8] as [number, number, number], 
      color: '#8060a0', 
      name: 'Village Elder', 
      action: 'info', 
      dialogs: ['Welcome to DeFi Village!', 'Explore and discover the world of decentralized finance.', 'Each building offers unique services.'] 
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
            const newX = Math.max(-90, Math.min(90, prev.x + dx * speed));
            const newZ = Math.max(-90, Math.min(90, prev.z + dz * speed));
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
          {/* Stream indicator */}
          <div style={{
            position: 'absolute',
            left: '70%',
            top: '10%',
            width: '3px',
            height: '80%',
            backgroundColor: '#4080a0',
            opacity: 0.6,
            borderRadius: '2px'
          }} />
          <div 
            className="minimap-player"
            style={{
              left: `${50 + (playerPos.x / 180) * 100}%`,
              top: `${50 + (playerPos.z / 180) * 100}%`
            }}
          />
          {npcs.map(npc => (
            <div 
              key={npc.id}
              className="minimap-npc"
              style={{
                left: `${50 + (npc.position[0] / 180) * 100}%`,
                top: `${50 + (npc.position[2] / 180) * 100}%`,
                backgroundColor: npc.color
              }}
            />
          ))}
          {/* Buildings on minimap */}
          <div className="minimap-building" style={{ left: '36%', top: '37%', backgroundColor: '#5a4030' }} />
          <div className="minimap-building" style={{ left: '64%', top: '37%', backgroundColor: '#5a4030' }} />
          <div className="minimap-building" style={{ left: '36%', top: '60%', backgroundColor: '#5a4030' }} />
          <div className="minimap-building" style={{ left: '64%', top: '60%', backgroundColor: '#5a4030' }} />
          <div className="minimap-building" style={{ left: '50%', top: '32%', backgroundColor: '#ff6b9d' }} />
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
