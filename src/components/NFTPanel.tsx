'use client';

import { useState, useEffect, useCallback } from 'react';
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
  const { authenticated, user } = usePrivy();
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

  // Fetch collections when panel opens or chain changes
  useEffect(() => {
    if (activePanel !== 'nft') return;
    fetchCollections();
  }, [activePanel, selectedChain]);

  // Fetch user NFTs when viewing "my" tab
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
      setBuyError('지갑을 먼저 연결해주세요');
      return;
    }

    setBuying(true);
    setBuyError(null);
    setBuySuccess(false);

    try {
      // Get buy transaction from API
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

      // Handle redirect (for Solana/Magic Eden)
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

      // For EVM chains, execute transaction with wallet
      const wallet = wallets?.[0];
      if (!wallet) {
        throw new Error('No wallet connected');
      }

      // Get provider from wallet
      const provider = await wallet.getEthereumProvider();
      
      // Execute each step in the transaction path
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
        // Refresh NFTs
        if (selectedCollection) {
          fetchNFTs(selectedCollection.address);
        }
      }, 3000);

    } catch (error: any) {
      console.error('Buy error:', error);
      setBuyError(error.message || '구매에 실패했습니다');
    }

    setBuying(false);
  };

  const handleOpenExternal = (nft: NFTItem) => {
    if (nft.buyUrl) {
      window.open(nft.buyUrl, '_blank');
    } else {
      // Fallback URLs
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
        <h2>수집가의 전시관</h2>
        <button className="rpg-close-btn" onClick={() => setActivePanel('none')}>
          <span>✕</span>
        </button>
      </div>

      <div className="rpg-npc-dialog">
        <div className="npc-portrait">
          <span>🎨</span>
        </div>
        <div className="dialog-bubble">
          <p>"환영합니다, 예술 애호가여. 실시간 마켓플레이스 데이터를 확인하고 거래하실 수 있습니다."</p>
        </div>
      </div>

      {/* Chain Selector */}
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

      {/* View Tabs */}
      <div className="nft-view-tabs">
        <button
          className={`nft-tab-btn ${view === 'collections' ? 'active' : ''}`}
          onClick={() => { setView('collections'); setSelectedCollection(null); }}
        >
          <span>📚</span> 컬렉션
        </button>
        <button
          className={`nft-tab-btn ${view === 'browse' ? 'active' : ''}`}
          onClick={() => { setView('browse'); fetchNFTs(); }}
        >
          <span>🔍</span> 둘러보기
        </button>
        <button
          className={`nft-tab-btn ${view === 'my' ? 'active' : ''}`}
          onClick={() => setView('my')}
        >
          <span>👤</span> 내 NFT
        </button>
      </div>

      {/* Content */}
      <div className="nft-content-area">
        {loading ? (
          <div className="nft-loading-state">
            <div className="loading-spinner" />
            <p>마켓플레이스 데이터 로딩 중...</p>
          </div>
        ) : view === 'collections' ? (
          <div className="nft-collections-grid">
            {collections.length === 0 ? (
              <div className="nft-empty-state">
                <span>📭</span>
                <p>컬렉션을 불러오는 중입니다...</p>
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
                        <span className="stat-label">바닥가</span>
                        <span className="stat-value gold">{collection.floorPrice} {collection.currency}</span>
                      </div>
                      <div className="stat-item">
                        <span className="stat-label">24h 거래량</span>
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
                  ← 뒤로
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
                  <p>판매 중인 NFT가 없습니다</p>
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
                <p>지갑을 연결하면 보유한 NFT를 확인할 수 있습니다</p>
              </div>
            ) : myNfts.length === 0 ? (
              <div className="nft-empty-state">
                <span>📦</span>
                <p>이 체인에 보유한 NFT가 없습니다</p>
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

      {/* NFT Detail Modal */}
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
                  <span className="label">가격</span>
                  <span className="value gold">{selectedNFT.price} {selectedNFT.currency}</span>
                </div>
                <div className="detail-item">
                  <span className="label">소유자</span>
                  <span className="value">{selectedNFT.owner}</span>
                </div>
                <div className="detail-item">
                  <span className="label">마켓플레이스</span>
                  <span className="value">{selectedNFT.marketplace}</span>
                </div>
              </div>

              {selectedNFT.attributes && selectedNFT.attributes.length > 0 && (
                <div className="modal-attributes">
                  <h4>속성</h4>
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
                  ✓ 거래가 시작되었습니다!
                </div>
              )}

              <div className="modal-actions">
                <button 
                  className={`rpg-action-btn ${buying ? 'loading' : ''} ${buySuccess ? 'success' : ''}`}
                  onClick={() => handleBuy(selectedNFT)}
                  disabled={!authenticated || buying || buySuccess}
                >
                  {!authenticated ? (
                    <span>지갑 연결 필요</span>
                  ) : buying ? (
                    <>
                      <span className="btn-spinner" />
                      <span>구매 진행 중...</span>
                    </>
                  ) : buySuccess ? (
                    <>
                      <span className="btn-icon">✓</span>
                      <span>성공!</span>
                    </>
                  ) : (
                    <>
                      <span className="btn-icon">💎</span>
                      <span>{selectedNFT.price} {selectedNFT.currency}로 구매</span>
                    </>
                  )}
                </button>

                <button 
                  className="rpg-secondary-btn"
                  onClick={() => handleOpenExternal(selectedNFT)}
                >
                  <span>🔗</span>
                  <span>마켓플레이스에서 보기</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
