import { formatDateTime } from "../lib/format";

export function LineChart({ points, language, unit }) {
  const width = 720;
  const height = 320;
  const pad = { left: 56, right: 16, top: 20, bottom: 42 };
  const sorted = [...points].sort((a, b) => a.date - b.date);
  const xs = sorted.map((point) => point.date.getTime());
  const ys = sorted.map((point) => point.value);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const y0 = minY === maxY ? minY - 1 : minY;
  const y1 = minY === maxY ? maxY + 1 : maxY;
  const x = (time) => {
    if (maxX === minX) return pad.left + (width - pad.left - pad.right) / 2;
    return pad.left + ((time - minX) / (maxX - minX)) * (width - pad.left - pad.right);
  };
  const y = (value) => pad.top + (1 - (value - y0) / (y1 - y0)) * (height - pad.top - pad.bottom);
  const path = sorted
    .map((point, index) => `${index === 0 ? "M" : "L"} ${x(point.date.getTime()).toFixed(1)} ${y(point.value).toFixed(1)}`)
    .join(" ");
  const ticks = 4;
  const yTicks = Array.from({ length: ticks + 1 }, (_, index) => y0 + ((y1 - y0) * index) / ticks);

  return (
    <svg viewBox={`0 0 ${width} ${height}`} role="img" className="h-80 w-full">
      {yTicks.map((tick) => (
        <g key={tick}>
          <line x1={pad.left} x2={width - pad.right} y1={y(tick)} y2={y(tick)} stroke="#e2e8f0" />
          <text x={pad.left - 8} y={y(tick) + 4} textAnchor="end" fontSize="12" fill="#64748b">
            {Math.round(tick * 100) / 100}
          </text>
        </g>
      ))}
      <path d={path} fill="none" stroke="#13a1de" strokeWidth="2.5" strokeLinejoin="round" />
      {sorted.map((point) => (
        <circle key={point.date.toISOString()} cx={x(point.date.getTime())} cy={y(point.value)} r="4" fill="#0b3a4a">
          <title>
            {formatDateTime(point.date, language)} · {point.value} {unit}
          </title>
        </circle>
      ))}
      <text x={sorted.length === 1 ? width / 2 : pad.left} y={height - 12} textAnchor={sorted.length === 1 ? "middle" : "start"} fontSize="12" fill="#64748b">
        {formatDateTime(sorted[0].date, language)}
      </text>
      {sorted.length > 1 ? (
        <text x={width - pad.right} y={height - 12} textAnchor="end" fontSize="12" fill="#64748b">
          {formatDateTime(sorted[sorted.length - 1].date, language)}
        </text>
      ) : null}
    </svg>
  );
}
