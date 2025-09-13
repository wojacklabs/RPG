# Required API Keys for DeFi RPG

## ✅ No API Key Required

### Uniswap V3 (Token Swap)
- **Chains**: Ethereum, Arbitrum, Base, Polygon, Optimism
- **How it works**: Direct smart contract interaction via SDK
- **Status**: Fully functional without any API key

---

## 🔑 Required Keys

### 1. Privy (Authentication)
- **Purpose**: User authentication and wallet management
- **Key**: `NEXT_PUBLIC_PRIVY_APP_ID`
- **Get it**: [Privy Dashboard](https://dashboard.privy.io/)
- **Setup**:
  1. Create an app on Privy Dashboard
  2. Copy your App ID
  3. Add `http://localhost:3000` to Allowed Origins

### 2. Reservoir (NFT Marketplace) - Optional
- **Purpose**: Fetching NFT collections for EVM chains
- **Key**: `RESERVOIR_API_KEY`
- **Get it**: [Reservoir Dashboard](https://dashboard.reservoir.tools/)
- **Note**: Works without key but rate-limited

---

## `.env.local` Example

```bash
# Required for authentication
NEXT_PUBLIC_PRIVY_APP_ID=your-privy-app-id

# Optional - for NFT marketplace
RESERVOIR_API_KEY=your-reservoir-api-key
```

---

## Feature Status

| Feature | API Key | Status |
|---------|---------|--------|
| **Token Swap** | ❌ None | ✅ Uniswap V3 direct contract |
| **Authentication** | Privy | Required |
| **NFT (EVM)** | Reservoir | Optional (rate-limited without) |
| **NFT (Solana)** | None | Magic Eden public API |
| **Bridge** | None | Basic estimates |
| **Staking** | None | Protocol info display |
| **Liquidity** | None | Pool info display |

---

## Supported Chains for Swap

- Ethereum (chainId: 1)
- Arbitrum (chainId: 42161)
- Base (chainId: 8453)
- Polygon (chainId: 137)
- Optimism (chainId: 10)
