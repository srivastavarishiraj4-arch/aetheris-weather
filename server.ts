import 'dotenv/config';
import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;
const GMP_ATTRIBUTION_HEADER = 'gmp_mcp_codeassist_v1_aistudio';

function getMapsApiKey(): string {
  return process.env.GOOGLE_MAPS_API_KEY || process.env.VITE_GOOGLE_MAPS_API_KEY || '';
}

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

const weatherCache = new Map<string, CacheEntry<unknown>>();
const geocodeCache = new Map<string, CacheEntry<unknown>>();
const WEATHER_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes in-memory session cache
const GEOCODE_CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes in-memory session cache

function isQuotaError(status: number, body: unknown): boolean {
  if (status === 429) return true;
  if (body && typeof body === 'object') {
    const err = (body as { error?: { status?: string; message?: string }; status?: string }).error;
    const topStatus = (body as { status?: string }).status;
    if (err?.status === 'RESOURCE_EXHAUSTED' || topStatus === 'OVER_QUERY_LIMIT') {
      return true;
    }
    if (typeof err?.message === 'string' && /quota|rate limit/i.test(err.message)) {
      return true;
    }
  }
  return false;
}

async function fetchJsonWithCheck(url: string, init?: RequestInit) {
  const res = await fetch(url, init);
  let json: unknown = null;
  try {
    json = await res.json();
  } catch {
    json = null;
  }
  return { status: res.status, ok: res.ok, json };
}

async function createApp() {
  const app = express();
  app.use(express.json());

  // Health check
  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, hasMapsKey: Boolean(getMapsApiKey()) });
  });

  // Forward Geocoding via Google Maps Platform Geocoding API v4 (with classic fallback)
  app.get('/api/geocode', async (req, res) => {
    const q = String(req.query.q || '').trim();
    if (!q || q.length < 2) {
      res.json({ results: [] });
      return;
    }

    const cacheKey = q.toLowerCase();
    const now = Date.now();
    const cachedGeo = geocodeCache.get(cacheKey);
    if (cachedGeo && cachedGeo.expiresAt > now) {
      res.json(cachedGeo.data);
      return;
    }

    const apiKey = getMapsApiKey();
    if (!apiKey) {
      res.status(503).json({
        error: { status: 'MISSING_API_KEY', message: 'Google Maps API key is not configured.' },
      });
      return;
    }

    try {
      const encoded = encodeURIComponent(q);
      const v4Url = `https://geocode.googleapis.com/v4/geocode/address/${encoded}?languageCode=en`;
      const v4Resp = await fetchJsonWithCheck(v4Url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': apiKey,
          'X-Goog-FieldMask':
            'results.placeId,results.location,results.formattedAddress,results.postalAddress',
          'X-Goog-Maps-Solution-ID': GMP_ATTRIBUTION_HEADER,
        },
      });

      if (isQuotaError(v4Resp.status, v4Resp.json)) {
        res.status(429).json({
          error: { status: 'RESOURCE_EXHAUSTED', message: 'Google Maps Platform quota reached.' },
        });
        return;
      }

      if (v4Resp.ok && v4Resp.json && typeof v4Resp.json === 'object') {
        const rawResults = (v4Resp.json as { results?: Array<Record<string, unknown>> }).results || [];
        const normalized = rawResults
          .map((item) => {
            const loc = item.location as { latitude?: number; longitude?: number } | undefined;
            const postal = item.postalAddress as
              | { locality?: string; administrativeArea?: string; regionCode?: string }
              | undefined;
            const formatted = String(item.formattedAddress || q);
            if (typeof loc?.latitude !== 'number' || typeof loc?.longitude !== 'number') {
              return null;
            }
            const name =
              postal?.locality ||
              formatted.split(',')[0]?.trim() ||
              q;
            const regionParts = [postal?.administrativeArea, postal?.regionCode].filter(Boolean);
            return {
              id: String(item.placeId || `${loc.latitude},${loc.longitude}`),
              name,
              subtitle: regionParts.length > 0 ? regionParts.join(', ') : formatted,
              formattedAddress: formatted,
              lat: loc.latitude,
              lng: loc.longitude,
            };
          })
          .filter(Boolean)
          .slice(0, 6);

        const responseBody = { results: normalized };
        if (normalized.length > 0) {
          geocodeCache.set(cacheKey, { data: responseBody, expiresAt: now + GEOCODE_CACHE_TTL_MS });
        }
        res.json(responseBody);
        return;
      }

      // Fallback to Geocoding REST API if v4 returns non-OK (e.g. legacy enablement)
      const fallbackUrl = new URL('https://maps.googleapis.com/maps/api/geocode/json');
      fallbackUrl.searchParams.set('address', q);
      fallbackUrl.searchParams.set('language', 'en');
      fallbackUrl.searchParams.set('key', apiKey);
      const fbResp = await fetchJsonWithCheck(fallbackUrl.toString(), {
        headers: { 'X-Goog-Maps-Solution-ID': GMP_ATTRIBUTION_HEADER },
      });

      if (isQuotaError(fbResp.status, fbResp.json)) {
        res.status(429).json({
          error: { status: 'RESOURCE_EXHAUSTED', message: 'Google Maps Platform quota reached.' },
        });
        return;
      }

      const fbResults =
        ((fbResp.json as { results?: Array<Record<string, unknown>> })?.results || [])
          .map((item) => {
            const geom = item.geometry as
              | { location?: { lat?: number; lng?: number } }
              | undefined;
            const lat = geom?.location?.lat;
            const lng = geom?.location?.lng;
            if (typeof lat !== 'number' || typeof lng !== 'number') return null;
            const formatted = String(item.formatted_address || q);
            const parts = formatted.split(',').map((s) => s.trim());
            return {
              id: String(item.place_id || `${lat},${lng}`),
              name: parts[0] || q,
              subtitle: parts.slice(1).join(', ') || formatted,
              formattedAddress: formatted,
              lat,
              lng,
            };
          })
          .filter(Boolean)
          .slice(0, 6);

      res.json({ results: fbResults });
    } catch (error) {
      console.error('Geocoding proxy error:', error);
      res.status(502).json({
        error: { status: 'UPSTREAM_ERROR', message: 'Failed to search locations.' },
      });
    }
  });

  // Reverse Geocoding for explicit user GPS geolocation
  app.get('/api/reverse-geocode', async (req, res) => {
    const lat = Number(req.query.lat);
    const lng = Number(req.query.lng);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      res.status(400).json({ error: { status: 'INVALID_ARGUMENT', message: 'Invalid coordinates.' } });
      return;
    }

    const apiKey = getMapsApiKey();
    if (!apiKey) {
      res.json({
        name: 'Current Location',
        subtitle: `${lat.toFixed(2)}°, ${lng.toFixed(2)}°`,
      });
      return;
    }

    try {
      const url = new URL('https://maps.googleapis.com/maps/api/geocode/json');
      url.searchParams.set('latlng', `${lat},${lng}`);
      url.searchParams.set('result_type', 'locality|administrative_area_level_1');
      url.searchParams.set('language', 'en');
      url.searchParams.set('key', apiKey);

      const resp = await fetchJsonWithCheck(url.toString(), {
        headers: { 'X-Goog-Maps-Solution-ID': GMP_ATTRIBUTION_HEADER },
      });

      if (isQuotaError(resp.status, resp.json)) {
        res.status(429).json({
          error: { status: 'RESOURCE_EXHAUSTED', message: 'Google Maps Platform quota reached.' },
        });
        return;
      }

      const first = (resp.json as { results?: Array<Record<string, unknown>> })?.results?.[0];
      if (first) {
        const formatted = String(first.formatted_address || '');
        const parts = formatted.split(',').map((s) => s.trim());
        res.json({
          name: parts[0] || 'Current Location',
          subtitle: parts.slice(1).join(', ') || `${lat.toFixed(2)}°, ${lng.toFixed(2)}°`,
        });
        return;
      }

      res.json({
        name: 'Current Location',
        subtitle: `${lat.toFixed(2)}°, ${lng.toFixed(2)}°`,
      });
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      res.json({
        name: 'Current Location',
        subtitle: `${lat.toFixed(2)}°, ${lng.toFixed(2)}°`,
      });
    }
  });

  // Unified Weather + Air Quality proxy using Google Maps Platform Weather API & Air Quality API
  app.get('/api/weather', async (req, res) => {
    const lat = Number(req.query.lat);
    const lng = Number(req.query.lng);
    if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) {
      res.status(400).json({
        error: { status: 'INVALID_ARGUMENT', message: 'Valid lat and lng query parameters are required.' },
      });
      return;
    }

    const cacheKey = `${lat.toFixed(2)},${lng.toFixed(2)}`;
    const now = Date.now();
    const cached = weatherCache.get(cacheKey);
    if (cached && cached.expiresAt > now) {
      res.json(cached.data);
      return;
    }

    const apiKey = getMapsApiKey();
    if (!apiKey) {
      res.status(503).json({
        error: {
          status: 'MISSING_API_KEY',
          message: 'Google Maps Platform API key is not configured on the server.',
        },
      });
      return;
    }

    try {
      const currentUrl = new URL('https://weather.googleapis.com/v1/currentConditions:lookup');
      currentUrl.searchParams.set('key', apiKey);
      currentUrl.searchParams.set('location.latitude', String(lat));
      currentUrl.searchParams.set('location.longitude', String(lng));
      currentUrl.searchParams.set('unitsSystem', 'METRIC');

      const hourlyUrl = new URL('https://weather.googleapis.com/v1/forecast/hours:lookup');
      hourlyUrl.searchParams.set('key', apiKey);
      hourlyUrl.searchParams.set('location.latitude', String(lat));
      hourlyUrl.searchParams.set('location.longitude', String(lng));
      hourlyUrl.searchParams.set('hours', '24');
      hourlyUrl.searchParams.set('pageSize', '24');

      const dailyUrl = new URL('https://weather.googleapis.com/v1/forecast/days:lookup');
      dailyUrl.searchParams.set('key', apiKey);
      dailyUrl.searchParams.set('location.latitude', String(lat));
      dailyUrl.searchParams.set('location.longitude', String(lng));
      dailyUrl.searchParams.set('days', '7');
      dailyUrl.searchParams.set('pageSize', '7');

      const aqUrl = `https://airquality.googleapis.com/v1/currentConditions:lookup?key=${encodeURIComponent(apiKey)}`;

      const fetchAirQuality = async (extraComputations: string[]) =>
        fetchJsonWithCheck(aqUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Goog-Maps-Solution-ID': GMP_ATTRIBUTION_HEADER,
          },
          body: JSON.stringify({
            universalAqi: true,
            location: { latitude: lat, longitude: lng },
            extraComputations,
            languageCode: 'en',
          }),
        });

      const [currentResp, hourlyResp, dailyResp, initialAqResp] = await Promise.all([
        fetchJsonWithCheck(currentUrl.toString(), {
          method: 'GET',
          headers: { 'X-Goog-Maps-Solution-ID': GMP_ATTRIBUTION_HEADER },
        }),
        fetchJsonWithCheck(hourlyUrl.toString(), {
          method: 'GET',
          headers: { 'X-Goog-Maps-Solution-ID': GMP_ATTRIBUTION_HEADER },
        }),
        fetchJsonWithCheck(dailyUrl.toString(), {
          method: 'GET',
          headers: { 'X-Goog-Maps-Solution-ID': GMP_ATTRIBUTION_HEADER },
        }),
        fetchAirQuality([
          'HEALTH_RECOMMENDATIONS',
          'DOMINANT_POLLUTANT_CONCENTRATION',
          'POLLUTANT_CONCENTRATION',
          'LOCAL_AQI',
          'POLLUTANT_ADDITIONAL_INFO',
        ]),
      ]);

      let aqResp = initialAqResp;
      if (!aqResp.ok && !isQuotaError(aqResp.status, aqResp.json) && aqResp.status === 400) {
        aqResp = await fetchAirQuality([
          'HEALTH_RECOMMENDATIONS',
          'POLLUTANT_CONCENTRATION',
          'POLLUTANT_ADDITIONAL_INFO',
        ]);
      }

      // Check quota exhaustion across all upstream Google Maps Platform calls
      if (
        isQuotaError(currentResp.status, currentResp.json) ||
        isQuotaError(hourlyResp.status, hourlyResp.json) ||
        isQuotaError(dailyResp.status, dailyResp.json) ||
        isQuotaError(aqResp.status, aqResp.json)
      ) {
        res.status(429).json({
          error: { status: 'RESOURCE_EXHAUSTED', message: 'Google Maps Platform quota reached.' },
        });
        return;
      }

      let resolvedAirQuality: unknown = aqResp.ok ? aqResp.json : null;

      // Regional coverage fallback: when Google Air Quality API reports no station coverage
      // (non-quota 400/404 in certain regions such as parts of India), enrich with live CAMS/Open-Meteo data.
      if (!resolvedAirQuality) {
        try {
          const omUrl = new URL('https://air-quality-api.open-meteo.com/v1/air-quality');
          omUrl.searchParams.set('latitude', String(lat));
          omUrl.searchParams.set('longitude', String(lng));
          omUrl.searchParams.set(
            'current',
            'us_aqi,pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone'
          );
          const omResp = await fetchJsonWithCheck(omUrl.toString());
          if (omResp.ok && omResp.json && typeof omResp.json === 'object') {
            const c = (omResp.json as { current?: Record<string, number | string> }).current;
            if (c && typeof c.us_aqi === 'number') {
              const usAqi = Math.round(c.us_aqi);
              // Map US EPA AQI (0 good -> 300+ hazardous) onto Universal AQI (100 excellent -> 0 poor)
              const uaqi = Math.max(0, Math.min(100, Math.round(100 - (usAqi / 300) * 100)));
              const pm25 = Number(c.pm2_5 ?? 0);
              const pm10 = Number(c.pm10 ?? 0);
              const o3Ug = Number(c.ozone ?? 0);
              const no2Ug = Number(c.nitrogen_dioxide ?? 0);
              const so2Ug = Number(c.sulphur_dioxide ?? 0);
              const coUg = Number(c.carbon_monoxide ?? 0);

              // Convert µg/m³ gases to ppb at standard 25°C / 1 atm for consistent display
              const o3Ppb = Number((o3Ug / 1.96).toFixed(2));
              const no2Ppb = Number((no2Ug / 1.88).toFixed(2));
              const so2Ppb = Number((so2Ug / 2.62).toFixed(2));
              const coPpb = Number((coUg / 1.145).toFixed(1));

              const dominantPollutant =
                pm25 / 35 >= pm10 / 150 && pm25 / 35 >= o3Ppb / 70
                  ? 'pm25'
                  : pm10 / 150 >= o3Ppb / 70
                  ? 'pm10'
                  : 'o3';

              const aqiMeta =
                usAqi <= 50
                  ? {
                      cat: 'Good air quality',
                      uaqiCat: 'Excellent air quality',
                      color: { red: 52, green: 211, blue: 153 },
                      general: 'Air quality is clean and poses little to no health risk. Ideal for outdoor activities.',
                      sensitive: 'No special precautions needed; enjoy normal outdoor activity.',
                      athletes: 'Clear breathing conditions for endurance and high-intensity outdoor training.',
                    }
                  : usAqi <= 100
                  ? {
                      cat: 'Moderate air quality',
                      uaqiCat: 'Moderate air quality',
                      color: { red: 251, green: 191, blue: 36 },
                      general: 'Acceptable air quality for most people; sensitive individuals should watch for mild symptoms.',
                      sensitive: 'Consider shortening prolonged or vigorous outdoor exertion if you feel throat or airway irritation.',
                      athletes: 'Outdoor workouts are generally fine; monitor breathing comfort near heavy traffic corridors.',
                    }
                  : usAqi <= 150
                  ? {
                      cat: 'Unhealthy for sensitive groups',
                      uaqiCat: 'Low air quality',
                      color: { red: 251, green: 146, blue: 60 },
                      general: 'Reduce prolonged outdoor exertion near congested roads and keep windows closed during peak traffic.',
                      sensitive: 'Limit extended outdoor time, use an N95 mask outdoors, and run indoor air filtration if available.',
                      athletes: 'Shift high-intensity cardio indoors or shorten outdoor sessions significantly.',
                    }
                  : usAqi <= 200
                  ? {
                      cat: 'Unhealthy air quality',
                      uaqiCat: 'Poor air quality',
                      color: { red: 248, green: 113, blue: 113 },
                      general: 'Everyone may begin to experience respiratory irritation; wear a fitted N95 mask outdoors and keep indoor air filtered.',
                      sensitive: 'Avoid outdoor exertion altogether and keep rescue medications close at hand.',
                      athletes: 'Move all aerobic and high-ventilation workouts indoors until particulate concentrations drop.',
                    }
                  : {
                      cat: 'Very unhealthy air quality',
                      uaqiCat: 'Very poor air quality',
                      color: { red: 192, green: 132, blue: 252 },
                      general: 'Health alert: minimize outdoor exposure, seal windows, use HEPA filtration indoors, and wear an N95 respirator outside.',
                      sensitive: 'Remain indoors with filtered air and avoid all outdoor physical activity.',
                      athletes: 'Cancel outdoor training sessions and stay indoors with purified air.',
                    };

              resolvedAirQuality = {
                dateTime: String(c.time || new Date().toISOString()),
                regionCode: 'in',
                indexes: [
                  {
                    code: 'uaqi',
                    displayName: 'Universal AQI',
                    aqi: uaqi,
                    aqiDisplay: String(uaqi),
                    color: aqiMeta.color,
                    category: aqiMeta.uaqiCat,
                    dominantPollutant,
                  },
                  {
                    code: 'usa_epa',
                    displayName: 'AQI (US EPA)',
                    aqi: usAqi,
                    aqiDisplay: String(usAqi),
                    color: aqiMeta.color,
                    category: aqiMeta.cat,
                    dominantPollutant,
                  },
                ],
                pollutants: [
                  {
                    code: 'pm25',
                    displayName: 'PM2.5',
                    fullName: 'Fine particulate matter (<2.5µm)',
                    concentration: { value: pm25, units: 'MICROGRAMS_PER_CUBIC_METER' },
                    additionalInfo: {
                      sources: 'Vehicle exhaust, power generation, biomass burning, construction dust, and industrial combustion.',
                      effects: 'Fine particles can travel deep into the lungs and enter the bloodstream, triggering airway inflammation.',
                    },
                  },
                  {
                    code: 'pm10',
                    displayName: 'PM10',
                    fullName: 'Inhalable particulate matter (<10µm)',
                    concentration: { value: pm10, units: 'MICROGRAMS_PER_CUBIC_METER' },
                    additionalInfo: {
                      sources: 'Road dust, construction activity, agricultural tillage, pollen, and industrial emissions.',
                      effects: 'Coarse inhalable particles can irritate the eyes, nose, throat, and upper respiratory tract.',
                    },
                  },
                  {
                    code: 'o3',
                    displayName: 'O3',
                    fullName: 'Ozone',
                    concentration: { value: o3Ppb, units: 'PARTS_PER_BILLION' },
                    additionalInfo: {
                      sources: 'Formed photochemically when sunlight reacts with nitrogen oxides and volatile organic compounds.',
                      effects: 'Ground-level ozone can irritate airways, reduce lung function, and worsen asthma symptoms.',
                    },
                  },
                  {
                    code: 'no2',
                    displayName: 'NO2',
                    fullName: 'Nitrogen dioxide',
                    concentration: { value: no2Ppb, units: 'PARTS_PER_BILLION' },
                    additionalInfo: {
                      sources: 'Motor vehicle engines, diesel generators, and fossil-fuel power plants.',
                      effects: 'Elevated levels increase bronchial sensitivity and respiratory infection vulnerability.',
                    },
                  },
                  {
                    code: 'so2',
                    displayName: 'SO2',
                    fullName: 'Sulfur dioxide',
                    concentration: { value: so2Ppb, units: 'PARTS_PER_BILLION' },
                    additionalInfo: {
                      sources: 'Coal and oil combustion in power plants, refineries, and heavy industrial boilers.',
                      effects: 'Can irritate the respiratory tract quickly, especially during outdoor exercise.',
                    },
                  },
                  {
                    code: 'co',
                    displayName: 'CO',
                    fullName: 'Carbon monoxide',
                    concentration: { value: coPpb, units: 'PARTS_PER_BILLION' },
                    additionalInfo: {
                      sources: 'Incomplete combustion in motor vehicles, generators, and biomass stoves.',
                      effects: 'High concentrations reduce oxygen delivery to body tissues and organs.',
                    },
                  },
                ],
                healthRecommendations: {
                  generalPopulation: aqiMeta.general,
                  athletes: aqiMeta.athletes,
                  children: aqiMeta.sensitive,
                  elderly: aqiMeta.sensitive,
                  lungDiseasePopulation: aqiMeta.sensitive,
                  heartDiseasePopulation: aqiMeta.sensitive,
                  pregnantWomen: aqiMeta.sensitive,
                },
              };
            }
          }
        } catch (fallbackErr) {
          console.warn('Regional air quality enrichment failed:', fallbackErr);
        }
      }

      if (!currentResp.ok) {
        const msg =
          (currentResp.json as { error?: { message?: string } })?.error?.message ||
          `Weather API returned status ${currentResp.status}`;
        res.status(currentResp.status >= 400 ? currentResp.status : 502).json({
          error: { status: 'WEATHER_UNAVAILABLE', message: msg },
        });
        return;
      }

      const payload = {
        fetchedAt: new Date().toISOString(),
        coordinates: { lat, lng },
        current: currentResp.json,
        hourly: hourlyResp.ok ? hourlyResp.json : { forecastHours: [] },
        daily: dailyResp.ok ? dailyResp.json : { forecastDays: [] },
        airQuality: resolvedAirQuality,
      };

      weatherCache.set(cacheKey, { data: payload, expiresAt: now + WEATHER_CACHE_TTL_MS });
      res.json(payload);
    } catch (error) {
      console.error('Weather proxy error:', error);
      res.status(502).json({
        error: { status: 'UPSTREAM_ERROR', message: 'Unable to fetch meteorological data.' },
      });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Aetheris Weather server running on http://0.0.0.0:${PORT}`);
  });
}

createApp();
