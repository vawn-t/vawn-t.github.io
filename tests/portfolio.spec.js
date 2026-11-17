const { test: base, expect } = require('@playwright/test');

const chapters = ['intro', 'about', 'skills', 'contact'];
const chapterLink = (page, id) => page.locator(`.chapter-nav a[href="#${id}"]`);

// These tests must never read/write the production guestbook. Guard every context,
// including wedding smoke tests; service workers are disabled in the config.
const test = base.extend({
  safetyAndErrors: [async ({ context, page, baseURL }, use) => {
    await context.route(/https?:\/\/[^/]*(?:firestore|firebaseio)[^/]*\//i,
      route => route.abort('blockedbyclient'));
    const errors = [];
    const missing = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('response', response => {
      if (response.url().startsWith(baseURL) && response.status() >= 400) {
        missing.push(`${response.status()} ${response.url()}`);
      }
    });
    await use();
    expect(errors, 'Uncaught page JavaScript errors').toEqual([]);
    expect(missing, 'Failed local assets/documents').toEqual([]);
  }, { auto: true }],
});

async function openPortfolio(page, hash = '') {
  const response = await page.goto(`/${hash}`, { waitUntil: 'load' });
  expect(response.status()).toBe(200);
  await expect(page.locator('.chapter')).toHaveCount(4);
  await page.evaluate(() => document.fonts.ready);
}

async function activeChapter(page, id) {
  await expect(chapterLink(page, id)).toHaveAttribute('aria-current', 'location');
  await expect(page.locator('.chapter-nav [aria-current="location"]')).toHaveCount(1);
  await expect(page.locator(`#${id}`)).toBeInViewport({ ratio: 0.25 });
  // aria-current changes at animation start; wait for geometry before issuing
  // the next independent gesture so smooth scrolling cannot race the test.
  await expect.poll(() => page.locator(`#${id}`).evaluate(el => {
    const main = document.querySelector('.chapters');
    if (matchMedia('(min-width: 768px)').matches) {
      return Math.abs(el.getBoundingClientRect().left - main.getBoundingClientRect().left);
    }
    const header = document.querySelector('.site-header');
    const offset = Math.max(header.offsetHeight, parseFloat(getComputedStyle(el).scrollMarginTop) || 0);
    const target = Math.min(document.documentElement.scrollHeight - innerHeight,
      Math.max(0, el.getBoundingClientRect().top + scrollY - offset));
    return Math.abs(scrollY - target);
  }), { message: `${id} scroll reaches its destination` }).toBeLessThanOrEqual(2);
}

async function navigate(page, id) {
  await chapterLink(page, id).click();
  await activeChapter(page, id);
  await expect(page).toHaveURL(new RegExp(`#${id}$`));
}

async function noHorizontalOverflow(page) {
  await expect.poll(() => page.evaluate(() =>
    document.documentElement.scrollWidth - document.documentElement.clientWidth
  ), { message: 'No document horizontal overflow' }).toBeLessThanOrEqual(1);
  for (const id of chapters) {
    const chapter = page.locator(`#${id}`);
    expect(await chapter.evaluate(el => el.scrollWidth - el.clientWidth),
      `${id} content must fit its chapter width`).toBeLessThanOrEqual(1);
  }
}

async function wheelOverChapters(page, deltaX, deltaY) {
  const box = await page.locator('.chapters').boundingBox();
  await page.mouse.move(box.x + box.width / 2, Math.min(box.y + box.height / 2, 500));
  await page.mouse.wheel(deltaX, deltaY);
}

test('desktop: all four chapter links, explore link and persistent header', async ({ page }) => {
  await openPortfolio(page);
  await activeChapter(page, 'intro');
  await page.locator('.explore-link').click();
  await activeChapter(page, 'about');
  for (const id of chapters) {
    await navigate(page, id);
    await expect(page.locator('.site-header')).toBeInViewport({ ratio: 1 });
    await expect(page.locator(`#${id} :is(h1,h2)`)).toBeInViewport();
  }
  await page.locator('.wordmark').click();
  await activeChapter(page, 'intro');
  await page.locator('.header-contact').click();
  await activeChapter(page, 'contact');
});

test('desktop: native trackpad deltaX and wheel deltaY, including boundaries', async ({ page }) => {
  await openPortfolio(page);
  // Real browser wheel input, not a synthetic dispatchEvent.
  await wheelOverChapters(page, 1440, 0);
  await activeChapter(page, 'about');
  await wheelOverChapters(page, -1440, 0);
  await activeChapter(page, 'intro');
  await wheelOverChapters(page, 0, 900);
  await activeChapter(page, 'about');
  await navigate(page, 'contact');
  await wheelOverChapters(page, 0, 900);
  await activeChapter(page, 'contact');
  await navigate(page, 'intro');
  await wheelOverChapters(page, 0, -900);
  await activeChapter(page, 'intro');
});

for (const [width, delta] of [[984, 40], [1440, 120], [1920, 40]]) {
  test(`wheel regression: small notches reach all chapters and return at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await openPortfolio(page);
    // No navigation clicks or large wheel deltas: reproduce normal mouse notches
    // after every chapter settles, especially About -> Skills -> Contact.
    for (const id of ['about', 'skills', 'contact']) {
      await wheelOverChapters(page, 0, delta);
      await activeChapter(page, id);
      await expect(page.locator('.chapters')).not.toHaveClass(/is-scrolling/);
    }
    await wheelOverChapters(page, 0, delta);
    await activeChapter(page, 'contact');
    for (const id of ['skills', 'about', 'intro']) {
      await wheelOverChapters(page, 0, -delta);
      await activeChapter(page, id);
      await expect(page.locator('.chapters')).not.toHaveClass(/is-scrolling/);
    }
    await wheelOverChapters(page, 0, -delta);
    await activeChapter(page, 'intro');
  });
}

test('wheel motion: one continuous ease-out with no idle pause or second acceleration', async ({ page }, testInfo) => {
  await openPortfolio(page);
  const samples = await page.locator('.chapters').evaluate(async main => {
    const samples = [{ t: 0, x: main.scrollLeft }];
    const started = performance.now();
    main.dispatchEvent(new WheelEvent('wheel', { deltaY: 80, bubbles: true, cancelable: true }));
    await new Promise(resolve => {
      function sample(now) {
        samples.push({ t: now - started, x: main.scrollLeft });
        if (now - started < 1000 && (main.classList.contains('is-scrolling') || samples.length < 5)) {
          requestAnimationFrame(sample);
        } else resolve();
      }
      requestAnimationFrame(sample);
    });
    return samples;
  });
  await testInfo.attach('scroll-frame-samples', {
    body: JSON.stringify(samples, null, 2), contentType: 'application/json',
  });
  // The old two-phase handler only moved 80px, paused, then accelerated at 160ms.
  // A single ease-out is already well into the next chapter by 100ms.
  const early = samples.find(sample => sample.t >= 100);
  expect(early.x).toBeGreaterThan(1440 * 0.3);
  const speeds = samples.slice(1).map((sample, i) => ({
    t: sample.t, x: sample.x,
    speed: (sample.x - samples[i].x) / Math.max(1, sample.t - samples[i].t),
  }));
  const moving = speeds.filter(sample => sample.x > 1440 * 0.05 && sample.x < 1440 * 0.9);
  expect(moving.length).toBeGreaterThan(3);
  expect(moving.every(sample => sample.speed > 0), 'No mid-transition stall or reversal').toBe(true);
  const average = values => values.reduce((sum, value) => sum + value.speed, 0) / values.length;
  const first = speeds.filter(sample => sample.t >= 60 && sample.t < 150);
  const second = speeds.filter(sample => sample.t >= 180 && sample.t < 280);
  expect(first.length).toBeGreaterThan(0);
  expect(second.length).toBeGreaterThan(0);
  expect(average(second), 'Motion decelerates instead of starting a second acceleration').toBeLessThan(average(first));
  expect(samples.at(-1).t, 'Animation has a bounded duration').toBeLessThan(700);
  await activeChapter(page, 'about');
  await expect(page.locator('.chapters')).not.toHaveClass(/is-scrolling/);
});

test('wheel: every delta in a sustained gesture contributes to the destination', async ({ page }) => {
  await openPortfolio(page);
  await page.locator('.chapters').evaluate(async main => {
    for (let i = 0; i < 24; i++) {
      main.dispatchEvent(new WheelEvent('wheel', { deltaY: 120, bubbles: true, cancelable: true }));
      await new Promise(requestAnimationFrame);
    }
  });
  await activeChapter(page, 'skills');
  await expect(page).toHaveURL(/#skills$/);
  await expect(page.locator('.chapters')).not.toHaveClass(/is-scrolling/);
});

test('wheel: reversing direction during the same gesture cancels forward momentum', async ({ page }) => {
  await openPortfolio(page);
  const intermediate = await page.locator('.chapters').evaluate(async main => {
    main.dispatchEvent(new WheelEvent('wheel', { deltaY: 1500, bubbles: true, cancelable: true }));
    for (let i = 0; i < 3; i++) await new Promise(requestAnimationFrame);
    const left = main.scrollLeft;
    main.dispatchEvent(new WheelEvent('wheel', { deltaY: -1500, bubbles: true, cancelable: true }));
    return left;
  });
  expect(intermediate).toBeGreaterThan(0);
  expect(intermediate).toBeLessThan(1440);
  await activeChapter(page, 'intro');
  await expect(page.locator('.chapters')).not.toHaveClass(/is-scrolling/);
});

test('wheel: navigation overrides an ongoing wheel transition', async ({ page }) => {
  await openPortfolio(page);
  await wheelOverChapters(page, 0, 900);
  await navigate(page, 'contact');
  await expect(page.locator('.chapters')).not.toHaveClass(/is-scrolling/);
  // Cancelled motion must not send us back after navigation settles.
  await page.waitForTimeout(250);
  await activeChapter(page, 'contact');
});

test('wheel: continued input does not restart the same transition or skip a chapter', async ({ page }) => {
  await openPortfolio(page);
  await page.locator('.chapters').evaluate(async main => {
    main.dispatchEvent(new WheelEvent('wheel', { deltaY: 120, bubbles: true, cancelable: true }));
    // The single transition is in progress, but About has not yet arrived.
    await new Promise(resolve => setTimeout(resolve, 200));
    main.dispatchEvent(new WheelEvent('wheel', { deltaY: 120, bubbles: true, cancelable: true }));
  });
  await activeChapter(page, 'about');
  await expect(page.locator('.chapters')).not.toHaveClass(/is-scrolling/);
});

test('wheel: line and page delta modes use consistent distances', async ({ page }) => {
  await openPortfolio(page);
  await page.locator('.chapters').evaluate(main => {
    main.dispatchEvent(new WheelEvent('wheel', { deltaY: 3, deltaMode: 1, bubbles: true, cancelable: true }));
  });
  await activeChapter(page, 'about');
  await page.locator('.chapters').evaluate(main => {
    main.dispatchEvent(new WheelEvent('wheel', { deltaY: 1, deltaMode: 2, bubbles: true, cancelable: true }));
  });
  await activeChapter(page, 'skills');
});

test('short desktop: wheel scrolls vertically before changing chapters', async ({ page }) => {
  await page.setViewportSize({ width: 800, height: 600 });
  await openPortfolio(page);
  await wheelOverChapters(page, 0, 100);
  await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(50);
  await expect(chapterLink(page, 'intro')).toHaveAttribute('aria-current', 'location');
  await wheelOverChapters(page, 0, 900);
  await expect.poll(() => page.evaluate(() =>
    document.documentElement.scrollHeight - innerHeight - scrollY
  )).toBeLessThanOrEqual(2);
  await expect(chapterLink(page, 'intro')).toHaveAttribute('aria-current', 'location');
  await wheelOverChapters(page, 0, 900);
  await activeChapter(page, 'about');
});

test('desktop: ArrowLeft/ArrowRight/Home/End keyboard navigation', async ({ page }) => {
  await openPortfolio(page);
  await page.locator('#main-content').focus();
  for (const [key, id] of [
    ['ArrowRight', 'about'], ['ArrowRight', 'skills'], ['ArrowLeft', 'about'],
    ['End', 'contact'], ['Home', 'intro'], ['ArrowLeft', 'intro'],
  ]) {
    await page.keyboard.press(key);
    await activeChapter(page, id);
  }
});

test('keyboard: skip link and Tab reveal reachable offscreen links', async ({ page }) => {
  await openPortfolio(page);
  await page.keyboard.press('Tab');
  await expect(page.locator('.skip-link')).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('#main-content')).toBeFocused();
  // Traverse a bounded number of real tab stops. No focused interactive element
  // may remain hidden in an offscreen desktop chapter.
  let reachedSocials = false;
  for (let i = 0; i < 16; i++) {
    await page.keyboard.press('Tab');
    const focused = page.locator(':focus');
    await expect(focused).toBeInViewport();
    expect(await focused.evaluate(el => el.classList.contains('wedding-link'))).toBe(false);
    if (await focused.evaluate(el => el.href === 'https://www.instagram.com/vawnnn/')) {
      reachedSocials = true;
      break;
    }
  }
  expect(reachedSocials, 'Contact social links reachable using Tab').toBe(true);
});

for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
  test(`hash entry and browser back/forward at ${viewport.width}px`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await openPortfolio(page, '#skills');
    await activeChapter(page, 'skills');
    await navigate(page, 'about');
    await navigate(page, 'contact');
    await page.goBack();
    await expect(page).toHaveURL(/#about$/);
    await activeChapter(page, 'about');
    await page.goBack();
    await activeChapter(page, 'skills');
    await page.goForward();
    await activeChapter(page, 'about');
  });
}

test('mobile: chapter links and native vertical scrolling synchronize active state', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openPortfolio(page);
  for (const id of chapters) await navigate(page, id);
  await navigate(page, 'intro');
  for (const id of chapters.slice(1)) {
    // Native scrolling, not the navigation API or an anchor click.
    await page.locator(`#${id}`).evaluate(el => {
      const header = document.querySelector('.site-header').getBoundingClientRect();
      window.scrollTo({ top: window.scrollY + el.getBoundingClientRect().top - header.bottom, behavior: 'instant' });
    });
    await activeChapter(page, id);
  }
  await navigate(page, 'intro');
  const before = await page.evaluate(() => window.scrollY);
  await wheelOverChapters(page, 0, 300);
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(before + 50);
});

test('live desktop/mobile breakpoint resizing preserves navigation', async ({ page }) => {
  await openPortfolio(page, '#skills');
  await activeChapter(page, 'skills');
  for (const width of [767, 768, 390, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await activeChapter(page, 'skills');
    await noHorizontalOverflow(page);
    await navigate(page, 'contact');
    await navigate(page, 'skills');
  }
  await wheelOverChapters(page, 0, -900);
  await activeChapter(page, 'about');
});

for (const [width, height] of [[320, 900], [390, 900], [767, 900], [768, 900],
  [984, 900], [1100, 900], [1440, 900], [800, 600]]) {
  test(`layout ${width}x${height}: no overflow and all chapter links accessible`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await openPortfolio(page);
    await noHorizontalOverflow(page);
    for (const id of chapters) {
      const link = chapterLink(page, id);
      await expect(link).toHaveAccessibleName(new RegExp(id, 'i'));
      const target = await link.boundingBox();
      expect(target.width, 'Chapter link minimum target width').toBeGreaterThanOrEqual(44);
      expect(target.height, 'Chapter link minimum target height').toBeGreaterThanOrEqual(44);
      await navigate(page, id);
      await expect(link).toBeInViewport();
      await noHorizontalOverflow(page);
    }
    if (width === 800 && height === 600) {
      // The short layout must retain access to the bottom CTA by native scrolling.
      const social = page.getByRole('link', { name: /Instagram/ });
      await social.scrollIntoViewIfNeeded();
      await expect(social).toBeInViewport();
    }
  });
}

test('reduced motion: content and navigation remain available', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await openPortfolio(page);
  for (const id of chapters) {
    await navigate(page, id);
    await expect(page.locator(`#${id} :is(h1,h2)`)).toBeVisible();
  }
  const behavior = await page.locator('.chapters').evaluate(el => getComputedStyle(el).scrollBehavior);
  expect(behavior, 'Reduced motion disables CSS smooth scrolling').not.toBe('smooth');
});

test('contact: original mail, social and wedding destinations', async ({ page }) => {
  await openPortfolio(page, '#contact');
  await activeChapter(page, 'contact');
  await expect(page.locator('.email-link')).toHaveAttribute('href', 'mailto:vantc.99@gmail.com');
  for (const [name, href] of [
    ['GitHub', 'https://github.com/vawn-t'],
    ['LinkedIn', 'https://www.linkedin.com/in/vawn/'],
    ['Instagram', 'https://www.instagram.com/vawnnn/'],
  ]) {
    const link = page.getByRole('link', { name: new RegExp(name) });
    await expect(link).toBeVisible();
    await expect(link).toHaveAttribute('href', href);
    await expect(link).toHaveAttribute('rel', /noopener/);
  }
  await expect(page.locator('.wedding-link')).toHaveAttribute('href', './our-wedding/');
  await expect(page.locator('.wedding-link')).toBeHidden();
});

test.describe('progressive enhancement (JavaScript disabled)', () => {
  test.use({ javaScriptEnabled: false });
  for (const width of [1440, 390]) {
    test(`all content and native anchors work at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await openPortfolio(page);
      for (const id of chapters) {
        await chapterLink(page, id).click();
        await expect(page).toHaveURL(new RegExp(`#${id}$`));
        await expect(page.locator(`#${id} :is(h1,h2)`)).toBeInViewport();
        await expect(page.locator(`#${id}`)).toBeVisible();
      }
      await expect(page.locator('.email-link')).toBeInViewport();
      await noHorizontalOverflow(page);
    });
  }

  test('wedding direct route and all referenced local assets return 200 (no Firebase)', async ({ page, request, baseURL }) => {
    // Keep this local-route smoke deterministic/offline: third-party image/font
    // CDNs are not under test, and audio is verified via HTTP below, not autoplay.
    await page.route('**/*', route => {
      const req = route.request();
      if (!req.url().startsWith(baseURL) || req.resourceType() === 'media') {
        return route.abort('blockedbyclient');
      }
      return route.fallback();
    });
    const response = await page.goto('/our-wedding/', { waitUntil: 'domcontentloaded' });
    expect(response.status()).toBe(200);
    await expect(page).toHaveTitle(/Our Wedding/);
    const assets = await page.locator('script[src], link[rel="stylesheet"][href], img[src], source[src]')
      .evaluateAll(elements => elements.filter(el => el.getAttribute('src') || el.getAttribute('href'))
        .map(el => el.src || el.href));
    // Remote CDN availability is intentionally outside this static regression test.
    const local = [...new Set(assets.filter(url => url.startsWith(baseURL)))];
    expect(local).toEqual(expect.arrayContaining([
      `${baseURL}/our-wedding/style.css`, `${baseURL}/our-wedding/main.js`, `${baseURL}/our-wedding/Ordinary.mp3`,
    ]));
    for (const url of local) {
      const asset = await request.get(url);
      expect(asset.status(), url).toBe(200);
      expect(Number(asset.headers()['content-length']), `${url} must not be empty`).toBeGreaterThan(0);
      await asset.dispose();
    }
  });
});
