const { chromium } = require('playwright');
const fs = require('fs');
const http = require('http');
const path = require('path');
const assert = require('node:assert/strict');

const root = path.resolve(__dirname, '..');
const server = http.createServer((request, response) => {
  const name = new URL(request.url, 'http://localhost').pathname;
  const file = path.resolve(root, '.' + (name === '/' ? '/index.html' : name));
  if (!file.startsWith(root + path.sep)) {
    response.statusCode = 403;
    return response.end();
  }
  const type = file.endsWith('.js') ? 'application/javascript'
    : file.endsWith('.css') ? 'text/css' : 'text/html';
  response.setHeader('Content-Type', type);
  fs.readFile(file, (error, content) => {
    response.statusCode = error ? 404 : 200;
    response.end(error ? 'Not found' : content);
  });
});

async function main() {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium',
    headless: true,
    args: ['--no-sandbox']
  });
  const errors = [];
  try {
    const page = await browser.newPage({ viewport: { width: 844, height: 390 }, hasTouch: true });
    page.on('pageerror', error => errors.push(error.message));
    await page.goto('http://127.0.0.1:' + server.address().port);
    await page.click('#begin');
    assert.equal(await page.locator('#allies').textContent(), '24');
    assert.equal(await page.locator('#enemies').textContent(), '12');

    await page.click('#pause');
    const time = await page.evaluate(() => battlePrototype.game.time);
    await page.waitForTimeout(100);
    assert.equal(await page.evaluate(() => battlePrototype.game.time), time);
    await page.click('[data-squad="archers"]');
    await page.click('[data-order="attack"]');
    assert.equal(await page.evaluate(() => battlePrototype.game.squads.find(s => s.id === 'archers').order), 'attack');
    await page.click('#pause');
    await page.click('#all');
    await page.click('[data-order="attack"]');

    const outcome = await page.evaluate(() => {
      const game = battlePrototype.game;
      for (let tick = 0; tick < 18000 && !game.ended; tick++) game.step(1 / 60);
      return { ended: game.ended, won: game.won, capture: game.capture };
    });
    assert.deepEqual(outcome, { ended: true, won: true, capture: 8 });
    assert.equal(await page.locator('#result').isVisible(), true);
    await page.click('#again');
    assert.equal(await page.evaluate(() => battlePrototype.game.units.length), 36);
    await page.evaluate(() => {
      const game = battlePrototype.game;
      game.hurt(game.hero, 9999);
      game.step(1 / 60);
    });
    assert.match(await page.locator('#result-title').textContent(), /Live/);

    for (const kind of ['champion', 'captain', 'ranger', 'warden']) {
      await page.click('#change-hero');
      await page.click('[data-hero="' + kind + '"]');
      await page.click('#begin');
      assert.equal(await page.evaluate(() => battlePrototype.game.ability(0)), true);
      assert.equal(await page.evaluate(() => battlePrototype.game.ability(0)), false);
      assert.equal(await page.evaluate(() => battlePrototype.game.ability(1)), true);
      await page.evaluate(() => battlePrototype.game.finish(false));
    }
    const bounds = await page.locator('.bottom').boundingBox();
    assert.ok(bounds.x >= 0 && bounds.x + bounds.width <= 844 && bounds.y + bounds.height <= 390);
    assert.deepEqual(errors, []);
    console.log('Passed: battle completion, capture, retreat, restart, pause, squad orders, all hero abilities, cooldowns and phone layout.');
  } finally {
    await browser.close();
    await new Promise(resolve => server.close(resolve));
  }
}
main().catch(error => {
  console.error(error);
  process.exitCode = 1;
  server.close();
});
