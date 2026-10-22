import { useState } from 'react';

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
