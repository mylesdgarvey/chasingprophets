import React, { useEffect, useRef, useState } from 'react';
import './SearchBox.css';
import { searchAssets, getAssetPrices, getAsset } from '../../services/assets';
import { useNavigate } from 'react-router-dom';

export interface SearchResult {
  ticker: string;
  name: string;
  market?: string;
  lastPrice?: number;
  type?: string; // 'Asset' etc
}

interface Props {
  placeholder?: string;
  maxResults?: number;
}

export default function SearchBox({ placeholder = 'Search markets, prophets, analysis...', maxResults = 8 }: Props) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const debounceRef = useRef<number | null>(null);
  const mounted = useRef(true);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  useEffect(() => {
    if (!query) {
      setResults([]);
      setOpen(false);
      setLoading(false);
      return;
    }

    setLoading(true);
    // debounce
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(async () => {
      try {
        const items = await searchAssets(query, maxResults);
        if (!mounted.current) return;
        const mapped = items.map(i => ({ ticker: (i as any).ticker || (i as any).symbol || '', name: (i as any).name || '', market: (i as any).market, lastPrice: (i as any).lastPrice, type: 'Asset' }));
        setResults(mapped);
        setOpen(true);
        setActiveIndex(mapped.length ? 0 : -1);
      } catch (err) {
        console.error('Search failed', err);
        setResults([]);
        setOpen(false);
      } finally {
        if (mounted.current) setLoading(false);
      }
    }, 200); // 200ms debounce for snappy UX but not noisy

    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, [query, maxResults]);

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex(i => Math.min(i + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex(i => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (results[activeIndex]) selectResult(results[activeIndex]);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  }

  function selectResult(r: SearchResult) {
    setOpen(false);
    setQuery('');
    setResults([]);
    // Before navigating, ensure the asset exists or has price data to avoid landing on an error page.
    if (r && r.ticker) {
      (async () => {
        try {
          const [assetMeta, prices] = await Promise.all([
            getAsset(r.ticker),
            getAssetPrices(r.ticker)
          ]);
          if ((assetMeta && Object.keys(assetMeta).length) || (prices && prices.length)) {
            navigate(`/assets/${encodeURIComponent(r.ticker)}`);
          } else {
            console.error('Selected asset has no data:', r.ticker);
            // keep the search open to allow retry
            setOpen(true);
          }
        } catch (err) {
          console.error('Error checking asset before navigate:', err);
          // fallback to navigate anyway so the user sees the not-found UI
          navigate(`/assets/${encodeURIComponent(r.ticker)}`);
        }
      })();
    }
  }

  return (
    <div className="searchbox-root">
      <div className="searchbox-input">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path d="M21 21l-4.35-4.35" stroke="#64748b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="11" cy="11" r="6" stroke="#64748b" strokeWidth="1.5" />
        </svg>
        <input
          ref={inputRef}
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={onKeyDown}
          onFocus={() => { if (results.length) setOpen(true); }}
          placeholder={placeholder}
          aria-label="Search"
        />
      </div>

      {open && (
        <div className="searchbox-results" role="listbox" aria-activedescendant={activeIndex >= 0 ? `sres-${activeIndex}` : undefined}>
          {loading && <div className="searchbox-row">Searching...</div>}
          {!loading && results.length === 0 && <div className="searchbox-row">No results</div>}
          {!loading && results.map((r, idx) => (
            <button
              id={`sres-${idx}`}
              key={`${r.ticker}-${idx}`}
              className={`searchbox-row ${idx === activeIndex ? 'active' : ''}`}
              onMouseDown={(e) => { e.preventDefault(); selectResult(r); }}
              onMouseEnter={() => setActiveIndex(idx)}
              role="option"
              aria-selected={idx === activeIndex}
            >
              <div className="row-left">
                <div className="ticker">{r.ticker}</div>
                <div className="name">{r.name}</div>
              </div>
              <div className="row-right">
                <div className="type">{r.type}</div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
