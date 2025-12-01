'use client';

import { PrivyProvider as PrivyAuthProvider } from '@privy-io/react-auth';
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { wagmiConfig } from '@/lib/wagmiConfig';
import { megaethTestnet } from '@/lib/chains';
import { ReactNode, useState } from 'react';
import { mainnet } from 'wagmi/chains';

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <PrivyAuthProvider
      appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID || 'clpispdty00ycl80fpueukbhl'}
      config={{
        loginMethods: ['email', 'wallet', 'google', 'discord'],
        appearance: {
          theme: 'dark',
          accentColor: '#E8B838',
          showWalletLoginFirst: false,
        },
        embeddedWallets: {
          createOnLogin: 'users-without-wallets',
        },
        defaultChain: mainnet,
        supportedChains: [mainnet, megaethTestnet],
      }}
    >
      <QueryClientProvider client={queryClient}>
        <WagmiProvider config={wagmiConfig}>
          {children}
        </WagmiProvider>
      </QueryClientProvider>
    </PrivyAuthProvider>
  );
}
