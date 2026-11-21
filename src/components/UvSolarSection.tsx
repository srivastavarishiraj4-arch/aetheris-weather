import { useMemo, useState } from 'react';
import { Sun, Sunrise, Sunset } from 'lucide-react';
import type { CurrentConditionsResponse, ForecastDay, ForecastHour } from '../types/weather';
import { formatClockTime, formatHourLabel, getUvGuidance } from '../utils/weatherIntelligence';

interface UvSolarSectionProps {
  current: CurrentConditionsResponse;
  hours: ForecastHour[];
  today?: ForecastDay;
  timeZone?: string;
}

export function UvSolarSection({ current, hours, today, timeZone }: UvSolarSectionProps) {
  const uvSeries = useMemo(() => {
    const slice = hours.slice(0, 18);
    return slice.map((h, idx) => ({
      label: formatHourLabel(h, idx, timeZone),
      uv: h.uvIndex ?? 0,
      cloudCover: h.cloudCover ?? 0,
      isDaytime: h.isDaytime ?? true,
    }));
  }, [hours, timeZone]);

  const [selectedIdx, setSelectedIdx] = useState<number>(0);

  const currentUv = current.uvIndex ?? 0;
  const activePoint = uvSeries[selectedIdx];
  const displayUv = activePoint ? activePoint.uv : currentUv;
  const guidance = getUvGuidance(displayUv);

  const peakInfo = useMemo(() => {
    if (uvSeries.length === 0) return { peak: currentUv, label: 'Now' };
    let peak = -1;
    let label = uvSeries[0].label;
    uvSeries.forEach((pt) => {
      if (pt.uv > peak) {
        peak = pt.uv;
        label = pt.label;
      }
    });
    return { peak: Math.max(0, peak), label };
  }, [uvSeries, currentUv]);

  // SVG chart coordinates
  const width = 620;
  const height = 170;
  const padX = 24;
  const padY = 22;
  const maxUvScale = Math.max(11, peakInfo.peak + 1);

  const points = useMemo(() => {
    if (uvSeries.length === 0) return [];
    return uvSeries.map((pt, idx) => {
      const x =
        uvSeries.length === 1
          ? width / 2
          : padX + (idx / (uvSeries.length - 1)) * (width - padX * 2);
      const y = height - padY - (Math.min(pt.uv, maxUvScale) / maxUvScale) * (height - padY * 2);
      return { x, y, ...pt, idx };
    });
  }, [uvSeries, maxUvScale]);

  const linePath = useMemo(() => {
    if (points.length === 0) return '';
    return points
      .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
      .join(' ');
  }, [points]);

  const areaPath = useMemo(() => {
    if (points.length === 0) return '';
    const first = points[0];
    const last = points[points.length - 1];
    return `${linePath} L ${last.x.toFixed(1)} ${height - padY} L ${first.x.toFixed(1)} ${height - padY} Z`;
  }, [linePath, points]);

  const uvBarPercent = Math.min(100, Math.round((displayUv / 11) * 100));

  return (
    <section id="uv-solar" className="glass-panel rounded-3xl p-6 md:p-8 scroll-mt-24">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between pb-6 border-b border-white/15">
        <div>
          <h2 className="font-display text-2xl md:text-[1.7rem] font-semibold tracking-tight text-white">
            UV Index & Solar Exposure
          </h2>
          <p className="mt-1 text-sm text-white/70">
            Hourly ultraviolet radiation curve, peak solar window, and dermatological protection guidance
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-white/70 font-mono tabular-nums">
          <span>Peak Today: UV {peakInfo.peak} at {peakInfo.label}</span>
          <span aria-hidden="true">·</span>
          <span>Cloud Cover: {current.cloudCover ?? 0}%</span>
        </div>
      </div>

      <div className="mt-7 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left 4 cols: UV Score, Spectrum Bar & Advice */}
        <div className="lg:col-span-4 flex flex-col gap-5">
          <div className="flex items-baseline justify-between gap-4">
            <div>
              <div className="text-xs text-white/60">
                {selectedIdx === 0 ? 'Current UV Index' : `Forecast at ${activePoint?.label}`}
              </div>
              <div className="mt-1 flex items-baseline gap-3">
                <span className="font-mono text-5xl font-semibold tracking-tight text-white tabular-nums">
                  {displayUv}
                </span>
                <span
                  className="font-display text-xl font-semibold"
                  style={{ color: guidance.color }}
                >
                  {guidance.level}
                </span>
              </div>
            </div>
            <Sun className="w-8 h-8 text-amber-300/90 shrink-0" aria-hidden="true" />
          </div>

          {/* WHO UV Scale Gradient Track */}
          <div>
            <div className="relative h-2.5 w-full rounded-full bg-gradient-to-r from-emerald-400 via-amber-400 via-65% to-purple-400">
              <div
                className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 h-4 w-4 rounded-full bg-white shadow-md border-2 border-slate-900 transition-all duration-300"
                style={{ left: `${uvBarPercent}%` }}
              />
            </div>
            <div className="mt-2 flex justify-between font-mono text-[11px] text-white/60 tabular-nums">
              <span>0 Low</span>
              <span>3 Mod</span>
              <span>6 High</span>
              <span>8 V.High</span>
              <span>11+ Ext</span>
            </div>
          </div>

          <p className="text-sm text-white/85 leading-relaxed">{guidance.action}</p>

          {/* Sunrise / Sunset Row */}
          <div className="pt-4 border-t border-white/12 grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2.5">
              <Sunrise className="w-4 h-4 text-amber-300 shrink-0" aria-hidden="true" />
              <div>
                <div className="text-xs text-white/60">Sunrise</div>
                <div className="font-mono text-sm font-medium text-white tabular-nums">
                  {formatClockTime(today?.sunEvents?.sunriseTime, timeZone)}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <Sunset className="w-4 h-4 text-orange-300 shrink-0" aria-hidden="true" />
              <div>
                <div className="text-xs text-white/60">Sunset</div>
                <div className="font-mono text-sm font-medium text-white tabular-nums">
                  {formatClockTime(today?.sunEvents?.sunsetTime, timeZone)}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right 8 cols: Interactive Hourly UV Curve + 3 Protection Metrics */}
        <div className="lg:col-span-8 flex flex-col gap-6 lg:pl-6 lg:border-l lg:border-white/12">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-white/70">
                18-Hour Ultraviolet Radiation Curve (click any point to inspect)
              </span>
              {activePoint && (
                <span className="font-mono text-xs text-white/80 tabular-nums">
                  {activePoint.label} · UV {activePoint.uv} · Clouds {activePoint.cloudCover}%
                </span>
              )}
            </div>

            {points.length > 1 ? (
              <div className="w-full overflow-x-auto weather-scroll">
                <svg
                  viewBox={`0 0 ${width} ${height}`}
                  className="w-full min-w-[460px] h-44"
                  role="img"
                  aria-label="Hourly UV index curve"
                >
                  <defs>
                    <linearGradient id="uv-area-grad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#FBBF24" stopOpacity="0.45" />
                      <stop offset="100%" stopColor="#FBBF24" stopOpacity="0.02" />
                    </linearGradient>
                    <linearGradient id="uv-stroke-grad" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#34D399" />
                      <stop offset="50%" stopColor="#FBBF24" />
                      <stop offset="100%" stopColor="#FB923C" />
                    </linearGradient>
                  </defs>

                  {/* Horizontal reference grid lines for UV 3, 6, 9 */}
                  {[3, 6, 9].map((level) => {
                    const gy =
                      height - padY - (level / maxUvScale) * (height - padY * 2);
                    return (
                      <g key={level}>
                        <line
                          x1={padX}
                          y1={gy}
                          x2={width - padX}
                          y2={gy}
                          stroke="rgba(255,255,255,0.12)"
                          strokeDasharray="4 4"
                        />
                        <text
                          x={6}
                          y={gy + 3}
                          fill="rgba(255,255,255,0.5)"
                          fontSize="10"
                          fontFamily="JetBrains Mono, monospace"
                        >
                          {level}
                        </text>
                      </g>
                    );
                  })}

                  <path d={areaPath} fill="url(#uv-area-grad)" />
                  <path
                    d={linePath}
                    fill="none"
                    stroke="url(#uv-stroke-grad)"
                    strokeWidth="2.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />

                  {points.map((pt) => {
                    const isSelected = pt.idx === selectedIdx;
                    const showLabel = pt.idx % 3 === 0 || pt.idx === points.length - 1;
                    return (
                      <g key={pt.idx}>
                        <circle
                          cx={pt.x}
                          cy={pt.y}
                          r={isSelected ? 6 : 3.5}
                          fill={isSelected ? '#FFFFFF' : '#FDE047'}
                          stroke={isSelected ? '#0F172A' : 'transparent'}
                          strokeWidth={2}
                          className="cursor-pointer transition-all"
                          onClick={() => setSelectedIdx(pt.idx)}
                        />
                        {/* Larger invisible click target for accessibility */}
                        <circle
                          cx={pt.x}
                          cy={pt.y}
                          r={14}
                          fill="transparent"
                          className="cursor-pointer"
                          onClick={() => setSelectedIdx(pt.idx)}
                        />
                        {showLabel && (
                          <text
                            x={pt.x}
                            y={height - 4}
                            textAnchor="middle"
                            fill="rgba(255,255,255,0.65)"
                            fontSize="10"
                            fontFamily="JetBrains Mono, monospace"
                          >
                            {pt.label}
                          </text>
                        )}
                      </g>
                    );
                  })}
                </svg>
              </div>
            ) : (
              <div className="py-8 text-sm text-white/65">
                Hourly UV curve data is loading or unavailable for this coordinate.
              </div>
            )}
          </div>

          {/* 3-Column Sun Protection Matrix */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 pt-5 border-t border-white/12">
            <div>
              <div className="text-xs text-white/60">Recommended SPF</div>
              <div className="mt-1 font-display text-base font-semibold text-white">
                {guidance.spf}
              </div>
            </div>
            <div>
              <div className="text-xs text-white/60">Unprotected Window</div>
              <div className="mt-1 font-mono text-base font-semibold text-white tabular-nums">
                {guidance.safeExposure}
              </div>
            </div>
            <div>
              <div className="text-xs text-white/60">Reapplication Cadence</div>
              <div className="mt-1 font-display text-base font-semibold text-white">
                {guidance.reapply}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
