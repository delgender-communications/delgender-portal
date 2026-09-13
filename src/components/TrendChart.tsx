interface Series {
  label: string;
  color: string;
  values: number[];
}

interface Props {
  series: Series[];
  xLabels: string[];
  height?: number;
}

export default function TrendChart({ series, xLabels, height = 260 }: Props) {
  const width = 1000;
  const padding = { top: 16, right: 16, bottom: 28, left: 40 };
  const innerW = width - padding.left - padding.right;
  const innerH = height - padding.top - padding.bottom;

  const maxVal = Math.max(1, ...series.flatMap((s) => s.values));
  const niceMax = Math.ceil(maxVal / 5) * 5 || 5;

  const pointCount = xLabels.length;
  const stepX = pointCount > 1 ? innerW / (pointCount - 1) : 0;

  const toPath = (values: number[]) =>
    values
      .map((v, i) => {
        const x = padding.left + i * stepX;
        const y = padding.top + innerH - (v / niceMax) * innerH;
        return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(" ");

  const gridLines = [0, 0.25, 0.5, 0.75, 1];

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      style={{ width: "100%", height: "auto", display: "block" }}
    >
      {gridLines.map((g) => {
        const y = padding.top + innerH - g * innerH;
        return (
          <g key={g}>
            <line
              x1={padding.left}
              x2={width - padding.right}
              y1={y}
              y2={y}
              stroke="var(--border)"
              strokeWidth={1}
            />
            <text x={0} y={y + 4} fontSize={11} fill="var(--really-muted)">
              {Math.round(niceMax * g)}
            </text>
          </g>
        );
      })}

      {series.map((s) => (
        <path
          key={s.label}
          d={toPath(s.values)}
          fill="none"
          stroke={s.color}
          strokeWidth={2.5}
        />
      ))}

      {series.map((s) =>
        s.values.map((v, i) => {
          const x = padding.left + i * stepX;
          const y = padding.top + innerH - (v / niceMax) * innerH;
          return (
            <circle
              key={`${s.label}-${i}`}
              cx={x}
              cy={y}
              r={2.5}
              fill={s.color}
            />
          );
        }),
      )}

      {xLabels.map((label, i) => {
        if (pointCount > 12 && i % 3 !== 0) return null;
        const x = padding.left + i * stepX;
        return (
          <text
            key={label}
            x={x}
            y={height - 6}
            fontSize={11}
            fill="var(--really-muted)"
            textAnchor="middle"
          >
            {label}
          </text>
        );
      })}
    </svg>
  );
}
