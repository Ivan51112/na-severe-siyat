// Automated Test Suite for Aurora Polaris Conditions & Signal Classification
// Verifies all required scenarios from ТЗ:
// 1. Clear night
// 2. Daylight
// 3. Twilight
// 4. Overcast clouds
// 5. Rain
// 6. Snow
// 7. Source failure / missing data
// 8. Stale data timestamp validation

function classifyConditions(cloudCover, auroraModel, sunAltitude, precipitation = 'none') {
  if (cloudCover === null || auroraModel === null) {
    return { signal: 'unknown', reason: 'unavailable' };
  }
  if (sunAltitude >= -1) {
    return { signal: 'red', reason: 'daylight' };
  }
  if (sunAltitude > -12) {
    return { signal: 'red', reason: 'twilight' };
  }
  if (precipitation === 'snow') {
    return { signal: 'red', reason: 'snow' };
  }
  if (precipitation === 'rain') {
    return { signal: 'red', reason: 'rain' };
  }
  if (cloudCover >= 80) {
    return { signal: 'red', reason: 'clouds' };
  }
  if (auroraModel >= 20 && cloudCover <= 25) {
    return { signal: 'green', reason: 'favorable' };
  }
  if (cloudCover >= 26) {
    return { signal: 'yellow', reason: 'patchy' };
  }
  return { signal: 'yellow', reason: 'low_aurora' };
}

function isRecent(timestamp, maxAgeMinutes, futureMinutes = 15) {
  if (!timestamp) return false;
  const moment = Date.parse(timestamp);
  if (!Number.isFinite(moment)) return false;
  const age = Date.now() - moment;
  return age >= -futureMinutes * 60_000 && age <= maxAgeMinutes * 60_000;
}

let passed = 0;
let failed = 0;

function assert(condition, testName) {
  if (condition) {
    console.log(`  [PASS] ${testName}`);
    passed++;
  } else {
    console.error(`  [FAIL] ${testName}`);
    failed++;
  }
}

console.log('=====================================================');
console.log('   AURORA POLARIS 2.0 — ТЕСТЫ РАСЧЁТА СИГНАЛОВ НЕБА');
console.log('=====================================================\n');

// 1. Ясная ночь с благоприятной активностью
console.log('--- 1. Сценарий: Ясная темная ночь с активностью (Зеленый) ---');
const r1 = classifyConditions(15, 30, -18, 'none');
assert(r1.signal === 'green' && r1.reason === 'favorable', 'Зеленый сигнал при безоблачном темном небе и NOAA >= 20');

// 2. Дневной свет
console.log('\n--- 2. Сценарий: Дневной свет (Красный) ---');
const r2 = classifyConditions(0, 80, 5, 'none');
assert(r2.signal === 'red' && r2.reason === 'daylight', 'Красный сигнал: солнце над горизонтом (sunAltitude >= -1)');

// 3. Сумерки
console.log('\n--- 3. Сценарий: Сумерки (Красный) ---');
const r3 = classifyConditions(10, 40, -6, 'none');
assert(r3.signal === 'red' && r3.reason === 'twilight', 'Красный сигнал: навигационные/гражданские сумерки (-12 < sunAltitude < -1)');

// 4. Плотная облачность
console.log('\n--- 4. Сценарий: Плотная облачность (Красный) ---');
const r4 = classifyConditions(85, 45, -20, 'none');
assert(r4.signal === 'red' && r4.reason === 'clouds', 'Красный сигнал: облачность >= 80% закрывает небо');

// 5. Дождь
console.log('\n--- 5. Сценарий: Осадки в виде дождя (Красный) ---');
const r5 = classifyConditions(60, 40, -16, 'rain');
assert(r5.signal === 'red' && r5.reason === 'rain', 'Красный сигнал: дождь мешает наблюдению');

// 6. Снег
console.log('\n--- 6. Сценарий: Осадки в виде снега (Красный) ---');
const r6 = classifyConditions(50, 40, -16, 'snow');
assert(r6.signal === 'red' && r6.reason === 'snow', 'Красный сигнал: снегопад закрывает небо');

// 7. Переменная облачность (просветы)
console.log('\n--- 7. Сценарий: Просветы / Переменная облачность (Желтый) ---');
const r7 = classifyConditions(45, 35, -18, 'none');
assert(r7.signal === 'yellow' && r7.reason === 'patchy', 'Желтый сигнал: переменная облачность 26-79% (есть неопределенность)');

// 8. Ясное темное небо, но слабая активность по модели
console.log('\n--- 8. Сценарий: Слабая активность по модели NOAA (Желтый) ---');
const r8 = classifyConditions(10, 8, -18, 'none');
assert(r8.signal === 'yellow' && r8.reason === 'low_aurora', 'Желтый сигнал: небо чистое, но модель NOAA < 20 (ждем усиления)');

// 9. Отказ погодного источника (cloudCover = null)
console.log('\n--- 9. Сценарий: Отказ погодного источника (Оценка недоступна) ---');
const r9 = classifyConditions(null, 30, -18, 'none');
assert(r9.signal === 'unknown' && r9.reason === 'unavailable', 'Unknown статус: нет свежих данных по погоде');

// 10. Отказ геофизического источника (auroraModel = null)
console.log('\n--- 10. Сценарий: Отказ модели NOAA (Оценка недоступна) ---');
const r10 = classifyConditions(10, null, -18, 'none');
assert(r10.signal === 'unknown' && r10.reason === 'unavailable', 'Unknown статус: нет свежих данных NOAA OVATION');

// 11. Проверка свежести данных по времени
console.log('\n--- 11. Сценарий: Проверка валидации устаревших данных ---');
const freshTime = new Date(Date.now() - 10 * 60 * 1000).toISOString(); // 10 минут назад
const staleTime = new Date(Date.now() - 90 * 60 * 1000).toISOString(); // 90 минут назад
assert(isRecent(freshTime, 60) === true, 'Данные возрастом 10 минут признаются свежими');
assert(isRecent(staleTime, 60) === false, 'Данные возрастом 90 минут отбраковываются как устаревшие');

console.log('\n=====================================================');
console.log(`РЕЗУЛЬТАТ ТЕСТИРОВАНИЯ: Пройдено: ${passed}, Ошибок: ${failed}`);
console.log('=====================================================');

if (failed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
