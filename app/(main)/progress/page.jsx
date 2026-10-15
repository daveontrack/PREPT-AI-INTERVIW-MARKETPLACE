import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import PageHeader from "@/components/reusables";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getSkillProgress } from "@/actions/progress";
import { formatDate } from "@/lib/helpers";
import { CATEGORY_LABEL, RATING_LABEL } from "@/lib/data";
import { Sparkles, TrendingUp, Users, Video } from "lucide-react";

// ─── Trend chart (pure SVG, server-rendered) ────────────────────────────────

function TrendChart({ trend }) {
  if (trend.length < 2) {
    return (
      <div className="rounded-2xl border border-white/10 bg-[#0f0f11] px-6 py-12 text-center text-sm text-stone-600 font-light">
        Complete at least two scored sessions to see your trend line.
      </div>
    );
  }

  const W = 600;
  const H = 170;
  const PAD_X = 10;
  const PAD_Y = 14;

  const xAt = (i) => PAD_X + (i * (W - PAD_X * 2)) / (trend.length - 1);
  const yAt = (v) => H - PAD_Y - ((v ?? 0) / 10) * (H - PAD_Y * 2);

  const linePoints = trend.map((t, i) => `${xAt(i).toFixed(1)},${yAt(t.value).toFixed(1)}`);
  const linePath = `M ${linePoints.join(" L ")}`;
  const areaPath = `${linePath} L ${xAt(trend.length - 1).toFixed(1)},${H - PAD_Y} L ${PAD_X},${H - PAD_Y} Z`;

  return (
    <div className="rounded-2xl border border-white/10 bg-[#0f0f11] px-4 py-4">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-44" role="img" aria-label="Average score per session over time">
        <defs>
          <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* grid lines at 2 / 5 / 8 */}
        {[2, 5, 8].map((v) => (
          <g key={v}>
            <line
              x1={PAD_X}
              x2={W - PAD_X}
              y1={yAt(v)}
              y2={yAt(v)}
              stroke="rgba(255,255,255,0.06)"
              strokeDasharray="3 5"
            />
            <text x={W - PAD_X + 2} y={yAt(v) + 3} fontSize="8" fill="#52525b">
              {v}
            </text>
          </g>
        ))}

        <path d={areaPath} fill="url(#trendFill)" />
        <path d={linePath} fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />

        {trend.map((t, i) => (
          <circle
            key={t.id}
            cx={xAt(i)}
            cy={yAt(t.value)}
            r={3}
            fill={t.source === "SOLO" ? "#10b981" : "#f59e0b"}
            stroke="#0f0f11"
            strokeWidth="1.5"
          >
            <title>
              {`${t.source === "SOLO" ? "Solo practice" : "Live session"} — ${formatDate(t.date)} — ${t.value}/10`}
            </title>
          </circle>
        ))}
      </svg>
      <div className="flex items-center justify-center gap-5 mt-1">
        <span className="inline-flex items-center gap-1.5 text-[11px] text-stone-500">
          <span className="w-2 h-2 rounded-full bg-amber-400" /> Live session
        </span>
        <span className="inline-flex items-center gap-1.5 text-[11px] text-stone-500">
          <span className="w-2 h-2 rounded-full bg-emerald-400" /> Solo practice
        </span>
      </div>
    </div>
  );
}

function DeltaBadge({ delta }) {
  if (delta === null || delta === undefined) return null;
  if (delta > 0.2)
    return (
      <span className="text-[10px] text-emerald-400 border border-emerald-500/20 bg-emerald-500/10 rounded px-1.5 py-0.5">
        ▲ +{delta.toFixed(1)}
      </span>
    );
  if (delta < -0.2)
    return (
      <span className="text-[10px] text-rose-400 border border-rose-500/20 bg-rose-500/10 rounded px-1.5 py-0.5">
        ▼ {delta.toFixed(1)}
      </span>
    );
  return (
    <span className="text-[10px] text-stone-500 border border-white/10 rounded px-1.5 py-0.5">
      → steady
    </span>
  );
}

const RATING_CHIP_STYLES = {
  POOR: "border-red-500/20 bg-red-500/10 text-red-400",
  AVERAGE: "border-yellow-500/20 bg-yellow-500/10 text-yellow-400",
  GOOD: "border-blue-500/20 bg-blue-500/10 text-blue-400",
  EXCELLENT: "border-green-500/20 bg-green-500/10 text-green-400",
};

export default async function ProgressPage() {
  const user = await currentUser();
  if (!user) redirect("/");

  const data = await getSkillProgress();

  const isEmpty = data.totals.sessions === 0;

  return (
    <main className="min-h-screen bg-background">
      <PageHeader
        label="Skill progression"
        gray="Track the skills,"
        gold="beat your past self"
        description="Every score below comes from your AI feedback reports — live interviews and solo practice in one view."
      />

      <div className="max-w-6xl mx-auto px-8 py-10 flex flex-col gap-10">
        {isEmpty ? (
          <div className="rounded-2xl border border-white/10 bg-[#0f0f11] px-8 py-16 flex flex-col items-center gap-5 text-center">
            <span className="w-14 h-14 rounded-2xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center">
              <TrendingUp size={24} className="text-amber-400" />
            </span>
            <div>
              <p className="text-base text-stone-300 font-light">
                No scored sessions yet.
              </p>
              <p className="text-sm text-stone-600 mt-1">
                Finish a live interview or a solo AI practice session and your
                scores will show up here.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="gold" asChild>
                <Link href="/practice">
                  <Sparkles size={15} />
                  Start solo practice
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/explore">
                  <Users size={15} />
                  Book an interviewer
                </Link>
              </Button>
            </div>
          </div>
        ) : (
          <>
            {/* ── KPI row ── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="rounded-2xl border border-white/10 bg-[#0f0f11] px-5 py-4 flex flex-col gap-1">
                <p className="text-[10px] font-semibold text-stone-600 tracking-widest uppercase">
                  Total sessions
                </p>
                <p className="font-serif text-3xl text-stone-200">
                  {data.totals.sessions}
                </p>
                <p className="text-[11px] text-stone-600">
                  {data.totals.live} live · {data.totals.solo} solo
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-[#0f0f11] px-5 py-4 flex flex-col gap-1">
                <p className="text-[10px] font-semibold text-stone-600 tracking-widest uppercase">
                  Overall average
                </p>
                <p className="font-serif text-3xl bg-linear-to-br from-amber-300 to-amber-500 bg-clip-text text-transparent">
                  {data.totals.overall?.toFixed(1) ?? "—"}
                  <span className="text-base text-stone-600">/10</span>
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-[#0f0f11] px-5 py-4 flex flex-col gap-1">
                <p className="text-[10px] font-semibold text-stone-600 tracking-widest uppercase">
                  Strongest area
                </p>
                <p className="text-lg text-stone-200 truncate">
                  {[...data.dimensions]
                    .sort((a, b) => (b.value ?? 0) - (a.value ?? 0))[0]?.label ??
                    "—"}
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-[#0f0f11] px-5 py-4 flex flex-col gap-1">
                <p className="text-[10px] font-semibold text-stone-600 tracking-widest uppercase">
                  Top category
                </p>
                <p className="text-lg text-stone-200 truncate">
                  {data.totals.topCategory ?? "—"}
                </p>
              </div>
            </div>

            {/* ── Skill bars ── */}
            <div className="rounded-2xl border border-white/10 bg-[#0f0f11] px-6 py-6 flex flex-col gap-5">
              <p className="text-xs font-semibold text-stone-500 tracking-widest uppercase">
                Skill averages
              </p>
              {data.dimensions.map((d) => (
                <div key={d.key} className="flex flex-col gap-2">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm text-stone-300">{d.label}</span>
                    <div className="flex items-center gap-2">
                      <DeltaBadge delta={d.delta} />
                      <span className="text-sm text-stone-400 tabular-nums">
                        {d.value?.toFixed(1) ?? "—"}/10
                      </span>
                    </div>
                  </div>
                  <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-linear-to-r from-amber-600 to-amber-300"
                      style={{ width: `${((d.value ?? 0) / 10) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* ── Trend + categories ── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2">
                <p className="text-xs font-semibold text-stone-500 tracking-widest uppercase mb-3">
                  Score per session
                </p>
                <TrendChart trend={data.trend} />
              </div>
              <div>
                <p className="text-xs font-semibold text-stone-500 tracking-widest uppercase mb-3">
                  By category
                </p>
                <div className="rounded-2xl border border-white/10 bg-[#0f0f11] px-5 py-5 flex flex-col gap-4">
                  {data.categories.slice(0, 6).map((c) => (
                    <div key={c.category} className="flex flex-col gap-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-stone-400">
                          {c.label}
                          <span className="text-stone-700 ml-1.5">
                            ×{c.count}
                          </span>
                        </span>
                        <span className="text-xs text-stone-500 tabular-nums">
                          {c.value?.toFixed(1) ?? "—"}
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-emerald-500/70"
                          style={{ width: `${((c.value ?? 0) / 10) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}

                  {/* Overall rating distribution */}
                  <div className="h-px bg-white/5" />
                  <div className="flex flex-wrap gap-1.5">
                    {Object.entries(RATING_LABEL).map(([key, label]) => (
                      <span
                        key={key}
                        className={`text-[10px] px-2 py-1 rounded-md border ${RATING_CHIP_STYLES[key]}`}
                      >
                        {label} · {data.ratings[key] ?? 0}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* ── Recent reports ── */}
            <div className="flex flex-col gap-3">
              <p className="text-xs font-semibold text-stone-500 tracking-widest uppercase">
                Recent reports
              </p>
              {data.recent.map((s) => (
                <Link
                  key={`${s.source}-${s.id}`}
                  href={s.source === "SOLO" ? "/practice" : "/appointments"}
                  className="rounded-2xl border border-white/10 bg-[#0f0f11] px-5 py-4 flex items-center justify-between gap-4 hover:border-amber-400/30 transition-colors"
                >
                  <div className="flex flex-col gap-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-stone-300 truncate">
                        {s.title}
                      </span>
                      {s.overallRating && (
                        <Badge
                          variant="outline"
                          className={`${RATING_CHIP_STYLES[s.overallRating] ?? ""} shrink-0`}
                        >
                          {RATING_LABEL[s.overallRating]}
                        </Badge>
                      )}
                    </div>
                    <span className="text-[11px] text-stone-600">
                      {s.date ? formatDate(s.date) : "—"}
                      {s.category ? ` · ${CATEGORY_LABEL[s.category] ?? s.category}` : ""}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <Badge
                      variant="outline"
                      className={
                        s.source === "SOLO"
                          ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
                          : "border-amber-400/20 bg-amber-400/5 text-amber-400"
                      }
                    >
                      {s.source === "SOLO" ? (
                        <Sparkles size={10} className="mr-1" />
                      ) : (
                        <Video size={10} className="mr-1" />
                      )}
                      {s.source === "SOLO" ? "Solo" : "Live"}
                    </Badge>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </main>
  );
}
