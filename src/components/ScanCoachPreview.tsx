import { COLORS } from '../cube';

function MiniCubeFace({ colors, size = 2 }: { colors: string[]; size?: number }) {
  const cellSize = 18;
  const gap = 2;
  const total = size * cellSize + (size - 1) * gap;

  return (
    <svg width={total} height={total} viewBox={`0 0 ${total} ${total}`}>
      {colors.map((color, i) => {
        const row = Math.floor(i / size);
        const col = i % size;
        return (
          <rect
            key={i}
            x={col * (cellSize + gap)}
            y={row * (cellSize + gap)}
            width={cellSize}
            height={cellSize}
            rx={3}
            fill={color}
          />
        );
      })}
    </svg>
  );
}

export function ScanCoachPreview() {
  const uColors = [COLORS.U, COLORS.U, COLORS.F, COLORS.U];
  const fColors = [COLORS.F, COLORS.R, COLORS.F, COLORS.F];
  const rColors = [COLORS.R, COLORS.R, COLORS.U, COLORS.R];

  return (
    <div className="scan-coach-preview" data-testid="scan-coach-preview">
      <div className="preview-panel">
        <div className="preview-visual">
          <MiniCubeFace colors={uColors} />
          <MiniCubeFace colors={fColors} />
          <MiniCubeFace colors={rColors} />
        </div>
        <span className="preview-label">Show three faces</span>
      </div>
      <div className="preview-panel">
        <div className="preview-speech-bubble">
          <p>"Two first-layer corners solved. Protect them, insert this corner next."</p>
        </div>
        <span className="preview-label">Coach diagnoses</span>
      </div>
      <div className="preview-panel">
        <div className="preview-visual">
          <svg width={38} height={38} viewBox="0 0 38 38" aria-label="Practice badge">
            <circle cx={19} cy={19} r={17} fill="none" stroke={COLORS.U} strokeWidth={2} />
            <path d="M12 19l5 5 9-9" stroke={COLORS.U} strokeWidth={2.5} fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <span className="preview-label">Practise the skill</span>
      </div>
    </div>
  );
}
