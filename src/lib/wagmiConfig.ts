import { createConfig, http } from 'wagmi';
import { megaethTestnet } from './chains';
import { mainnet, arbitrum, base, polygon } from 'wagmi/chains';

export const wagmiConfig = createConfig({
  chains: [megaethTestnet, mainnet, arbitrum, base, polygon],
  transports: {
    [megaethTestnet.id]: http(),
    [mainnet.id]: http(),
    [arbitrum.id]: http(),
    [base.id]: http(),
    [polygon.id]: http(),
  },
});

declare module 'wagmi' {
  interface Register {
    config: typeof wagmiConfig;
  }
}

