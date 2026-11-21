import type {
  AirQualityResponse,
  AqiColor,
  CityLocation,
  CurrentConditionsResponse,
  ForecastDay,
  ForecastHour,
  PollutantItem,
  TempUnit,
  WeatherVisualCategory,
} from '../types/weather';

export const INDIA_CITIES: CityLocation[] = [
  { id: 'in-delhi', name: 'New Delhi', subtitle: 'Delhi NCR, India', query: 'New Delhi, India', region: 'india' },
  { id: 'in-mumbai', name: 'Mumbai', subtitle: 'Maharashtra, India', query: 'Mumbai, Maharashtra, India', region: 'india' },
  { id: 'in-bengaluru', name: 'Bengaluru', subtitle: 'Karnataka, India', query: 'Bengaluru, Karnataka, India', region: 'india' },
  { id: 'in-hyderabad', name: 'Hyderabad', subtitle: 'Telangana, India', query: 'Hyderabad, Telangana, India', region: 'india' },
  { id: 'in-chennai', name: 'Chennai', subtitle: 'Tamil Nadu, India', query: 'Chennai, Tamil Nadu, India', region: 'india' },
  { id: 'in-kolkata', name: 'Kolkata', subtitle: 'West Bengal, India', query: 'Kolkata, West Bengal, India', region: 'india' },
  { id: 'in-lucknow', name: 'Lucknow', subtitle: 'Uttar Pradesh, India', query: 'Lucknow, Uttar Pradesh, India', region: 'india' },
  { id: 'in-pune', name: 'Pune', subtitle: 'Maharashtra, India', query: 'Pune, Maharashtra, India', region: 'india' },
  { id: 'in-jaipur', name: 'Jaipur', subtitle: 'Rajasthan, India', query: 'Jaipur, Rajasthan, India', region: 'india' },
  { id: 'in-ahmedabad', name: 'Ahmedabad', subtitle: 'Gujarat, India', query: 'Ahmedabad, Gujarat, India', region: 'india' },
  { id: 'in-varanasi', name: 'Varanasi', subtitle: 'Uttar Pradesh, India', query: 'Varanasi, Uttar Pradesh, India', region: 'india' },
  { id: 'in-prayagraj', name: 'Prayagraj', subtitle: 'Uttar Pradesh, India', query: 'Prayagraj, Uttar Pradesh, India', region: 'india' },
  { id: 'in-kanpur', name: 'Kanpur', subtitle: 'Uttar Pradesh, India', query: 'Kanpur, Uttar Pradesh, India', region: 'india' },
  { id: 'in-noida', name: 'Noida', subtitle: 'Uttar Pradesh, India', query: 'Noida, Uttar Pradesh, India', region: 'india' },
  { id: 'in-gurugram', name: 'Gurugram', subtitle: 'Haryana, India', query: 'Gurugram, Haryana, India', region: 'india' },
  { id: 'in-chandigarh', name: 'Chandigarh', subtitle: 'Chandigarh, India', query: 'Chandigarh, India', region: 'india' },
  { id: 'in-patna', name: 'Patna', subtitle: 'Bihar, India', query: 'Patna, Bihar, India', region: 'india' },
  { id: 'in-indore', name: 'Indore', subtitle: 'Madhya Pradesh, India', query: 'Indore, Madhya Pradesh, India', region: 'india' },
  { id: 'in-bhopal', name: 'Bhopal', subtitle: 'Madhya Pradesh, India', query: 'Bhopal, Madhya Pradesh, India', region: 'india' },
  { id: 'in-surat', name: 'Surat', subtitle: 'Gujarat, India', query: 'Surat, Gujarat, India', region: 'india' },
  { id: 'in-nagpur', name: 'Nagpur', subtitle: 'Maharashtra, India', query: 'Nagpur, Maharashtra, India', region: 'india' },
  { id: 'in-kochi', name: 'Kochi', subtitle: 'Kerala, India', query: 'Kochi, Kerala, India', region: 'india' },
  { id: 'in-coimbatore', name: 'Coimbatore', subtitle: 'Tamil Nadu, India', query: 'Coimbatore, Tamil Nadu, India', region: 'india' },
  { id: 'in-vizag', name: 'Visakhapatnam', subtitle: 'Andhra Pradesh, India', query: 'Visakhapatnam, Andhra Pradesh, India', region: 'india' },
  { id: 'in-guwahati', name: 'Guwahati', subtitle: 'Assam, India', query: 'Guwahati, Assam, India', region: 'india' },
  { id: 'in-dehradun', name: 'Dehradun', subtitle: 'Uttarakhand, India', query: 'Dehradun, Uttarakhand, India', region: 'india' },
  { id: 'in-bhubaneswar', name: 'Bhubaneswar', subtitle: 'Odisha, India', query: 'Bhubaneswar, Odisha, India', region: 'india' },
  { id: 'in-shimla', name: 'Shimla', subtitle: 'Himachal Pradesh, India', query: 'Shimla, Himachal Pradesh, India', region: 'india' },
];

export const GLOBAL_CITIES: CityLocation[] = [
  { id: 'gl-sf', name: 'San Francisco', subtitle: 'California, US', query: 'San Francisco, CA, USA', region: 'global' },
  { id: 'gl-tokyo', name: 'Tokyo', subtitle: 'Kanto, JP', query: 'Tokyo, Japan', region: 'global' },
  { id: 'gl-london', name: 'London', subtitle: 'England, GB', query: 'London, UK', region: 'global' },
  { id: 'gl-nyc', name: 'New York', subtitle: 'New York, US', query: 'New York, NY, USA', region: 'global' },
  { id: 'gl-reykjavik', name: 'Reykjavik', subtitle: 'Capital Region, IS', query: 'Reykjavik, Iceland', region: 'global' },
  { id: 'gl-sydney', name: 'Sydney', subtitle: 'New South Wales, AU', query: 'Sydney, Australia', region: 'global' },
  { id: 'gl-zurich', name: 'Zurich', subtitle: 'Switzerland, CH', query: 'Zurich, Switzerland', region: 'global' },
  { id: 'gl-singapore', name: 'Singapore', subtitle: 'Singapore, SG', query: 'Singapore', region: 'global' },
];

export const PRESET_CITIES: CityLocation[] = [...INDIA_CITIES, ...GLOBAL_CITIES];

export function classifyWeatherVisual(
  conditionType?: string,
  isDaytime = true,
  windSpeedKmh = 0
): WeatherVisualCategory {
  const type = (conditionType || 'CLEAR').toUpperCase();

  if (
    type.includes('THUNDER') ||
    type.includes('LIGHTNING') ||
    type.includes('HAIL')
  ) {
    return 'thunderstorm';
  }
  if (
    type.includes('SNOW') ||
    type.includes('BLIZZARD') ||
    type.includes('FLURR') ||
    type.includes('SLEET') ||
    type.includes('ICE')
  ) {
    return 'snow';
  }
  if (
    type.includes('RAIN') ||
    type.includes('SHOWER') ||
    type.includes('DRIZZLE') ||
    type.includes('DOWNPOUR')
  ) {
    return 'rain';
  }
  if (
    type.includes('FOG') ||
    type.includes('MIST') ||
    type.includes('HAZE') ||
    type.includes('SMOKE') ||
    type.includes('DUST')
  ) {
    return 'fog';
  }
  if (type.includes('WIND') || windSpeedKmh >= 42) {
    return 'windy';
  }
  if (type === 'CLOUDY' || type === 'OVERCAST' || type === 'MOSTLY_CLOUDY') {
    return 'cloudy';
  }
  if (
    type === 'PARTLY_CLOUDY' ||
    type === 'MOSTLY_CLEAR' ||
    type === 'PARTLY_SUNNY' ||
    type === 'SCATTERED_CLOUDS'
  ) {
    return isDaytime ? 'partly-cloudy-day' : 'partly-cloudy-night';
  }
  return isDaytime ? 'clear-day' : 'clear-night';
}

export interface SkyGradientTheme {
  label: string;
  background: string;
  orbPrimary: string;
  orbSecondary: string;
  accentHex: string;
  atmosphereEffect: 'sunbeams' | 'stars' | 'rain' | 'snow' | 'storm' | 'mist' | 'none';
}

export const SKY_THEMES: Record<WeatherVisualCategory, SkyGradientTheme> = {
  'clear-day': {
    label: 'Clear Daylight',
    background:
      'linear-gradient(155deg, #0b3b75 0%, #1565a8 42%, #2b86c5 74%, #c27849 100%)',
    orbPrimary: 'rgba(251, 191, 36, 0.34)',
    orbSecondary: 'rgba(56, 189, 248, 0.28)',
    accentHex: '#FBBF24',
    atmosphereEffect: 'sunbeams',
  },
  'clear-night': {
    label: 'Clear Night',
    background:
      'linear-gradient(160deg, #050a18 0%, #0d1b3d 48%, #162955 82%, #1d2647 100%)',
    orbPrimary: 'rgba(99, 102, 241, 0.26)',
    orbSecondary: 'rgba(56, 189, 248, 0.18)',
    accentHex: '#93C5FD',
    atmosphereEffect: 'stars',
  },
  'partly-cloudy-day': {
    label: 'Partly Cloudy',
    background:
      'linear-gradient(158deg, #163a5f 0%, #2a5d87 46%, #4a7899 78%, #6d7f93 100%)',
    orbPrimary: 'rgba(253, 224, 71, 0.22)',
    orbSecondary: 'rgba(148, 163, 184, 0.28)',
    accentHex: '#FCD34D',
    atmosphereEffect: 'sunbeams',
  },
  'partly-cloudy-night': {
    label: 'Partly Cloudy Night',
    background:
      'linear-gradient(160deg, #09101f 0%, #15223d 50%, #233352 84%, #1a243b 100%)',
    orbPrimary: 'rgba(129, 140, 248, 0.2)',
    orbSecondary: 'rgba(100, 116, 139, 0.24)',
    accentHex: '#A5B4FC',
    atmosphereEffect: 'stars',
  },
  cloudy: {
    label: 'Overcast Sky',
    background:
      'linear-gradient(162deg, #1d2939 0%, #334155 48%, #475569 80%, #2b384a 100%)',
    orbPrimary: 'rgba(148, 163, 184, 0.24)',
    orbSecondary: 'rgba(100, 116, 139, 0.22)',
    accentHex: '#CBD5E1',
    atmosphereEffect: 'mist',
  },
  rain: {
    label: 'Rainfall',
    background:
      'linear-gradient(162deg, #0b1e2e 0%, #16374f 44%, #1e4b63 78%, #0f2537 100%)',
    orbPrimary: 'rgba(56, 189, 248, 0.24)',
    orbSecondary: 'rgba(20, 184, 166, 0.18)',
    accentHex: '#38BDF8',
    atmosphereEffect: 'rain',
  },
  thunderstorm: {
    label: 'Thunderstorm',
    background:
      'linear-gradient(162deg, #0b0d1b 0%, #1e1b3a 46%, #2c2650 78%, #14192d 100%)',
    orbPrimary: 'rgba(167, 139, 250, 0.24)',
    orbSecondary: 'rgba(250, 204, 21, 0.14)',
    accentHex: '#C4B5FD',
    atmosphereEffect: 'storm',
  },
  snow: {
    label: 'Snowfall',
    background:
      'linear-gradient(162deg, #1c3148 0%, #355472 48%, #547594 82%, #2c435c 100%)',
    orbPrimary: 'rgba(224, 242, 254, 0.28)',
    orbSecondary: 'rgba(125, 211, 252, 0.22)',
    accentHex: '#BAE6FD',
    atmosphereEffect: 'snow',
  },
  fog: {
    label: 'Mist & Fog',
    background:
      'linear-gradient(160deg, #1e2d33 0%, #344a50 48%, #4d6469 80%, #26373c 100%)',
    orbPrimary: 'rgba(203, 213, 225, 0.24)',
    orbSecondary: 'rgba(148, 163, 184, 0.2)',
    accentHex: '#E2E8F0',
    atmosphereEffect: 'mist',
  },
  windy: {
    label: 'Breezy & Windy',
    background:
      'linear-gradient(158deg, #0f2c44 0%, #1c4e6b 46%, #2e6d85 80%, #15384d 100%)',
    orbPrimary: 'rgba(45, 212, 191, 0.24)',
    orbSecondary: 'rgba(56, 189, 248, 0.2)',
    accentHex: '#5EEAD4',
    atmosphereEffect: 'none',
  },
};

export function cToF(c: number): number {
  return (c * 9) / 5 + 32;
}

export function formatTemp(degreesC: number | undefined, unit: TempUnit, includeSymbol = true): string {
  if (typeof degreesC !== 'number' || Number.isNaN(degreesC)) return '—';
  const val = unit === 'F' ? cToF(degreesC) : degreesC;
  return `${Math.round(val)}${includeSymbol ? '°' : ''}`;
}

export function formatSpeed(kmh: number | undefined, unit: TempUnit): string {
  if (typeof kmh !== 'number' || Number.isNaN(kmh)) return '—';
  if (unit === 'F') {
    return `${Math.round(kmh * 0.621371)} mph`;
  }
  return `${Math.round(kmh)} km/h`;
}

export function formatDistance(km: number | undefined, unit: TempUnit): string {
  if (typeof km !== 'number' || Number.isNaN(km)) return '—';
  if (unit === 'F') {
    return `${(km * 0.621371).toFixed(1)} mi`;
  }
  return `${km.toFixed(1)} km`;
}

export function formatCardinal(cardinal?: string): string {
  if (!cardinal) return '';
  const map: Record<string, string> = {
    NORTH: 'N',
    NORTH_NORTHEAST: 'NNE',
    NORTHEAST: 'NE',
    EAST_NORTHEAST: 'ENE',
    EAST: 'E',
    EAST_SOUTHEAST: 'ESE',
    SOUTHEAST: 'SE',
    SOUTH_SOUTHEAST: 'SSE',
    SOUTH: 'S',
    SOUTH_SOUTHWEST: 'SSW',
    SOUTHWEST: 'SW',
    WEST_SOUTHWEST: 'WSW',
    WEST: 'W',
    WEST_NORTHWEST: 'WNW',
    NORTHWEST: 'NW',
    NORTH_NORTHWEST: 'NNW',
  };
  return map[cardinal.toUpperCase()] || cardinal;
}

export function formatClockTime(isoString?: string, timeZone?: string): string {
  if (!isoString) return '—';
  try {
    return new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      timeZone: timeZone || undefined,
    }).format(new Date(isoString));
  } catch {
    return '—';
  }
}

export function formatHourLabel(hour: ForecastHour, idx: number, timeZone?: string): string {
  if (idx === 0) return 'Now';
  if (typeof hour.displayDateTime?.hours === 'number') {
    const h = hour.displayDateTime.hours;
    const suffix = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 === 0 ? 12 : h % 12;
    return `${h12} ${suffix}`;
  }
  if (hour.interval?.startTime) {
    try {
      return new Intl.DateTimeFormat('en-US', {
        hour: 'numeric',
        timeZone: timeZone || undefined,
      }).format(new Date(hour.interval.startTime));
    } catch {
      return `+${idx}h`;
    }
  }
  return `+${idx}h`;
}

export function formatDayLabel(day: ForecastDay, idx: number): string {
  if (idx === 0) return 'Today';
  if (day.displayDate?.year && day.displayDate?.month && day.displayDate?.day) {
    const dt = new Date(
      Date.UTC(day.displayDate.year, day.displayDate.month - 1, day.displayDate.day, 12, 0, 0)
    );
    return new Intl.DateTimeFormat('en-US', { weekday: 'short', timeZone: 'UTC' }).format(dt);
  }
  return `Day ${idx + 1}`;
}

export function parseAqiColor(color?: AqiColor): string {
  if (!color) return '#34D399';
  const rRaw = color.red ?? 0;
  const gRaw = color.green ?? 0;
  const bRaw = color.blue ?? 0;
  // Air Quality API can return 0..1 floats or 0..255 integers; handle both safely
  const isNormalized = rRaw <= 1 && gRaw <= 1 && bRaw <= 1 && (rRaw > 0 || gRaw > 0 || bRaw > 0);
  const r = Math.round(isNormalized ? rRaw * 255 : rRaw);
  const g = Math.round(isNormalized ? gRaw * 255 : gRaw);
  const b = Math.round(isNormalized ? bRaw * 255 : bRaw);
  return `rgb(${r}, ${g}, ${b})`;
}

export function formatPollutantUnit(units?: string): string {
  if (!units) return '';
  if (units === 'MICROGRAMS_PER_CUBIC_METER') return 'µg/m³';
  if (units === 'PARTS_PER_BILLION') return 'ppb';
  if (units === 'PARTS_PER_MILLION') return 'ppm';
  return units.toLowerCase().replace(/_/g, ' ');
}

export interface PollutantBenchmark {
  limit: number;
  status: 'Low' | 'Moderate' | 'Elevated' | 'High';
  percent: number;
  color: string;
  guidelineLabel: string;
}

export function evaluatePollutant(pollutant: PollutantItem): PollutantBenchmark {
  const code = (pollutant.code || '').toLowerCase();
  const value = pollutant.concentration?.value ?? 0;

  // Reference 24h/8h WHO & EPA healthy upper thresholds for visual scale normalization
  const refs: Record<string, { good: number; mod: number; high: number; maxScale: number; guide: string }> = {
    pm25: { good: 12, mod: 35.4, high: 55.4, maxScale: 75, guide: 'WHO 24h guide: 15 µg/m³' },
    pm10: { good: 45, mod: 100, high: 150, maxScale: 180, guide: 'WHO 24h guide: 45 µg/m³' },
    o3: { good: 50, mod: 70, high: 85, maxScale: 110, guide: 'EPA 8h limit: 70 ppb' },
    no2: { good: 25, mod: 53, high: 100, maxScale: 120, guide: 'EPA 1h guide: 53 ppb' },
    so2: { good: 20, mod: 40, high: 75, maxScale: 100, guide: 'EPA 1h guide: 75 ppb' },
    co: { good: 4000, mod: 9000, high: 12000, maxScale: 15000, guide: 'EPA 8h limit: 9,000 ppb' },
  };

  const ref = refs[code] || { good: 25, mod: 60, high: 100, maxScale: 120, guide: 'Ambient reference' };
  const percent = Math.max(4, Math.min(100, Math.round((value / ref.maxScale) * 100)));

  if (value <= ref.good) {
    return { limit: ref.good, status: 'Low', percent, color: '#34D399', guidelineLabel: ref.guide };
  }
  if (value <= ref.mod) {
    return { limit: ref.mod, status: 'Moderate', percent, color: '#FBBF24', guidelineLabel: ref.guide };
  }
  if (value <= ref.high) {
    return { limit: ref.high, status: 'Elevated', percent, color: '#FB923C', guidelineLabel: ref.guide };
  }
  return { limit: ref.high, status: 'High', percent, color: '#F87171', guidelineLabel: ref.guide };
}

export interface UvGuidance {
  level: 'Low' | 'Moderate' | 'High' | 'Very High' | 'Extreme';
  color: string;
  spf: string;
  safeExposure: string;
  action: string;
  reapply: string;
}

export function getUvGuidance(uvIndex: number): UvGuidance {
  if (uvIndex <= 2) {
    return {
      level: 'Low',
      color: '#34D399',
      spf: 'SPF 15+ optional',
      safeExposure: '60+ min',
      action: 'Minimal risk for most skin types; sunglasses helpful on bright or snowy surfaces.',
      reapply: 'Every 3–4 hrs outdoors',
    };
  }
  if (uvIndex <= 5) {
    return {
      level: 'Moderate',
      color: '#FBBF24',
      spf: 'SPF 30+ broad-spectrum',
      safeExposure: '30–45 min',
      action: 'Wear UV400 sunglasses and apply sunscreen before midday outdoor errands.',
      reapply: 'Every 2 hrs',
    };
  }
  if (uvIndex <= 7) {
    return {
      level: 'High',
      color: '#FB923C',
      spf: 'SPF 50+ PA++++',
      safeExposure: '20–30 min',
      action: 'Seek shade around solar noon, wear a breathable hat, and protect exposed skin.',
      reapply: 'Every 90 min',
    };
  }
  if (uvIndex <= 10) {
    return {
      level: 'Very High',
      color: '#F87171',
      spf: 'SPF 50+ water-resistant',
      safeExposure: '10–20 min',
      action: 'Avoid prolonged direct sun between 11 AM and 4 PM; prioritize UPF sleeves and shade.',
      reapply: 'Every 60–90 min',
    };
  }
  return {
    level: 'Extreme',
    color: '#C084FC',
    spf: 'SPF 50+ & UPF 50 clothing',
    safeExposure: '< 10 min',
    action: 'Unprotected skin can burn in minutes. Move strenuous activities indoors during peak sun.',
    reapply: 'Every 60 min',
  };
}

export type PlannerCategory = 'all' | 'fitness' | 'commute' | 'outdoors';

export interface DayPlanSlot {
  id: string;
  period: string;
  timeRange: string;
  category: Exclude<PlannerCategory, 'all'>;
  suitability: 'Optimal' | 'Good' | 'Caution' | 'Indoor';
  headline: string;
  detail: string;
  metricsSummary: string;
}

export function generateDayPlanner(
  current: CurrentConditionsResponse,
  hours: ForecastHour[],
  airQuality: AirQualityResponse | null,
  unit: TempUnit
): { bestOutdoorWindow: string; slots: DayPlanSlot[] } {
  const uaqi = airQuality?.indexes?.find((i) => i.code === 'uaqi')?.aqi ?? 75;
  const airClean = uaqi >= 60;
  const airPoor = uaqi < 40;

  const slices = hours.slice(0, 16);

  // Find best 2-hour window for outdoor movement
  let bestIdx = 0;
  let bestScore = -999;
  slices.forEach((h, i) => {
    const temp = h.temperature?.degrees ?? 20;
    const rain = h.precipitation?.probability?.percent ?? 0;
    const uv = h.uvIndex ?? 0;
    const wind = h.wind?.speed?.value ?? 10;
    const tempPenalty = Math.abs(temp - 19) * 1.6;
    const score = 100 - tempPenalty - rain * 0.9 - Math.max(0, uv - 5) * 6 - Math.max(0, wind - 22) * 0.8;
    if (score > bestScore) {
      bestScore = score;
      bestIdx = i;
    }
  });

  const bestHour = slices[bestIdx];
  const bestOutdoorWindow = bestHour
    ? `${formatHourLabel(bestHour, bestIdx, current.timeZone?.id)} (${formatTemp(bestHour.temperature?.degrees, unit)}, ${bestHour.precipitation?.probability?.percent ?? 0}% rain)`
    : 'Next 2 hours';

  const pickSlice = (startIdx: number, endIdx: number): ForecastHour | undefined => {
    if (slices.length === 0) return undefined;
    const idx = Math.min(slices.length - 1, Math.max(0, Math.floor((startIdx + endIdx) / 2)));
    return slices[idx];
  };

  const s1 = pickSlice(0, 2);
  const s2 = pickSlice(3, 6);
  const s3 = pickSlice(7, 10);
  const s4 = pickSlice(11, 14);

  const buildSlot = (
    id: string,
    period: string,
    category: Exclude<PlannerCategory, 'all'>,
    h: ForecastHour | undefined,
    idxFallback: number
  ): DayPlanSlot => {
    const temp = h?.temperature?.degrees ?? current.temperature?.degrees ?? 20;
    const rain = h?.precipitation?.probability?.percent ?? current.precipitation?.probability?.percent ?? 0;
    const uv = h?.uvIndex ?? current.uvIndex ?? 0;
    const wind = h?.wind?.speed?.value ?? current.wind?.speed?.value ?? 10;
    const desc = h?.weatherCondition?.description?.text ?? current.weatherCondition?.description?.text ?? 'Clear';
    const timeLabel = h ? formatHourLabel(h, idxFallback, current.timeZone?.id) : period;
    const metricsSummary = `${formatTemp(temp, unit)} · ${rain}% precip · UV ${uv} · ${formatSpeed(wind, unit)}`;

    if (category === 'fitness') {
      if (airPoor) {
        return {
          id,
          period,
          timeRange: timeLabel,
          category,
          suitability: 'Indoor',
          headline: 'Move cardio indoors today',
          detail: 'Air quality is reduced right now; opt for indoor strength, mobility, or treadmill work instead of high-ventilation outdoor runs.',
          metricsSummary,
        };
      }
      if (rain >= 55) {
        return {
          id,
          period,
          timeRange: timeLabel,
          category,
          suitability: 'Caution',
          headline: 'Wet pavement — indoor session preferred',
          detail: `${desc} expected (${rain}% chance). If training outside, use grippy road shoes and a breathable water-resistant shell.`,
          metricsSummary,
        };
      }
      if (uv >= 7) {
        return {
          id,
          period,
          timeRange: timeLabel,
          category,
          suitability: 'Caution',
          headline: 'High solar load — favor shaded routes',
          detail: `UV peaks at ${uv}. Keep outdoor workouts brief, stick to tree-lined paths, and hydrate proactively.`,
          metricsSummary,
        };
      }
      return {
        id,
        period,
        timeRange: timeLabel,
        category,
        suitability: airClean && temp >= 10 && temp <= 24 ? 'Optimal' : 'Good',
        headline: temp < 10 ? 'Crisp air for brisk running or cycling' : 'Strong window for outdoor training',
        detail: `${desc} with ${formatSpeed(wind, unit)} wind and low precipitation risk (${rain}%). Warm up well and enjoy clean pacing.`,
        metricsSummary,
      };
    }

    if (category === 'commute') {
      if (rain >= 45 || wind >= 35) {
        return {
          id,
          period,
          timeRange: timeLabel,
          category,
          suitability: 'Caution',
          headline: 'Add 10–15 min buffer for transit & roads',
          detail: `${rain >= 45 ? `Precipitation risk at ${rain}%` : `Gusty winds at ${formatSpeed(wind, unit)}`} may slow surface traffic and bike lanes.`,
          metricsSummary,
        };
      }
      return {
        id,
        period,
        timeRange: timeLabel,
        category,
        suitability: 'Optimal',
        headline: 'Smooth commuting and walking conditions',
        detail: `Dry pavement and clear visibility during ${desc.toLowerCase()} skies — ideal for walking, cycling, or transit.`,
        metricsSummary,
      };
    }

    // Outdoors / Errands / Leisure
    if (rain >= 60) {
      return {
        id,
        period,
        timeRange: timeLabel,
        category,
        suitability: 'Indoor',
        headline: 'Schedule indoor cafés, galleries, or errands',
        detail: `High likelihood of ${desc.toLowerCase()} (${rain}%). Keep outdoor transfers short and carry compact rain gear.`,
        metricsSummary,
      };
    }
    if (uv >= 6) {
      return {
        id,
        period,
        timeRange: timeLabel,
        category,
        suitability: 'Good',
        headline: 'Great visibility — bring sun protection',
        detail: `Bright conditions with UV ${uv}. Ideal for patio dining under umbrellas or shaded park walks.`,
        metricsSummary,
      };
    }
    if (temp <= 5) {
      return {
        id,
        period,
        timeRange: timeLabel,
        category,
        suitability: 'Good',
        headline: 'Brisk outdoor window — keep stops warm',
        detail: `Chilly ${formatTemp(temp, unit)} air under ${desc.toLowerCase()} skies. Short walks paired with warm indoor stops work best.`,
        metricsSummary,
      };
    }
    return {
      id,
      period,
      timeRange: timeLabel,
      category,
      suitability: airClean ? 'Optimal' : 'Good',
      headline: 'Comfortable window for outdoor dining & walks',
      detail: `${desc} at ${formatTemp(temp, unit)} with gentle airflow (${formatSpeed(wind, unit)}). Ideal for unhurried outdoor plans.`,
      metricsSummary,
    };
  };

  const slots: DayPlanSlot[] = [
    buildSlot('slot-1', 'Immediate Window', 'commute', s1, 1),
    buildSlot('slot-2', 'Next 3–6 Hours', 'outdoors', s2, 4),
    buildSlot('slot-3', 'Mid-Horizon', 'fitness', s3, 8),
    buildSlot('slot-4', 'Later Outlook', 'outdoors', s4, 12),
  ];

  return { bestOutdoorWindow, slots };
}

export interface DressingLayer {
  slot: string;
  item: string;
  rationale: string;
}

export interface DressingPlan {
  summary: string;
  comfortIndex: string;
  layers: DressingLayer[];
}

export function generateDressingSuggestion(
  current: CurrentConditionsResponse,
  hours: ForecastHour[],
  airQuality: AirQualityResponse | null,
  unit: TempUnit
): DressingPlan {
  const feelsC = current.feelsLikeTemperature?.degrees ?? current.temperature?.degrees ?? 18;
  const windKmh = current.wind?.speed?.value ?? 10;
  const gustKmh = current.wind?.gust?.value ?? windKmh;
  const humidity = current.relativeHumidity ?? 50;
  const maxRainNext12h = Math.max(
    current.precipitation?.probability?.percent ?? 0,
    ...hours.slice(0, 12).map((h) => h.precipitation?.probability?.percent ?? 0)
  );
  const peakUv = Math.max(
    current.uvIndex ?? 0,
    ...hours.slice(0, 12).map((h) => h.uvIndex ?? 0)
  );
  const temps12h = hours
    .slice(0, 12)
    .map((h) => h.temperature?.degrees)
    .filter((v): v is number => typeof v === 'number');
  const tempSwing =
    temps12h.length >= 2 ? Math.max(...temps12h) - Math.min(...temps12h) : 0;

  const uaqi = airQuality?.indexes?.find((i) => i.code === 'uaqi')?.aqi ?? 75;
  const pm25 = airQuality?.pollutants?.find((p) => p.code === 'pm25')?.concentration?.value ?? 5;

  let summary = '';
  let comfortIndex = '';
  let baseTop: DressingLayer;
  let outerwear: DressingLayer;
  let footwear: DressingLayer;
  const essentialItems: string[] = [];
  const essentialReasons: string[] = [];

  if (feelsC <= 2) {
    comfortIndex = 'Freezing · Heavy Thermal';
    summary = 'Full winter insulation with wind-blocking outer layers and covered extremities.';
    baseTop = {
      slot: 'Base & Mid Layer',
      item: 'Thermal merino base + heavy wool knit or fleece',
      rationale: `Apparent temperature sits at ${formatTemp(feelsC, unit)} — trap core warmth with breathable insulating fibers.`,
    };
    outerwear = {
      slot: 'Outerwear',
      item: 'Insulated down parka, scarf, and thermal gloves',
      rationale: gustKmh >= 25 ? `Gusts up to ${formatSpeed(gustKmh, unit)} significantly amplify wind chill.` : 'Retains heat during extended outdoor exposure.',
    };
  } else if (feelsC <= 11) {
    comfortIndex = 'Chilly · Structured Layers';
    summary = 'Warm mid-layer paired with a tailored coat or wind-resistant jacket.';
    baseTop = {
      slot: 'Base & Mid Layer',
      item: 'Long-sleeve cotton tee with crewneck sweater or knit',
      rationale: `Feels like ${formatTemp(feelsC, unit)}; modular layering adapts cleanly between transit and indoors.`,
    };
    outerwear = {
      slot: 'Outerwear',
      item: maxRainNext12h >= 40 ? 'Waterproof hooded trench or insulated rain shell' : 'Wool overcoat or quilted liner jacket',
      rationale:
        maxRainNext12h >= 40
          ? `${maxRainNext12h}% rain chance over the next 12 hours requires weatherproofing.`
          : tempSwing >= 8
          ? `Temperature swings by ~${Math.round(unit === 'F' ? tempSwing * 1.8 : tempSwing)}° across the day.`
          : `Blocks ${formatSpeed(windKmh, unit)} ambient breeze.`,
    };
  } else if (feelsC <= 19) {
    comfortIndex = 'Mild · Transitional';
    summary = 'Breathable everyday layers with a light outer piece for breeze or evening dip.';
    baseTop = {
      slot: 'Base & Top',
      item: 'Oxford shirt, breathable tee, or lightweight knit + chinos',
      rationale: `Comfortable ${formatTemp(feelsC, unit)} feel with ${humidity}% humidity.`,
    };
    outerwear = {
      slot: 'Outerwear',
      item: maxRainNext12h >= 40 ? 'Packable waterproof shell jacket' : 'Unlined overshirt, denim jacket, or light cardigan',
      rationale:
        maxRainNext12h >= 40
          ? `Keeps you dry through ${maxRainNext12h}% precipitation probability without overheating.`
          : 'Easy to remove indoors and layer back on as evening cools.',
    };
  } else if (feelsC <= 27) {
    comfortIndex = 'Warm · Breathable';
    summary = 'Light natural fabrics that promote airflow and keep sun glare off your shoulders.';
    baseTop = {
      slot: 'Base & Top',
      item: 'Linen or airy cotton shirt with relaxed trousers or shorts',
      rationale: `Warm ${formatTemp(feelsC, unit)} feel${humidity >= 70 ? ` with sticky ${humidity}% humidity — favor moisture-wicking weaves.` : ' — prioritize open, breathable weaves.'}`,
    };
    outerwear = {
      slot: 'Outerwear',
      item: maxRainNext12h >= 45 ? 'Ultralight ventilated rain poncho or compact umbrella' : 'None needed (light layer for A/C indoors)',
      rationale:
        maxRainNext12h >= 45
          ? 'Avoid heavy coats in warm rain; stay ventilated.'
          : 'No exterior thermal layer required outdoors.',
    };
  } else {
    comfortIndex = 'Hot · Heat Management';
    summary = 'Minimal, loose-fitting UV-reflective fabrics and proactive hydration.';
    baseTop = {
      slot: 'Base & Top',
      item: 'Loose light-colored linen or technical moisture-wicking top',
      rationale: `High thermal feel (${formatTemp(feelsC, unit)}); light tones reflect direct solar radiation.`,
    };
    outerwear = {
      slot: 'Outerwear',
      item: 'Skip outerwear — consider a breathable UPF sun shirt',
      rationale: 'Maximizes evaporative cooling while shielding skin from intense sun.',
    };
  }

  // Footwear logic
  if (feelsC <= 1 && maxRainNext12h >= 30) {
    footwear = {
      slot: 'Footwear',
      item: 'Insulated waterproof boots with deep winter tread',
      rationale: 'Protects against slush, wet cold, and slick surfaces.',
    };
  } else if (maxRainNext12h >= 45) {
    footwear = {
      slot: 'Footwear',
      item: 'Water-resistant leather boots or Gore-Tex sneakers',
      rationale: `${maxRainNext12h}% precipitation forecast means wet sidewalks and puddles.`,
    };
  } else if (feelsC >= 24) {
    footwear = {
      slot: 'Footwear',
      item: 'Breathable mesh sneakers or open-air loafers',
      rationale: 'Prevents heat buildup during warm daytime walking.',
    };
  } else {
    footwear = {
      slot: 'Footwear',
      item: 'Everyday sneakers, loafers, or suede boots',
      rationale: 'Dry pavement expected — focus on walking comfort.',
    };
  }

  // Essentials logic
  if (peakUv >= 3) {
    essentialItems.push(peakUv >= 6 ? 'SPF 50+ sunscreen & UV400 sunglasses' : 'UV400 sunglasses & SPF 30');
    essentialReasons.push(`Peak UV reaches ${peakUv}`);
  }
  if (maxRainNext12h >= 35) {
    essentialItems.push('Compact windproof umbrella');
    essentialReasons.push(`${maxRainNext12h}% rain chance ahead`);
  }
  if (uaqi < 50 || pm25 >= 35) {
    essentialItems.push('Well-fitting N95/KN95 mask');
    essentialReasons.push(`Elevated particulate load (PM2.5: ${pm25.toFixed(1)} µg/m³)`);
  }
  if (feelsC >= 26 || humidity >= 75) {
    essentialItems.push('Insulated water bottle');
    essentialReasons.push('Higher heat & moisture loss');
  }
  if (essentialItems.length === 0) {
    essentialItems.push('Light lip balm & daypack');
    essentialReasons.push('Balanced, low-hazard atmospheric conditions');
  }

  const essentials: DressingLayer = {
    slot: 'Sun, Rain & Air Essentials',
    item: essentialItems.join(' · '),
    rationale: essentialReasons.join(' · '),
  };

  return {
    summary,
    comfortIndex,
    layers: [baseTop, outerwear, footwear, essentials],
  };
}
