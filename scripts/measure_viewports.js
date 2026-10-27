const { chromium } = require('/Users/khuonganvu/Projects/ptdtt-testkit/node_modules/playwright');

const viewports = [
  { name: '1440x900', w: 1440, h: 900 },
  { name: '1280x800', w: 1280, h: 800 },
  { name: '1024x768', w: 1024, h: 768 },
  { name: '820x1180', w: 820, h: 1180 },
  { name: '390x844', w: 390, h: 844 },
  { name: '360x800', w: 360, h: 800 },
  { name: '320x568', w: 320, h: 568 }
];

async function measure() {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  // 1. Seed data
  await page.goto('http://localhost:3001');
  await page.evaluate(() => {
    Store.init();
    const data = Store.load() || { ideas: [], stats: { totalIdeas: 0, totalDrafts: 0 } };
    data.ideas = [];
    Store.save(data);
    for (let i = 0; i < 5; i++) {
      Store.addIdea({
        title: 'Ý tưởng mẫu ' + (i + 1) + ' cho kiểm thử viewport',
        content: 'Chi tiết nội dung ý tưởng ' + (i + 1),
        category: i % 2 === 0 ? 'clinical' : 'research',
        priority: i % 2 === 0 ? 'high' : 'medium',
        tags: ['ptdtt', 'surgery']
      });
    }
  });

  const report = {};

  for (const vp of viewports) {
    await page.setViewportSize({ width: vp.w, height: vp.h });

    // Check overflow on #capture, #timeline, #settings
    const overflows = {};
    for (const p of ['#capture', '#timeline', '#settings']) {
      await page.goto('http://localhost:3001/' + p);
      await page.waitForTimeout(50);
      const diff = await page.evaluate(() => {
        return Math.max(0, document.documentElement.scrollWidth - document.documentElement.clientWidth);
      });
      overflows[p] = diff;
    }

    // Touch targets & clickables on #timeline
    await page.goto('http://localhost:3001/#timeline');
    await page.waitForSelector('.idea-card');
    const touch = await page.evaluate((isMobile) => {
      const interactives = Array.from(document.querySelectorAll('button, a, input, select, textarea, [tabindex="0"]'));
      let under24 = 0;
      let under44 = 0;
      let nonFocusable = 0;
      interactives.forEach(el => {
        const r = el.getBoundingClientRect();
        if (r.width > 0 && r.height > 0) {
          if (r.width < 24 || r.height < 24) under24++;
          if (isMobile && (r.width < 40 || r.height < 40)) under44++;
        }
      });
      const clickables = Array.from(document.querySelectorAll('[onclick]'));
      clickables.forEach(el => {
        const tag = el.tagName.toLowerCase();
        if (tag !== 'button' && tag !== 'a' && tag !== 'input' && !el.hasAttribute('tabindex')) {
          nonFocusable++;
        }
      });
      return { under24, under44, nonFocusable };
    }, vp.w <= 768);

    report[vp.name] = {
      overflows,
      touch
    };
  }

  // 390x844 specific mobile metrics
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('http://localhost:3001/#capture');
  await page.waitForSelector('.capture-hero');
  const heroHeight = await page.evaluate(() => {
    return document.querySelector('.capture-hero').getBoundingClientRect().height;
  });
  const recentTop = await page.evaluate(() => {
    return document.querySelector('.recent-ideas-section').getBoundingClientRect().top;
  });

  await page.goto('http://localhost:3001/#timeline');
  await page.waitForSelector('.idea-card');
  const timelineMetrics = await page.evaluate(() => {
    const cards = Array.from(document.querySelectorAll('.idea-card'));
    const heights = cards.map(c => c.getBoundingClientRect().height);
    const avg = heights.reduce((a, b) => a + b, 0) / (heights.length || 1);
    const visible = cards.filter(c => {
      const r = c.getBoundingClientRect();
      return r.top < window.innerHeight && r.bottom > 0;
    }).length;
    return { avgCardHeight: avg, visibleCards: visible, heights };
  });

  const firstIdeaId = await page.evaluate(() => Store.getAllIdeas()[0].id);
  await page.goto('http://localhost:3001/#draft/' + firstIdeaId);
  await page.waitForSelector('.draft-mobile-bottom-actions');
  const draftMetrics = await page.evaluate(() => {
    const act = document.querySelector('.draft-mobile-bottom-actions').getBoundingClientRect();
    const nav = document.querySelector('.bottom-nav').getBoundingClientRect();
    return {
      actTop: act.top,
      actBottom: act.bottom,
      actHeight: act.height,
      navTop: nav.top,
      navBottom: nav.bottom
    };
  });

  console.log('=== VIEWPORT_MEASUREMENT_REPORT ===');
  console.log(JSON.stringify({ report, heroHeight, recentTop, timelineMetrics, draftMetrics }, null, 2));

  await browser.close();
}

measure().catch(err => {
  console.error(err);
  process.exit(1);
});
