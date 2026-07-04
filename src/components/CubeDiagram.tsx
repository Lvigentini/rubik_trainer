import { COLORS, type FaceName } from '../cube';
import type { DiagramState, FaceDiagram } from '../lessonDiagrams';

function FaceGrid({ diagram, faceLabel }: { diagram: FaceDiagram; faceLabel: string }) {
  const { size, stickers } = diagram;
  const cellSize = 32;
  const gap = 2;
  const totalSize = size * cellSize + (size - 1) * gap;

  return (
    <svg
      width={totalSize}
      height={totalSize}
      viewBox={`0 0 ${totalSize} ${totalSize}`}
      role="img"
      aria-label={`${faceLabel} face: ${size}x${size} grid`}
    >
      {stickers.map((color, i) => {
        const row = Math.floor(i / size);
        const col = i % size;
        const x = col * (cellSize + gap);
        const y = row * (cellSize + gap);
        return (
          <rect
            key={i}
            x={x}
            y={y}
            width={cellSize}
            height={cellSize}
            rx={4}
            fill={COLORS[color as FaceName]}
          />
        );
      })}
    </svg>
  );
}

export function CubeDiagram({ state, testId }: { state: DiagramState; testId?: string }) {
  return (
    <div className="cube-diagram" data-testid={testId}>
      <span className="diagram-label">{state.label}</span>
      <div className="diagram-faces">
        {Object.entries(state.faces).map(([faceLabel, diagram]) => (
          <FaceGrid key={faceLabel} diagram={diagram} faceLabel={faceLabel} />
        ))}
      </div>
    </div>
  );
}

export function BeforeAfterDiagram({ before, after }: { before: DiagramState; after?: DiagramState }) {
  return (
    <div className="before-after-diagram" data-testid="lesson-diagram">
      <CubeDiagram state={before} testId="diagram-before" />
      {after && (
        <>
          <span className="diagram-arrow">→</span>
          <CubeDiagram state={after} testId="diagram-after" />
        </>
      )}
    </div>
  );
}
