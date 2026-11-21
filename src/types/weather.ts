export type TempUnit = 'C' | 'F';

export interface CityLocation {
  id: string;
  name: string;
  subtitle: string;
  query?: string;
  region?: 'india' | 'global' | 'home';
  lat?: number;
  lng?: number;
}

export interface WeatherConditionObj {
  iconBaseUri?: string;
  description?: { text?: string; languageCode?: string };
  type?: string;
}

export interface TempMeasurement {
  degrees?: number;
  unit?: string;
}

export interface SpeedMeasurement {
  value?: number;
  unit?: string;
}

export interface CurrentConditionsResponse {
  currentTime?: string;
  timeZone?: { id?: string };
  isDaytime?: boolean;
  weatherCondition?: WeatherConditionObj;
  temperature?: TempMeasurement;
  feelsLikeTemperature?: TempMeasurement;
  dewPoint?: TempMeasurement;
  heatIndex?: TempMeasurement;
  windChill?: TempMeasurement;
  relativeHumidity?: number;
  uvIndex?: number;
  precipitation?: {
    probability?: { percent?: number; type?: string };
    qpf?: { quantity?: number; unit?: string };
  };
  thunderstormProbability?: number;
  airPressure?: { meanSeaLevelMillibars?: number };
  wind?: {
    direction?: { degrees?: number; cardinal?: string };
    speed?: SpeedMeasurement;
    gust?: SpeedMeasurement;
  };
  visibility?: { distance?: number; unit?: string };
  cloudCover?: number;
  currentConditionsHistory?: {
    temperatureChange?: TempMeasurement;
    maxTemperature?: TempMeasurement;
    minTemperature?: TempMeasurement;
    qpf?: { quantity?: number; unit?: string };
  };
}

export interface ForecastHour {
  interval?: { startTime?: string; endTime?: string };
  displayDateTime?: {
    year?: number;
    month?: number;
    day?: number;
    hours?: number;
    utcOffset?: string;
  };
  isDaytime?: boolean;
  weatherCondition?: WeatherConditionObj;
  temperature?: TempMeasurement;
  feelsLikeTemperature?: TempMeasurement;
  relativeHumidity?: number;
  uvIndex?: number;
  precipitation?: {
    probability?: { percent?: number; type?: string };
    qpf?: { quantity?: number; unit?: string };
  };
  thunderstormProbability?: number;
  wind?: {
    direction?: { degrees?: number; cardinal?: string };
    speed?: SpeedMeasurement;
    gust?: SpeedMeasurement;
  };
  cloudCover?: number;
}

export interface ForecastDay {
  interval?: { startTime?: string; endTime?: string };
  displayDate?: { year?: number; month?: number; day?: number };
  daytimeForecast?: {
    weatherCondition?: WeatherConditionObj;
    relativeHumidity?: number;
    uvIndex?: number;
    precipitation?: {
      probability?: { percent?: number; type?: string };
      qpf?: { quantity?: number; unit?: string };
    };
    wind?: {
      speed?: SpeedMeasurement;
      direction?: { degrees?: number; cardinal?: string };
    };
    cloudCover?: number;
  };
  nighttimeForecast?: {
    weatherCondition?: WeatherConditionObj;
    relativeHumidity?: number;
    precipitation?: {
      probability?: { percent?: number; type?: string };
    };
  };
  maxTemperature?: TempMeasurement;
  minTemperature?: TempMeasurement;
  feelsLikeMaxTemperature?: TempMeasurement;
  feelsLikeMinTemperature?: TempMeasurement;
  sunEvents?: {
    sunriseTime?: string;
    sunsetTime?: string;
  };
  moonEvents?: {
    moonPhase?: string;
  };
}

export interface AqiColor {
  red?: number;
  green?: number;
  blue?: number;
  alpha?: number;
}

export interface AqiIndexItem {
  code?: string;
  displayName?: string;
  aqi?: number;
  aqiDisplay?: string;
  color?: AqiColor;
  category?: string;
  dominantPollutant?: string;
}

export interface PollutantItem {
  code?: string;
  displayName?: string;
  fullName?: string;
  concentration?: {
    value?: number;
    units?: string;
  };
  additionalInfo?: {
    sources?: string;
    effects?: string;
  };
}

export interface HealthRecommendations {
  generalPopulation?: string;
  elderly?: string;
  lungDiseasePopulation?: string;
  heartDiseasePopulation?: string;
  athletes?: string;
  pregnantWomen?: string;
  children?: string;
}

export interface AirQualityResponse {
  dateTime?: string;
  regionCode?: string;
  indexes?: AqiIndexItem[];
  pollutants?: PollutantItem[];
  healthRecommendations?: HealthRecommendations;
}

export interface WeatherDashboardPayload {
  fetchedAt: string;
  coordinates: { lat: number; lng: number };
  current: CurrentConditionsResponse;
  hourly: { forecastHours?: ForecastHour[]; timeZone?: { id?: string } };
  daily: { forecastDays?: ForecastDay[]; timeZone?: { id?: string } };
  airQuality: AirQualityResponse | null;
}

export type WeatherVisualCategory =
  | 'clear-day'
  | 'clear-night'
  | 'partly-cloudy-day'
  | 'partly-cloudy-night'
  | 'cloudy'
  | 'rain'
  | 'thunderstorm'
  | 'snow'
  | 'fog'
  | 'windy';
