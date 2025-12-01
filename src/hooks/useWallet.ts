'use client';

import { usePrivy, useWallets } from '@privy-io/react-auth';
import { useEffect } from 'react';
import { useWalletStore } from '@/stores/walletStore';
import { useBalance } from 'wagmi';
import { megaethTestnet } from '@/lib/chains';

export function useWallet() {
  const { ready, authenticated, user, login, logout } = usePrivy();
  const { wallets } = useWallets();
  const { 
    setAddress, 
    setIsConnected, 
    setTokens,
    address,
    setIsLoading 
  } = useWalletStore();

  const { data: balanceData } = useBalance({
    address: address as `0x${string}` | undefined,
    chainId: megaethTestnet.id,
  });

  useEffect(() => {
    if (ready && authenticated && wallets.length > 0) {
      const primaryWallet = wallets[0];
      setAddress(primaryWallet.address);
      setIsConnected(true);
    } else {
      setAddress(null);
      setIsConnected(false);
    }
  }, [ready, authenticated, wallets, setAddress, setIsConnected]);

  useEffect(() => {
    if (balanceData && address) {
      setTokens([
        {
          symbol: 'ETH',
          name: 'Ethereum',
          balance: balanceData.formatted,
          decimals: 18,
          address: '0x0000000000000000000000000000000000000000',
          chainId: megaethTestnet.id,
        },
      ]);
    }
  }, [balanceData, address, setTokens]);

  const connect = async () => {
    setIsLoading(true);
    try {
      await login();
    } catch (error) {
      console.error('Failed to connect:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const disconnect = async () => {
    setIsLoading(true);
    try {
      await logout();
      setAddress(null);
      setIsConnected(false);
      setTokens([]);
    } catch (error) {
      console.error('Failed to disconnect:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    ready,
    authenticated,
    user,
    address,
    connect,
    disconnect,
    wallets,
  };
}

