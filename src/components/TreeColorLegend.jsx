import { TREE_APPEARANCE_COLORS } from '../config/treeRendering.js';
import './TreeColorLegend.css';

const LEGEND_ITEMS = [
  { key: 'dead', label: 'Dead / cut / uprooted' },
  { key: 'dangerous', label: 'Dangerous' },
  { key: 'heritage', label: 'Heritage tree' },
  { key: 'exotic', label: 'Exotic species' },
  { key: 'default', label: 'Normal / other' },
];

export default function TreeColorLegend() {
  return (
    <aside className="tree-color-legend" aria-label="Tree color legend">
      <h2 className="tree-color-legend-title">Tree color legend</h2>
      <ul className="tree-color-legend-list">
        {LEGEND_ITEMS.map((item) => (
          <li className="tree-color-legend-item" key={item.key}>
            <span
              className="tree-color-legend-swatch"
              style={{ backgroundColor: TREE_APPEARANCE_COLORS[item.key] }}
              aria-hidden="true"
            />
            <span>{item.label}</span>
          </li>
        ))}
      </ul>
    </aside>
  );
}
