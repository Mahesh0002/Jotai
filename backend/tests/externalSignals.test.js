const test = require('node:test');
const assert = require('node:assert');
const express = require('express');
const request = require('supertest');

const newsService = require('../src/services/newsService');
const stockService = require('../src/services/stockService');
const weatherService = require('../src/services/weatherService');
const newsRoutes = require('../src/routes/newsRoutes');
const stockRoutes = require('../src/routes/stockRoutes');
const weatherRoutes = require('../src/routes/weatherRoutes');
const errorHandler = require('../src/middlewares/errorHandler');

function buildApp() {
  const app = express();
  app.use('/news', newsRoutes);
  app.use('/stocks', stockRoutes);
  app.use('/weather', weatherRoutes);
  app.use(errorHandler);
  return app;
}

test('news bridge normalizes the upstream articles payload', async () => {
  const original = newsService.getNews;
  newsService.getNews = async () => ({
    status: 'ok',
    articles: [
      {
        title: 'Headline',
        description: 'Summary',
        source: { name: 'TechCrunch' },
        url: 'https://example.com/story',
        publishedAt: '2026-11-25T10:00:00Z',
      },
    ],
  });

  try {
    const response = await request(buildApp()).get('/news');
    assert.strictEqual(response.status, 200);
    assert.strictEqual(response.body.success, true);
    assert.strictEqual(response.body.data.length, 1);
    assert.strictEqual(response.body.data[0].title, 'Headline');
    assert.strictEqual(response.body.data[0].source, 'TechCrunch');
  } finally {
    newsService.getNews = original;
  }
});

test('stock bridge derives price and change from the latest two values', async () => {
  const original = stockService.getStock;
  stockService.getStock = async () => ({
    status: 'ok',
    meta: { symbol: 'BTC/USD' },
    values: [
      { datetime: '2026-11-25', close: '100' },
      { datetime: '2026-11-24', close: '90' },
    ],
  });

  try {
    const response = await request(buildApp()).get('/stocks?symbol=BTC/USD');
    assert.strictEqual(response.status, 200);
    assert.strictEqual(response.body.data.price, 100);
    assert.strictEqual(response.body.data.change, 10);
    assert.ok(Math.abs(response.body.data.percent_change - 11.11) < 0.01);
  } finally {
    stockService.getStock = original;
  }
});

test('weather bridge normalizes current conditions', async () => {
  const original = weatherService.getWeather;
  weatherService.getWeather = async () => ({
    location: { name: 'Hyderabad', region: 'Telangana', country: 'India' },
    current: {
      temp_c: 28,
      feelslike_c: 30,
      humidity: 60,
      wind_kph: 12,
      condition: { text: 'Sunny' },
      last_updated: '2026-11-25 10:00',
    },
  });

  try {
    const response = await request(buildApp()).get('/weather?city=Hyderabad');
    assert.strictEqual(response.status, 200);
    assert.strictEqual(response.body.data.location.name, 'Hyderabad');
    assert.strictEqual(response.body.data.current.temp_c, 28);
    assert.strictEqual(response.body.data.current.condition.text, 'Sunny');
  } finally {
    weatherService.getWeather = original;
  }
});
