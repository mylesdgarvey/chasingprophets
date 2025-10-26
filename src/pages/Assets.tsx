import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { getAllAssets } from "../services/assets";

type ViewState = "root" | "letter" | "results";

type AssetMeta = {
  ticker: string;
  name?: string;
  market?: string;
  lastPrice?: number | null;
  priceChange?: number | null;
};

const OPTION_CARDS = [
  {
    key: "ticker" as const,
    title: "By Ticker Spelling",
    description: "Browse tickers alphabetically to jump straight to the assets you need.",
    enabled: true
  },
  {
    key: "prophets" as const,
    title: "By Top Prophets",
    description: "Coming soon — discover the analysts driving the strongest signals.",
    enabled: false
  },
  {
    key: "forecasts" as const,
    title: "By Top Forecasts",
    description: "Rank opportunities by projected performance (feature in development).",
    enabled: false
  },
  {
    key: "industry" as const,
    title: "By Industry",
    description: "Segment the universe by sector or vertical (feature in development).",
    enabled: false
  }
];

const LETTER_BUCKETS = [
  "A","B","C","D","E","F","G","H","I","J","K","L",
  "M","N","O","P","Q","R","S","T","U","V","W","X","Y","Z",
  "#"
];

export default function Assets() {
  const [assets, setAssets] = useState<AssetMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<ViewState>("root");
  const [selectedLetter, setSelectedLetter] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;
    async function loadAssets() {
      try {
        const data = await getAllAssets();
        if (!isMounted) return;
        const sorted = [...data].sort((a, b) => (a.ticker || "").localeCompare(b.ticker || ""));
        setAssets(sorted);
        setLoading(false);
      } catch (err: any) {
        if (!isMounted) return;
        setError(err?.message || "Failed to load assets");
        setLoading(false);
      }
    }
    loadAssets();
    return () => {
      isMounted = false;
    };
  }, []);

  const assetsByLetter = useMemo(() => {
    const buckets: Record<string, AssetMeta[]> = LETTER_BUCKETS.reduce((acc, letter) => {
      acc[letter] = [];
      return acc;
    }, {} as Record<string, AssetMeta[]>);

    assets.forEach(asset => {
      const symbol = (asset.ticker || "").toUpperCase();
      if (!symbol) return;
      const firstChar = symbol[0];
      const bucketKey = LETTER_BUCKETS.includes(firstChar) ? firstChar : "#";
      buckets[bucketKey].push(asset);
    });
    return buckets;
  }, [assets]);

  const filteredAssets = useMemo(() => {
    if (!selectedLetter) return [];
    return assetsByLetter[selectedLetter] || [];
  }, [assetsByLetter, selectedLetter]);

  const handleAssetClick = (ticker: string) => {
    navigate(`/assets/${ticker}`);
  };

  const handleOptionSelect = (key: typeof OPTION_CARDS[number]["key"]) => {
    if (key !== "ticker") return;
    setView("letter");
    setSelectedLetter(null);
  };

  const handleLetterSelect = (letter: string) => {
    if (!assetsByLetter[letter]?.length) return;
    setSelectedLetter(letter);
    setView("results");
  };

  const resetToRoot = () => {
    setView("root");
    setSelectedLetter(null);
  };

  const backToLetters = () => {
    setView("letter");
  };

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  return (
    <div className="assets-page">
      <div className="assets-header">
        <div>
          <h1>Asset Explorer</h1>
          <p className="assets-subtitle">Navigate the universe of tracked symbols with progressive filters.</p>
        </div>
        <div className="header-actions">
          {view !== "root" && (
            <button className="ghost-btn" onClick={view === "results" ? backToLetters : resetToRoot}>
              ← {view === "results" ? "Back to Letters" : "Back to Options"}
            </button>
          )}
          {view === "results" && selectedLetter && (
            <button className="ghost-btn" onClick={resetToRoot}>
              Reset
            </button>
          )}
        </div>
      </div>

      <div className="assets-content">
        {loading ? (
          <div className="loading">Loading assets...</div>
        ) : assets.length === 0 ? (
          <div className="empty-state">No assets available.</div>
        ) : (
          <>
            {view === "root" && (
              <div className="option-grid">
                {OPTION_CARDS.map(option => (
                  <button
                    key={option.key}
                    className={`option-card ${option.enabled ? "" : "disabled"}`}
                    onClick={() => option.enabled && handleOptionSelect(option.key)}
                    disabled={!option.enabled}
                  >
                    <div className="option-card-title">{option.title}</div>
                    <div className="option-card-description">{option.description}</div>
                    {!option.enabled && <span className="soon-tag">Locked</span>}
                  </button>
                ))}
              </div>
            )}

            {view === "letter" && (
              <div className="letter-stage">
                <h2>Select a letter</h2>
                <p className="stage-helper">Choose the first letter of the ticker you want to explore.</p>
                <div className="letter-grid">
                  {LETTER_BUCKETS.map(letter => {
                    const count = assetsByLetter[letter]?.length || 0;
                    const disabled = count === 0;
                    return (
                      <button
                        key={letter}
                        className={`letter-card ${disabled ? "disabled" : ""}`}
                        onClick={() => handleLetterSelect(letter)}
                        disabled={disabled}
                      >
                        <span className="letter-label">{letter === "#" ? "#" : letter}</span>
                        <span className="letter-count">{count} {count === 1 ? "match" : "matches"}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {view === "results" && selectedLetter && (
              <div className="results-stage">
                <div className="results-header">
                  <h2>
                    {selectedLetter === "#" ? "Tickers starting with digits or symbols" : `Tickers starting with “${selectedLetter}”`}
                  </h2>
                  <p className="stage-helper">
                    Showing {filteredAssets.length} {filteredAssets.length === 1 ? "asset" : "assets"}. Click a card to open the detailed dashboard.
                  </p>
                </div>
                <div className="assets-grid refined">
                  {filteredAssets.map(asset => (
                    <div key={asset.ticker} className="asset-card refined" onClick={() => handleAssetClick(asset.ticker)}>
                      <div className="asset-card-header">
                        <div>
                          <div className="asset-symbol">{asset.ticker}</div>
                          <div className="asset-name">{asset.name || asset.ticker}</div>
                        </div>
                        <div className="asset-market">{asset.market || "Market N/A"}</div>
                      </div>
                      <div className="asset-card-body">
                        <div className="stat">
                          <div className="stat-label">Last Price</div>
                          <div className="stat-value">
                            {typeof asset.lastPrice === "number" ? `$${asset.lastPrice.toFixed(2)}` : "--"}
                          </div>
                        </div>
                        <div className="stat">
                          <div className="stat-label">Change</div>
                          <div className={`stat-value ${Number(asset.priceChange) >= 0 ? "positive" : "negative"}`}>
                            {typeof asset.priceChange === "number"
                              ? `${asset.priceChange >= 0 ? "+" : ""}${asset.priceChange.toFixed(2)}%`
                              : "--"}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <style>{`
        .assets-page {
          display: flex;
          flex-direction: column;
          height: 100%;
          width: 100%;
          background: #f6f7fb;
        }
        .assets-header {
          padding: 24px 32px;
          border-bottom: 1px solid rgba(15,23,42,0.08);
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 16px;
        }
        .assets-header h1 {
          margin: 0;
          font-size: 28px;
          font-weight: 600;
          color: var(--text);
        }
        .assets-subtitle {
          margin: 6px 0 0;
          color: var(--text-secondary);
          font-size: 14px;
        }
        .header-actions {
          display: flex;
          gap: 12px;
          align-items: center;
        }
        .ghost-btn {
          background: rgba(15,23,42,0.04);
          border: 1px solid rgba(15,23,42,0.08);
          border-radius: 8px;
          padding: 8px 14px;
          font-size: 13px;
          color: var(--text);
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .ghost-btn:hover {
          background: rgba(15,23,42,0.08);
        }
        .assets-content {
          padding: 28px 32px;
          flex: 1;
          overflow: auto;
        }
        .loading, .empty-state {
          padding: 48px;
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
        .option-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 24px;
        }
        .option-card {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          text-align: left;
          background: linear-gradient(145deg, #ffffff, #f1f5ff);
          border-radius: 16px;
          border: 1px solid rgba(15,23,42,0.08);
          padding: 20px;
          box-shadow: 0 12px 24px -14px rgba(15,23,42,0.45);
          cursor: pointer;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
          position: relative;
        }
        .option-card:not(.disabled):hover {
          transform: translateY(-4px);
          box-shadow: 0 20px 32px -18px rgba(15,23,42,0.55);
        }
        .option-card.disabled {
          cursor: not-allowed;
          opacity: 0.6;
          box-shadow: none;
        }
        .option-card-title {
          font-size: 18px;
          font-weight: 600;
          color: var(--text);
          margin-bottom: 8px;
        }
        .option-card-description {
          font-size: 13px;
          color: var(--text-secondary);
          line-height: 1.5;
        }
        .soon-tag {
          position: absolute;
          top: 14px;
          right: 16px;
          background: rgba(15,23,42,0.08);
          color: var(--text-secondary);
          border-radius: 999px;
          padding: 4px 10px;
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .letter-stage h2 {
          margin: 0;
          font-size: 22px;
          font-weight: 600;
          color: var(--text);
        }
        .stage-helper {
          margin: 6px 0 24px;
          color: var(--text-secondary);
          font-size: 13px;
        }
        .letter-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(88px, 1fr));
          gap: 16px;
        }
        .letter-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 18px 12px;
          border-radius: 14px;
          border: 1px solid rgba(15,23,42,0.12);
          background: #ffffff;
          box-shadow: 0 10px 18px -14px rgba(15,23,42,0.5);
          font-size: 15px;
          font-weight: 600;
          color: var(--text);
          cursor: pointer;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .letter-card:not(.disabled):hover {
          transform: translateY(-3px);
          box-shadow: 0 18px 26px -16px rgba(15,23,42,0.55);
        }
        .letter-card.disabled {
          cursor: not-allowed;
          opacity: 0.45;
          box-shadow: none;
        }
        .letter-label {
          font-size: 20px;
          font-weight: 700;
        }
        .letter-count {
          font-size: 11px;
          letter-spacing: 0.04em;
          color: var(--text-secondary);
        }
        .results-stage {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }
        .results-header h2 {
          margin: 0;
          font-size: 24px;
          font-weight: 600;
          color: var(--text);
        }
        .assets-grid.refined {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 24px;
        }
        .asset-card.refined {
          background: linear-gradient(155deg, #ffffff, #eef2ff);
          border-radius: 18px;
          padding: 20px;
          border: 1px solid rgba(79,70,229,0.18);
          box-shadow: 0 24px 40px -24px rgba(79,70,229,0.45);
          transition: transform 0.18s ease, box-shadow 0.18s ease;
        }
        .asset-card.refined:hover {
          transform: translateY(-4px);
          box-shadow: 0 28px 48px -22px rgba(79,70,229,0.55);
        }
        .asset-card-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          margin-bottom: 18px;
        }
        .asset-symbol {
          font-weight: 700;
          font-size: 20px;
          color: var(--text);
        }
        .asset-name {
          color: var(--text-secondary);
          font-size: 13px;
          margin-top: 6px;
        }
        .asset-market {
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: rgba(79,70,229,0.8);
          background: rgba(79,70,229,0.12);
          border-radius: 999px;
          padding: 4px 10px;
        }
        .asset-card-body {
          display: flex;
          gap: 28px;
          justify-content: flex-start;
        }
        .stat {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .stat-label {
          color: var(--text-secondary);
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }
        .stat-value {
          font-weight: 600;
          font-size: 16px;
        }
        .positive { color: #0f9d58; }
        .negative { color: #d93025; }

        @media (max-width: 768px) {
          .assets-header {
            flex-direction: column;
            align-items: flex-start;
          }
          .header-actions {
            width: 100%;
          }
          .letter-grid {
            grid-template-columns: repeat(auto-fit, minmax(72px, 1fr));
          }
          .assets-grid.refined {
            grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
          }
        }
      `}</style>
    </div>
  );
}