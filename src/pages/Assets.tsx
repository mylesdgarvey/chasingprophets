import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Grid, BookOpen, Compass, RefreshCw } from "react-feather";
import { getAllAssets } from "../services/assets";
import "./Assets.css";

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

  const populatedBuckets = useMemo(
    () => LETTER_BUCKETS.filter(letter => (assetsByLetter[letter] || []).length > 0).length,
    [assetsByLetter]
  );

  const heroMetrics = useMemo(
    () => [
      {
        id: "tracked",
        label: "Tracked Assets",
        value: assets.length,
        detail: "Universe size",
        icon: <Grid size={16} />,
        positive: true
      },
      {
        id: "buckets",
        label: "Live Buckets",
        value: populatedBuckets,
        detail: "Letters populated",
        icon: <BookOpen size={16} />,
        positive: populatedBuckets > 0
      },
      {
        id: "focus",
        label: selectedLetter ? `Focused ${selectedLetter}` : "Navigator",
        value: selectedLetter ? `${filteredAssets.length} assets` : "Select a letter",
        detail: selectedLetter ? "Results" : "Awaiting selection",
        icon: <Compass size={16} />,
        positive: !!selectedLetter
      }
    ],
    [assets.length, filteredAssets.length, populatedBuckets, selectedLetter]
  );

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
    return (
      <div className="assets-screen">
        <section className="assets-hero glass-surface">
          <div className="hero-copy">
            <span className="eyebrow">Asset Universe</span>
            <h1>Asset Explorer</h1>
            <p>Navigate the tracked symbols and drill down into mission-ready dashboards.</p>
          </div>
        </section>
        <div className="assets-error glass-surface">{error}</div>
      </div>
    );
  }

  return (
    <div className="assets-screen">
      <section className="assets-hero glass-surface">
        <div className="hero-copy">
          <span className="eyebrow">Asset Universe</span>
          <h1>Asset Explorer</h1>
          <p>Navigate the tracked symbols and drill down into mission-ready dashboards.</p>
        </div>
        <div className="hero-metrics">
          {heroMetrics.map(metric => (
            <div key={metric.id} className={`metric-chip ${metric.positive ? "positive" : ""}`}>
              <div className="metric-icon">{metric.icon}</div>
              <div className="metric-text">
                <span className="metric-label">{metric.label}</span>
                <span className="metric-value">{metric.value}</span>
              </div>
              <span className="metric-delta">{metric.detail}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="assets-workspace">
        <article className="assets-panel control-panel glass-surface">
          <header className="panel-header">
            <div>
              <h2>
                {view === "root"
                  ? "Start with a navigator"
                  : view === "letter"
                  ? "Select a letter"
                  : selectedLetter === "#"
                  ? "Tickers starting with digits or symbols"
                  : `Tickers starting with “${selectedLetter}”`}
              </h2>
              <p>
                {view === "root"
                  ? "Choose how you want to browse the inventory. Alphabetical navigator is currently live."
                  : view === "letter"
                  ? "Pick the first character of the ticker to focus the explorer."
                  : `Showing ${filteredAssets.length} ${filteredAssets.length === 1 ? "asset" : "assets"}. Click a card to open detailed telemetry.`}
              </p>
            </div>
            <div className="panel-actions">
              {view !== "root" && (
                <button className="ghost-btn" type="button" onClick={view === "results" ? backToLetters : resetToRoot}>
                  {view === "results" ? "Back to letters" : "Back to options"}
                </button>
              )}
              {view === "results" && selectedLetter && (
                <button className="ghost-btn" type="button" onClick={resetToRoot}>
                  Reset
                </button>
              )}
            </div>
          </header>

          <div className="panel-body">
            {loading ? (
              <div className="loading-state">
                <RefreshCw className="spin" size={18} />
                <span>Loading assets…</span>
              </div>
            ) : assets.length === 0 ? (
              <div className="empty-state">No assets available.</div>
            ) : view === "root" ? (
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
            ) : view === "letter" ? (
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
                      <span className="letter-label">{letter}</span>
                      <span className="letter-count">{count} {count === 1 ? "match" : "matches"}</span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="letter-grid compact">
                {LETTER_BUCKETS.map(letter => {
                  const count = assetsByLetter[letter]?.length || 0;
                  const disabled = count === 0;
                  const isActive = selectedLetter === letter;
                  return (
                    <button
                      key={letter}
                      className={`letter-card ${disabled ? "disabled" : ""} ${isActive ? "active" : ""}`}
                      onClick={() => !disabled && handleLetterSelect(letter)}
                      disabled={disabled}
                    >
                      <span className="letter-label">{letter}</span>
                      <span className="letter-count">{count}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </article>

        <article className="assets-panel results-panel glass-surface">
          <header className="panel-header">
            <div>
              <h2>{view === "results" ? "Results" : "Preview"}</h2>
              <p>
                {view === "results"
                  ? "Select an asset to open its detailed telemetry dashboard."
                  : "Pick a navigator mode on the left to populate results."}
              </p>
            </div>
          </header>

          <div className={`panel-body ${view === "results" ? "scrollable" : ""}`}>
            {view !== "results" || !selectedLetter ? (
              <div className="empty-state">
                {view === "root"
                  ? "Navigator idle — choose an option to begin."
                  : "No letter selected yet — use the navigator to focus a bucket."}
              </div>
            ) : filteredAssets.length === 0 ? (
              <div className="empty-state">No assets found for this letter.</div>
            ) : (
              <div className="assets-grid refined">
                {filteredAssets.map(asset => (
                  <button key={asset.ticker} className="asset-card refined" onClick={() => handleAssetClick(asset.ticker)}>
                    <div className="asset-card-header">
                      <div>
                        <div className="asset-symbol">{asset.ticker}</div>
                        <div className="asset-name">{asset.name || asset.ticker}</div>
                      </div>
                      <div className="asset-market">{asset.market || "Unknown market"}</div>
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
                  </button>
                ))}
              </div>
            )}
          </div>
        </article>
      </section>
    </div>
  );
}