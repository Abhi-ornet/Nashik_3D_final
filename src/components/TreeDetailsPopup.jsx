export default function TreeDetailsPopup({ tree, onClose, onFocus }) {
  if (!tree) return null;
  const selectedTree = tree;

  return (
    <div className="tree-popup">
      <button className="popup-close" onClick={onClose} aria-label="Close tree details">×</button>
      <div className="popup-kicker">SELECTED TREE</div>
      <div className="popup-title">{selectedTree.localName}</div>
      <div className="popup-id">{selectedTree.uid}</div>
      <div className="popup-rule" />
      <div className="popup-detail"><span>Height</span><strong>{selectedTree.heightMeters} m</strong></div>
      <div className="popup-detail"><span>Health</span><strong className={'health-text ' + selectedTree.health}>{selectedTree.healthLabel}</strong></div>
      <div className="popup-detail"><span>Group</span><strong>{selectedTree.speciesGroup}</strong></div>
      <div className="popup-detail"><span>Girth</span><strong>{selectedTree.girth ?? 'Not recorded'}</strong></div>
      <div className="popup-detail"><span>Canopy</span><strong>{selectedTree.canopy ?? 'Not recorded'}</strong></div>
      <div className="popup-detail"><span>Heritage</span><strong>{selectedTree.isHeritage ? 'Yes' : 'No'}</strong></div>
      <div className="popup-detail"><span>Ward</span><strong>{selectedTree.ward}</strong></div>
      <button className="focus-button" onClick={onFocus}>Focus tree <span>↗</span></button>
      {selectedTree.photo && <a className="tree-photo-link" href={selectedTree.photo} target="_blank" rel="noreferrer">Open tree photo ↗</a>}
    </div>
  );
}
