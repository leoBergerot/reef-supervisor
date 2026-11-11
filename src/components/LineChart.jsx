import { formatDateTime } from "../lib/format";

export function LineChart({ points, language, unit, domainStart, domainEnd }) {
  if (!points?.length) return null;

  const width = 720;
  const height = 320;
  const pad = { left: 56, right: 16, top: 20, bottom: 42 };
  const sorted = [...points].sort((a, b) => a.date - b.date);
  const xs = sorted.map((point) => point.date.getTime());
  const ys = sorted.map((point) => point.value);
  const dataMinX = Math.min(...xs);
  const dataMaxX = Math.max(...xs);
  const rangeStart = domainStart instanceof Date && !Number.isNaN(domainStart.getTime()) ? domainStart.getTime() : null;
  const rangeEnd = domainEnd instanceof Date && !Number.isNaN(domainEnd.getTime()) ? domainEnd.getTime() : null;
  const minX = rangeStart != null ? rangeStart : dataMinX;
  const maxX = rangeEnd != null ? Math.max(rangeEnd, minX) : dataMaxX;
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const y0 = minY === maxY ? minY - 1 : minY;
  const y1 = minY === maxY ? maxY + 1 : maxY;
  const ySpan = y1 - y0 || 1;
  const xSpan = maxX - minX;

  const x = (time) => {
    if (xSpan === 0) return pad.left + (width - pad.left - pad.right) / 2;
    return pad.left + ((time - minX) / xSpan) * (width - pad.left - pad.right);
  };
  const y = (value) => pad.top + (1 - (value - y0) / ySpan) * (height - pad.top - pad.bottom);
  const path = sorted
    .map((point, index) => `${index === 0 ? "M" : "L"} ${x(point.date.getTime()).toFixed(1)} ${y(point.value).toFixed(1)}`)
    .join(" ");
  const ticks = 4;
  const yTicks = Array.from({ length: ticks + 1 }, (_, index) => y0 + (ySpan * index) / ticks);
  const xTickCount = sorted.length === 1 && xSpan === 0 ? 1 : 3;
  const xTicks = Array.from({ length: xTickCount }, (_, index) => {
    if (xTickCount === 1) return minX;
    return minX + (xSpan * index) / (xTickCount - 1);
  });

  return (
    <svg viewBox={`0 0 ${width} ${height}`} role="img" className="h-80 w-full">
      {yTicks.map((tick, index) => (
        <g key={`y-${index}`}>
          <line x1={pad.left} x2={width - pad.right} y1={y(tick)} y2={y(tick)} stroke="#e2e8f0" />
          <text x={pad.left - 8} y={y(tick) + 4} textAnchor="end" fontSize="12" fill="#64748b">
            {Math.round(tick * 100) / 100}
          </text>
        </g>
      ))}
      <path d={path} fill="none" stroke="#13a1de" strokeWidth="2.5" strokeLinejoin="round" />
      {sorted.map((point, index) => (
        <circle key={`${point.date.toISOString()}-${index}`} cx={x(point.date.getTime())} cy={y(point.value)} r="4" fill="#0b3a4a">
          <title>
            {formatDateTime(point.date, language)} · {point.value} {unit}
          </title>
        </circle>
      ))}
      {xTicks.map((tick, index) => {
        const anchor = index === 0 ? "start" : index === xTicks.length - 1 ? "end" : "middle";
        return (
          <text key={`x-${index}`} x={x(tick)} y={height - 12} textAnchor={anchor} fontSize="12" fill="#64748b">
            {formatDateTime(new Date(tick), language)}
          </text>
        );
      })}
    </svg>
  );
}
