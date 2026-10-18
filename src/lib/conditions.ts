export type CityId = 'murmansk' | 'teriberka' | 'kirovsk';
export type Signal = 'green' | 'yellow' | 'red' | 'unknown';
export type Reason =
  | 'favorable'
  | 'clouds'
  | 'rain'
  | 'snow'
  | 'daylight'
  | 'twilight'
  | 'patchy'
  | 'low_aurora'
  | 'unavailable';
export type PrecipitationKind = 'none' | 'rain' | 'snow' | 'unknown';

export interface CityConditions {
  city: CityId;
  signal: Signal;
  reason: Reason;
  cloudCover: number | null;
  cloudLow: number | null;
  cloudMid: number | null;
  cloudHigh: number | null;
  temperature: number | null;
  windSpeed: number | null;
  weatherCode: number | null;
  precipitation: number | null;
  rain: number | null;
  showers: number | null;
  snowfall: number | null;
  precipitationKind: PrecipitationKind;
  isDay: boolean | null;
  sunAltitude: number;
  auroraModel: number | null;
  weatherTime: string | null;
  auroraObservationTime: string | null;
  auroraForecastTime: string | null;
}

export interface LiveConditions {
  fetchedAt: string;
  cities: Record<CityId, CityConditions>;
  solarWind: {
    speed: number | null;
    bz: number | null;
    time: string | null;
  };
}

export const CITIES: Record<CityId, { latitude: number; longitude: number; nameRu: string; nameZh: string; landmarkRu: string; landmarkZh: string; image: string; referenceUrl: string }> = {
  murmansk: {
    latitude: 68.9707,
    longitude: 33.0749,
    nameRu: 'Мурманск',
    nameZh: '摩尔曼斯克',
    landmarkRu: 'Ледокол «Ленин»',
    landmarkZh: '列宁号破冰船',
    image: '/images/murmansk-generated-v1.jpg',
    referenceUrl: 'https://www.rosatomflot.ru/atomnyy-ledokol-lenin/',
  },
  teriberka: {
    latitude: 69.1655,
    longitude: 35.1438,
    nameRu: 'Териберка',
    nameZh: '捷里别尔卡',
    landmarkRu: 'Корабль на берегу',
    landmarkZh: '海滩搁浅渔船',
    image: '/images/teriberka-generated-v1.jpg',
    referenceUrl: 'https://murmansk.travel/en/places/1496',
  },
  kirovsk: {
    latitude: 67.614,
    longitude: 33.6717,
    nameRu: 'Кировск',
    nameZh: '基洛夫斯克',
    landmarkRu: 'Ресторан «Плато»',
    landmarkZh: '普拉托全景餐厅',
    image: '/images/user_photos/kirovsk/kirovsk_6.jpg',
    referenceUrl: 'https://murmansk.travel/places/944',
  },
};

type WeatherCurrent = {
  time: number;
  cloud_cover: number;
  cloud_cover_low: number;
  cloud_cover_mid: number;
  cloud_cover_high: number;
  temperature_2m: number;
  wind_speed_10m: number;
  weather_code: number;
  precipitation: number;
  rain: number;
  showers: number;
  snowfall: number;
  is_day: number;
};

type WeatherResponse = { current?: WeatherCurrent };
type OvationResponse = {
  'Observation Time': string;
  'Forecast Time': string;
  coordinates: Array<[number, number, number]>;
};
type SolarWindSummary = Array<{ time_tag: string; proton_speed?: number; bz_gsm?: number }>;

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url, {
    cache: 'no-store',
    signal: AbortSignal.timeout(9000),
    headers: { 'User-Agent': 'AuroraPolaris/2.0' },
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json() as Promise<T>;
}

export function isRecent(timestamp: string | null | undefined, maxAgeMinutes: number, futureMinutes = 15): boolean {
  if (!timestamp) return false;
  const moment = Date.parse(timestamp);
  if (!Number.isFinite(moment)) return false;
  const age = Date.now() - moment;
  return age >= -futureMinutes * 60_000 && age <= maxAgeMinutes * 60_000;
}

// Solar altitude in degrees.
// Strictly used to evaluate twilight and darkness for aurora visibility conditions.
export function sunAltitudeDegrees(date: Date, latitude: number, longitude: number): number {
  const rad = Math.PI / 180;
  const days = date.getTime() / 86_400_000 - 0.5 + 2_440_588 - 2_451_545;
  const anomaly = rad * (357.5291 + 0.98560028 * days);
  const ecliptic =
    anomaly +
    rad * (1.9148 * Math.sin(anomaly) + 0.02 * Math.sin(2 * anomaly) + 0.0003 * Math.sin(3 * anomaly)) +
    rad * 102.9372 +
    Math.PI;
  const obliquity = rad * 23.4397;
  const declination = Math.asin(Math.sin(obliquity) * Math.sin(ecliptic));
  const rightAscension = Math.atan2(Math.cos(obliquity) * Math.sin(ecliptic), Math.cos(ecliptic));
  const hourAngle = rad * (280.16 + 360.9856235 * days + longitude) - rightAscension;
  const latitudeRad = latitude * rad;
  return (
    Math.asin(
      Math.sin(latitudeRad) * Math.sin(declination) +
        Math.cos(latitudeRad) * Math.cos(declination) * Math.cos(hourAngle)
    ) / rad
  );
}

export function modelAtCity(model: OvationResponse, latitude: number, longitude: number): number | null {
  if (!Array.isArray(model.coordinates)) return null;
  const targetLat = Math.round(latitude);
  const targetLon = ((Math.round(longitude) % 360) + 360) % 360;
  const point = model.coordinates.find((row) => row[0] === targetLon && row[1] === targetLat);
  const value = point?.[2];
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 100 ? value : null;
}

export function precipitationKind(weather: WeatherCurrent | null): PrecipitationKind {
  if (!weather) return 'unknown';
  const code = weather.weather_code;
  if ([71, 73, 75, 77, 85, 86].includes(code) || weather.snowfall > 0) return 'snow';
  if (
    [51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82, 95, 96, 99].includes(code) ||
    weather.rain > 0.05 ||
    weather.showers > 0.05
  ) {
    return 'rain';
  }
  return 'none';
}

export function classifyConditions(
  cloudCover: number | null,
  auroraModel: number | null,
  sunAltitude: number,
  precipitation: PrecipitationKind = 'none'
): Pick<CityConditions, 'signal' | 'reason'> {
  // If mandatory weather or geomagnetic data is unavailable or stale, display honest unknown status
  if (cloudCover === null || auroraModel === null) {
    return { signal: 'unknown', reason: 'unavailable' };
  }

  // Daylight check: Sun is higher than -1 degree
  if (sunAltitude >= -1) {
    return { signal: 'red', reason: 'daylight' };
  }

  // Twilight check: Sun between -1 and -12 degrees (astronomical twilight)
  if (sunAltitude > -12) {
    return { signal: 'red', reason: 'twilight' };
  }

  // Weather impediments
  if (precipitation === 'snow') {
    return { signal: 'red', reason: 'snow' };
  }
  if (precipitation === 'rain') {
    return { signal: 'red', reason: 'rain' };
  }
  if (cloudCover >= 80) {
    return { signal: 'red', reason: 'clouds' };
  }

  // Favorable: dark sky, low clouds (<=25%), and model activity >= 20
  if (auroraModel >= 20 && cloudCover <= 25) {
    return { signal: 'green', reason: 'favorable' };
  }

  // Uncertainty: variable/patchy cloud cover
  if (cloudCover >= 26) {
    return { signal: 'yellow', reason: 'patchy' };
  }

  // Clear dark sky, but model shows weak activity
  return { signal: 'yellow', reason: 'low_aurora' };
}

function validWeather(data: WeatherResponse | null): WeatherCurrent | null {
  const current = data?.current;
  if (!current || !Number.isFinite(current.time) || !Number.isFinite(current.cloud_cover)) return null;
  if (current.cloud_cover < 0 || current.cloud_cover > 100) return null;
  const isoTime = new Date(current.time * 1000).toISOString();
  return isRecent(isoTime, 60, 20) ? current : null;
}

function nullableNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

export async function getLiveConditions(): Promise<LiveConditions> {
  const ids = Object.keys(CITIES) as CityId[];
  const weatherUrls = ids.map((id) => {
    const city = CITIES[id];
    const params = new URLSearchParams({
      latitude: String(city.latitude),
      longitude: String(city.longitude),
      current:
        'temperature_2m,wind_speed_10m,cloud_cover,cloud_cover_low,cloud_cover_mid,cloud_cover_high,weather_code,precipitation,rain,showers,snowfall,is_day',
      timeformat: 'unixtime',
      timezone: 'Europe/Moscow',
    });
    return `https://api.open-meteo.com/v1/forecast?${params}`;
  });

  const results = await Promise.allSettled([
    fetchJson<OvationResponse>('https://services.swpc.noaa.gov/json/ovation_aurora_latest.json'),
    fetchJson<SolarWindSummary>('https://services.swpc.noaa.gov/products/summary/solar-wind-speed.json'),
    fetchJson<SolarWindSummary>('https://services.swpc.noaa.gov/products/summary/solar-wind-mag-field.json'),
    ...weatherUrls.map((url) => fetchJson<WeatherResponse>(url)),
  ]);

  const successful = <T>(index: number): T | null =>
    results[index].status === 'fulfilled'
      ? ((results[index] as PromiseFulfilledResult<unknown>).value as T)
      : null;

  const model = successful<OvationResponse>(0);
  const validModel =
    model && isRecent(model['Observation Time'], 60) && isRecent(model['Forecast Time'], 45, 120)
      ? model
      : null;

  const speed = successful<SolarWindSummary>(1)?.[0];
  const field = successful<SolarWindSummary>(2)?.[0];
  const validSpeed = speed && isRecent(speed.time_tag, 60) ? speed : null;
  const validField = field && isRecent(field.time_tag, 60) ? field : null;

  const cities = {} as Record<CityId, CityConditions>;
  ids.forEach((id, index) => {
    const coords = CITIES[id];
    const weather = validWeather(successful<WeatherResponse>(index + 3));
    const cloudCover = nullableNumber(weather?.cloud_cover);
    const precipitation = precipitationKind(weather);
    const auroraModel = validModel ? modelAtCity(validModel, coords.latitude, coords.longitude) : null;
    const sunAltitude = sunAltitudeDegrees(new Date(), coords.latitude, coords.longitude);

    cities[id] = {
      city: id,
      ...classifyConditions(cloudCover, auroraModel, sunAltitude, precipitation),
      cloudCover,
      cloudLow: nullableNumber(weather?.cloud_cover_low),
      cloudMid: nullableNumber(weather?.cloud_cover_mid),
      cloudHigh: nullableNumber(weather?.cloud_cover_high),
      temperature: nullableNumber(weather?.temperature_2m),
      windSpeed: nullableNumber(weather?.wind_speed_10m),
      weatherCode: nullableNumber(weather?.weather_code),
      precipitation: nullableNumber(weather?.precipitation),
      rain: nullableNumber(weather?.rain),
      showers: nullableNumber(weather?.showers),
      snowfall: nullableNumber(weather?.snowfall),
      precipitationKind: precipitation,
      isDay: weather && (weather.is_day === 0 || weather.is_day === 1) ? weather.is_day === 1 : null,
      sunAltitude: Math.round(sunAltitude * 10) / 10,
      auroraModel,
      weatherTime: weather ? new Date(weather.time * 1000).toISOString() : null,
      auroraObservationTime: validModel?.['Observation Time'] ?? null,
      auroraForecastTime: validModel?.['Forecast Time'] ?? null,
    };
  });

  return {
    fetchedAt: new Date().toISOString(),
    cities,
    solarWind: {
      speed: nullableNumber(validSpeed?.proton_speed),
      bz: nullableNumber(validField?.bz_gsm),
      time: validSpeed?.time_tag ?? validField?.time_tag ?? null,
    },
  };
}
