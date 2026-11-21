import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'motion/react';
import {
  Compass,
  Droplets,
  Eye,
  Gauge,
  Home,
  Loader2,
  LocateFixed,
  MapPin,
  RefreshCw,
  Search,
} from 'lucide-react';
import type { CityLocation, TempUnit, WeatherDashboardPayload } from './types/weather';
import {
  INDIA_CITIES,
  SKY_THEMES,
  classifyWeatherVisual,
  formatCardinal,
  formatClockTime,
  formatDistance,
  formatSpeed,
  formatTemp,
} from './utils/weatherIntelligence';
import { WeatherBackdrop } from './components/WeatherBackdrop';
import { AnimatedWeatherIcon } from './components/AnimatedWeatherIcon';
import { ForecastPanels } from './components/ForecastPanels';
import { AirQualitySection } from './components/AirQualitySection';
import { UvSolarSection } from './components/UvSolarSection';
import { DayPlannerAndAttire } from './components/DayPlannerAndAttire';
import { CitySearchModal } from './components/CitySearchModal';

const HOME_CITY_STORAGE_KEY = 'aetheris_home_city_v1';
const HOME_CITY_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000; // 30-day ToS-compliant TTL

function readSavedHomeCity(): CityLocation | null {
  try {
    const raw = localStorage.getItem(HOME_CITY_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { city?: CityLocation; savedAt?: number };
    if (!parsed.city || typeof parsed.savedAt !== 'number') return null;
    if (Date.now() - parsed.savedAt > HOME_CITY_MAX_AGE_MS) {
      localStorage.removeItem(HOME_CITY_STORAGE_KEY);
      return null;
    }
    return parsed.city;
  } catch {
    return null;
  }
}

export default function App() {
  const [homeCity, setHomeCity] = useState<CityLocation | null>(() => readSavedHomeCity());
  const [selectedCity, setSelectedCity] = useState<CityLocation>(
    () => readSavedHomeCity() ?? INDIA_CITIES[0]
  );
  const [unit, setUnit] = useState<TempUnit>('C');
  const [data, setData] = useState<WeatherDashboardPayload | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const [quotaExceeded, setQuotaExceeded] = useState<boolean>(false);

  // Client-side coordinate cache for this session so repeat switches avoid re-geocoding
  const resolvedCoordsRef = useRef<Map<string, { lat: number; lng: number }>>(new Map());

  // Listen for Tier 1 / Tier 2 Google Maps Platform quota events
  useEffect(() => {
    const onQuota = () => setQuotaExceeded(true);
    window.addEventListener('gmp-quota-exceeded', onQuota);
    return () => window.removeEventListener('gmp-quota-exceeded', onQuota);
  }, []);

  const triggerQuotaWarning = useCallback(() => {
    window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
  }, []);

  const saveHomeCity = useCallback((city: CityLocation) => {
    const homeEntry: CityLocation = { ...city, region: 'home' };
    setHomeCity(homeEntry);
    try {
      localStorage.setItem(
        HOME_CITY_STORAGE_KEY,
        JSON.stringify({ city: homeEntry, savedAt: Date.now() })
      );
    } catch {
      // Ignore storage quota issues
    }
  }, []);

  const loadWeather = useCallback(
    async (city: CityLocation) => {
      setIsLoading(true);
      setErrorMessage(null);
      try {
        let resolvedLat: number;
        let resolvedLng: number;

        if (typeof city.lat === 'number' && typeof city.lng === 'number') {
          resolvedLat = city.lat;
          resolvedLng = city.lng;
        } else {
          const cached = resolvedCoordsRef.current.get(city.id);
          if (cached) {
            resolvedLat = cached.lat;
            resolvedLng = cached.lng;
          } else {
            const geocodeQuery = city.query || `${city.name}, ${city.subtitle}`;
            const geoRes = await fetch(`/api/geocode?q=${encodeURIComponent(geocodeQuery)}`);
            const geoData = await geoRes.json();
            if (geoRes.status === 429 || geoData?.error?.status === 'RESOURCE_EXHAUSTED') {
              triggerQuotaWarning();
              setErrorMessage('Google Maps Platform daily quota reached for location lookup.');
              return;
            }
            const first = Array.isArray(geoData?.results) ? geoData.results[0] : null;
            if (!geoRes.ok || !first || typeof first.lat !== 'number' || typeof first.lng !== 'number') {
              setErrorMessage(`Could not resolve coordinates for ${city.name}.`);
              return;
            }
            resolvedLat = first.lat;
            resolvedLng = first.lng;
            resolvedCoordsRef.current.set(city.id, { lat: resolvedLat, lng: resolvedLng });
          }
        }

        const res = await fetch(
          `/api/weather?lat=${encodeURIComponent(resolvedLat)}&lng=${encodeURIComponent(resolvedLng)}`
        );
        const payload = await res.json();

        if (res.status === 429 || payload?.error?.status === 'RESOURCE_EXHAUSTED') {
          triggerQuotaWarning();
          setErrorMessage('Google Maps Platform daily quota reached for weather telemetry.');
          return;
        }

        if (!res.ok) {
          setErrorMessage(
            payload?.error?.message || 'Unable to load meteorological telemetry for this location.'
          );
          return;
        }

        setData(payload as WeatherDashboardPayload);
      } catch {
        setErrorMessage('Network error while connecting to weather services. Please try again.');
      } finally {
        setIsLoading(false);
      }
    },
    [triggerQuotaWarning]
  );

  useEffect(() => {
    void loadWeather(selectedCity);
  }, [selectedCity, loadWeather]);

  const handleDetectMyLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setErrorMessage('Browser geolocation is unavailable. Use Change City to search your town or PIN code.');
      return;
    }
    setIsLocating(true);
    setErrorMessage(null);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        let detected: CityLocation = {
          id: `home-${lat.toFixed(3)},${lng.toFixed(3)}`,
          name: 'My Location',
          subtitle: `${lat.toFixed(2)}°, ${lng.toFixed(2)}°`,
          region: 'home',
          lat,
          lng,
        };
        try {
          const res = await fetch(`/api/reverse-geocode?lat=${lat}&lng=${lng}`);
          const payload = await res.json();
          if (res.status === 429 || payload?.error?.status === 'RESOURCE_EXHAUSTED') {
            triggerQuotaWarning();
          }
          if (payload?.name) {
            detected = {
              ...detected,
              name: payload.name,
              subtitle: payload.subtitle || detected.subtitle,
            };
          }
        } catch {
          // Keep coordinate label if reverse geocoding fails
        } finally {
          setIsLocating(false);
          saveHomeCity(detected);
          setSelectedCity(detected);
        }
      },
      (err) => {
        setIsLocating(false);
        if (err.code === err.PERMISSION_DENIED) {
          setIsSearchOpen(true);
        } else {
          setErrorMessage('Unable to detect your GPS location. Search your city or PIN code via Change City.');
        }
      },
      { enableHighAccuracy: false, timeout: 10000 }
    );
  }, [saveHomeCity, triggerQuotaWarning]);

  const quickCities = useMemo(() => {
    const featuredIndia = INDIA_CITIES.slice(0, 8);
    if (!homeCity) return featuredIndia;
    const deduped = featuredIndia.filter((c) => c.id !== homeCity.id && c.name !== homeCity.name);
    return [homeCity, ...deduped.slice(0, 7)];
  }, [homeCity]);

  const isViewingHome = Boolean(
    homeCity && (homeCity.id === selectedCity.id || homeCity.name === selectedCity.name)
  );

  const current = data?.current;
  const forecastHours = data?.hourly?.forecastHours ?? [];
  const forecastDays = data?.daily?.forecastDays ?? [];
  const timeZone = current?.timeZone?.id || data?.hourly?.timeZone?.id;

  const visualCategory = useMemo(() => {
    if (!current) return 'partly-cloudy-day';
    return classifyWeatherVisual(
      current.weatherCondition?.type,
      current.isDaytime ?? true,
      current.wind?.speed?.value ?? 0
    );
  }, [current]);

  const skyTheme = SKY_THEMES[visualCategory];
  const todayForecast = forecastDays[0];
  const highC =
    todayForecast?.maxTemperature?.degrees ??
    current?.currentConditionsHistory?.maxTemperature?.degrees;
  const lowC =
    todayForecast?.minTemperature?.degrees ??
    current?.currentConditionsHistory?.minTemperature?.degrees;

  return (
    <div className="relative min-h-screen text-white selection:bg-white/25">
      {/* Dynamic Weather-Synced Atmospheric Gradient Backdrop */}
      <WeatherBackdrop category={visualCategory} />

      {/* Required Google Maps Platform Demo Quota Notice Banner */}
      {quotaExceeded && (
        <div className="bg-amber-50 border-b border-amber-200 text-amber-900 px-4 py-2.5 text-xs md:text-sm text-center sticky top-0 z-50 shadow-sm">
          <span>
            Google Maps Platform quota reached. If you are the app owner, visit{' '}
            <a
              href="https://developers.google.com/maps/ai/ai-studio?utm_campaign=gmp_mcp_codeassist_v1_aistudio#quota_exceeded_errors"
              target="_blank"
              rel="noopener noreferrer"
              className="underline font-semibold text-amber-950 hover:text-amber-800"
            >
              maps developer site
            </a>{' '}
            for instructions to update your account.
          </span>
        </div>
      )}

      {/* Strict 3-Zone Top Navigation Bar */}
      <header className="glass-header sticky top-0 z-40">
        <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
          {/* Zone 1: Single-element Brand Wordmark */}
          <a
            href="#overview"
            className="font-display text-xl font-bold tracking-tight text-white whitespace-nowrap shrink-0"
          >
            Aetheris
          </a>

          {/* Zone 2: Clean Single-Line Navigation Links */}
          <nav
            aria-label="Dashboard sections"
            className="hidden md:flex items-center gap-7 text-sm font-medium text-white/75"
          >
            <a
              href="#overview"
              className="hover:text-white transition-colors whitespace-nowrap shrink-0 py-1 border-b border-transparent hover:border-white/50"
            >
              Overview
            </a>
            <a
              href="#air-quality"
              className="hover:text-white transition-colors whitespace-nowrap shrink-0 py-1 border-b border-transparent hover:border-white/50"
            >
              Air Quality
            </a>
            <a
              href="#uv-solar"
              className="hover:text-white transition-colors whitespace-nowrap shrink-0 py-1 border-b border-transparent hover:border-white/50"
            >
              UV & Solar
            </a>
            <a
              href="#planner-attire"
              className="hover:text-white transition-colors whitespace-nowrap shrink-0 py-1 border-b border-transparent hover:border-white/50"
            >
              Planner & Attire
            </a>
          </nav>

          {/* Zone 3: Single Primary Action */}
          <div className="flex items-center shrink-0">
            <button
              type="button"
              onClick={() => setIsSearchOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white text-slate-950 text-xs sm:text-sm font-semibold hover:bg-white/90 transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              <Search className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>Change City</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Viewport Canvas */}
      <main
        id="overview"
        className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8 pt-6 pb-16 flex flex-col gap-6 scroll-mt-20"
      >
        {/* Workspace Toolbar: Home + Quick Indian City Switcher + My Location + Unit Toggle */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div
            className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 weather-scroll"
            role="group"
            aria-label="Quick Indian cities"
          >
            {quickCities.map((city) => {
              const active = city.id === selectedCity.id;
              const isHomeItem = homeCity?.id === city.id;
              return (
                <button
                  key={city.id}
                  type="button"
                  onClick={() => setSelectedCity(city)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-white ${
                    active
                      ? 'bg-white/22 text-white border border-white/30 backdrop-blur-md'
                      : 'text-white/75 hover:text-white hover:bg-white/10 border border-transparent'
                  }`}
                >
                  {isHomeItem && <Home className="w-3.5 h-3.5 text-amber-300 shrink-0" aria-hidden="true" />}
                  <span>{city.name}</span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2 self-end lg:self-auto shrink-0">
            <button
              type="button"
              onClick={handleDetectMyLocation}
              disabled={isLocating}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-950/35 border border-white/15 text-xs font-medium text-white/90 hover:text-white hover:bg-white/15 disabled:opacity-50 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              {isLocating ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
              ) : (
                <LocateFixed className="w-3.5 h-3.5 shrink-0" />
              )}
              <span>My Location</span>
            </button>

            <div
              className="flex items-center p-1 rounded-xl bg-slate-950/35 border border-white/15 backdrop-blur-md"
              role="group"
              aria-label="Temperature unit"
            >
              <button
                type="button"
                onClick={() => setUnit('C')}
                className={`px-3 py-1 text-xs font-mono font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  unit === 'C' ? 'bg-white text-slate-950' : 'text-white/75 hover:text-white'
                }`}
              >
                °C
              </button>
              <button
                type="button"
                onClick={() => setUnit('F')}
                className={`px-3 py-1 text-xs font-mono font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  unit === 'F' ? 'bg-white text-slate-950' : 'text-white/75 hover:text-white'
                }`}
              >
                °F
              </button>
            </div>

            <button
              type="button"
              onClick={() => void loadWeather(selectedCity)}
              disabled={isLoading}
              aria-label="Refresh weather data"
              className="p-2 rounded-xl bg-slate-950/35 border border-white/15 text-white/80 hover:text-white hover:bg-white/15 disabled:opacity-50 transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Error State Banner (actionable) */}
        {errorMessage && (
          <div className="glass-panel rounded-3xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="font-display text-lg font-semibold text-white">
                Weather Data Unavailable
              </h2>
              <p className="mt-1 text-sm text-white/80">{errorMessage}</p>
            </div>
            <button
              type="button"
              onClick={() => void loadWeather(selectedCity)}
              className="px-4 py-2 rounded-xl bg-white text-slate-950 text-sm font-semibold hover:bg-white/90 transition-colors whitespace-nowrap shrink-0 cursor-pointer self-start sm:self-auto"
            >
              Retry Lookup
            </button>
          </div>
        )}

        {/* Loading Skeleton */}
        {isLoading && !current && (
          <div className="flex flex-col gap-6 animate-pulse" aria-busy="true">
            <div className="glass-panel rounded-3xl p-8 h-72" />
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-7 glass-panel rounded-3xl h-56" />
              <div className="lg:col-span-5 glass-panel rounded-3xl h-56" />
            </div>
            <div className="glass-panel rounded-3xl h-80" />
          </div>
        )}

        {/* Live Populated Dashboard */}
        {current && (
          <motion.div
            key={`${selectedCity.id}-${data?.fetchedAt}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col gap-6"
          >
            {/* Dominant Focal Anchor: Hero Current Weather Panel */}
            <section className="glass-panel rounded-3xl p-6 sm:p-8 lg:p-10">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                {/* Left 7 cols: Location, Condition & Primary Temperature */}
                <div className="lg:col-span-7">
                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setIsSearchOpen(true)}
                      className="group inline-flex items-center gap-2 text-left cursor-pointer focus-visible:outline-2 focus-visible:outline-white rounded-lg"
                    >
                      <MapPin className="w-5 h-5 text-white/80 shrink-0" aria-hidden="true" />
                      <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-white group-hover:underline decoration-white/40 underline-offset-4">
                        {selectedCity.name}
                      </h1>
                    </button>

                    {!isViewingHome ? (
                      <button
                        type="button"
                        onClick={() =>
                          saveHomeCity({
                            ...selectedCity,
                            lat: data?.coordinates.lat ?? selectedCity.lat,
                            lng: data?.coordinates.lng ?? selectedCity.lng,
                          })
                        }
                        className="inline-flex items-center gap-1.5 text-xs font-medium text-white/75 hover:text-white underline underline-offset-4 decoration-white/30 hover:decoration-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                      >
                        <Home className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>Set as Home</span>
                      </button>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-200 whitespace-nowrap shrink-0">
                        <Home className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>Home</span>
                      </span>
                    )}
                  </div>

                  {/* Unboxed clean metadata with typographic separators */}
                  <div className="mt-2 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs sm:text-sm text-white/75">
                    <span>{selectedCity.subtitle}</span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono tabular-nums">
                      Local {formatClockTime(current.currentTime, timeZone)}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>{skyTheme.label}</span>
                  </div>

                  <div className="mt-6 flex flex-wrap items-end gap-x-7 gap-y-3">
                    <div className="font-display text-7xl sm:text-8xl font-semibold leading-none tracking-tight text-white tabular-nums">
                      {formatTemp(current.temperature?.degrees, unit)}
                    </div>

                    <div className="pb-1.5">
                      <div className="font-display text-2xl sm:text-3xl font-medium text-white">
                        {current.weatherCondition?.description?.text || skyTheme.label}
                      </div>
                      <div className="mt-1.5 flex flex-wrap items-center gap-x-2.5 text-sm text-white/80 font-mono tabular-nums">
                        <span>Feels like {formatTemp(current.feelsLikeTemperature?.degrees, unit)}</span>
                        <span aria-hidden="true">·</span>
                        <span>High {formatTemp(highC, unit)}</span>
                        <span aria-hidden="true">·</span>
                        <span>Low {formatTemp(lowC, unit)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right 5 cols: Hero Animated Weather Sculpture & Dew / Rain Callout */}
                <div className="lg:col-span-5 flex flex-row lg:flex-col items-center lg:items-end justify-between gap-6">
                  <div className="relative flex items-center justify-center p-2">
                    <AnimatedWeatherIcon category={visualCategory} size={136} />
                  </div>

                  <div className="text-right font-mono text-xs text-white/75 space-y-1 tabular-nums">
                    <div>
                      Precipitation chance:{' '}
                      <span className="text-white font-semibold">
                        {current.precipitation?.probability?.percent ?? 0}%
                      </span>
                    </div>
                    <div>
                      Dew point:{' '}
                      <span className="text-white font-semibold">
                        {formatTemp(current.dewPoint?.degrees, unit)}
                      </span>
                    </div>
                    <div>
                      Cloud cover:{' '}
                      <span className="text-white font-semibold">
                        {current.cloudCover ?? 0}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Full-Width 4-Column Atmospheric Telemetry Strip below Hero Split */}
              <div className="mt-8 pt-6 border-t border-white/15 grid grid-cols-2 lg:grid-cols-4 gap-6">
                <div>
                  <div className="flex items-center gap-1.5 text-xs text-white/65">
                    <Droplets className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Relative Humidity</span>
                  </div>
                  <div className="mt-1.5 font-mono text-2xl font-semibold text-white tabular-nums">
                    {current.relativeHumidity ?? '—'}%
                  </div>
                  <div className="mt-0.5 text-xs text-white/65">
                    Dew point {formatTemp(current.dewPoint?.degrees, unit)}
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-1.5 text-xs text-white/65">
                    <Compass className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Wind & Gusts</span>
                  </div>
                  <div className="mt-1.5 font-mono text-2xl font-semibold text-white tabular-nums">
                    {formatSpeed(current.wind?.speed?.value, unit)}
                  </div>
                  <div className="mt-0.5 text-xs text-white/65 font-mono tabular-nums">
                    {formatCardinal(current.wind?.direction?.cardinal)} · Gusts{' '}
                    {formatSpeed(current.wind?.gust?.value ?? current.wind?.speed?.value, unit)}
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-1.5 text-xs text-white/65">
                    <Gauge className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Barometric Pressure</span>
                  </div>
                  <div className="mt-1.5 font-mono text-2xl font-semibold text-white tabular-nums">
                    {current.airPressure?.meanSeaLevelMillibars
                      ? `${Math.round(current.airPressure.meanSeaLevelMillibars)} hPa`
                      : '—'}
                  </div>
                  <div className="mt-0.5 text-xs text-white/65">Mean sea level</div>
                </div>

                <div>
                  <div className="flex items-center gap-1.5 text-xs text-white/65">
                    <Eye className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Visibility</span>
                  </div>
                  <div className="mt-1.5 font-mono text-2xl font-semibold text-white tabular-nums">
                    {formatDistance(current.visibility?.distance, unit)}
                  </div>
                  <div className="mt-0.5 text-xs text-white/65">
                    Thunderstorm risk {current.thunderstormProbability ?? 0}%
                  </div>
                </div>
              </div>
            </section>

            {/* Hourly & 7-Day Forecasts */}
            <ForecastPanels
              hours={forecastHours}
              days={forecastDays}
              timeZone={timeZone}
              unit={unit}
            />

            {/* Detailed AQI Indexes & Particle Concentration Analytics */}
            <AirQualitySection airQuality={data?.airQuality ?? null} />

            {/* UV Index & Hourly Solar Curve */}
            <UvSolarSection
              current={current}
              hours={forecastHours}
              today={todayForecast}
              timeZone={timeZone}
            />

            {/* Day Planner Suggestions & Dressing Suggestion */}
            <DayPlannerAndAttire
              current={current}
              hours={forecastHours}
              airQuality={data?.airQuality ?? null}
              unit={unit}
            />
          </motion.div>
        )}
      </main>

      {/* Clean Minimal Footer with Required Google Maps Attribution & Terms */}
      <footer className="border-t border-white/12 bg-slate-950/30 backdrop-blur-md">
        <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-white/60">
          <div>
            Aetheris Weather · Powered by Google Maps Platform Weather, Air Quality, and Geocoding APIs
          </div>
          <div className="flex items-center gap-3">
            <a
              href="https://maps.google.com/help/terms_maps/?utm_campaign=gmp_mcp_codeassist_v1_aistudio"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white transition-colors underline underline-offset-2"
            >
              Google Maps Terms
            </a>
            <span aria-hidden="true">·</span>
            <a
              href="https://policies.google.com/privacy?utm_campaign=gmp_mcp_codeassist_v1_aistudio"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white transition-colors underline underline-offset-2"
            >
              Privacy Policy
            </a>
          </div>
        </div>
      </footer>

      {/* City Search & Geolocation Modal */}
      <CitySearchModal
        isOpen={isSearchOpen}
        currentCity={selectedCity}
        homeCity={homeCity}
        onClose={() => setIsSearchOpen(false)}
        onSelectCity={(city) => setSelectedCity(city)}
        onSetHomeCity={saveHomeCity}
        onQuotaExceeded={triggerQuotaWarning}
      />
    </div>
  );
}
