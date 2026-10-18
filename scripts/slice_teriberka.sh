#!/bin/bash
# Автоматическая нарезка коллажа Териберки (2x2) на 4 состояния с помощью sips
set -e

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
IMG_DIR="$DIR/public/images"

# Поиск исходного коллажа
INPUT=""
for cand in "$IMG_DIR/teriberka-states.jpg" "$IMG_DIR/teriberka-states.jpeg" "$IMG_DIR/teriberka-states.png" "$DIR/teriberka-states.jpg" "$DIR/teriberka-states.jpeg" "$DIR/teriberka-states.png"; do
  if [ -f "$cand" ]; then
    INPUT="$cand"
    break
  fi
done

# Если точного имени нет, ищем любой свежий файл коллажа в public/images или корне
if [ -z "$INPUT" ]; then
  INPUT=$(find "$IMG_DIR" "$DIR" -maxdepth 1 -type f \( -name "*Gemini*w0pbmi*" -o -name "*collage*" -o -name "*states*" \) 2>/dev/null | head -n 1 || true)
fi

if [ -z "$INPUT" ] || [ ! -f "$INPUT" ]; then
  echo "Файл коллажа не найден. Пожалуйста, положите файл коллажа в папку public/images/ под именем teriberka-states.jpg"
  exit 1
fi

echo "Обработка коллажа: $INPUT"

# Получение размеров
W=$(sips -g pixelWidth "$INPUT" | awk '/pixelWidth/ {print $2}')
H=$(sips -g pixelHeight "$INPUT" | awk '/pixelHeight/ {print $2}')

HALF_W=$((W / 2))
HALF_H=$((H / 2))

echo "Исходный размер: ${W}x${H}, размер одного кадра: ${HALF_W}x${HALF_H}"

# 1. Верхний левый квадрант: Ясный день
# sips --cropOffset: расстояние от верхнего левого угла (H W)
cp "$INPUT" "$IMG_DIR/teriberka-day.jpg"
sips --cropToHeightWidth $HALF_H $HALF_W --cropOffset 0 0 "$IMG_DIR/teriberka-day.jpg" >/dev/null

# 2. Верхний правый квадрант: Тёмная ночь
cp "$INPUT" "$IMG_DIR/teriberka-night.jpg"
sips --cropToHeightWidth $HALF_H $HALF_W --cropOffset 0 $HALF_W "$IMG_DIR/teriberka-night.jpg" >/dev/null

# 3. Нижний левый квадрант: Ночь с сиянием (Зеленый сигнал)
cp "$INPUT" "$IMG_DIR/teriberka-aurora.jpg"
sips --cropToHeightWidth $HALF_H $HALF_W --cropOffset $HALF_H 0 "$IMG_DIR/teriberka-aurora.jpg" >/dev/null

# 4. Нижний правый квадрант: Сияние сквозь облака (Желтый сигнал)
cp "$INPUT" "$IMG_DIR/teriberka-patchy.jpg"
sips --cropToHeightWidth $HALF_H $HALF_W --cropOffset $HALF_H $HALF_W "$IMG_DIR/teriberka-patchy.jpg" >/dev/null

echo "Успешно нарезано:"
echo " - $IMG_DIR/teriberka-day.jpg"
echo " - $IMG_DIR/teriberka-night.jpg"
echo " - $IMG_DIR/teriberka-aurora.jpg"
echo " - $IMG_DIR/teriberka-patchy.jpg"
