import { useState } from 'react';

export default function TreeDetailsPopup({ tree, onClose, onFocus }) {
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [imageError, setImageError] = useState(false);

  if (!tree) return null;
  const selectedTree = tree;

  return (
    <>
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
        {selectedTree.ageGroup && selectedTree.ageGroup !== 'Unknown' && (
          <div className="popup-detail"><span>Age Group</span><strong>{selectedTree.ageGroup} yrs</strong></div>
        )}
        {selectedTree.ownership && selectedTree.ownership !== 'Not recorded' && (
          <div className="popup-detail"><span>Ownership</span><strong>{selectedTree.ownership}</strong></div>
        )}
        {selectedTree.rawProperties?.TreeLocation && (
          <div className="popup-detail"><span>Location</span><strong>{selectedTree.rawProperties.TreeLocation}</strong></div>
        )}

        {selectedTree.photo && !imageError && (
          <div
            className="tree-photo-container"
            onClick={() => setIsImageModalOpen(true)}
            title="Click to view full photo"
          >
            <img
              src={selectedTree.photo}
              alt={selectedTree.localName}
              className="tree-photo-thumb"
              onError={() => setImageError(true)}
            />
            <span className="photo-expand-hint">🔍 Enlarge</span>
          </div>
        )}

        <button className="focus-button" onClick={onFocus}>Focus tree <span>↗</span></button>
      </div>

      {isImageModalOpen && selectedTree.photo && (
        <div
          className="tree-photo-modal-backdrop"
          onClick={() => setIsImageModalOpen(false)}
        >
          <div
            className="tree-photo-modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="tree-photo-modal-close"
              onClick={() => setIsImageModalOpen(false)}
              aria-label="Close enlarged photo"
            >
              ×
            </button>
            <img
              src={selectedTree.photo}
              alt={selectedTree.localName}
              className="tree-photo-large"
            />
            <div className="tree-photo-modal-caption">
              <strong>{selectedTree.localName}</strong> — {selectedTree.uid}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
