import { useEffect, useMemo, useRef, useState } from 'react';
import { Home, Loader2, LocateFixed, MapPin, Search, X } from 'lucide-react';
import type { CityLocation } from '../types/weather';
import { GLOBAL_CITIES, INDIA_CITIES } from '../utils/weatherIntelligence';

interface CitySearchModalProps {
  isOpen: boolean;
  currentCity: CityLocation;
  homeCity: CityLocation | null;
  onClose: () => void;
  onSelectCity: (city: CityLocation) => void;
  onSetHomeCity: (city: CityLocation) => void;
  onQuotaExceeded: () => void;
}

export function CitySearchModal({
  isOpen,
  currentCity,
  homeCity,
  onClose,
  onSelectCity,
  onSetHomeCity,
  onQuotaExceeded,
}: CitySearchModalProps) {
  const [query, setQuery] = useState('');
  const [activeRegion, setActiveRegion] = useState<'india' | 'global'>('india');
  const [results, setResults] = useState<CityLocation[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setResults([]);
      setSearchError(null);
      setActiveRegion('india');
      setTimeout(() => inputRef.current?.focus(), 60);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  const filteredDirectory = useMemo(() => {
    const source = activeRegion === 'india' ? INDIA_CITIES : GLOBAL_CITIES;
    const q = query.trim().toLowerCase();
    if (!q) return source;
    return source.filter(
      (c) => c.name.toLowerCase().includes(q) || c.subtitle.toLowerCase().includes(q)
    );
  }, [activeRegion, query]);

  const runSearch = async (term: string) => {
    const trimmed = term.trim();
    if (trimmed.length < 2) {
      setResults([]);
      setSearchError(null);
      return;
    }
    setIsSearching(true);
    setSearchError(null);
    try {
      const res = await fetch(`/api/geocode?q=${encodeURIComponent(trimmed)}`);
      const data = await res.json();
      if (res.status === 429 || data?.error?.status === 'RESOURCE_EXHAUSTED') {
        onQuotaExceeded();
        setSearchError(
          'Search quota reached. You can still select one of the featured cities below.'
        );
        setResults([]);
        return;
      }
      if (!res.ok) {
        setSearchError(data?.error?.message || 'Unable to search cities right now.');
        setResults([]);
        return;
      }
      const list: CityLocation[] = Array.isArray(data?.results) ? data.results : [];
      setResults(list);
      if (list.length === 0) {
        setSearchError(`No locations found matching "${trimmed}".`);
      }
    } catch {
      setSearchError('Network error while searching for locations.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void runSearch(query);
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setSearchError('Geolocation is not supported by this browser.');
      return;
    }
    setIsLocating(true);
    setSearchError(null);
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
          const data = await res.json();
          if (res.status === 429 || data?.error?.status === 'RESOURCE_EXHAUSTED') {
            onQuotaExceeded();
          }
          if (data?.name) {
            detected = {
              ...detected,
              name: data.name,
              subtitle: data.subtitle || detected.subtitle,
            };
          }
        } catch {
          // Keep coordinate fallback if reverse geocode fails
        } finally {
          setIsLocating(false);
          onSetHomeCity(detected);
          onSelectCity(detected);
          onClose();
        }
      },
      (err) => {
        setIsLocating(false);
        setSearchError(
          err.code === err.PERMISSION_DENIED
            ? 'Location permission was declined. Search your city or PIN code above, then pin it as Home.'
            : 'Unable to determine your current coordinates.'
        );
      },
      { enableHighAccuracy: false, timeout: 10000 }
    );
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-12 sm:pt-20 bg-slate-950/65 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      aria-label="Search or select a city"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl max-h-[84vh] overflow-y-auto weather-scroll glass-panel rounded-3xl p-6 text-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-4 pb-4 border-b border-white/15">
          <div>
            <h2 className="font-display text-xl font-semibold">Select Location</h2>
            <p className="text-xs text-white/65 mt-0.5">
              Browse cities across India, search any town or 6-digit PIN code, or detect where you live
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close location selector"
            className="p-2 rounded-xl text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Input */}
        <form onSubmit={handleSubmit} className="mt-4 flex items-center gap-2">
          <div className="relative flex-1">
            <Search
              className="w-4 h-4 text-white/55 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
              aria-hidden="true"
            />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search any Indian city, town, PIN code, or global city..."
              className="w-full rounded-xl bg-white/10 border border-white/15 pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-white/45 focus:outline-none focus:border-white/45 transition-colors"
            />
          </div>
          <button
            type="submit"
            disabled={isSearching || query.trim().length < 2}
            className="px-4 py-2.5 rounded-xl bg-white text-slate-950 text-sm font-semibold hover:bg-white/90 disabled:opacity-45 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            {isSearching ? 'Searching...' : 'Search'}
          </button>
        </form>

        {/* Live GPS Home Detection & Current Home Row */}
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleUseCurrentLocation}
            disabled={isLocating}
            className="inline-flex items-center gap-2 text-xs font-medium text-sky-200 hover:text-white transition-colors py-1.5 cursor-pointer"
          >
            {isLocating ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <LocateFixed className="w-3.5 h-3.5" />
            )}
            Detect where I live & save as Home
          </button>

          {homeCity && (
            <button
              type="button"
              onClick={() => {
                onSelectCity(homeCity);
                onClose();
              }}
              className="inline-flex items-center gap-1.5 text-xs text-white/80 hover:text-white transition-colors cursor-pointer"
            >
              <Home className="w-3.5 h-3.5 text-amber-300" aria-hidden="true" />
              <span>Home: {homeCity.name}</span>
            </button>
          )}
        </div>

        {searchError && (
          <p className="mt-3 text-xs text-amber-200 bg-amber-500/15 border border-amber-300/25 rounded-xl px-3.5 py-2.5">
            {searchError}
          </p>
        )}

        {/* Live Google Geocoding Search Results */}
        {results.length > 0 && (
          <div className="mt-4 pt-3 border-t border-white/12">
            <div className="text-xs text-white/60 mb-2">Search Results</div>
            <div className="divide-y divide-white/10">
              {results.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-3 py-2.5 px-2.5 -mx-2.5 rounded-xl hover:bg-white/10 transition-colors"
                >
                  <button
                    type="button"
                    onClick={() => {
                      onSelectCity(item);
                      onClose();
                    }}
                    className="flex-1 min-w-0 text-left cursor-pointer"
                  >
                    <div className="text-sm font-medium text-white truncate">{item.name}</div>
                    <div className="text-xs text-white/60 truncate">{item.subtitle}</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onSetHomeCity(item);
                      onSelectCity(item);
                      onClose();
                    }}
                    className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white hover:text-slate-950 text-xs font-medium text-white/85 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    Set as Home
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Region Tabs + Directory Grid */}
        <div className="mt-5 pt-4 border-t border-white/12">
          <div className="flex items-center justify-between gap-3 mb-3">
            <div
              className="flex items-center gap-1 p-1 rounded-xl bg-white/8 border border-white/10"
              role="tablist"
              aria-label="City directory region"
            >
              <button
                type="button"
                role="tab"
                aria-selected={activeRegion === 'india'}
                onClick={() => setActiveRegion('india')}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  activeRegion === 'india'
                    ? 'bg-white text-slate-950 shadow-sm'
                    : 'text-white/75 hover:text-white hover:bg-white/10'
                }`}
              >
                India ({INDIA_CITIES.length})
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activeRegion === 'global'}
                onClick={() => setActiveRegion('global')}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  activeRegion === 'global'
                    ? 'bg-white text-slate-950 shadow-sm'
                    : 'text-white/75 hover:text-white hover:bg-white/10'
                }`}
              >
                Global ({GLOBAL_CITIES.length})
              </button>
            </div>
            <span className="text-xs text-white/50 hidden sm:inline">
              Press Search for any other town or PIN code
            </span>
          </div>

          {filteredDirectory.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {filteredDirectory.map((city) => {
                const isSelected = city.id === currentCity.id;
                const isHome = homeCity?.id === city.id;
                return (
                  <button
                    key={city.id}
                    type="button"
                    onClick={() => {
                      onSelectCity(city);
                      onClose();
                    }}
                    className={`flex flex-col items-start p-2.5 rounded-xl border text-left transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-white text-slate-950 border-white'
                        : 'bg-white/6 border-white/12 text-white hover:bg-white/12'
                    }`}
                  >
                    <span className="text-xs font-semibold flex items-center gap-1 truncate w-full">
                      {isHome ? (
                        <Home className="w-3 h-3 shrink-0 text-amber-400" aria-hidden="true" />
                      ) : (
                        <MapPin className="w-3 h-3 shrink-0 opacity-75" aria-hidden="true" />
                      )}
                      <span className="truncate">{city.name}</span>
                    </span>
                    <span
                      className={`mt-0.5 text-[11px] truncate w-full ${
                        isSelected ? 'text-slate-600' : 'text-white/60'
                      }`}
                    >
                      {city.subtitle}
                    </span>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="py-6 text-center text-xs text-white/70">
              No preset city matched &ldquo;{query}&rdquo;. Click <span className="text-white font-semibold">Search</span> above to look up any town, village, or PIN code live.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
