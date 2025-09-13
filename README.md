# DeFi RPG - 온체인 어드벤처

MegaETH 기반 바람의 나라 스타일 픽셀 RPG 게임입니다. 다양한 체인의 DeFi 활동을 게임 내 NPC/상점 경험으로 변환합니다.

![Game Preview](docs/preview.png)

## 🎮 주요 기능

- **🦄 스왑 상점**: 토큰 교환 (Uniswap, Curve 등 연동)
- **⚓ 브릿지 항구**: 크로스체인 자산 전송
- **🧘 스테이킹 신전**: 장기 예치 및 보상
- **💰 유동성 길드**: LP 공급 및 수익 획득

## 🛠️ 기술 스택

- **게임 엔진**: Phaser 3
- **프레임워크**: Next.js 14 (App Router)
- **지갑 연결**: Privy
- **블록체인**: viem + wagmi
- **상태 관리**: Zustand
- **스타일링**: Tailwind CSS

## 🚀 시작하기

### 1. 의존성 설치

```bash
npm install
```

### 2. 환경 변수 설정

```bash
cp .env.example .env.local
```

`.env.local` 파일을 열어 Privy App ID를 설정하세요:

```env
NEXT_PUBLIC_PRIVY_APP_ID=your-privy-app-id
```

Privy App ID는 [Privy Dashboard](https://dashboard.privy.io)에서 발급받을 수 있습니다.

### 3. 개발 서버 실행

```bash
npm run dev
```

http://localhost:3000 에서 확인하세요.

## 📁 프로젝트 구조

```
src/
├── app/                    # Next.js App Router
│   ├── page.tsx            # 로그인 페이지
│   └── game/
│       └── page.tsx        # 게임 페이지
│
├── game/                   # Phaser 게임 로직
│   ├── scenes/
│   │   ├── BootScene.ts    # 에셋 로딩
│   │   └── VillageScene.ts # 마을 맵
│   ├── entities/
│   │   ├── Player.ts       # 플레이어 캐릭터
│   │   └── NPC.ts          # NPC
│   └── config.ts           # 게임 설정
│
├── components/             # React 컴포넌트
│   ├── GameCanvas.tsx      # Phaser 래퍼
│   ├── Inventory.tsx       # 인벤토리 UI
│   ├── SwapPanel.tsx       # 스왑 패널
│   ├── BridgePanel.tsx     # 브릿지 패널
│   ├── StakingPanel.tsx    # 스테이킹 패널
│   └── LiquidityPanel.tsx  # 유동성 패널
│
├── hooks/                  # React Hooks
│   └── useWallet.ts        # Privy 지갑 훅
│
├── lib/                    # 유틸리티
│   ├── chains.ts           # 체인 설정
│   └── wagmiConfig.ts      # Wagmi 설정
│
├── providers/              # Context Providers
│   └── PrivyProvider.tsx   # Privy + Wagmi 설정
│
└── stores/                 # Zustand 스토어
    ├── gameStore.ts        # 게임 상태
    └── walletStore.ts      # 지갑 상태
```

## 🎮 조작법

| 키 | 동작 |
|---|---|
| WASD / 방향키 | 캐릭터 이동 (8방향) |
| SPACE | NPC 대화 / 상호작용 |
| I | 인벤토리 열기/닫기 |
| ESC | 패널 닫기 |

## 🔗 지원 체인

### 메인 체인
- **MegaETH Testnet** (Chain ID: 6342)

### DeFi 연동 체인
- Ethereum Mainnet
- Arbitrum One
- Base
- Polygon

## 📋 체인별 주요 DeFi

| 체인 | 프로토콜 |
|------|----------|
| Ethereum | Uniswap, Aave, Lido, Curve, Compound |
| Arbitrum | GMX, Camelot, Radiant, Pendle, Dopex |
| Base | Aerodrome, Moonwell, BaseSwap |
| Polygon | QuickSwap, Balancer, Beefy |

## 🎨 아트 스타일

- 바람의 나라 (1996) 스타일 참고
- 32x32 픽셀 타일 기반
- 한국 전통 색상 팔레트 사용

## 📝 개발 로드맵

### Phase 1 (현재) ✅
- [x] 기본 마을 맵 및 캐릭터 이동
- [x] Privy 지갑 연결
- [x] 인벤토리 시스템
- [x] 스왑/브릿지/스테이킹/유동성 UI

### Phase 2 (예정)
- [ ] 실제 DeFi 프로토콜 연동
- [ ] 크로스체인 스왑 (LI.FI 연동)
- [ ] NFT 인벤토리 표시

### Phase 3 (예정)
- [ ] 사냥 시스템
- [ ] 레벨업 및 스탯
- [ ] 퀘스트 시스템
- [ ] 멀티플레이어

## 🤝 기여하기

1. 이 저장소를 Fork 하세요
2. Feature 브랜치를 생성하세요 (`git checkout -b feature/amazing-feature`)
3. 변경사항을 커밋하세요 (`git commit -m 'Add amazing feature'`)
4. 브랜치에 Push 하세요 (`git push origin feature/amazing-feature`)
5. Pull Request를 생성하세요

## 📄 라이선스

MIT License - 자세한 내용은 [LICENSE](LICENSE) 파일을 참조하세요.

## 🙏 감사의 말

- [바람의 나라](https://baram.nexon.com/) - 게임 스타일 영감
- [Phaser](https://phaser.io/) - 게임 엔진
- [Privy](https://privy.io/) - 지갑 연결
- [MegaETH](https://megaeth.com/) - 블록체인 인프라
