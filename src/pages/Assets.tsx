import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getAllAssets } from "../services/assets";

export default function Assets() {
  const [assets, setAssets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    async function loadAssets() {
      try {
        const data = await getAllAssets();
        setAssets(data);
        setLoading(false);
      } catch (err: any) {
        setError(err?.message || "Failed to load assets");
        setLoading(false);
      }
    }
    loadAssets();
  }, []);

  const handleAssetClick = (ticker: string) => {
    navigate(`/assets/${ticker}`);
  };

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  return (
    <div className="assets-page">
      <div className="assets-header">
        <h1>Assets</h1>
      </div>

      <div className="assets-content">
        {loading ? (
          <div className="loading">Loading assets...</div>
        ) : assets.length === 0 ? (
          <div className="empty-state">No assets available.</div>
        ) : (
          <div className="assets-grid">
            {assets.map((asset) => (
              <div key={asset.ticker} className="asset-card" onClick={() => handleAssetClick(asset.ticker)}>
                <div className="asset-card-header">
                  <div className="asset-symbol">{asset.ticker}</div>
                  <div className="asset-name">{asset.name || asset.ticker}</div>
                </div>
                <div className="asset-card-body">
                  <div className="stat">
                    <div className="stat-label">Last Price</div>
                    <div className="stat-value">
                      {typeof asset.lastPrice === 'number' ? `$${asset.lastPrice.toFixed(2)}` : '--'}
                    </div>
                  </div>
                  <div className="stat">
                    <div className="stat-label">Change</div>
                    <div className={`stat-value ${asset.priceChange >= 0 ? 'positive' : 'negative'}`}>
                      {typeof asset.priceChange === 'number' ? `${asset.priceChange >= 0 ? '+' : ''}${asset.priceChange.toFixed(2)}%` : '--'}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <style>{`
        .assets-page { 
          display: flex;
          flex-direction: column;
          height: 100%;
          width: 100%;
        }
        .assets-header {
          padding: 24px 32px;
          border-bottom: 1px solid var(--border-light);
        }
        .assets-content {
          padding: 24px 32px;
          flex: 1;
          overflow: auto;
        }
        .assets-grid { 
          display: grid; 
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); 
          gap: 24px; 
          width: 100%;
        }
        .asset-card { 
          background: var(--bg-primary); 
          border-radius: 12px; 
          padding: 16px; 
          box-shadow: var(--shadow-sm); 
          border: 1px solid var(--border-light);
          transition: all 0.2s ease;
        }
        .asset-card:hover {
          transform: translateY(-2px);
          box-shadow: var(--shadow-md);
          border-color: var(--border);
        }
        .asset-card-header { 
          display: flex; 
          align-items: flex-start; 
          justify-content: space-between; 
          margin-bottom: 16px;
        }
        .asset-symbol { 
          font-weight: 600; 
          font-size: 18px;
          color: var(--text);
        }
        .asset-name { 
          color: var(--text-secondary); 
          font-size: 14px;
          margin-top: 4px;
        }
        .asset-card-body { 
          display: flex; 
          gap: 24px; 
          justify-content: space-between;
        }
        .stat-label { 
          color: var(--text-secondary); 
          font-size: 13px;
          margin-bottom: 4px;
        }
        .stat-value { 
          font-weight: 600;
          font-size: 16px;
        }
        .positive { color: var(--success); }
        .negative { color: var(--danger); }
        .loading, .empty-state { 
          padding: 32px;
          color: var(--text-secondary);
          text-align: center;
          font-size: 15px;
        }
        .error-message { 
          color: var(--danger); 
          padding: 32px;
          text-align: center;
          font-size: 15px;
        }
      `}</style>
    </div>
  );
}