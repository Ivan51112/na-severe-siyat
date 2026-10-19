#!/usr/bin/env node

/**
 * Daily 10:00 AM Telegram Analytics Report
 * «✨ На Севере — сиять»
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8673734795:AAEGelbzYwot7qVgvvZ1ynAKezrhNdOmdLU';
const DATA_DIR = path.join(process.cwd(), '.data');
const DATA_FILE = path.join(DATA_DIR, 'analytics.jsonl');
const CHAT_ID_FILE = path.join(DATA_DIR, 'telegram_chat_id.txt');

function sendTelegramMessage(chatId, text) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({
      chat_id: chatId,
      text: text,
      parse_mode: 'HTML',
      disable_web_page_preview: true,
    });

    const req = https.request(
      `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload),
        },
      },
      (res) => {
        let body = '';
        res.on('data', (chunk) => (body += chunk));
        res.on('end', () => {
          try {
            const data = JSON.parse(body);
            if (data.ok) resolve(data.result);
            else reject(new Error(data.description || 'Telegram API Error'));
          } catch (e) {
            reject(e);
          }
        });
      }
    );

    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

function getLatestChatId() {
  return new Promise((resolve) => {
    // 1. Check saved file first
    if (fs.existsSync(CHAT_ID_FILE)) {
      const saved = fs.readFileSync(CHAT_ID_FILE, 'utf-8').trim();
      if (saved) return resolve(saved);
    }

    // 2. Query Telegram getUpdates
    https
      .get(`https://api.telegram.org/bot${BOT_TOKEN}/getUpdates`, (res) => {
        let body = '';
        res.on('data', (c) => (body += c));
        res.on('end', () => {
          try {
            const data = JSON.parse(body);
            if (data.ok && data.result.length > 0) {
              const lastMsg = data.result[data.result.length - 1];
              const chatId = lastMsg.message?.chat?.id || lastMsg.callback_query?.message?.chat?.id;
              if (chatId) {
                if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
                fs.writeFileSync(CHAT_ID_FILE, chatId.toString(), 'utf-8');
                return resolve(chatId.toString());
              }
            }
          } catch {}
          resolve(null);
        });
      })
      .on('error', () => resolve(null));
  });
}

async function generateReport() {
  const chatId = await getLatestChatId();
  if (!chatId) {
    console.error('No Telegram chat ID found. Please send a message to @severe_siyat_stats_bot first!');
    return;
  }

  // Read all events
  let events = [];
  if (fs.existsSync(DATA_FILE)) {
    const lines = fs.readFileSync(DATA_FILE, 'utf-8').trim().split('\n').filter(Boolean);
    events = lines.map((l) => {
      try {
        return JSON.parse(l);
      } catch {
        return null;
      }
    }).filter(Boolean);
  }

  // Filter last 24 hours (or at least recent 100 if fresh)
  const now = Date.now();
  const dayAgo = now - 24 * 60 * 60 * 1000;
  let dayEvents = events.filter((e) => new Date(e.timestamp).getTime() >= dayAgo);
  if (dayEvents.length === 0) {
    dayEvents = events; // fallback for initial day
  }

  // Metrics
  const pageViews = dayEvents.filter((e) => e.eventType === 'page_view').length;
  const gameStarts = dayEvents.filter((e) => e.eventType === 'game_start').length;
  const questCompletes = dayEvents.filter((e) => e.eventType === 'quest_complete').length;
  const tgClicks = dayEvents.filter((e) => e.eventType === 'telegram_click');
  const tgTotal = tgClicks.length;

  const convRate = pageViews > 0 ? ((tgTotal / pageViews) * 100).toFixed(1) : '0.0';
  const gameRate = pageViews > 0 ? ((gameStarts / pageViews) * 100).toFixed(0) : '0';
  const finishRate = gameStarts > 0 ? ((questCompletes / gameStarts) * 100).toFixed(0) : '0';

  // Cities count
  const cityHits = { murmansk: 0, teriberka: 0, kirovsk: 0 };
  dayEvents.forEach((e) => {
    if (e.city && cityHits[e.city] !== undefined) {
      cityHits[e.city]++;
    }
  });
  const totalCityHits = cityHits.murmansk + cityHits.teriberka + cityHits.kirovsk || 1;
  const mPct = Math.round((cityHits.murmansk / totalCityHits) * 100);
  const tPct = Math.round((cityHits.teriberka / totalCityHits) * 100);
  const kPct = Math.round((cityHits.kirovsk / totalCityHits) * 100);

  // Buttons breakdown
  let finalBtnClicks = 0;
  let headerBtnClicks = 0;
  let weatherBtnClicks = 0;
  tgClicks.forEach((e) => {
    if (e.signal === 'quest_final_btn') finalBtnClicks++;
    else if (e.signal === 'header_round_btn') headerBtnClicks++;
    else if (e.signal === 'weather_block_btn') weatherBtnClicks++;
  });

  const dateStr = new Intl.DateTimeFormat('ru-RU', {
    timeZone: 'Europe/Moscow',
    day: 'numeric',
    month: 'long',
  }).format(new Date());

  const message = `🌌 <b>«На Севере — сиять» · Сводка за 24ч</b>
📅 <i>${dateStr} (10:00 МСК)</i>

👥 <b>Посетителей (просмотров):</b> <b>${pageViews}</b>
🎮 <b>Начали квест:</b> <b>${gameStarts}</b> (${gameRate}%)
🏆 <b>Прошли все 3 города:</b> <b>${questCompletes}</b> (${finishRate}%)
🚀 <b>Переходов в Telegram:</b> <b>${tgTotal}</b>
📈 <b>Итоговая конверсия:</b> <b>${convRate}%</b>

📍 <b>Интерес к локациям:</b>
• 🐋 Териберка: <b>${tPct}%</b>
• ⚓ Мурманск: <b>${mPct}%</b>
• ⛷️ Кировск (Хибины): <b>${kPct}%</b>

🔘 <b>Откуда кликали в канал:</b>
• 🏆 Финал после Кировска: <b>${finalBtnClicks}</b>
• ⚡ Шапка (круглая кнопка): <b>${headerBtnClicks}</b>
• ☁️ Блок прогноза погоды: <b>${weatherBtnClicks}</b>

✨ <i>Сайт работает в штатном режиме: na-severe-siyat.ru</i>`;

  try {
    await sendTelegramMessage(chatId, message);
    console.log('✅ Daily report sent successfully to Telegram!');
  } catch (err) {
    console.error('Failed to send Telegram message:', err.message);
  }
}

if (require.main === module) {
  generateReport().catch(console.error);
}

module.exports = { generateReport, sendTelegramMessage, getLatestChatId };
