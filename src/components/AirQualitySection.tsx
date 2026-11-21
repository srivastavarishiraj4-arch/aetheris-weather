import { useMemo, useState } from 'react';
import { ShieldAlert, Wind } from 'lucide-react';
import type { AirQualityResponse, HealthRecommendations, PollutantItem } from '../types/weather';
import {
  evaluatePollutant,
  formatPollutantUnit,
  parseAqiColor,
} from '../utils/weatherIntelligence';

interface AirQualitySectionProps {
  airQuality: AirQualityResponse | null;
}

type HealthGroupKey = keyof HealthRecommendations;

const HEALTH_TABS: Array<{ key: HealthGroupKey; label: string }> = [
  { key: 'generalPopulation', label: 'General' },
  { key: 'athletes', label: 'Athletes' },
  { key: 'children', label: 'Children' },
  { key: 'elderly', label: 'Elderly' },
  { key: 'lungDiseasePopulation', label: 'Respiratory' },
  { key: 'heartDiseasePopulation', label: 'Cardiac' },
];

export function AirQualitySection({ airQuality }: AirQualitySectionProps) {
  const [selectedPollutantCode, setSelectedPollutantCode] = useState<string | null>(null);
  const [activeHealthGroup, setActiveHealthGroup] = useState<HealthGroupKey>('generalPopulation');

  const indexes = airQuality?.indexes ?? [];
  const pollutants = airQuality?.pollutants ?? [];
  const health = airQuality?.healthRecommendations;

  const universalIndex = indexes.find((i) => i.code === 'uaqi') ?? indexes[0];
  const localIndex = indexes.find((i) => i.code !== 'uaqi');

  const activePollutant: PollutantItem | undefined = useMemo(() => {
    if (pollutants.length === 0) return undefined;
    if (selectedPollutantCode) {
      const found = pollutants.find((p) => p.code === selectedPollutantCode);
      if (found) return found;
    }
    const domCode = universalIndex?.dominantPollutant?.toLowerCase();
    return (
      pollutants.find((p) => p.code?.toLowerCase() === domCode) ??
      pollutants.find((p) => p.code?.toLowerCase() === 'pm25') ??
      pollutants[0]
    );
  }, [pollutants, selectedPollutantCode, universalIndex?.dominantPollutant]);

  if (!airQuality || indexes.length === 0) {
    return (
      <section id="air-quality" className="glass-panel rounded-3xl p-6 md:p-8 scroll-mt-24">
        <div className="flex flex-col gap-2">
          <h2 className="font-display text-2xl font-semibold tracking-tight text-white">
            Air Quality & Particulate Matter
          </h2>
          <p className="text-sm text-white/70 max-w-2xl">
            Station air quality telemetry is currently unavailable for this coordinate. Try selecting a nearby metropolitan area for live AQI indexes and particulate matter concentrations.
          </p>
        </div>
      </section>
    );
  }

  const primaryAqi = universalIndex?.aqi ?? 0;
  const primaryColor = parseAqiColor(universalIndex?.color);
  // Universal AQI runs 0 (poor) to 100 (excellent)
  const isUaqi = universalIndex?.code === 'uaqi';
  const gaugeFraction = isUaqi
    ? Math.max(0.05, Math.min(1, primaryAqi / 100))
    : Math.max(0.05, Math.min(1, primaryAqi / 300));
  const arcRadius = 64;
  const arcCircumference = Math.PI * arcRadius; // semicircle
  const strokeDashoffset = arcCircumference * (1 - gaugeFraction);

  const activeAdvice =
    health?.[activeHealthGroup] ||
    health?.generalPopulation ||
    'Standard ambient air quality conditions apply for this location.';

  return (
    <section id="air-quality" className="glass-panel rounded-3xl p-6 md:p-8 scroll-mt-24">
      {/* Header Row */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between pb-6 border-b border-white/15">
        <div>
          <h2 className="font-display text-2xl md:text-[1.7rem] font-semibold tracking-tight text-white">
            Air Quality & Particulate Data
          </h2>
          <p className="mt-1 text-sm text-white/70">
            Live atmospheric index breakdown, fine particulate matter concentrations, and demographic advisories
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-x-2 text-xs text-white/65 font-mono tabular-nums">
          <span>Region: {(airQuality.regionCode || 'Global').toUpperCase()}</span>
          <span aria-hidden="true">·</span>
          <span>Dominant: {(universalIndex?.dominantPollutant || 'N/A').toUpperCase()}</span>
        </div>
      </div>

      {/* Main 12-Col Layout: Left AQI Indexes & Health, Right Detailed Particle Telemetry */}
      <div className="mt-7 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left 5 cols: Dual AQI Index Gauge + Health Guidance */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <div className="flex flex-col sm:flex-row lg:flex-col xl:flex-row items-center gap-6 pb-6 border-b border-white/12">
            {/* Semicircular AQI Gauge */}
            <div className="relative flex flex-col items-center justify-center w-44 shrink-0">
              <svg viewBox="0 0 160 100" className="w-44 h-28 overflow-visible" role="img" aria-label={`Universal AQI ${primaryAqi}`}>
                <path
                  d="M 16 84 A 64 64 0 0 1 144 84"
                  fill="none"
                  stroke="rgba(255,255,255,0.14)"
                  strokeWidth="12"
                  strokeLinecap="round"
                />
                <path
                  d="M 16 84 A 64 64 0 0 1 144 84"
                  fill="none"
                  stroke={primaryColor}
                  strokeWidth="12"
                  strokeLinecap="round"
                  strokeDasharray={arcCircumference}
                  strokeDashoffset={strokeDashoffset}
                  className="transition-all duration-700 ease-out"
                />
              </svg>
              <div className="absolute bottom-1 flex flex-col items-center text-center">
                <span className="font-mono text-4xl font-semibold tracking-tight text-white tabular-nums">
                  {universalIndex?.aqiDisplay ?? primaryAqi}
                </span>
                <span className="text-xs text-white/65">
                  {universalIndex?.displayName || 'Universal AQI'}
                </span>
              </div>
            </div>

            {/* Index Summary & Local AQI Comparison */}
            <div className="flex-1 min-w-0 text-center sm:text-left lg:text-center xl:text-left">
              <p className="font-display text-lg font-semibold text-white">
                {universalIndex?.category || 'Air Quality Reading'}
              </p>
              <p className="mt-1 text-xs text-white/70 leading-relaxed">
                {isUaqi
                  ? 'Universal AQI scores air clarity from 0 (poor) to 100 (excellent) across regions.'
                  : 'Regional air quality scale based on dominant local pollutant concentration.'}
              </p>

              {localIndex && (
                <div className="mt-4 pt-3 border-t border-white/12 flex items-baseline justify-between gap-3">
                  <div className="text-left">
                    <div className="text-xs text-white/65">{localIndex.displayName || 'Local AQI'}</div>
                    <div className="text-sm font-medium text-white/90">{localIndex.category}</div>
                  </div>
                  <div className="font-mono text-2xl font-semibold text-white tabular-nums">
                    {localIndex.aqiDisplay ?? localIndex.aqi}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Health Recommendations with Interactive Segmented Control */}
          <div>
            <div className="flex items-center justify-between gap-2 mb-3">
              <h3 className="font-display text-base font-semibold text-white flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-white/75" aria-hidden="true" />
                Health Advisory by Group
              </h3>
            </div>

            <div
              className="flex flex-wrap gap-1 p-1 rounded-xl bg-white/8 border border-white/10"
              role="tablist"
              aria-label="Demographic health recommendations"
            >
              {HEALTH_TABS.map((tab) => {
                const isActive = activeHealthGroup === tab.key;
                return (
                  <button
                    key={tab.key}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => setActiveHealthGroup(tab.key)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-white ${
                      isActive
                        ? 'bg-white text-slate-950 shadow-sm'
                        : 'text-white/75 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>

            <p className="mt-4 text-sm leading-relaxed text-white/85">
              {activeAdvice}
            </p>
          </div>
        </div>

        {/* Right 7 cols: Particle Data Breakdown & Selected Pollutant Sources/Effects */}
        <div className="lg:col-span-7 flex flex-col gap-6 lg:pl-6 lg:border-l lg:border-white/12">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-display text-base font-semibold text-white flex items-center gap-2">
                <Wind className="w-4 h-4 text-white/75" aria-hidden="true" />
                Particulate & Gas Concentrations
              </h3>
              <span className="text-xs text-white/60">Select a pollutant for sources & effects</span>
            </div>

            {pollutants.length > 0 ? (
              <div className="divide-y divide-white/10">
                {pollutants.map((pollutant) => {
                  const code = pollutant.code || pollutant.displayName || 'unknown';
                  const isSelected = activePollutant?.code === pollutant.code;
                  const isDominant =
                    universalIndex?.dominantPollutant?.toLowerCase() === pollutant.code?.toLowerCase();
                  const evalData = evaluatePollutant(pollutant);
                  const val = pollutant.concentration?.value;
                  const unitLabel = formatPollutantUnit(pollutant.concentration?.units);

                  return (
                    <button
                      key={code}
                      type="button"
                      onClick={() => setSelectedPollutantCode(pollutant.code ?? null)}
                      className={`w-full text-left py-3 px-3 -mx-3 rounded-xl transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-white ${
                        isSelected ? 'bg-white/12' : 'hover:bg-white/6'
                      }`}
                    >
                      <div className="grid grid-cols-12 items-center gap-3">
                        <div className="col-span-5 sm:col-span-4 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-sm font-semibold text-white">
                              {pollutant.displayName || code.toUpperCase()}
                            </span>
                            {isDominant && (
                              <span className="text-[11px] text-amber-300 font-medium">
                                · Dominant
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-white/60 truncate">
                            {pollutant.fullName || code}
                          </div>
                        </div>

                        <div className="col-span-4 sm:col-span-5">
                          <div className="h-1.5 w-full rounded-full bg-white/12 overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-500"
                              style={{
                                width: `${evalData.percent}%`,
                                backgroundColor: evalData.color,
                              }}
                            />
                          </div>
                          <div className="mt-1 flex items-center justify-between text-[11px] text-white/60">
                            <span>{evalData.status}</span>
                            <span className="hidden sm:inline truncate">{evalData.guidelineLabel}</span>
                          </div>
                        </div>

                        <div className="col-span-3 text-right font-mono tabular-nums">
                          <div className="text-sm font-semibold text-white">
                            {typeof val === 'number' ? val.toFixed(val >= 100 ? 0 : 1) : '—'}
                          </div>
                          <div className="text-[11px] text-white/60">{unitLabel}</div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-white/70 py-4">
                Detailed pollutant concentrations are not reported for this monitoring zone.
              </p>
            )}
          </div>

          {/* Selected Pollutant Deep-Dive: Emission Sources & Physiological Effects */}
          {activePollutant && (
            <div className="pt-5 border-t border-white/15">
              <div className="flex flex-wrap items-baseline justify-between gap-2 mb-3">
                <h4 className="font-display text-base font-semibold text-white">
                  {activePollutant.displayName} — {activePollutant.fullName}
                </h4>
                <span className="font-mono text-sm text-white/80 tabular-nums">
                  {activePollutant.concentration?.value?.toFixed(2)}{' '}
                  {formatPollutantUnit(activePollutant.concentration?.units)}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-sm">
                <div>
                  <div className="text-xs font-medium text-white/60 mb-1">Primary Emission Sources</div>
                  <p className="text-white/80 leading-relaxed">
                    {activePollutant.additionalInfo?.sources ||
                      'Combustion processes, vehicular traffic, industrial emissions, and natural atmospheric chemistry.'}
                  </p>
                </div>
                <div>
                  <div className="text-xs font-medium text-white/60 mb-1">Physiological Effects</div>
                  <p className="text-white/80 leading-relaxed">
                    {activePollutant.additionalInfo?.effects ||
                      'Elevated exposure can irritate the respiratory tract and reduce aerobic comfort for sensitive individuals.'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
