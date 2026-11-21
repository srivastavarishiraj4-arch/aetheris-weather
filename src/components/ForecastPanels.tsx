import { useMemo, useState } from 'react';
import { Cloud, Droplets, Sun, Thermometer, Wind } from 'lucide-react';
import type { ForecastDay, ForecastHour, TempUnit } from '../types/weather';
import {
  cToF,
  classifyWeatherVisual,
  formatCardinal,
  formatDayLabel,
  formatHourLabel,
  formatSpeed,
  formatTemp,
} from '../utils/weatherIntelligence';
import { AnimatedWeatherIcon } from './AnimatedWeatherIcon';

interface ForecastPanelsProps {
  hours: ForecastHour[];
  days: ForecastDay[];
  timeZone?: string;
  unit: TempUnit;
}

type CurveMetric = 'temp' | 'precip' | 'wind';

const METRIC_TABS: Array<{ id: CurveMetric; label: string }> = [
  { id: 'temp', label: 'Temperature' },
  { id: 'precip', label: 'Rain %' },
  { id: 'wind', label: 'Wind' },
];

export function ForecastPanels({ hours, days, timeZone, unit }: ForecastPanelsProps) {
  const hourlyItems = hours.slice(0, 18);
  const dailyItems = days.slice(0, 7);

  const [selectedHourIdx, setSelectedHourIdx] = useState<number>(0);
  const [curveMetric, setCurveMetric] = useState<CurveMetric>('temp');

  const safeSelectedIdx = Math.min(selectedHourIdx, Math.max(0, hourlyItems.length - 1));
  const selectedHour = hourlyItems[safeSelectedIdx];

  const weeklyRange = useMemo(() => {
    const mins = dailyItems
      .map((d) => d.minTemperature?.degrees)
      .filter((v): v is number => typeof v === 'number');
    const maxs = dailyItems
      .map((d) => d.maxTemperature?.degrees)
      .filter((v): v is number => typeof v === 'number');
    if (mins.length === 0 || maxs.length === 0) return { min: 0, max: 30 };
    return { min: Math.min(...mins), max: Math.max(...maxs) };
  }, [dailyItems]);

  const span = Math.max(1, weeklyRange.max - weeklyRange.min);

  // Build interactive hourly trajectory curve data
  const curveData = useMemo(() => {
    return hourlyItems.map((h, idx) => {
      const tempC = h.temperature?.degrees ?? 0;
      const tempDisplay = unit === 'F' ? cToF(tempC) : tempC;
      const precip = h.precipitation?.probability?.percent ?? 0;
      const windKmh = h.wind?.speed?.value ?? 0;
      const windDisplay = unit === 'F' ? windKmh * 0.621371 : windKmh;

      const value =
        curveMetric === 'temp' ? tempDisplay : curveMetric === 'precip' ? precip : windDisplay;

      return {
        idx,
        label: formatHourLabel(h, idx, timeZone),
        value,
        formatted:
          curveMetric === 'temp'
            ? `${Math.round(tempDisplay)}°`
            : curveMetric === 'precip'
            ? `${Math.round(precip)}%`
            : `${Math.round(windDisplay)} ${unit === 'F' ? 'mph' : 'km/h'}`,
      };
    });
  }, [hourlyItems, curveMetric, unit, timeZone]);

  // SVG Curve Geometry
  const svgW = 640;
  const svgH = 148;
  const padX = 22;
  const padTop = 24;
  const padBottom = 24;

  const { points, smoothPath, areaPath, minVal, maxVal, strokeColor, areaColor } = useMemo(() => {
    if (curveData.length === 0) {
      return {
        points: [],
        smoothPath: '',
        areaPath: '',
        minVal: 0,
        maxVal: 100,
        strokeColor: '#FBBF24',
        areaColor: '#FBBF24',
      };
    }

    const values = curveData.map((d) => d.value);
    const rawMin = Math.min(...values);
    const rawMax = Math.max(...values);

    const minV = curveMetric === 'precip' ? 0 : Math.floor(rawMin - 1.5);
    const maxV =
      curveMetric === 'precip'
        ? Math.max(40, Math.ceil(rawMax / 10) * 10)
        : Math.ceil(rawMax + 1.5);
    const range = Math.max(1, maxV - minV);

    const pts = curveData.map((d, i) => {
      const x =
        curveData.length === 1
          ? svgW / 2
          : padX + (i / (curveData.length - 1)) * (svgW - padX * 2);
      const y = svgH - padBottom - ((d.value - minV) / range) * (svgH - padTop - padBottom);
      return { ...d, x, y };
    });

    // Smooth Catmull-Rom / cubic Bezier curve between points
    let path = `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i];
      const p1 = pts[i + 1];
      const midX = ((p0.x + p1.x) / 2).toFixed(1);
      path += ` C ${midX} ${p0.y.toFixed(1)}, ${midX} ${p1.y.toFixed(1)}, ${p1.x.toFixed(1)} ${p1.y.toFixed(1)}`;
    }

    const area = `${path} L ${pts[pts.length - 1].x.toFixed(1)} ${svgH - padBottom} L ${pts[0].x.toFixed(1)} ${svgH - padBottom} Z`;

    const stroke =
      curveMetric === 'temp' ? '#FCD34D' : curveMetric === 'precip' ? '#38BDF8' : '#5EEAD4';

    return {
      points: pts,
      smoothPath: path,
      areaPath: area,
      minVal: Math.round(rawMin),
      maxVal: Math.round(rawMax),
      strokeColor: stroke,
      areaColor: stroke,
    };
  }, [curveData, curveMetric]);

  const metricSummaryText = useMemo(() => {
    if (curveData.length === 0) return '';
    const unitSuffix =
      curveMetric === 'temp' ? `°${unit}` : curveMetric === 'precip' ? '%' : unit === 'F' ? ' mph' : ' km/h';
    return `Range ${minVal}${unitSuffix} – ${maxVal}${unitSuffix}`;
  }, [curveData.length, curveMetric, minVal, maxVal, unit]);

  return (
    <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
      {/* 18-Hour Trajectory (Left 7 cols) */}
      <div className="lg:col-span-7 glass-panel rounded-3xl p-6 md:p-7 flex flex-col justify-between gap-5">
        {/* Top Header + Interactive Metric Mode Switcher */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/15">
          <div>
            <h2 className="font-display text-xl font-semibold text-white">
              Hourly Trajectory
            </h2>
            <p className="text-xs text-white/65 mt-0.5 font-mono tabular-nums">
              Next {hourlyItems.length} hrs {metricSummaryText ? `· ${metricSummaryText}` : ''}
            </p>
          </div>

          <div
            className="flex items-center gap-1 p-1 rounded-xl bg-white/8 border border-white/10 self-start sm:self-auto"
            role="tablist"
            aria-label="Hourly curve metric"
          >
            {METRIC_TABS.map((tab) => {
              const active = curveMetric === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setCurveMetric(tab.id)}
                  className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-white ${
                    active
                      ? 'bg-white text-slate-950 shadow-sm'
                      : 'text-white/75 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {hourlyItems.length > 0 ? (
          <>
            {/* Interactive Smooth Hourly SVG Trajectory Curve */}
            <div className="w-full overflow-x-auto weather-scroll">
              <svg
                viewBox={`0 0 ${svgW} ${svgH}`}
                className="w-full min-w-[460px] h-36"
                role="img"
                aria-label={`18-hour ${curveMetric} trajectory chart`}
              >
                <defs>
                  <linearGradient id="hourly-curve-area" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={areaColor} stopOpacity="0.34" />
                    <stop offset="100%" stopColor={areaColor} stopOpacity="0.02" />
                  </linearGradient>
                </defs>

                {/* Subtle horizontal baseline & midpoint line */}
                <line
                  x1={padX}
                  y1={svgH - padBottom}
                  x2={svgW - padX}
                  y2={svgH - padBottom}
                  stroke="rgba(255,255,255,0.14)"
                />
                <line
                  x1={padX}
                  y1={(padTop + svgH - padBottom) / 2}
                  x2={svgW - padX}
                  y2={(padTop + svgH - padBottom) / 2}
                  stroke="rgba(255,255,255,0.08)"
                  strokeDasharray="4 4"
                />

                <path d={areaPath} fill="url(#hourly-curve-area)" />
                <path
                  d={smoothPath}
                  fill="none"
                  stroke={strokeColor}
                  strokeWidth="2.6"
                  strokeLinecap="round"
                />

                {points.map((pt) => {
                  const isSelected = pt.idx === safeSelectedIdx;
                  const showTick = pt.idx % 3 === 0 || pt.idx === points.length - 1;
                  return (
                    <g key={pt.idx}>
                      {isSelected && (
                        <>
                          <line
                            x1={pt.x}
                            y1={pt.y}
                            x2={pt.x}
                            y2={svgH - padBottom}
                            stroke="rgba(255,255,255,0.35)"
                            strokeDasharray="3 3"
                          />
                          <text
                            x={pt.x}
                            y={Math.max(13, pt.y - 10)}
                            textAnchor="middle"
                            fill="#FFFFFF"
                            fontSize="11"
                            fontWeight="600"
                            fontFamily="JetBrains Mono, monospace"
                          >
                            {pt.formatted}
                          </text>
                        </>
                      )}
                      <circle
                        cx={pt.x}
                        cy={pt.y}
                        r={isSelected ? 5.5 : 3}
                        fill={isSelected ? '#FFFFFF' : strokeColor}
                        stroke={isSelected ? '#0F172A' : 'transparent'}
                        strokeWidth={2}
                        className="cursor-pointer transition-all"
                        onClick={() => setSelectedHourIdx(pt.idx)}
                      />
                      <circle
                        cx={pt.x}
                        cy={pt.y}
                        r={13}
                        fill="transparent"
                        className="cursor-pointer"
                        onClick={() => setSelectedHourIdx(pt.idx)}
                      />
                      {showTick && (
                        <text
                          x={pt.x}
                          y={svgH - 6}
                          textAnchor="middle"
                          fill={isSelected ? '#FFFFFF' : 'rgba(255,255,255,0.6)'}
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

            {/* Interactive Scrollable Hourly Tiles */}
            <div className="flex gap-2.5 overflow-x-auto pb-2 weather-scroll">
              {hourlyItems.map((h, idx) => {
                const visual = classifyWeatherVisual(
                  h.weatherCondition?.type,
                  h.isDaytime ?? true,
                  h.wind?.speed?.value ?? 0
                );
                const rainChance = h.precipitation?.probability?.percent ?? 0;
                const isSelected = idx === safeSelectedIdx;

                return (
                  <button
                    key={h.interval?.startTime ?? idx}
                    type="button"
                    onClick={() => setSelectedHourIdx(idx)}
                    className={`flex flex-col items-center justify-between min-w-[74px] py-3 px-2 rounded-2xl transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-white ${
                      isSelected
                        ? 'bg-white/18 border border-white/35 shadow-sm'
                        : 'bg-white/4 border border-white/8 hover:bg-white/10'
                    }`}
                  >
                    <span className="font-mono text-xs text-white/85 whitespace-nowrap tabular-nums">
                      {formatHourLabel(h, idx, timeZone)}
                    </span>

                    <div className="my-2">
                      <AnimatedWeatherIcon category={visual} size={36} />
                    </div>

                    <span className="font-mono text-base font-semibold text-white tabular-nums">
                      {formatTemp(h.temperature?.degrees, unit)}
                    </span>

                    <div className="mt-1 flex items-center gap-0.5 font-mono text-[11px] text-sky-200/90 tabular-nums">
                      <Droplets className="w-3 h-3 opacity-80" aria-hidden="true" />
                      <span>{rainChance}%</span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Selected Hour Atmospheric Inspector Strip */}
            {selectedHour && (
              <div className="pt-4 border-t border-white/15 grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <div className="flex items-center gap-1.5 text-[11px] text-white/60">
                    <Thermometer className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>{formatHourLabel(selectedHour, safeSelectedIdx, timeZone)} · Feels Like</span>
                  </div>
                  <div className="mt-1 font-mono text-sm font-semibold text-white tabular-nums">
                    {formatTemp(selectedHour.feelsLikeTemperature?.degrees ?? selectedHour.temperature?.degrees, unit)}
                    <span className="font-sans font-normal text-xs text-white/70 ml-1.5">
                      {selectedHour.weatherCondition?.description?.text || 'Clear'}
                    </span>
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-1.5 text-[11px] text-white/60">
                    <Wind className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Wind & Gust</span>
                  </div>
                  <div className="mt-1 font-mono text-sm font-semibold text-white tabular-nums">
                    {formatSpeed(selectedHour.wind?.speed?.value, unit)}{' '}
                    <span className="text-xs font-normal text-white/70">
                      {formatCardinal(selectedHour.wind?.direction?.cardinal)}
                    </span>
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-1.5 text-[11px] text-white/60">
                    <Droplets className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Humidity & Rain</span>
                  </div>
                  <div className="mt-1 font-mono text-sm font-semibold text-white tabular-nums">
                    {selectedHour.relativeHumidity ?? '—'}% · {selectedHour.precipitation?.probability?.percent ?? 0}%
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-1.5 text-[11px] text-white/60">
                    {selectedHour.isDaytime ? (
                      <Sun className="w-3.5 h-3.5" aria-hidden="true" />
                    ) : (
                      <Cloud className="w-3.5 h-3.5" aria-hidden="true" />
                    )}
                    <span>UV & Cloud Cover</span>
                  </div>
                  <div className="mt-1 font-mono text-sm font-semibold text-white tabular-nums">
                    UV {selectedHour.uvIndex ?? 0} · {selectedHour.cloudCover ?? 0}%
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="py-10 text-sm text-white/65">
            Hourly forecast intervals are unavailable for this location.
          </div>
        )}
      </div>

      {/* 7-Day Forecast (Right 5 cols) */}
      <div className="lg:col-span-5 glass-panel rounded-3xl p-6 md:p-7 flex flex-col">
        <div className="flex items-baseline justify-between gap-4 pb-4 border-b border-white/15">
          <div>
            <h2 className="font-display text-xl font-semibold text-white">
              7-Day Outlook
            </h2>
            <p className="text-xs text-white/65 mt-0.5">
              Daily thermal envelope and daytime sky conditions
            </p>
          </div>
          <span className="font-mono text-xs text-white/60 tabular-nums">
            {dailyItems.length} days
          </span>
        </div>

        {dailyItems.length > 0 ? (
          <div className="mt-2 divide-y divide-white/10 flex-1 flex flex-col justify-between">
            {dailyItems.map((day, idx) => {
              const cond = day.daytimeForecast?.weatherCondition;
              const visual = classifyWeatherVisual(
                cond?.type,
                true,
                day.daytimeForecast?.wind?.speed?.value ?? 0
              );
              const minC = day.minTemperature?.degrees ?? weeklyRange.min;
              const maxC = day.maxTemperature?.degrees ?? weeklyRange.max;
              const leftPct = Math.max(0, Math.min(100, ((minC - weeklyRange.min) / span) * 100));
              const widthPct = Math.max(8, Math.min(100 - leftPct, ((maxC - minC) / span) * 100));
              const rainPct = day.daytimeForecast?.precipitation?.probability?.percent ?? 0;

              return (
                <div
                  key={day.interval?.startTime ?? idx}
                  className="grid grid-cols-12 items-center gap-2 py-2.5"
                >
                  <div className="col-span-3 text-sm font-medium text-white truncate">
                    {formatDayLabel(day, idx)}
                  </div>

                  <div className="col-span-3 flex items-center gap-2">
                    <AnimatedWeatherIcon category={visual} size={28} />
                    <span className="font-mono text-xs text-sky-200/85 tabular-nums">
                      {rainPct > 0 ? `${rainPct}%` : '—'}
                    </span>
                  </div>

                  <div className="col-span-6 flex items-center gap-2.5">
                    <span className="w-8 text-right font-mono text-xs text-white/65 tabular-nums">
                      {formatTemp(day.minTemperature?.degrees, unit)}
                    </span>
                    <div className="relative flex-1 h-1.5 rounded-full bg-white/12 overflow-hidden">
                      <div
                        className="absolute top-0 bottom-0 rounded-full bg-gradient-to-r from-sky-300 via-amber-200 to-amber-400"
                        style={{
                          left: `${leftPct}%`,
                          width: `${widthPct}%`,
                        }}
                      />
                    </div>
                    <span className="w-8 font-mono text-xs font-semibold text-white tabular-nums">
                      {formatTemp(day.maxTemperature?.degrees, unit)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-10 text-sm text-white/65">
            Multi-day forecast data is unavailable for this location.
          </div>
        )}
      </div>
    </section>
  );
}
