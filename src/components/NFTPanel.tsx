'use client';

import { useState, useEffect } from 'react';
import { useGameStore } from '@/stores/gameStore';
import { EVM_CHAINS } from '@/lib/chains';
import type { NFTCollection, NFTItem } from '@/lib/services/nftService';

type ChainType = 'evm' | 'solana' | 'sui';

const CHAIN_OPTIONS = {
  evm: [
    { key: 'ethereum', name: 'Ethereum', icon: '⟠' },
    { key: 'arbitrum', name: 'Arbitrum', icon: '🔵' },
    { key: 'base', name: 'Base', icon: '🔷' },
    { key: 'polygon', name: 'Polygon', icon: '💜' },
    { key: 'optimism', name: 'Optimism', icon: '🔴' },
  ],
  solana: [{ key: 'solana', name: 'Solana', icon: '◎' }],
  sui: [{ key: 'sui', name: 'Sui', icon: '💧' }],
};

export function NFTPanel() {
  const { activePanel, setActivePanel } = useGameStore();
  const [chainType, setChainType] = useState<ChainType>('evm');
  const [selectedChain, setSelectedChain] = useState('ethereum');
  const [view, setView] = useState<'collections' | 'browse' | 'my'>('collections');
  const [collections, setCollections] = useState<NFTCollection[]>([]);
  const [nfts, setNfts] = useState<NFTItem[]>([]);
  const [selectedCollection, setSelectedCollection] = useState<NFTCollection | null>(null);
  const [selectedNFT, setSelectedNFT] = useState<NFTItem | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (activePanel !== 'nft') return;
    fetchCollections();
  }, [activePanel, selectedChain]);

  const fetchCollections = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/nft?action=collections&chain=${selectedChain}`);
      const data = await res.json();
      setCollections(data.collections || []);
    } catch (error) {
      console.error('Failed to fetch collections:', error);
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
    }
    setLoading(false);
  };

  const handleCollectionClick = (collection: NFTCollection) => {
    setSelectedCollection(collection);
    setView('browse');
    fetchNFTs(collection.address);
  };

  const handleBuy = (nft: NFTItem) => {
    alert(
      `Buy NFT:\n\n` +
      `Name: ${nft.name}\n` +
      `Collection: ${nft.collection}\n` +
      `Price: ${nft.price} ${nft.currency}\n` +
      `Chain: ${nft.chain}\n\n` +
      `This will open your wallet to sign the transaction.`
    );
  };

  if (activePanel !== 'nft') return null;

  return (
    <div className="defi-panel nft-panel">
      <div className="panel-header">
        <h2>🖼️ NFT Marketplace</h2>
        <button className="close-btn" onClick={() => setActivePanel('none')}>×</button>
      </div>

      <div className="npc-message">
        <div className="npc-avatar">🎨</div>
        <p>Browse and trade NFTs across multiple chains!</p>
      </div>

      {/* Chain Type Selector */}
      <div className="chain-type-selector">
        <button
          className={`chain-type-btn ${chainType === 'evm' ? 'active' : ''}`}
          onClick={() => { setChainType('evm'); setSelectedChain('ethereum'); }}
        >
          EVM Chains
        </button>
        <button
          className={`chain-type-btn ${chainType === 'solana' ? 'active' : ''}`}
          onClick={() => { setChainType('solana'); setSelectedChain('solana'); }}
        >
          ◎ Solana
        </button>
        <button
          className={`chain-type-btn ${chainType === 'sui' ? 'active' : ''}`}
          onClick={() => { setChainType('sui'); setSelectedChain('sui'); }}
        >
          💧 Sui
        </button>
      </div>

      {/* EVM Chain Selector */}
      {chainType === 'evm' && (
        <div className="evm-chain-selector">
          {CHAIN_OPTIONS.evm.map(chain => (
            <button
              key={chain.key}
              className={`evm-chain-btn ${selectedChain === chain.key ? 'active' : ''}`}
              onClick={() => setSelectedChain(chain.key)}
            >
              <span>{chain.icon}</span>
              <span>{chain.name}</span>
            </button>
          ))}
        </div>
      )}

      {/* View Tabs */}
      <div className="nft-tabs">
        <button
          className={`nft-tab ${view === 'collections' ? 'active' : ''}`}
          onClick={() => { setView('collections'); setSelectedCollection(null); }}
        >
          📚 Collections
        </button>
        <button
          className={`nft-tab ${view === 'browse' ? 'active' : ''}`}
          onClick={() => { setView('browse'); fetchNFTs(); }}
        >
          🔍 Browse
        </button>
        <button
          className={`nft-tab ${view === 'my' ? 'active' : ''}`}
          onClick={() => setView('my')}
        >
          👤 My NFTs
        </button>
      </div>

      {/* Content */}
      <div className="nft-content">
        {loading ? (
          <div className="nft-loading">
            <div className="loading-spinner" />
            <p>Loading...</p>
          </div>
        ) : view === 'collections' ? (
          <div className="nft-collections">
            {collections.length === 0 ? (
              <div className="nft-empty">No collections found on this chain</div>
            ) : (
              collections.map(collection => (
                <div
                  key={collection.address}
                  className="nft-collection-card"
                  onClick={() => handleCollectionClick(collection)}
                >
                  <div className="collection-image">{collection.image}</div>
                  <div className="collection-info">
                    <h3>{collection.name}</h3>
                    <p className="collection-symbol">{collection.symbol}</p>
                    <div className="collection-stats">
                      <div className="stat">
                        <span className="stat-label">Floor</span>
                        <span className="stat-value">{collection.floorPrice} {collection.currency}</span>
                      </div>
                      <div className="stat">
                        <span className="stat-label">24h Vol</span>
                        <span className="stat-value">{collection.volume24h} {collection.currency}</span>
                      </div>
                      <div className="stat">
                        <span className="stat-label">Owners</span>
                        <span className="stat-value">{collection.owners.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : view === 'browse' ? (
          <div className="nft-browse">
            {selectedCollection && (
              <div className="collection-header">
                <button className="back-btn" onClick={() => setView('collections')}>← Back</button>
                <h3>{selectedCollection.image} {selectedCollection.name}</h3>
              </div>
            )}
            <div className="nft-grid">
              {nfts.length === 0 ? (
                <div className="nft-empty">No NFTs found</div>
              ) : (
                nfts.map(nft => (
                  <div key={nft.id} className="nft-card">
                    <div className="nft-image">{nft.image}</div>
                    <div className="nft-info">
                      <h4>{nft.name}</h4>
                      <p className="nft-collection">{nft.collection}</p>
                      <div className="nft-price">
                        <span>{nft.price} {nft.currency}</span>
                        <span className="nft-marketplace">{nft.marketplace}</span>
                      </div>
                      <button className="buy-btn" onClick={() => handleBuy(nft)}>
                        Buy Now
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        ) : (
          <div className="nft-my">
            <div className="nft-empty">
              <p>Connect your wallet to view your NFTs</p>
              <button className="connect-btn">Connect Wallet</button>
            </div>
          </div>
        )}
      </div>

      {/* NFT Detail Modal */}
      {selectedNFT && (
        <div className="nft-modal" onClick={() => setSelectedNFT(null)}>
          <div className="nft-modal-content" onClick={e => e.stopPropagation()}>
            <button className="close-btn" onClick={() => setSelectedNFT(null)}>×</button>
            <div className="nft-detail-image">{selectedNFT.image}</div>
            <h3>{selectedNFT.name}</h3>
            <p>{selectedNFT.description}</p>
            <div className="nft-detail-info">
              <div className="info-row">
                <span>Collection</span>
                <span>{selectedNFT.collection}</span>
              </div>
              <div className="info-row">
                <span>Price</span>
                <span className="highlight">{selectedNFT.price} {selectedNFT.currency}</span>
              </div>
              <div className="info-row">
                <span>Owner</span>
                <span>{selectedNFT.owner}</span>
              </div>
            </div>
            {selectedNFT.attributes && (
              <div className="nft-attributes">
                <h4>Attributes</h4>
                <div className="attributes-grid">
                  {selectedNFT.attributes.map((attr, i) => (
                    <div key={i} className="attribute">
                      <span className="attr-type">{attr.trait_type}</span>
                      <span className="attr-value">{attr.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <button className="buy-btn large" onClick={() => handleBuy(selectedNFT)}>
              Buy for {selectedNFT.price} {selectedNFT.currency}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

