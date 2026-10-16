export default function MapModeControls({ viewMode, onChange }) {
  return (
        <div className="basemap-switch" role="group" aria-label="Map view mode">
          <button type="button" className={viewMode === 'map' ? 'basemap-option active' : 'basemap-option'} aria-pressed={viewMode === 'map'} onClick={() => onChange('map')}>
            <span className="basemap-option-icon map-icon" aria-hidden="true">⌖</span> Map
          </button>
          <button type="button" className={viewMode === 'satellite' ? 'basemap-option active' : 'basemap-option'} aria-pressed={viewMode === 'satellite'} onClick={() => onChange('satellite')}>
            <span className="basemap-option-icon satellite-icon" aria-hidden="true">◉</span> Satellite
          </button>
          <button type="button" className={viewMode === 'cesium' ? 'basemap-option active' : 'basemap-option'} aria-pressed={viewMode === 'cesium'} onClick={() => onChange('cesium')}>
            <span className="basemap-option-icon cesium-icon" aria-hidden="true">◎</span> Cesium 3D
          </button>
        </div>
  );
}
