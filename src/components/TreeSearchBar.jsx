import { useState, useRef, useEffect, useCallback } from 'react';
import { normalizeTree } from '../data/treeData.js';
import './TreeSearchBar.css';

const DEBOUNCE_DELAY_MS = 280;
const MAX_SEARCH_RESULTS = 25;

export default function TreeSearchBar({ onSelectTree, treeLayer, wfsUrl }) {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [results, setResults] = useState([]);
  const [isOpen, setIsOpen] = useState(false);

  const searchContainerRef = useRef(null);
  const errorTimerRef = useRef(null);
  const debounceTimerRef = useRef(null);
  const abortControllerRef = useRef(null);

  // Close suggestions if clicked outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      if (errorTimerRef.current) clearTimeout(errorTimerRef.current);
      if (abortControllerRef.current) abortControllerRef.current.abort();
    };
  }, []);

  /**
   * Fetch matching trees from GeoServer using indexed PK/UID queries.
   * @param {string} searchTerm
   * @param {boolean} autoFly - If true, immediately flies to the tree if only 1 match.
   */
  const searchTrees = useCallback(async (searchTerm, autoFly = false) => {
    const term = searchTerm.trim();
    if (!term) {
      setResults([]);
      setIsOpen(false);
      setIsLoading(false);
      return;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsLoading(true);
    if (autoFly) setErrorMsg(null);

    const t0 = performance.now();
    const cleanTerm = term.replace(/'/g, "''");
    const isDigits = /^\d+$/.test(term);

    // Smart CQL: matches exact Primary Key or UID/Name pattern up to MAX_SEARCH_RESULTS
    let searchCql = '';
    if (isDigits) {
      searchCql = `TreeCensusCd = ${cleanTerm} OR Tree_UID LIKE '%${cleanTerm}%'`;
    } else {
      searchCql = `Tree_UID = '${cleanTerm}' OR Tree_UID LIKE '%${cleanTerm}%' OR LocalName LIKE '%${cleanTerm}%'`;
    }

    const baseParams = {
      service: 'WFS',
      version: '2.0.0',
      request: 'GetFeature',
      typeNames: treeLayer,
      outputFormat: 'application/json',
      srsName: 'CRS:84',
      count: String(MAX_SEARCH_RESULTS),
      CQL_FILTER: searchCql,
    };

    try {
      const response = await fetch(`${wfsUrl}?${new URLSearchParams(baseParams).toString()}`, { signal: controller.signal });
      if (!response.ok) {
        const errorDetails = await response.text().catch(() => '');
        console.warn('GeoServer search error:', errorDetails);
        throw new Error(`HTTP ${response.status}`);
      }
      const data = await response.json();
      let features = data?.features || [];

      if (controller.signal.aborted) return;
      const elapsedMs = Math.round(performance.now() - t0);
      let normalizedList = features.map(normalizeTree).filter(Boolean);

      // Rank exact matches (TreeCensusCd or Tree_UID exact match) to the very top
      normalizedList.sort((a, b) => {
        const aExact = String(a.rawProperties?.TreeCensusCd) === cleanTerm || a.uid.toLowerCase() === cleanTerm.toLowerCase();
        const bExact = String(b.rawProperties?.TreeCensusCd) === cleanTerm || b.uid.toLowerCase() === cleanTerm.toLowerCase();
        if (aExact && !bExact) return -1;
        if (!aExact && bExact) return 1;
        return 0;
      });

      if (autoFly) {
        if (normalizedList.length === 0) {
          setErrorMsg(`Tree "${term}" not found (${elapsedMs}ms)`);
          setIsOpen(false);
          if (errorTimerRef.current) clearTimeout(errorTimerRef.current);
          errorTimerRef.current = setTimeout(() => setErrorMsg(null), 4000);
        } else if (normalizedList.length === 1) {
          // Direct flight to the single match
          onSelectTree(normalizedList[0]);
          setIsOpen(false);
          setQuery(normalizedList[0].uid || term);
        } else {
          // Check if top result is an exact match: if so, auto-fly to it but keep dropdown open
          const topExact = String(normalizedList[0].rawProperties?.TreeCensusCd) === cleanTerm || normalizedList[0].uid.toLowerCase() === cleanTerm.toLowerCase();
          if (topExact) {
            onSelectTree(normalizedList[0]);
          }
          setResults(normalizedList);
          setIsOpen(true);
        }
      } else {
        // Debounced typing suggestions mode: show dropdown with all matches
        setResults(normalizedList);
        setIsOpen(normalizedList.length > 0);
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        if (autoFly) setErrorMsg(`Search failed: ${err.message}`);
      }
    } finally {
      if (!controller.signal.aborted) {
        setIsLoading(false);
      }
    }
  }, [treeLayer, wfsUrl, onSelectTree]);

  // Handle input change with debouncing
  function handleInputChange(e) {
    const val = e.target.value;
    setQuery(val);
    if (errorMsg) setErrorMsg(null);

    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);

    const trimmed = val.trim();
    if (!trimmed || (trimmed.length < 2 && !/^\d+$/.test(trimmed))) {
      setResults([]);
      setIsOpen(false);
      setIsLoading(false);
      if (abortControllerRef.current) abortControllerRef.current.abort();
      return;
    }

    // Debounce suggestion queries while typing
    debounceTimerRef.current = setTimeout(() => {
      searchTrees(trimmed, false);
    }, DEBOUNCE_DELAY_MS);
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    searchTrees(query, true);
  }

  function handleSelectResult(tree) {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    if (abortControllerRef.current) abortControllerRef.current.abort();
    onSelectTree(tree);
    setIsOpen(false);
    setQuery(tree.uid || (tree.id ? String(tree.id) : tree.localName));
  }

  function handleKeyDown(e) {
    if (e.key === 'Escape') {
      setIsOpen(false);
    }
  }

  return (
    <div className="tree-search-widget" ref={searchContainerRef} onKeyDown={handleKeyDown}>
      <form className={`tree-search-bar ${errorMsg ? 'has-error' : ''}`} onSubmit={handleSubmit}>
        <span className="search-icon" aria-hidden="true">
          {isLoading ? <span className="search-spinner" /> : '🔍'}
        </span>
        <input
          type="text"
          className="search-input"
          value={query}
          onChange={handleInputChange}
          placeholder="Go to tree: enter UID or Census ID…"
          aria-label="Search tree by UID or Census code"
        />
        {query && (
          <button
            type="button"
            className="search-clear-btn"
            onClick={() => {
              if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
              if (abortControllerRef.current) abortControllerRef.current.abort();
              setQuery('');
              setResults([]);
              setErrorMsg(null);
              setIsOpen(false);
              setIsLoading(false);
            }}
            aria-label="Clear search"
          >
            ×
          </button>
        )}
        <button type="submit" className="search-go-btn" disabled={isLoading || !query.trim()}>
          Go ➔
        </button>
      </form>

      {errorMsg && (
        <div className="search-error-toast" role="alert">
          <span>⚠️</span> {errorMsg}
        </div>
      )}

      {isOpen && results.length > 0 && (
        <ul className="search-dropdown" role="listbox">
          <li className="search-dropdown-header">
            {results.length === 1 ? '1 matching tree — click to jump:' : `Found ${results.length} matching trees — select one:`}
          </li>
          {results.map((tree) => (
            <li
              key={tree.id || tree.uid}
              className="search-dropdown-item"
              role="option"
              aria-selected="false"
              onClick={() => handleSelectResult(tree)}
            >
              <div className="result-main">
                <span className="result-name">{tree.localName || tree.commonName || 'Tree'}</span>
                <span className="result-badge">{tree.uid || `#${tree.id}`}</span>
              </div>
              <div className="result-sub">
                {tree.speciesGroup && tree.speciesGroup !== 'Unknown' && (
                  <span className="result-ward">{tree.speciesGroup}</span>
                )}
                {tree.botName && <span className="result-bot">{tree.botName}</span>}
                {tree.ward && tree.ward !== 'Not recorded' && (
                  <span className="result-ward">Ward: {tree.ward}</span>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
