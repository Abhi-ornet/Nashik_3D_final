import { TREE_LAYER } from '../config/mapConfig.js';

export default function InventorySidebar({
  status,
  totalTrees,
  matchedInViewport,
  loadedInViewport,
  speciesFilter,
  setSpeciesFilter,
  healthFilter,
  setHealthFilter,
  treesEnabled,
  setTreesEnabled,
}) {
  return (
      <aside className="sidebar">
        <div className="brand-row">
          <div className="brand-mark">✳</div>
          <div><div className="brand-name">canopy<span>.</span></div><div className="brand-subtitle">TREE INVENTORY EXPLORER</div></div>
        </div>
        <header className="intro">
          <div className="eyebrow">GEOSPATIAL PROOF OF CONCEPT</div>
          <h1>Nashik, tree by tree.</h1>
          <p>Explore the live Nashik tree census with realistic, instanced 3D tree forms.</p>
        </header>
        <section className="metric-card">
          <div className="metric-top"><span>NASHIK TREE CENSUS</span><span className="live-dot" /></div>
          <div className="metric-number">{totalTrees ? totalTrees.toLocaleString() : '—'}</div>
          <div className="metric-foot">Records reported by GeoServer</div>
          <div className="metric-divider" />
          <div className="visible-row"><span>Matched in viewport</span><strong>{matchedInViewport.toLocaleString()}</strong></div>
          <div className="visible-row"><span>Loaded for rendering</span><strong>{loadedInViewport.toLocaleString()}</strong></div>
          <div className="visible-bar">
            <span style={{ width: matchedInViewport ? `${Math.min(100, loadedInViewport / matchedInViewport * 100)}%` : '0%' }} />
          </div>
          <div className="metric-note">Viewport records are requested from GeoServer as you navigate.</div>
        </section>
        <section className="filter-section">
          <div className="section-heading">Explore inventory <span>FILTERS</span></div>
          <label className="field-label" htmlFor="species">Tree group</label>
          <select id="species" value={speciesFilter} onChange={(event) => setSpeciesFilter(event.target.value)}>
            <option value="all">All groups</option>
            <option value="Indigenous">Indigenous</option>
            <option value="Exotic">Exotic</option>
          </select>
          <label className="field-label" htmlFor="health">Tree health</label>
          <select id="health" value={healthFilter} onChange={(event) => setHealthFilter(event.target.value)}>
            <option value="all">All statuses</option>
            <option value="healthy">Healthy</option>
            <option value="fair">Average / fair</option>
            <option value="poor">Dead / dangerous / cut</option>
          </select>
          <label className="toggle-row">
            <span><strong>3D tree models</strong><small>Instanced GLB models; detailed leaves when zoomed in</small></span>
            <input type="checkbox" checked={treesEnabled} onChange={(event) => setTreesEnabled(event.target.checked)} />
          </label>
        </section>
        <section className="legend-section">
          <div className="section-heading">Health condition <span>LEGEND</span></div>
          <div className="legend-item"><i className="legend-dot healthy" /><span>Healthy</span><small>Healthy</small></div>
          <div className="legend-item"><i className="legend-dot fair" /><span>Average</span><small>Monitor</small></div>
          <div className="legend-item"><i className="legend-dot poor" /><span>Attention</span><small>Dead / cut / danger</small></div>
        </section>
        <footer className="sidebar-footer">
          <div className="status-indicator" />
          <div><strong>{status}</strong><small>GeoServer · {TREE_LAYER} · CC0 GLB models</small></div>
        </footer>
      </aside>
  );
}
