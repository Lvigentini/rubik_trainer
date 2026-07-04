import { Camera, Wand2 } from 'lucide-react';
import { useState } from 'react';
import {
  COLOR_LABELS,
  COLORS,
  FACE_NAMES,
  type FaceName,
  type PartialScan,
  type ScanFace,
  emptyPartialScan,
  scanWarnings,
} from '../../cube';
import { STICKER_INDICES_BY_SIZE } from '../cube/bands';
import { CubeWorkspace, type CubeSession } from './CubeWorkspace';

const SCAN_FACES: ScanFace[] = ['U', 'F', 'R'];

function FaceEditor({
  face,
  values,
  selectedColor,
  stickerIndices,
  onPick,
}: {
  face: ScanFace;
  values: PartialScan[ScanFace];
  selectedColor: FaceName;
  stickerIndices: number[];
  onPick: (index: number, color: FaceName) => void;
}) {
  return (
    <div className="face-editor">
      <div className="face-editor-title">{face} face</div>
      <div className={`face-grid ${stickerIndices.length === 4 ? 'face-grid-4' : ''}`}>
        {stickerIndices.map((index) => {
          const value = values[index];
          return (
            <button
              key={`${face}-${index}`}
              className="scan-sticker"
              style={{ background: value ? COLORS[value] : 'rgba(255,255,255,0.12)' }}
              onClick={() => onPick(index, selectedColor)}
              aria-label={`Set ${face} sticker ${index + 1} to ${COLOR_LABELS[selectedColor]}`}
            >
              {!value ? '+' : ''}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Scan Coach: a single unified column (palette, import/clear, face editors,
 * completeness, warnings all together — no split panels). It reuses the
 * shared CubeWorkspace purely to get an interactive cube (and its current
 * grid) to import visible faces from; there's no scoring here at all.
 */
export function ScanCoachPanel() {
  return <CubeWorkspace>{(session) => <ScanCoachBody session={session} />}</CubeWorkspace>;
}

function ScanCoachBody({ session }: { session: CubeSession }) {
  const [selectedColor, setSelectedColor] = useState<FaceName>('U');
  const [scan, setScan] = useState<PartialScan>(() => emptyPartialScan());

  const warnings = scanWarnings(scan);
  const visibleStickerIndices = STICKER_INDICES_BY_SIZE[session.cubeSize];
  const visibleStickerTotal = visibleStickerIndices.length * SCAN_FACES.length;
  const visibleKnown = SCAN_FACES.reduce(
    (total, face) => total + visibleStickerIndices.filter((index) => scan[face][index]).length,
    0,
  );
  const visibleCompleteness = Math.round((visibleKnown / visibleStickerTotal) * 100);

  function setScanSticker(face: ScanFace, index: number, color: FaceName) {
    setScan((current) => ({
      ...current,
      [face]: current[face].map((value, stickerIndex) => (stickerIndex === index ? color : value)),
    }));
  }

  function importVisibleFacesFromCube() {
    setScan({ U: [...session.grid.U], F: [...session.grid.F], R: [...session.grid.R] });
  }

  return (
    <aside className="panel practice-panel scan-coach-panel">
      <div className="panel-header">
        <h2>Three-face assistant</h2>
        <Camera className="panel-icon" />
      </div>
      <p className="note">
        Capture or manually enter visible faces. This is a scan coach prototype — partial-state guidance with honest
        limitations.
      </p>
      <div className="palette">
        {FACE_NAMES.map((face) => (
          <button
            key={face}
            className={selectedColor === face ? 'selected' : ''}
            style={{ background: COLORS[face] }}
            onClick={() => setSelectedColor(face)}
            aria-label={`Select ${COLOR_LABELS[face]}`}
          >
            {face}
          </button>
        ))}
      </div>
      <button className="wide" onClick={importVisibleFacesFromCube}>
        <Wand2 size={16} /> Import visible U/F/R from cube
      </button>
      <button className="wide" onClick={() => setScan(emptyPartialScan())}>
        Clear scan
      </button>
      <div className="confidence-card">
        <span>
          {visibleKnown}/{visibleStickerTotal} visible stickers
        </span>
        <strong>{visibleCompleteness}% captured</strong>
        <div className="progress-bar">
          <span style={{ width: `${visibleCompleteness}%` }} />
        </div>
      </div>
      <div className="scan-faces">
        {SCAN_FACES.map((face) => (
          <FaceEditor
            key={face}
            face={face}
            values={scan[face]}
            selectedColor={selectedColor}
            stickerIndices={visibleStickerIndices}
            onPick={(index, color) => setScanSticker(face, index, color)}
          />
        ))}
      </div>
      <ul className="scan-warnings">
        {warnings.map((warning) => (
          <li key={warning}>{warning}</li>
        ))}
      </ul>
    </aside>
  );
}
