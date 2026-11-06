// external
import type { CSSProperties } from "react";

// internal
import "./Skeleton.css";

export function Skeleton({
  width = "100%",
  height = 14,
  radius = 6,
  className = "",
  style,
}: {
  width?: number | string;
  height?: number | string;
  radius?: number | string;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <span
      className={`skeleton ${className}`}
      style={{ width, height, borderRadius: radius, ...style }}
      aria-hidden="true"
    />
  );
}

export function SkeletonLabel({ text = "Loading" }: { text?: string }) {
  return (
    <span className="skeleton-sr" role="status">
      {text}
    </span>
  );
}

export type SkeletonCell =
  | "title"
  | "avatar"
  | "text"
  | "short"
  | "badge"
  | "action";

const TEXT_WIDTHS = ["74%", "58%", "66%", "82%", "52%", "70%"];
const TITLE_WIDTHS = ["62%", "48%", "70%", "56%", "66%", "52%"];

function renderCell(kind: SkeletonCell, row: number, col: number) {
  const pick = (list: string[]) => list[(row + col) % list.length];

  switch (kind) {
    case "title":
      return (
        <div className="skeleton-stack">
          <Skeleton width={pick(TITLE_WIDTHS)} height={14} />
          <Skeleton width="42%" height={11} />
        </div>
      );
    case "avatar":
      return (
        <div className="skeleton-inline">
          <Skeleton width={38} height={38} radius="50%" />
          <div className="skeleton-stack">
            <Skeleton width={pick(TITLE_WIDTHS)} height={14} />
            <Skeleton width="45%" height={11} />
          </div>
        </div>
      );
    case "badge":
      return <Skeleton width={78} height={24} radius={999} />;
    case "action":
      return <Skeleton width={68} height={30} radius={8} />;
    case "short":
      return <Skeleton width="48%" height={14} />;
    case "text":
    default:
      return <Skeleton width={pick(TEXT_WIDTHS)} height={14} />;
  }
}

export function TableSkeletonRows({
  cells,
  rows = 6,
}: {
  cells: SkeletonCell[];
  rows?: number;
}) {
  return (
    <>
      {Array.from({ length: rows }, (_, r) => (
        <tr key={r} className="skeleton-row">
          {cells.map((kind, c) => (
            <td key={c}>
              {r === 0 && c === 0 && <SkeletonLabel />}
              {renderCell(kind, r, c)}
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}
