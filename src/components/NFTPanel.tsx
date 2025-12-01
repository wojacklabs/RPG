'use client';

import { useState, useEffect } from 'react';
import { useGameStore } from '@/stores/gameStore';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import type { NFTCollection, NFTItem } from '@/lib/services/nftService';

const CHAIN_OPTIONS = [
  { key: 'ethereum', name: 'Ethereum', icon: '⟠' },
  { key: 'arbitrum', name: 'Arbitrum', icon: '🔵' },
  { key: 'base', name: 'Base', icon: '🔷' },
  { key: 'polygon', name: 'Polygon', icon: '💜' },
  { key: 'solana', name: 'Solana', icon: '◎' },
];

export function NFTPanel() {
  const { activePanel, setActivePanel } = useGameStore();
  const { authenticated } = usePrivy();
  const { wallets } = useWallets();
  
  const [selectedChain, setSelectedChain] = useState('ethereum');
  const [view, setView] = useState<'collections' | 'browse' | 'my'>('collections');
  const [collections, setCollections] = useState<NFTCollection[]>([]);
  const [nfts, setNfts] = useState<NFTItem[]>([]);
  const [myNfts, setMyNfts] = useState<NFTItem[]>([]);
  const [selectedCollection, setSelectedCollection] = useState<NFTCollection | null>(null);
  const [selectedNFT, setSelectedNFT] = useState<NFTItem | null>(null);
  const [loading, setLoading] = useState(false);
  const [buying, setBuying] = useState(false);
  const [buyError, setBuyError] = useState<string | null>(null);
  const [buySuccess, setBuySuccess] = useState(false);

  const walletAddress = wallets?.[0]?.address;

  useEffect(() => {
    if (activePanel !== 'nft') return;
    fetchCollections();
  }, [activePanel, selectedChain]);

  useEffect(() => {
    if (activePanel !== 'nft' || view !== 'my' || !walletAddress) return;
    fetchMyNFTs();
  }, [activePanel, view, walletAddress, selectedChain]);

  const fetchCollections = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/nft?action=collections&chain=${selectedChain}`);
      const data = await res.json();
      setCollections(data.collections || []);
    } catch (error) {
      console.error('Failed to fetch collections:', error);
      setCollections([]);
    }
    setLoading(false);
  };

  const fetchNFTs = async (collectionAddress?: string) => {
    setLoading(true);
    try {
      const url = collectionAddress
        ? `/api/nft?action=nfts&chain=${selectedChain}&collection=${collectionAddress}`
        : `/api/nft?action=nfts&chain=${selectedChain}`;
      const res = await fetch(url);
      const data = await res.json();
      setNfts(data.nfts || []);
    } catch (error) {
      console.error('Failed to fetch NFTs:', error);
      setNfts([]);
    }
    setLoading(false);
  };

  const fetchMyNFTs = async () => {
    if (!walletAddress) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/nft?action=user&chain=${selectedChain}&address=${walletAddress}`);
      const data = await res.json();
      setMyNfts(data.nfts || []);
    } catch (error) {
      console.error('Failed to fetch user NFTs:', error);
      setMyNfts([]);
    }
    setLoading(false);
  };

  const handleCollectionClick = (collection: NFTCollection) => {
    setSelectedCollection(collection);
    setView('browse');
    fetchNFTs(collection.address);
  };

  const handleBuy = async (nft: NFTItem) => {
    if (!authenticated || !walletAddress) {
      setBuyError('Please connect your wallet first');
      return;
    }

    setBuying(true);
    setBuyError(null);
    setBuySuccess(false);

    try {
      const res = await fetch('/api/nft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'buy',
          chain: selectedChain,
          collectionAddress: nft.collectionAddress,
          tokenId: nft.tokenId,
          buyer: walletAddress,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to prepare transaction');
      }

      const txData = data.transaction;

      if (txData.type === 'redirect') {
        window.open(txData.url, '_blank');
        setBuySuccess(true);
        setTimeout(() => {
          setSelectedNFT(null);
          setBuySuccess(false);
        }, 2000);
        setBuying(false);
        return;
      }

      const wallet = wallets?.[0];
      if (!wallet) {
        throw new Error('No wallet connected');
      }

      const provider = await wallet.getEthereumProvider();
      
      if (txData.steps) {
        for (const step of txData.steps) {
          for (const item of step.items || []) {
            if (item.status === 'incomplete') {
              const txHash = await provider.request({
                method: 'eth_sendTransaction',
                params: [{
                  from: walletAddress,
                  to: item.data?.to,
                  data: item.data?.data,
                  value: item.data?.value ? `0x${BigInt(item.data.value).toString(16)}` : undefined,
                }],
              });
              console.log('Transaction sent:', txHash);
            }
          }
        }
      }

      setBuySuccess(true);
      setTimeout(() => {
        setSelectedNFT(null);
        setBuySuccess(false);
        if (selectedCollection) {
          fetchNFTs(selectedCollection.address);
        }
      }, 3000);

    } catch (error: any) {
      console.error('Buy error:', error);
      setBuyError(error.message || 'Purchase failed');
    }

    setBuying(false);
  };

  const handleOpenExternal = (nft: NFTItem) => {
    if (nft.buyUrl) {
      window.open(nft.buyUrl, '_blank');
    } else {
      if (selectedChain === 'ethereum' || selectedChain === 'arbitrum' || selectedChain === 'base' || selectedChain === 'polygon') {
        window.open(`https://opensea.io/assets/${selectedChain}/${nft.collectionAddress}/${nft.tokenId}`, '_blank');
      } else if (selectedChain === 'solana') {
        window.open(`https://magiceden.io/item-details/${nft.tokenId}`, '_blank');
      }
    }
  };

  if (activePanel !== 'nft') return null;

  return (
    <div className="rpg-panel nft-panel-rpg">
      <div className="panel-corner top-left" />
      <div className="panel-corner top-right" />
      <div className="panel-corner bottom-left" />
      <div className="panel-corner bottom-right" />

      <div className="rpg-panel-header">
        <div className="header-icon">🖼️</div>
        <h2>Collector's Gallery</h2>
        <button className="rpg-close-btn" onClick={() => setActivePanel('none')}>
          <span>✕</span>
        </button>
      </div>

      <div className="rpg-npc-dialog">
        <div className="npc-portrait">
          <span>🎨</span>
        </div>
        <div className="dialog-bubble">
          <p>"Welcome, art enthusiast. Browse and trade NFTs from live marketplace data."</p>
        </div>
      </div>

      <div className="rpg-chain-selector">
        <div className="chain-network-selector">
          {CHAIN_OPTIONS.map(chain => (
            <button
              key={chain.key}
              className={`network-btn ${selectedChain === chain.key ? 'active' : ''}`}
              onClick={() => {
                setSelectedChain(chain.key);
                setSelectedCollection(null);
                setView('collections');
              }}
            >
              <span className="network-icon">{chain.icon}</span>
              <span className="network-name">{chain.name}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="nft-view-tabs">
        <button
          className={`nft-tab-btn ${view === 'collections' ? 'active' : ''}`}
          onClick={() => { setView('collections'); setSelectedCollection(null); }}
        >
          <span>📚</span> Collections
        </button>
        <button
          className={`nft-tab-btn ${view === 'browse' ? 'active' : ''}`}
          onClick={() => { setView('browse'); fetchNFTs(); }}
        >
          <span>🔍</span> Browse
        </button>
        <button
          className={`nft-tab-btn ${view === 'my' ? 'active' : ''}`}
          onClick={() => setView('my')}
        >
          <span>👤</span> My NFTs
        </button>
      </div>

      <div className="nft-content-area">
        {loading ? (
          <div className="nft-loading-state">
            <div className="loading-spinner" />
            <p>Loading marketplace data...</p>
          </div>
        ) : view === 'collections' ? (
          <div className="nft-collections-grid">
            {collections.length === 0 ? (
              <div className="nft-empty-state">
                <span>📭</span>
                <p>Loading collections...</p>
              </div>
            ) : (
              collections.map(collection => (
                <div
                  key={collection.address}
                  className="nft-collection-card-rpg"
                  onClick={() => handleCollectionClick(collection)}
                >
                  <div className="collection-thumbnail">
                    {collection.image.startsWith('http') ? (
                      <img src={collection.image} alt={collection.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '6px' }} />
                    ) : (
                      collection.image
                    )}
                  </div>
                  <div className="collection-details">
                    <h3>{collection.name}</h3>
                    <span className="collection-symbol">{collection.symbol}</span>
                    <div className="collection-stats-row">
                      <div className="stat-item">
                        <span className="stat-label">Floor</span>
                        <span className="stat-value gold">{collection.floorPrice} {collection.currency}</span>
                      </div>
                      <div className="stat-item">
                        <span className="stat-label">24h Vol</span>
                        <span className="stat-value">{collection.volume24h} {collection.currency}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : view === 'browse' ? (
          <div className="nft-browse-area">
            {selectedCollection && (
              <div className="browse-header">
                <button className="back-btn-rpg" onClick={() => setView('collections')}>
                  ← Back
                </button>
                <h3>
                  {selectedCollection.image.startsWith('http') ? '🖼️' : selectedCollection.image} {selectedCollection.name}
                </h3>
              </div>
            )}
            <div className="nft-items-grid">
              {nfts.length === 0 ? (
                <div className="nft-empty-state">
                  <span>🖼️</span>
                  <p>No NFTs listed for sale</p>
                </div>
              ) : (
                nfts.map(nft => (
                  <div key={nft.id} className="nft-item-card-rpg" onClick={() => setSelectedNFT(nft)}>
                    <div className="nft-item-image">
                      {nft.image.startsWith('http') ? (
                        <img src={nft.image} alt={nft.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        nft.image
                      )}
                    </div>
                    <div className="nft-item-info">
                      <h4>{nft.name}</h4>
                      <span className="nft-item-collection">{nft.collection}</span>
                      <div className="nft-item-price">
                        <span className="price-value">{nft.price} {nft.currency}</span>
                        <span className="marketplace-tag">{nft.marketplace}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        ) : (
          <div className="nft-my-area">
            {!authenticated ? (
              <div className="nft-empty-state">
                <span>🔒</span>
                <p>Connect wallet to view your NFTs</p>
              </div>
            ) : myNfts.length === 0 ? (
              <div className="nft-empty-state">
                <span>📦</span>
                <p>No NFTs found on this chain</p>
              </div>
            ) : (
              <div className="nft-items-grid">
                {myNfts.map(nft => (
                  <div key={nft.id} className="nft-item-card-rpg" onClick={() => setSelectedNFT(nft)}>
                    <div className="nft-item-image">
                      {nft.image.startsWith('http') ? (
                        <img src={nft.image} alt={nft.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        nft.image
                      )}
                    </div>
                    <div className="nft-item-info">
                      <h4>{nft.name}</h4>
                      <span className="nft-item-collection">{nft.collection}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {selectedNFT && (
        <div className="nft-modal-overlay" onClick={() => { setSelectedNFT(null); setBuyError(null); }}>
          <div className="nft-modal-rpg" onClick={e => e.stopPropagation()}>
            <button className="rpg-close-btn modal-close" onClick={() => { setSelectedNFT(null); setBuyError(null); }}>
              <span>✕</span>
            </button>
            
            <div className="modal-nft-image">
              {selectedNFT.image.startsWith('http') ? (
                <img src={selectedNFT.image} alt={selectedNFT.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              ) : (
                selectedNFT.image
              )}
            </div>
            
            <div className="modal-nft-info">
              <h3>{selectedNFT.name}</h3>
              <p className="modal-collection">{selectedNFT.collection}</p>
              
              <div className="modal-details">
                <div className="detail-item">
                  <span className="label">Price</span>
                  <span className="value gold">{selectedNFT.price} {selectedNFT.currency}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Owner</span>
                  <span className="value">{selectedNFT.owner}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Marketplace</span>
                  <span className="value">{selectedNFT.marketplace}</span>
                </div>
              </div>

              {selectedNFT.attributes && selectedNFT.attributes.length > 0 && (
                <div className="modal-attributes">
                  <h4>Attributes</h4>
                  <div className="attributes-list">
                    {selectedNFT.attributes.slice(0, 6).map((attr, i) => (
                      <div key={i} className="attribute-tag">
                        <span className="attr-type">{attr.trait_type}</span>
                        <span className="attr-value">{attr.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {buyError && (
                <div className="buy-error-message">
                  ⚠️ {buyError}
                </div>
              )}

              {buySuccess && (
                <div className="buy-success-message">
                  ✓ Transaction initiated!
                </div>
              )}

              <div className="modal-actions">
                <button 
                  className={`rpg-action-btn ${buying ? 'loading' : ''} ${buySuccess ? 'success' : ''}`}
                  onClick={() => handleBuy(selectedNFT)}
                  disabled={!authenticated || buying || buySuccess}
                >
                  {!authenticated ? (
                    <span>Connect Wallet</span>
                  ) : buying ? (
                    <>
                      <span className="btn-spinner" />
                      <span>Processing...</span>
                    </>
                  ) : buySuccess ? (
                    <>
                      <span className="btn-icon">✓</span>
                      <span>Success!</span>
                    </>
                  ) : (
                    <>
                      <span className="btn-icon">💎</span>
                      <span>Buy for {selectedNFT.price} {selectedNFT.currency}</span>
                    </>
                  )}
                </button>

                <button 
                  className="rpg-secondary-btn"
                  onClick={() => handleOpenExternal(selectedNFT)}
                >
                  <span>🔗</span>
                  <span>View on Marketplace</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
