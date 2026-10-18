import type { CityId, PrecipitationKind, Signal } from './conditions';

export type SkyPhase = 'day' | 'twilight' | 'night' | 'unknown';
export type SceneWeather = 'clear' | 'breaks' | 'clouds' | 'rain' | 'snow' | 'unknown';
type Overlay = 'none' | 'breaks' | 'rain' | 'snow';

type CityScenes = {
  neutral: string;
  dayClear: string;
  dayCloudy: string;
  nightClear: string;
  nightAurora: string;
  nightBreaksAurora?: string;
  nightCloudy: string;
  nightSnow: string;
  nightCloudyFromDay?: boolean;
};

// All frames already exist in this project's public/images folder. A dark sky
// with stars or aurora is never used for daylight, dense clouds or precipitation.
export const CITY_SCENES: Record<CityId, CityScenes> = {
  murmansk: {
    neutral: '/images/murmansk-generated-v1.jpg',
    dayClear: '/images/user_photos/murmansk/murmansk_2.jpg',
    dayCloudy: '/images/murmansk-day.jpg',
    nightClear: '/images/user_photos/murmansk/murmansk_3.jpg',
    nightAurora: '/images/murmansk-aurora.jpg',
    nightBreaksAurora: '/images/user_photos/murmansk/murmansk_8.jpg',
    nightCloudy: '/images/murmansk-day.jpg',
    nightSnow: '/images/murmansk-overcast.jpg',
    nightCloudyFromDay: true,
  },
  teriberka: {
    neutral: '/images/teriberka-generated-v1.jpg',
    dayClear: '/images/teriberka-user-day.jpg',
    dayCloudy: '/images/teriberka-overcast.jpg',
    nightClear: '/images/teriberka-night.jpg',
    nightAurora: '/images/teriberka-user-aurora.jpg',
    nightBreaksAurora: '/images/teriberka-patchy.jpg',
    nightCloudy: '/images/user_photos/teriberka/teriberka_1.jpg',
    nightSnow: '/images/user_photos/teriberka/teriberka_6.jpg',
  },
  kirovsk: {
    neutral: '/images/user_photos/kirovsk/kirovsk_6.jpg',
    dayClear: '/images/user_photos/kirovsk/kirovsk_3.jpg',
    dayCloudy: '/images/kirovsk-day.jpg',
    nightClear: '/images/kirovsk-patchy.jpg',
    nightAurora: '/images/kirovsk-aurora.jpg',
    nightBreaksAurora: '/images/user_photos/kirovsk/kirovsk_8.jpg',
    nightCloudy: '/images/user_photos/kirovsk/kirovsk_6.jpg',
    nightSnow: '/images/kirovsk-overcast.jpg',
  },
};

export function selectVisualScene(input: {
  city: CityId;
  phase: SkyPhase;
  cloudCover: number | null;
  precipitation: PrecipitationKind;
  signal: Signal;
  auroraModel: number | null;
}): { src: string; weather: SceneWeather; overlay: Overlay; nightTone: boolean } {
  const frames = CITY_SCENES[input.city];
  if (input.phase === 'unknown' || input.cloudCover === null || input.precipitation === 'unknown') {
    return { src: frames.neutral, weather: 'unknown', overlay: 'none', nightTone: false };
  }

  const weather: SceneWeather = input.precipitation === 'rain' || input.precipitation === 'snow'
    ? input.precipitation
    : input.cloudCover >= 80 ? 'clouds' : input.cloudCover >= 30 ? 'breaks' : 'clear';

  if (input.phase !== 'night') {
    if (weather === 'clear') return { src: frames.dayClear, weather, overlay: 'none', nightTone: false };
    if (weather === 'breaks') return { src: frames.dayClear, weather, overlay: 'breaks', nightTone: false };
    return { src: frames.dayCloudy, weather, overlay: weather === 'rain' || weather === 'snow' ? weather : 'none', nightTone: false };
  }

  if (weather === 'snow') return { src: frames.nightSnow, weather, overlay: 'none', nightTone: false };
  if (weather === 'rain' || weather === 'clouds') {
    return { src: frames.nightCloudy, weather, overlay: weather === 'rain' ? 'rain' : 'none', nightTone: !!frames.nightCloudyFromDay };
  }
  if (weather === 'breaks') {
    if (frames.nightBreaksAurora && input.auroraModel !== null && input.auroraModel >= 20) {
      return { src: frames.nightBreaksAurora, weather, overlay: 'none', nightTone: false };
    }
    return { src: frames.nightClear, weather, overlay: 'breaks', nightTone: false };
  }
  return { src: input.signal === 'green' ? frames.nightAurora : frames.nightClear, weather, overlay: 'none', nightTone: false };
}
