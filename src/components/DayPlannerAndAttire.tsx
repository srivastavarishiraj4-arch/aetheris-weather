import { useMemo, useState } from 'react';
import { CalendarClock, Shirt } from 'lucide-react';
import type {
  AirQualityResponse,
  CurrentConditionsResponse,
  ForecastHour,
  TempUnit,
} from '../types/weather';
import {
  generateDayPlanner,
  generateDressingSuggestion,
  type PlannerCategory,
} from '../utils/weatherIntelligence';

interface DayPlannerAndAttireProps {
  current: CurrentConditionsResponse;
  hours: ForecastHour[];
  airQuality: AirQualityResponse | null;
  unit: TempUnit;
}

const PLANNER_FILTERS: Array<{ id: PlannerCategory; label: string }> = [
  { id: 'all', label: 'All Plans' },
  { id: 'outdoors', label: 'Outdoors' },
  { id: 'fitness', label: 'Fitness' },
  { id: 'commute', label: 'Commute' },
];

function suitabilityColor(suitability: string): string {
  if (suitability === 'Optimal') return 'text-emerald-300';
  if (suitability === 'Good') return 'text-sky-300';
  if (suitability === 'Caution') return 'text-amber-300';
  return 'text-rose-300';
}

export function DayPlannerAndAttire({
  current,
  hours,
  airQuality,
  unit,
}: DayPlannerAndAttireProps) {
  const [filter, setFilter] = useState<PlannerCategory>('all');

  const planner = useMemo(
    () => generateDayPlanner(current, hours, airQuality, unit),
    [current, hours, airQuality, unit]
  );

  const dressing = useMemo(
    () => generateDressingSuggestion(current, hours, airQuality, unit),
    [current, hours, airQuality, unit]
  );

  const visibleSlots =
    filter === 'all'
      ? planner.slots
      : planner.slots.filter((slot) => slot.category === filter);

  return (
    <section
      id="planner-attire"
      className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch scroll-mt-24"
    >
      {/* Day Planner Suggestions (Left 7 cols) */}
      <div className="lg:col-span-7 glass-panel rounded-3xl p-6 md:p-8 flex flex-col">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 pb-5 border-b border-white/15">
          <div>
            <h2 className="font-display text-2xl font-semibold tracking-tight text-white flex items-center gap-2.5">
              <CalendarClock className="w-5 h-5 text-white/80 shrink-0" aria-hidden="true" />
              Day Planner Suggestions
            </h2>
            <p className="mt-1 text-sm text-white/70">
              Best outdoor window: <span className="font-mono text-white tabular-nums">{planner.bestOutdoorWindow}</span>
            </p>
          </div>

          <div
            className="flex items-center gap-1 p-1 rounded-xl bg-white/8 border border-white/10 self-start"
            role="tablist"
            aria-label="Filter day planner activities"
          >
            {PLANNER_FILTERS.map((tab) => {
              const active = filter === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setFilter(tab.id)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-white ${
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

        <div className="mt-2 divide-y divide-white/12 flex-1">
          {visibleSlots.map((slot) => (
            <div key={slot.id} className="py-5 first:pt-4 last:pb-1">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2 text-white/65">
                  <span className="font-medium text-white/90">{slot.period}</span>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono tabular-nums">{slot.timeRange}</span>
                  <span aria-hidden="true">·</span>
                  <span className="capitalize">{slot.category}</span>
                </div>
                <span className={`font-medium ${suitabilityColor(slot.suitability)}`}>
                  {slot.suitability}
                </span>
              </div>

              <h3 className="mt-1.5 font-display text-lg font-semibold text-white">
                {slot.headline}
              </h3>
              <p className="mt-1 text-sm text-white/80 leading-relaxed">
                {slot.detail}
              </p>
              <div className="mt-2 font-mono text-xs text-white/55 tabular-nums">
                {slot.metricsSummary}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Dressing Suggestions (Right 5 cols) */}
      <div className="lg:col-span-5 glass-panel rounded-3xl p-6 md:p-8 flex flex-col">
        <div className="pb-5 border-b border-white/15">
          <h2 className="font-display text-2xl font-semibold tracking-tight text-white flex items-center gap-2.5">
            <Shirt className="w-5 h-5 text-white/80 shrink-0" aria-hidden="true" />
            Dressing Suggestion
          </h2>
          <div className="mt-1 text-xs font-medium text-white/70">
            {dressing.comfortIndex}
          </div>
          <p className="mt-2 text-sm text-white/85 leading-relaxed">
            {dressing.summary}
          </p>
        </div>

        <div className="mt-2 divide-y divide-white/12 flex-1 flex flex-col justify-between">
          {dressing.layers.map((layer) => (
            <div key={layer.slot} className="py-4 first:pt-4 last:pb-1">
              <div className="text-xs font-medium text-white/60">{layer.slot}</div>
              <div className="mt-1 font-display text-base font-semibold text-white">
                {layer.item}
              </div>
              <p className="mt-1 text-xs text-white/75 leading-relaxed">
                {layer.rationale}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
