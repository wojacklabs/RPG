# Required API Keys for On-Chain Features

## 1. Swap (DEX Aggregator) - Choose One

### Option A: 1inch API (Recommended)
- **URL**: https://portal.1inch.dev/
- **Free tier**: 10 req/sec
- **Chains**: Ethereum, Arbitrum, Base, Polygon, Optimism, etc.
- **Env var**: `ONEINCH_API_KEY`

### Option B: LI.FI API
- **URL**: https://li.fi/
- **Free tier**: Available
- **Chains**: 20+ EVM chains
- **Env var**: `LIFI_API_KEY`

### Option C: 0x API
- **URL**: https://dashboard.0x.org/
- **Free tier**: 100k requests/month
- **Chains**: Ethereum, Arbitrum, Base, Polygon, etc.
- **Env var**: `ZEROX_API_KEY`

---

## 2. Bridge (Cross-Chain)

### LI.FI API (Swap + Bridge combined)
- **URL**: https://li.fi/
- **Supports**: Swap + Bridge in one API
- **Env var**: `LIFI_API_KEY`

---

## 3. NFT Marketplace

### Reservoir API (EVM chains)
- **URL**: https://dashboard.reservoir.tools/
- **Free tier**: 120 requests/min
- **Chains**: Ethereum, Arbitrum, Base, Polygon, Optimism
- **Env var**: `RESERVOIR_API_KEY`

### Magic Eden API (Solana)
- **URL**: https://api.magiceden.dev/
- **Free tier**: Available (rate limited)
- **No API key required for basic usage**

---

## 4. RPC Providers - Choose One

### Option A: Alchemy (Recommended)
- **URL**: https://dashboard.alchemy.com/
- **Free tier**: 300M compute units/month
- **Chains**: Ethereum, Arbitrum, Base, Polygon, Optimism
- **Env vars**:
  - `ALCHEMY_API_KEY`
  - Or individual: `ALCHEMY_ETH_URL`, `ALCHEMY_ARB_URL`, etc.

### Option B: Infura
- **URL**: https://app.infura.io/
- **Free tier**: 100k requests/day
- **Env var**: `INFURA_API_KEY`

### Option C: QuickNode
- **URL**: https://quicknode.com/
- **Free tier**: 10M API credits/month
- **Env var**: `QUICKNODE_API_KEY`

---

## .env.local Template

```bash
# Privy (already configured)
NEXT_PUBLIC_PRIVY_APP_ID=your-privy-app-id

# DEX Aggregator (choose one)
ONEINCH_API_KEY=your-1inch-api-key
# or
LIFI_API_KEY=your-lifi-api-key

# NFT Marketplace
RESERVOIR_API_KEY=your-reservoir-api-key

# RPC Provider
ALCHEMY_API_KEY=your-alchemy-api-key

# Alternative: Direct RPC URLs
NEXT_PUBLIC_RPC_ETHEREUM=https://eth-mainnet.g.alchemy.com/v2/YOUR_KEY
NEXT_PUBLIC_RPC_ARBITRUM=https://arb-mainnet.g.alchemy.com/v2/YOUR_KEY
NEXT_PUBLIC_RPC_BASE=https://base-mainnet.g.alchemy.com/v2/YOUR_KEY
NEXT_PUBLIC_RPC_POLYGON=https://polygon-mainnet.g.alchemy.com/v2/YOUR_KEY
```

---

## Priority Order

1. **1inch API** - For swaps (most important)
2. **Alchemy API** - For RPC calls and balance queries
3. **Reservoir API** - For NFT marketplace (already partially working)
4. **LI.FI API** - For bridge functionality

---

## Quick Start

1. Get 1inch API key: https://portal.1inch.dev/
2. Get Alchemy API key: https://dashboard.alchemy.com/
3. Get Reservoir API key: https://dashboard.reservoir.tools/
4. Add to `.env.local`:

```bash
NEXT_PUBLIC_PRIVY_APP_ID=cmimpnebf001pjv0ctl7oedn0
ONEINCH_API_KEY=your-key-here
ALCHEMY_API_KEY=your-key-here
RESERVOIR_API_KEY=your-key-here
```

5. Run: `npm run dev`

