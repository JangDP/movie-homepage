"use client";

import { useEffect, useMemo, useState } from "react";

import { useAdminUser } from "@/components/AdminAuthContext";
import { supabase } from "@/lib/supabase";
import {
  addDays,
  calculatePercentChange,
  getDateRange,
  getKoreaDateKey,
  type VisitorStatsRow,
} from "@/lib/visitor-stats";
import { canViewVisitorStats } from "@/types/admin";

type VisitorRange = "7" | "30" | "90" | "all";

const rangeOptions: Array<{ label: string; value: VisitorRange }> = [
  { label: "7일", value: "7" },
  { label: "30일", value: "30" },
  { label: "90일", value: "90" },
  { label: "전체", value: "all" },
];

function emptyRow(date: string): VisitorStatsRow {
  return {
    id: date,
    date,
    page_views: 0,
    unique_visitors: 0,
    created_at: null,
    updated_at: null,
  };
}

function formatNumber(value: number) {
  return value.toLocaleString("ko-KR");
}

function formatPercent(value: number) {
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(1)}%`;
}

function formatDate(dateKey: string) {
  return new Date(`${dateKey}T00:00:00+09:00`).toLocaleDateString("ko-KR", {
    month: "short",
    day: "numeric",
    weekday: "short",
  });
}

function sumRows(rows: VisitorStatsRow[], key: "page_views" | "unique_visitors") {
  return rows.reduce((sum, row) => sum + Number(row[key] ?? 0), 0);
}

function StatCard({
  label,
  value,
  helper,
  tone = "neutral",
}: {
  label: string;
  value: string;
  helper?: string;
  tone?: "neutral" | "up" | "down";
}) {
  const toneClass =
    tone === "up" ? "text-red-300" : tone === "down" ? "text-sky-300" : "text-white";

  return (
    <div className="rounded-lg border border-zinc-800 bg-black/55 p-5">
      <p className="text-xs font-bold text-zinc-500">{label}</p>
      <p className={`mt-3 text-2xl font-black ${toneClass}`}>{value}</p>
      {helper ? <p className="mt-2 text-xs leading-5 text-zinc-500">{helper}</p> : null}
    </div>
  );
}

function VisitorLineChart({ rows }: { rows: VisitorStatsRow[] }) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const width = 1000;
  const height = 320;
  const padding = 42;
  const maxVisitors = Math.max(...rows.map((row) => row.unique_visitors), 1);
  const firstValue = rows[0]?.unique_visitors ?? 0;
  const lastValue = rows[rows.length - 1]?.unique_visitors ?? 0;
  const stroke = lastValue >= firstValue ? "#dc2626" : "#38bdf8";

  const points = rows.map((row, index) => {
    const x =
      rows.length === 1
        ? width / 2
        : padding + (index / (rows.length - 1)) * (width - padding * 2);
    const y =
      height - padding - (row.unique_visitors / maxVisitors) * (height - padding * 2);

    return { x, y, row };
  });

  const linePoints = points.map((point) => `${point.x},${point.y}`).join(" ");
  const hovered = hoveredIndex === null ? null : points[hoveredIndex];

  return (
    <div className="rounded-lg border border-zinc-800 bg-black/55 p-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-lg font-black text-white">방문자 변화 추이</h2>
          <p className="mt-1 text-sm text-zinc-500">순방문자 기준 선 그래프입니다.</p>
        </div>
        {hovered ? (
          <div className="rounded border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-300">
            <span className="font-bold text-white">{formatDate(hovered.row.date)}</span>
            <span className="ml-2">방문자 {formatNumber(hovered.row.unique_visitors)}명</span>
          </div>
        ) : null}
      </div>

      <div className="mt-5 overflow-x-auto">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="h-[280px] min-w-[720px] rounded bg-zinc-950/70"
          role="img"
          aria-label="날짜별 방문자 수 선 그래프"
          onMouseLeave={() => setHoveredIndex(null)}
        >
          {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
            const y = padding + ratio * (height - padding * 2);
            const label = Math.round(maxVisitors * (1 - ratio));

            return (
              <g key={ratio}>
                <line
                  x1={padding}
                  x2={width - padding}
                  y1={y}
                  y2={y}
                  stroke="rgba(63,63,70,0.65)"
                  strokeDasharray="4 6"
                />
                <text x={10} y={y + 4} fill="#71717a" fontSize="12">
                  {label}
                </text>
              </g>
            );
          })}
          {linePoints ? (
            <polyline
              fill="none"
              points={linePoints}
              stroke={stroke}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="4"
            />
          ) : null}
          {points.map((point, index) => (
            <g key={point.row.date}>
              <circle
                cx={point.x}
                cy={point.y}
                r={hoveredIndex === index ? 7 : 5}
                fill={stroke}
                stroke="#0a0a0a"
                strokeWidth="3"
                onMouseEnter={() => setHoveredIndex(index)}
              >
                <title>
                  {point.row.date} 방문자 {point.row.unique_visitors}명
                </title>
              </circle>
              {index === 0 || index === points.length - 1 || index % Math.ceil(points.length / 6) === 0 ? (
                <text
                  x={point.x}
                  y={height - 12}
                  fill="#71717a"
                  fontSize="12"
                  textAnchor="middle"
                >
                  {point.row.date.slice(5)}
                </text>
              ) : null}
            </g>
          ))}
        </svg>
      </div>
    </div>
  );
}

export function AdminVisitorsDashboard() {
  const currentAdmin = useAdminUser();
  const canView = canViewVisitorStats(currentAdmin.role);
  const [range, setRange] = useState<VisitorRange>("30");
  const [rows, setRows] = useState<VisitorStatsRow[]>([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      if (!supabase || !canView) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setMessage("");

      const { data, error } = await supabase
        .from("visitor_stats")
        .select("id,date,page_views,unique_visitors,created_at,updated_at")
        .order("date", { ascending: true })
        .limit(2000);

      setLoading(false);

      if (error) {
        setMessage(`방문자 통계 조회 실패: ${error.message}`);
        return;
      }

      setRows((data ?? []) as VisitorStatsRow[]);
    }

    void loadStats();
  }, [canView]);

  const today = getKoreaDateKey();
  const yesterday = addDays(today, -1);

  const stats = useMemo(() => {
    const rowMap = new Map(rows.map((row) => [row.date, row]));
    const todayRow = rowMap.get(today) ?? emptyRow(today);
    const yesterdayRow = rowMap.get(yesterday) ?? emptyRow(yesterday);
    const last7Keys = getDateRange(7, today);
    const last30Keys = getDateRange(30, today);
    const previous7Keys = getDateRange(7, addDays(today, -7));
    const last7Rows = last7Keys.map((date) => rowMap.get(date) ?? emptyRow(date));
    const last30Rows = last30Keys.map((date) => rowMap.get(date) ?? emptyRow(date));
    const previous7Rows = previous7Keys.map((date) => rowMap.get(date) ?? emptyRow(date));
    const totalVisitors = sumRows(rows, "unique_visitors");
    const last7Visitors = sumRows(last7Rows, "unique_visitors");
    const last30Visitors = sumRows(last30Rows, "unique_visitors");
    const previous7Visitors = sumRows(previous7Rows, "unique_visitors");

    return {
      rowMap,
      todayVisitors: todayRow.unique_visitors,
      yesterdayVisitors: yesterdayRow.unique_visitors,
      totalVisitors,
      last7Visitors,
      last30Visitors,
      dayChange: calculatePercentChange(todayRow.unique_visitors, yesterdayRow.unique_visitors),
      weekChange: calculatePercentChange(last7Visitors, previous7Visitors),
    };
  }, [rows, today, yesterday]);

  const visibleRows = useMemo(() => {
    if (range === "all") {
      if (rows.length === 0) {
        return [emptyRow(today)];
      }

      return rows;
    }

    return getDateRange(Number(range), today).map(
      (date) => stats.rowMap.get(date) ?? emptyRow(date),
    );
  }, [range, rows, stats.rowMap, today]);

  const tableRows = [...visibleRows].reverse();

  if (!canView) {
    return (
      <div className="rounded-lg border border-zinc-800 bg-black/50 p-6">
        <p className="text-sm font-bold uppercase tracking-[0.18em] text-red-500">
          접근 제한
        </p>
        <h2 className="mt-3 text-2xl font-black text-white">관리자만 접근할 수 있습니다.</h2>
        <p className="mt-3 text-sm leading-6 text-zinc-400">
          방문자 통계는 최고 관리자와 관리자 권한만 확인할 수 있습니다.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-5">
      {message ? (
        <div className="rounded-lg border border-red-900 bg-red-950/35 p-4 text-sm font-bold text-red-100">
          {message}
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="오늘 방문자 수" value={formatNumber(stats.todayVisitors)} helper={today} />
        <StatCard label="어제 방문자 수" value={formatNumber(stats.yesterdayVisitors)} helper={yesterday} />
        <StatCard label="전체 방문자 수" value={formatNumber(stats.totalVisitors)} helper="일별 순방문자 합계" />
        <StatCard label="최근 7일 방문자 수" value={formatNumber(stats.last7Visitors)} helper="오늘 포함 7일" />
        <StatCard label="최근 30일 방문자 수" value={formatNumber(stats.last30Visitors)} helper="오늘 포함 30일" />
        <StatCard
          label="전일 대비"
          value={formatPercent(stats.dayChange)}
          helper="오늘 vs 어제"
          tone={stats.dayChange >= 0 ? "up" : "down"}
        />
        <StatCard
          label="전주 대비"
          value={formatPercent(stats.weekChange)}
          helper="최근 7일 vs 이전 7일"
          tone={stats.weekChange >= 0 ? "up" : "down"}
        />
        <StatCard
          label="선택 기간 페이지뷰"
          value={formatNumber(sumRows(visibleRows, "page_views"))}
          helper="같은 페이지는 하루 1회 기준"
        />
      </div>

      <section className="rounded-lg border border-zinc-800 bg-black/55 p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-black text-white">기간 선택</h2>
            <p className="mt-1 text-sm text-zinc-500">
              기본은 최근 30일이며, 버튼을 눌러 통계 범위를 바꿀 수 있습니다.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {rangeOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setRange(option.value)}
                className={`rounded border px-4 py-2 text-sm font-bold transition ${
                  range === option.value
                    ? "border-red-700 bg-red-700 text-white"
                    : "border-zinc-800 bg-zinc-950 text-zinc-400 hover:border-zinc-600 hover:text-white"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      <VisitorLineChart rows={visibleRows} />

      <section className="rounded-lg border border-zinc-800 bg-black/55 p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-black text-white">날짜별 방문자 수</h2>
            <p className="mt-1 text-sm text-zinc-500">
              순방문자, 페이지뷰, 전일 대비 증감을 함께 확인합니다.
            </p>
          </div>
          {loading ? <p className="text-sm text-zinc-500">불러오는 중...</p> : null}
        </div>
        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="border-b border-zinc-800 text-xs uppercase text-zinc-500">
              <tr>
                <th className="py-3 pr-4">날짜</th>
                <th className="py-3 pr-4">방문자 수</th>
                <th className="py-3 pr-4">페이지뷰</th>
                <th className="py-3">전일 대비</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-900">
              {tableRows.map((row) => {
                const previous = stats.rowMap.get(addDays(row.date, -1)) ?? emptyRow(addDays(row.date, -1));
                const delta = row.unique_visitors - previous.unique_visitors;
                const tone = delta > 0 ? "text-red-300" : delta < 0 ? "text-sky-300" : "text-zinc-500";

                return (
                  <tr key={row.date} className="text-zinc-300">
                    <td className="py-4 pr-4 font-bold text-white">{formatDate(row.date)}</td>
                    <td className="py-4 pr-4">{formatNumber(row.unique_visitors)}명</td>
                    <td className="py-4 pr-4">{formatNumber(row.page_views)}회</td>
                    <td className={`py-4 font-bold ${tone}`}>
                      {delta > 0 ? "+" : ""}
                      {formatNumber(delta)}명
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {rows.length === 0 && !loading ? (
            <p className="py-8 text-center text-sm text-zinc-500">
              아직 집계된 방문자 통계가 없습니다.
            </p>
          ) : null}
        </div>
      </section>
    </div>
  );
}
