import { useState } from 'react';
import { DENSITY_THRESHOLDS } from '../config/treeRendering.js';

export default function InventorySidebar({
  totalTrees,
  matchedInViewport,
  loadedInViewport,
  speciesFilter,
  setSpeciesFilter,
  healthFilter,
  setHealthFilter,
}) {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <aside className="right-panel">
      <div className="right-panel-header" onClick={() => setIsOpen((prev) => !prev)}>
        <div className="right-panel-title">
          <span className="brand-mark-mini">✳</span>
          <span>3D Tree Census</span>
          {totalTrees > 0 && <span className="mini-badge">{totalTrees.toLocaleString()}</span>}
        </div>
        <button
          type="button"
          className="right-panel-toggle"
          aria-label={isOpen ? 'Collapse panel' : 'Expand panel'}
        >
          {isOpen ? '▲' : '▼'}
        </button>
      </div>

      {isOpen && (
        <div className="right-panel-body">
          <div className="metric-strip-three">
            <div className="metric-strip-item">
              <span>TOTAL</span>
              <strong>{totalTrees ? totalTrees.toLocaleString() : '—'}</strong>
            </div>
            <div className="metric-strip-item">
              <span>MATCHING</span>
              <strong>{matchedInViewport ? matchedInViewport.toLocaleString() : '0'}</strong>
            </div>
            <div className="metric-strip-item">
              <span>RENDERING</span>
              <strong>{loadedInViewport ? loadedInViewport.toLocaleString() : '0'}</strong>
            </div>
          </div>

          <div className="tier-status-banner">
            {loadedInViewport > 0 ? (
              loadedInViewport <= DENSITY_THRESHOLDS.DETAIL ? (
                <span className="tier-badge tier-detail">● Tier 1: Detailed 3D (≤{(DENSITY_THRESHOLDS.DETAIL / 1000).toFixed(0)}k)</span>
              ) : loadedInViewport <= DENSITY_THRESHOLDS.MID ? (
                <span className="tier-badge tier-mid">● Tier 2: Mid 3D (≤{(DENSITY_THRESHOLDS.MID / 1000).toFixed(1)}k)</span>
              ) : (
                <span className="tier-badge tier-lowpoly">● Tier 3: Showcase Low-Poly (≤{(DENSITY_THRESHOLDS.LOW_POLY / 1000).toFixed(0)}k)</span>
              )
            ) : matchedInViewport > DENSITY_THRESHOLDS.LOW_POLY ? (
              <span className="tier-badge tier-2d">● Tier 4: 2D WMS Map (&gt;{(DENSITY_THRESHOLDS.LOW_POLY / 1000).toFixed(0)}k)</span>
            ) : (
              <span className="tier-badge tier-idle">● Standby</span>
            )}
          </div>

          <div className="filter-row-two-col">
            <div className="filter-group">
              <label className="field-label" htmlFor="species">Tree Group</label>
              <select
                id="species"
                value={speciesFilter}
                onChange={(event) => setSpeciesFilter(event.target.value)}
              >
                <option value="all">All groups</option>
                <option value="Indigenous">Indigenous</option>
                <option value="Exotic">Exotic</option>
              </select>
            </div>

            <div className="filter-group">
              <label className="field-label" htmlFor="health">Tree Health</label>
              <select
                id="health"
                value={healthFilter}
                onChange={(event) => setHealthFilter(event.target.value)}
              >
                <option value="all">All</option>
                <option value="healthy">Healthy</option>
                <option value="fair">Average</option>
                <option value="poor">Attention</option>
              </select>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
