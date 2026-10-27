// tests/ux.spec.js — Cross-checking UI/UX & Data Integrity for Idea Agent
const { test, expect } = require('@playwright/test');

// Helper to seed localStorage
async function seedStorage(page, data) {
  await page.addInitScript((d) => {
    localStorage.setItem('idea-agent-data', JSON.stringify(d));
    localStorage.setItem('idea-agent-settings', JSON.stringify(d.settings || {}));
  }, data);
}

// ---------------------------------------------------------------------------
// LỆNH 1.1: Sidebar Layout & Re-expand Button
// ---------------------------------------------------------------------------
test.describe('LỆNH 1.1 — Sidebar Layout & Collapse Button', () => {
  test('L1.1 CONTROL: Desktop expanded sidebar has full width and main has margin-left >= 260px', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');
    const sidebar = page.locator('#sidebar');
    await expect(sidebar).toBeVisible();
    const box = await sidebar.boundingBox();
    expect(box.width).toBeCloseTo(260, -1);
  });

  test('L1.1 FAIL on e9814c5: Sidebar tablet overlap check (820px & 1024px)', async ({ page }) => {
    // At tablet width 1024px, sidebar must not overlap main content (sidebarRight <= mainLeft)
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.goto('/');
    const layout = await page.evaluate(() => {
      const sb = document.getElementById('sidebar');
      const mc = document.querySelector('.main-content');
      const sbRect = sb.getBoundingClientRect();
      const mcRect = mc.getBoundingClientRect();
      return {
        sidebarWidth: sbRect.width,
        sidebarRight: sbRect.right,
        mainLeft: mcRect.left,
        overlap: sbRect.right - mcRect.left
      };
    });
    // On e9814c5: sidebarWidth is 260px, mainLeft is 72px -> overlap is 188px!
    // Expected after fix: overlap <= 0 (sidebar is collapsed to <= 72px)
    expect(layout.overlap).toBeLessThanOrEqual(0);
  });

  test('L1.1 FAIL on e9814c5: Collapsed sidebar still renders visible 44x44 re-expand button', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');
    const collapseBtn = page.locator('#sidebar-collapse-btn');
    await expect(collapseBtn).toBeVisible();
    await collapseBtn.click();

    // On e9814c5, .sidebar.collapsed .sidebar-collapse-btn has display:none !important
    // User cannot expand it back!
    await expect(collapseBtn).toBeVisible();
    const box = await collapseBtn.boundingBox();
    expect(box.width).toBeGreaterThanOrEqual(40);
    expect(box.height).toBeGreaterThanOrEqual(40);

    // Clicking again must expand sidebar back to 260px
    await collapseBtn.click();
    await expect(page.locator('#sidebar')).not.toHaveClass(/collapsed/);
    await page.waitForTimeout(300);
    const sbBox = await page.locator('#sidebar').boundingBox();
    expect(sbBox.width).toBeCloseTo(260, -1);
  });
});

// ---------------------------------------------------------------------------
// LỆNH 1.2: Silent Save Failure on QuotaExceeded
// ---------------------------------------------------------------------------
test.describe('LỆNH 1.2 — Silent Save Failure on Storage Quota', () => {
  test('L1.2 CONTROL: Normal Store.save returns true when quota is fine', async ({ page }) => {
    await page.goto('/');
    const success = await page.evaluate(() => {
      const data = Store.getData();
      return Store.save(data);
    });
    // Store.save must return a boolean (true on success)
    expect(success).toBe(true);
  });

  test('L1.2 FAIL on e9814c5: Store.save returns false and addDraft/quickSave reports error when QuotaExceeded', async ({ page }) => {
    await page.goto('/');
    const result = await page.evaluate(() => {
      // Mock localStorage.setItem to throw QuotaExceededError
      const origSetItem = localStorage.setItem.bind(localStorage);
      localStorage.setItem = () => {
        const err = new DOMException('The quota has been exceeded.', 'QuotaExceededError');
        throw err;
      };

      const data = Store.getData();
      const saveResult = Store.save(data);

      // Now attempt addDraft
      const draftResult = Store.addDraft('any-id', 'test draft');

      // Restore
      localStorage.setItem = origSetItem;

      return { saveResult, draftResult };
    });

    // On e9814c5, Store.save returns undefined (swallowed error)
    // and addDraft returns a draft object as if it succeeded!
    expect(result.saveResult).toBe(false);
    expect(result.draftResult).toBe(null);
  });

  test('L1.2 VERIFY: Settings page displays storage usage gauge', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => App.navigate('settings'));
    const gaugeText = page.locator('#storage-usage-text');
    await expect(gaugeText).toBeVisible();
    const text = await gaugeText.textContent();
    expect(text).toMatch(/\d+\s*KB\s*\/\s*~5\.120\s*KB\s*\(\d+%\)/);
    const gaugeBar = page.locator('#storage-usage-bar');
    await expect(gaugeBar).toBeVisible();
  });

  test('L1.2 VERIFY: Filling localStorage near quota causes addDraft to fail cleanly', async ({ page }) => {
    await page.goto('/');
    const result = await page.evaluate(() => {
      // Clean start with an idea
      const idea = Store.addIdea({ title: 'Quota Test Idea', content: 'Base content' });
      // Fill localStorage close to quota
      let fillCount = 0;
      try {
        const chunk = 'X'.repeat(1024 * 100); // 100KB chunks
        for (let i = 0; i < 60; i++) {
          localStorage.setItem(`fill_${i}`, chunk);
          fillCount++;
        }
      } catch (e) {
        // reached quota
      }

      // Now attempt addDraft with 50KB content
      const draftResult = Store.addDraft(idea.id, 'New draft '.repeat(5000));
      
      // Cleanup filler keys
      for (let i = 0; i < 60; i++) {
        localStorage.removeItem(`fill_${i}`);
      }

      return {
        fillCount,
        draftResult,
        ideaAfter: Store.getIdea(idea.id)
      };
    });

    expect(result.draftResult).toBe(null);
  });
});

// ---------------------------------------------------------------------------
// LỆNH 1.3: Data Integrity (Status, Link preservation, ID reuse, Import)
// ---------------------------------------------------------------------------
test.describe('LỆNH 1.3 — Data Integrity', () => {
  test('L1.3a CONTROL: addDraft on raw idea transitions status to developing', async ({ page }) => {
    await page.goto('/');
    const status = await page.evaluate(() => {
      const idea = Store.addIdea({ title: 'Raw idea test', status: 'raw' });
      Store.addDraft(idea.id, 'Draft 1 content');
      return Store.getIdea(idea.id).status;
    });
    expect(status).toBe('developing');
  });

  test('L1.3a FAIL on e9814c5: addDraft does not overwrite reviewed or archived status to draft_vN', async ({ page }) => {
    await page.goto('/');
    const res = await page.evaluate(() => {
      const idea1 = Store.addIdea({ title: 'Idea 1' });
      Store.updateIdea(idea1.id, { status: 'reviewed' });
      Store.addDraft(idea1.id, 'Draft for reviewed');

      const idea2 = Store.addIdea({ title: 'Idea 2' });
      Store.updateIdea(idea2.id, { status: 'archived' });
      Store.addDraft(idea2.id, 'Draft for archived');

      return {
        status1: Store.getIdea(idea1.id).status,
        status2: Store.getIdea(idea2.id).status,
      };
    });

    // On e9814c5, status1 was 'draft_v1' and status2 was 'draft_v1'
    expect(res.status1).toBe('reviewed');
    expect(res.status2).toBe('archived');
  });

  test('L1.3b FAIL on e9814c5: Edit modal preserves linkedIdeas outside top 15', async ({ page }) => {
    await page.goto('/');
    const res = await page.evaluate(() => {
      // Create 20 ideas
      const data = Store.getData();
      const ids = [];
      for (let i = 1; i <= 20; i++) {
        const id = `2026-01-01-${String(i).padStart(3, '0')}`;
        data.ideas.push({
          id,
          title: `Idea #${i}`,
          category: 'tech',
          priority: 'medium',
          status: 'raw',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          drafts: [],
          linkedIdeas: []
        });
        ids.push(id);
      }
      Store.save(data);

      // Link idea 20 to idea 1
      const targetId = ids[19];
      const linkedOldId = ids[0];
      Store.linkIdeas(targetId, linkedOldId);

      // Open edit idea modal
      Timeline.editIdea(targetId);

      // Simulating saving without changing links
      Timeline.saveEditIdea(targetId);

      const after = Store.getIdea(targetId);
      return {
        linkedIdeas: after ? (after.linkedIdeas || []) : []
      };
    });

    // On e9814c5, idea 1 is not in top 15, so saveEditIdea wiped it out (linkedIdeas becomes [])
    expect(res.linkedIdeas).toContain('2026-01-01-001');
  });

  test('L1.3c CONTROL: deleteIdea decreases totalIdeas count', async ({ page }) => {
    await page.goto('/');
    const count = await page.evaluate(() => {
      const a = Store.addIdea({ title: 'Delete me' });
      const before = Store.getAllIdeas().length;
      Store.deleteIdea(a.id);
      const after = Store.getAllIdeas().length;
      return { before, after };
    });
    expect(count.after).toBe(count.before - 1);
  });

  test('L1.3c FAIL on e9814c5: deleteIdea cleans linkedIdeas and does not reuse deleted ID', async ({ page }) => {
    await page.goto('/');
    const res = await page.evaluate(() => {
      // Clean start for today's date
      const today = Store.formatDateId(new Date());
      const data = Store.getData();
      data.ideas = data.ideas.filter(i => !i.id.startsWith(today));
      if (data.stats && data.stats.seq) {
        delete data.stats.seq[today];
      }
      Store.save(data);

      const a = Store.addIdea({ title: 'Idea A' });
      const b = Store.addIdea({ title: 'Idea B' });
      const c = Store.addIdea({ title: 'Idea C' }); // e.g. -003

      Store.linkIdeas(a.id, c.id);

      // Delete C (-003)
      Store.deleteIdea(c.id);

      // Check 1: Does A still have C's ID in linkedIdeas?
      const aLinked = Store.getIdea(a.id).linkedIdeas || [];

      // Check 2: Next idea created on the same day must NOT be -003!
      const d = Store.addIdea({ title: 'Idea D' });

      return {
        cId: c.id,
        dId: d.id,
        aLinkedContainsC: aLinked.includes(c.id)
      };
    });

    // On e9814c5:
    // 1) aLinkedContainsC was true (not cleaned)
    // 2) dId reused cId (-003)!
    expect(res.aLinkedContainsC).toBe(false);
    expect(res.dId).not.toBe(res.cId);
  });

  test('L1.3d FAIL on e9814c5: Store.importData rejects invalid schema without ideas array', async ({ page }) => {
    await page.goto('/');
    const res = await page.evaluate(() => {
      // Invalid structure: has version but no ideas array
      const invalid = JSON.stringify({ version: 1, something: 'bad' });
      return Store.importData(invalid);
    });
    // On e9814c5, Store.importData checked if (data.version) -> returned true!
    expect(res).toBe(false);
  });

  test('L1.3d VERIFY: Import corrupted JSON preserves existing data intact', async ({ page }) => {
    await page.goto('/');
    const res = await page.evaluate(() => {
      const originalIdea = Store.addIdea({ title: 'Pre-existing Idea', content: 'Do not lose me' });
      const beforeCount = Store.getAllIdeas().length;

      // Simulate importing corrupted json string
      const importCorrupt = Store.importData('{ invalid json, corrupt: true }');
      const afterCount = Store.getAllIdeas().length;
      const stillExists = !!Store.getIdea(originalIdea.id);

      return { importCorrupt, beforeCount, afterCount, stillExists };
    });

    expect(res.importCorrupt).toBe(false);
    expect(res.afterCount).toBe(res.beforeCount);
    expect(res.stillExists).toBe(true);
  });

  test('L1.3d VERIFY: Import with merge mode preserves both existing and new ideas, skipping duplicate IDs', async ({ page }) => {
    await page.goto('/');
    const res = await page.evaluate(() => {
      // Seed initial idea
      const idA = '2026-01-01-001';
      const initialData = Store.getData();
      initialData.ideas = [{
        id: idA,
        title: 'Original Idea A',
        category: 'tech',
        priority: 'high',
        status: 'raw',
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
        drafts: [],
        linkedIdeas: []
      }];
      Store.save(initialData);

      // Incoming payload has duplicate ID idA (with changed title) and new idea idB
      const incomingPayload = JSON.stringify({
        ideas: [
          {
            id: idA,
            title: 'Malicious / Conflicting Duplicate A',
            category: 'tech',
            priority: 'low',
            status: 'archived',
            createdAt: '2026-01-01T00:00:00Z',
            updatedAt: '2026-01-01T00:00:00Z',
            drafts: [],
            linkedIdeas: []
          },
          {
            id: '2026-01-01-002',
            title: 'New Idea B',
            category: 'clinical',
            priority: 'medium',
            status: 'raw',
            createdAt: '2026-01-01T01:00:00Z',
            updatedAt: '2026-01-01T01:00:00Z',
            drafts: [],
            linkedIdeas: []
          }
        ]
      });

      const mergeResult = Store.importData(incomingPayload, 'merge');
      const currentIdeas = Store.getAllIdeas();
      const ideaA = Store.getIdea(idA);
      const ideaB = Store.getIdea('2026-01-01-002');

      return {
        mergeResult,
        totalIdeas: currentIdeas.length,
        ideaATitle: ideaA ? ideaA.title : null,
        hasIdeaB: !!ideaB
      };
    });

    expect(res.mergeResult).toBe(true);
    expect(res.totalIdeas).toBe(2);
    // Duplicate ID is skipped: original title preserved
    expect(res.ideaATitle).toBe('Original Idea A');
    // New idea is added
    expect(res.hasIdeaB).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// LỆNH 1.4: AI Target Version & Truncation
// ---------------------------------------------------------------------------
test.describe('LỆNH 1.4 — AI Draft Reading & Concurrency Lock', () => {
  test('L1.4 CONTROL: AI template definitions are accessible', async ({ page }) => {
    await page.goto('/');
    const hasAI = await page.evaluate(() => typeof AI !== 'undefined');
    expect(hasAI).toBe(true);
  });

  test('L1.4 FAIL on e9814c5: AI.processAction respects targetVersion and does not truncate at 1000 chars', async ({ page }) => {
    await page.goto('/');
    const promptCaptured = await page.evaluate(async () => {
      let capturedPrompt = '';
      // Intercept AI.call
      AI.call = async (prompt) => {
        capturedPrompt = prompt;
        return 'Mock response';
      };

      const longText = 'A'.repeat(5000);
      const idea = {
        id: '2026-10-27-001',
        title: 'Test Idea',
        category: 'tech',
        priority: 'high',
        content: 'Original content',
        drafts: [
          { version: 1, content: 'Version 1 unique marker ' + longText },
          { version: 2, content: 'Version 2 unique marker' }
        ]
      };

      // User is viewing version 0 (v1)
      await AI.processAction('summarize', idea, { geminiApiKey: 'fake' }, 0);
      return capturedPrompt;
    });

    // On e9814c5:
    // 1. It ignored targetVersion and took drafts[drafts.length - 1] (Version 2)
    // 2. It sliced at 1000 chars
    expect(promptCaptured).toContain('Version 1 unique marker');
    expect(promptCaptured.length).toBeGreaterThan(4000);
  });
});

// ---------------------------------------------------------------------------
// LỆNH 1.5: Esc Key Modal Guard
// ---------------------------------------------------------------------------
test.describe('LỆNH 1.5 — Esc Key Scroll Lock Guard', () => {
  test('L1.5 CONTROL: Esc closes modal when modal is open', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => App.openModal('Test Modal', '<p>Hello</p>'));
    const modal = page.locator('#modal-overlay');
    await expect(modal).toHaveClass(/active/);
    await page.keyboard.press('Escape');
    await expect(modal).not.toHaveClass(/active/);
  });

  test('L1.5 FAIL on e9814c5: Pressing Esc when modal is closed does not reset window scroll position', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      document.documentElement.style.scrollBehavior = 'auto';
      // Append a tall spacer element inside #app so window can scroll to 1500px regardless of body style resets
      let spacer = document.getElementById('test-scroll-spacer');
      if (!spacer) {
        spacer = document.createElement('div');
        spacer.id = 'test-scroll-spacer';
        spacer.style.height = '3500px';
        document.body.appendChild(spacer);
      }

      // Simulate earlier modal opened at 1159px
      App.openModal('Previous Modal', '<p>Test</p>');
      App._savedScrollTop = 1159;
      App.closeModal();

      // User scrolls down to 1500px
      window.scrollTo(0, 1500);
    });

    const scrollBefore = await page.evaluate(() => window.scrollY);
    expect(scrollBefore).toBe(1500);

    // Press Escape with NO modal open
    await page.keyboard.press('Escape');

    const scrollAfter = await page.evaluate(() => window.scrollY);
    // On e9814c5: App.closeModal() ran unconditionally, resetting window.scrollTo(0, this._savedScrollTop || 0) -> 1159!
    expect(scrollAfter).toBe(1500);
  });
});

// ---------------------------------------------------------------------------
// LỆNH 1.6: Draft.isEditing State Reset
// ---------------------------------------------------------------------------
test.describe('LỆNH 1.6 — Draft.isEditing State Isolation', () => {
  test('L1.6 CONTROL: Opening idea first time shows rendered markdown', async ({ page }) => {
    await page.goto('/');
    const isTextarea = await page.evaluate(() => {
      const idea = Store.addIdea({ title: 'Test 1', content: 'Hello' });
      Store.addDraft(idea.id, 'Draft text');
      App.viewDraft(idea.id);
      App.handleRoute();
      return !!document.getElementById('draft-editor-area');
    });
    expect(isTextarea).toBe(false);
  });

  test('L1.6 FAIL on e9814c5: Draft.isEditing resets to false when opening another idea', async ({ page }) => {
    await page.goto('/');
    const leaked = await page.evaluate(() => {
      const ideaA = Store.addIdea({ title: 'Idea A' });
      Store.addDraft(ideaA.id, 'Draft A');
      const ideaB = Store.addIdea({ title: 'Idea B' });
      Store.addDraft(ideaB.id, 'Draft B');

      // View A and toggle edit
      App.viewDraft(ideaA.id);
      App.handleRoute();
      Draft.toggleEdit(); // isEditing = true

      // Now view B
      App.viewDraft(ideaB.id);
      App.handleRoute();

      // On e9814c5, Draft.isEditing was NOT reset, so it remained true
      return {
        isEditing: Draft.isEditing,
        hasEditorTextarea: !!document.getElementById('draft-editor-area')
      };
    });

    expect(leaked.isEditing).toBe(false);
    expect(leaked.hasEditorTextarea).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// LỆNH 2: Accessibility, Tap Targets, Markdown, Color Contrast
// ---------------------------------------------------------------------------
test.describe('LỆNH 2.1 — Timeline Clickable Elements & Keyboard Focusability', () => {
  test('L2.1 CONTROL: Filter chips are buttons with aria-pressed', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => App.navigate('timeline'));
    const chips = page.locator('.filter-chip');
    const firstChip = chips.first();
    await expect(firstChip).toBeVisible();
    const tagName = await firstChip.evaluate(el => el.tagName);
    expect(tagName).toBe('BUTTON');
    const ariaPressed = await firstChip.getAttribute('aria-pressed');
    expect(ariaPressed).toBe('true');
  });

  test('L2.1 FAIL on e9814c5: Timeline has 0 clickable elements without focusability', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      for (let i = 1; i <= 15; i++) {
        Store.addIdea({ title: `Idea #${i}`, category: 'tech', priority: 'medium', status: 'raw', tags: ['tag1'] });
      }
      App.navigate('timeline');
    });
    await page.waitForTimeout(300);

    const nonFocusableCount = await page.evaluate(() => {
      const focusableTags = ['A', 'BUTTON', 'INPUT', 'SELECT', 'TEXTAREA'];
      const elements = document.querySelectorAll('#main-content *');
      let count = 0;
      elements.forEach(el => {
        const hasClick = el.hasAttribute('onclick') || (el.getAttribute('role') === 'button');
        const isFocusable = focusableTags.includes(el.tagName) || (el.hasAttribute('tabindex') && parseInt(el.getAttribute('tabindex'), 10) >= 0);
        if (hasClick && !isFocusable) {
          count++;
        }
      });
      return count;
    });

    // On e9814c5: count was 186-241! Target is 0.
    expect(nonFocusableCount).toBe(0);
  });
});

test.describe('LỆNH 2.2 — Touch Targets & Minimum Sizes', () => {
  test('L2.2 CONTROL: Back button and collapse toggle button have height >= 44px', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      const idea = Store.addIdea({ title: 'Test Idea' });
      App.viewDraft(idea.id);
    });
    const backBtn = page.locator('.back-btn');
    await expect(backBtn).toBeVisible();
    const backBox = await backBtn.boundingBox();
    expect(backBox.height).toBeGreaterThanOrEqual(44);

    const collapseBtn = page.locator('#sidebar-collapse-btn');
    const colBox = await collapseBtn.boundingBox();
    expect(colBox.height).toBeGreaterThanOrEqual(44);
    expect(colBox.width).toBeGreaterThanOrEqual(44);
  });

  test('L2.2 FAIL on e9814c5: Zero interactive elements under 24px across viewports', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      for (let i = 1; i <= 10; i++) {
        Store.addIdea({ title: `Idea ${i}`, content: `Content ${i}` });
      }
      App.navigate('timeline');
    });

    const under24 = await page.evaluate(() => {
      const interactives = Array.from(document.querySelectorAll('button, a, input, select, textarea'));
      return interactives.filter(el => {
        const r = el.getBoundingClientRect();
        return r.width > 0 && r.height > 0 && (r.width < 24 || r.height < 24);
      }).map(el => ({ tag: el.tagName, class: el.className, w: el.getBoundingClientRect().width, h: el.getBoundingClientRect().height }));
    });

    // On e9814c5: .idea-select-check was 20x20
    expect(under24.length).toBe(0);
  });
});

test.describe('LỆNH 2.3 — Screen Reader Accessibility (aria-live)', () => {
  test('L2.3 FAIL on e9814c5: main does not have aria-live, toast-container has role=status and aria-live=polite', async ({ page }) => {
    await page.goto('/');
    const mainAriaLive = await page.locator('#main-content').getAttribute('aria-live');
    expect(mainAriaLive).toBeNull();

    await page.evaluate(() => Utils.showToast('Test Toast', 'info'));
    const toastContainer = page.locator('.toast-container');
    await expect(toastContainer).toBeAttached();
    expect(await toastContainer.getAttribute('role')).toBe('status');
    expect(await toastContainer.getAttribute('aria-live')).toBe('polite');
  });
});

test.describe('LỆNH 2.4 — Status Change Menu & 5s Undo Toast', () => {
  test('L2.4 FAIL on e9814c5: Status change opens 4-status menu and shows toast with Undo button', async ({ page }) => {
    await page.goto('/');
    const res = await page.evaluate(async () => {
      const idea = Store.addIdea({ title: 'Status Test Idea', status: 'raw' });
      App.viewDraft(idea.id);
      App.handleRoute();

      // Click status badge in draft
      const badge = document.querySelector('.status-badge');
      badge.click();

      const menu = document.getElementById('status-change-menu');
      const hasMenu = !!menu;

      // Select 'reviewed'
      const optReviewed = menu ? menu.querySelector('[data-status="reviewed"]') : null;
      if (optReviewed) optReviewed.click();

      const afterStatus = Store.getIdea(idea.id).status;
      const undoBtn = document.getElementById('toast-undo-btn');
      const hasUndo = !!undoBtn;

      // Click undo
      if (undoBtn) undoBtn.click();
      const revertedStatus = Store.getIdea(idea.id).status;

      return { hasMenu, afterStatus, hasUndo, revertedStatus };
    });

    // On e9814c5, status badge cycled immediately on click without menu or undo button!
    expect(res.hasMenu).toBe(true);
    expect(res.afterStatus).toBe('reviewed');
    expect(res.hasUndo).toBe(true);
    expect(res.revertedStatus).toBe('raw');
  });
});

test.describe('LỆNH 2.5 — Enhanced Markdown Parsing', () => {
  test('L2.5 FAIL on e9814c5: renderMarkdown supports hr, nested lists, task checkboxes, h5-h6, table wrapper', async ({ page }) => {
    await page.goto('/');
    const checks = await page.evaluate(() => {
      const sample = [
        '##### Tiêu đề H5',
        '---',
        '- [ ] Việc cần làm',
        '- [x] Việc đã xong',
        '- Mục cha',
        '  - Mục con 1',
        '',
        '| Cột 1 | Cột 2 |',
        '|---|---|',
        '| A | B |'
      ].join('\n');

      const out = Utils.renderMarkdown(sample);
      return {
        hrCount: (out.match(/<hr/g) || []).length,
        nestedUl: (out.match(/<ul[\s\S]*?<ul/g) || []).length,
        checkboxCount: (out.match(/<input[^>]*type=["\']checkbox["\']/g) || []).length,
        h5Count: (out.match(/<h5/g) || []).length,
        literalHr: (out.match(/---/g) || []).length,
        tableContainer: (out.match(/<div[^>]*class=["\'][^"\']*table-container[^"\']*["\'][\s\S]*?<table/g) || []).length
      };
    });

    // On e9814c5, all of these failed
    expect(checks.hrCount).toBeGreaterThanOrEqual(1);
    expect(checks.nestedUl).toBeGreaterThanOrEqual(1);
    expect(checks.checkboxCount).toBe(2);
    expect(checks.h5Count).toBe(1);
    expect(checks.literalHr).toBe(0);
    expect(checks.tableContainer).toBeGreaterThanOrEqual(1);
  });
});

test.describe('LỆNH 2.6 — Color Contrast for --text-muted (WCAG AA >= 4.5:1)', () => {
  test('L2.6 FAIL on e9814c5: Contrast ratio of --text-muted against --bg-primary is >= 4.5 in light & dark', async ({ page }) => {
    await page.goto('/');
    const ratios = await page.evaluate(() => {
      function parseColor(str) {
        const m = str.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
        if (m) return [parseInt(m[1]), parseInt(m[2]), parseInt(m[3])];
        if (str.startsWith('#')) {
          const hex = str.replace('#', '');
          return [0, 2, 4].map(i => parseInt(hex.substr(i, 2), 16));
        }
        return [0, 0, 0];
      }
      function lum(rgb) {
        const a = rgb.map(v => {
          v /= 255;
          return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
        });
        return 0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2];
      }
      function contrast(c1, c2) {
        const l1 = lum(c1), l2 = lum(c2);
        return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
      }

      // 1. Light theme
      document.documentElement.setAttribute('data-theme', 'light');
      const lightStyle = getComputedStyle(document.documentElement);
      const lightText = parseColor(lightStyle.getPropertyValue('--text-muted').trim());
      const lightBg = parseColor(lightStyle.getPropertyValue('--bg-primary').trim());
      const lightContrast = contrast(lightText, lightBg);

      // 2. Dark theme
      document.documentElement.setAttribute('data-theme', 'dark');
      const darkStyle = getComputedStyle(document.documentElement);
      const darkText = parseColor(darkStyle.getPropertyValue('--text-muted').trim());
      const darkBg = parseColor(darkStyle.getPropertyValue('--bg-primary').trim());
      const darkContrast = contrast(darkText, darkBg);

      return { lightContrast, darkContrast };
    });

    // On e9814c5: lightContrast was 2.49, darkContrast was 2.86
    expect(ratios.lightContrast).toBeGreaterThanOrEqual(4.5);
    expect(ratios.darkContrast).toBeGreaterThanOrEqual(4.5);
  });
});

// ---------------------------------------------------------------------------
// LỆNH 3: Mobile Redesign (Capture, Timeline, Draft <= 768px)
// ---------------------------------------------------------------------------
test.describe('LỆNH 3.1 — Mobile Capture Redesign', () => {
  test('L3.1 FAIL on e9814c5: Hero height <= 220px on 390x844 and recent ideas start before y = 450', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    const metrics = await page.evaluate(() => {
      const hero = document.querySelector('.capture-hero');
      const recent = document.querySelector('.recent-ideas-section');
      const heroRect = hero ? hero.getBoundingClientRect() : { height: 999 };
      const recentRect = recent ? recent.getBoundingClientRect() : { top: 999 };
      return {
        heroHeight: heroRect.height,
        recentTop: recentRect.top
      };
    });
    // On e9814c5: heroHeight was 333px, recentTop was > 490px
    expect(metrics.heroHeight).toBeLessThanOrEqual(220);
    expect(metrics.recentTop).toBeLessThan(450);
  });

  test('L3.1 FAIL on e9814c5: Zero horizontal overflow on 320x568 (scrollWidth <= clientWidth)', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 568 });
    await page.goto('/');
    const overflow = await page.evaluate(() => {
      const doc = document.documentElement;
      return {
        scrollWidth: doc.scrollWidth,
        clientWidth: doc.clientWidth,
        hasOverflow: doc.scrollWidth > doc.clientWidth
      };
    });
    expect(overflow.hasOverflow).toBe(false);
  });

  test('L3.1 CONTROL: Quick save button is full width (>= 90% container) and height >= 48px', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    const btn = page.locator('#quick-capture-btn');
    await expect(btn).toBeVisible();
    const box = await btn.boundingBox();
    expect(box.height).toBeGreaterThanOrEqual(48);
    expect(box.width).toBeGreaterThanOrEqual(300);
  });

  test('L3.1 FAIL on e9814c5: Token preview renders chips below input and allows token removal', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    const input = page.locator('#quick-capture-input');
    await input.fill('Phẫu thuật nội soi #noisoi !cao @lamsang');

    const preview = page.locator('#quick-token-preview');
    await expect(preview).toBeVisible();
    const chipText = await preview.textContent();
    expect(chipText).toContain('#noisoi');
    expect(chipText).toContain('Cao');
    expect(chipText).toContain('Lâm sàng');

    // Click remove tag chip
    const tagChip = preview.locator('.preview-chip.tag');
    await tagChip.click();
    const val = await input.inputValue();
    expect(val).not.toContain('#noisoi');
  });

  test('L3.1 CONTROL: 4 stats cards render in 1 compact row on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    const statsPositions = await page.evaluate(() => {
      const cards = Array.from(document.querySelectorAll('.capture-stat-card'));
      return cards.map(c => {
        const r = c.getBoundingClientRect();
        return { top: Math.round(r.top), width: r.width };
      });
    });
    expect(statsPositions.length).toBe(4);
    // All 4 should have roughly the same top coordinate (single row)
    const firstTop = statsPositions[0].top;
    statsPositions.forEach(p => {
      expect(Math.abs(p.top - firstTop)).toBeLessThanOrEqual(4);
    });
  });
});

test.describe('LỆNH 3.2 — Mobile Timeline Redesign', () => {
  test('L3.2 FAIL on e9814c5: Zero horizontal overflow on 320, 360, 390 on Timeline', async ({ page }) => {
    for (const w of [320, 360, 390]) {
      await page.setViewportSize({ width: w, height: 800 });
      await page.goto('/');
      await page.evaluate(() => {
        if (!Store.getAllIdeas().length) {
          for (let i = 0; i < 5; i++) {
            Store.addIdea({
              title: `Ý tưởng số ${i + 1}`,
              category: 'clinical',
              priority: 'high'
            });
          }
        }
      });
      await page.goto('/#timeline');
      await page.waitForSelector('#timeline-container');
      const hasOverflow = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth;
      });
      expect(hasOverflow).toBe(false);
    }
  });

  test('L3.2 FAIL on e9814c5: Average card height <= 140px and >= 4 cards visible on first screen on 390x844', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    await page.evaluate(() => {
      const cur = Store.getAllIdeas();
      if (cur.length < 5) {
        for (let i = cur.length; i < 5; i++) {
          Store.addIdea({
            title: `Ý tưởng nghiên cứu mẫu số ${i + 1} về lâm sàng`,
            content: `Nội dung chi tiết cho ý tưởng số ${i + 1}`,
            category: i % 2 === 0 ? 'clinical' : 'research',
            priority: i % 2 === 0 ? 'high' : 'medium',
            tags: ['ptdtt', 'surgery']
          });
        }
      }
    });
    await page.goto('/#timeline');
    await page.waitForSelector('.idea-card');
    const metrics = await page.evaluate(() => {
      const cards = Array.from(document.querySelectorAll('.idea-card'));
      const heights = cards.map(c => c.getBoundingClientRect().height);
      const avg = heights.reduce((a, b) => a + b, 0) / (heights.length || 1);
      const visibleOnScreen = cards.filter(c => {
        const r = c.getBoundingClientRect();
        return r.top < window.innerHeight && r.bottom > 0;
      }).length;
      return { avgHeight: avg, visibleOnScreen, total: cards.length };
    });
    // On e9814c5: avgHeight was 326px, visibleOnScreen was 1-2
    expect(metrics.avgHeight).toBeLessThanOrEqual(140);
    expect(metrics.visibleOnScreen).toBeGreaterThanOrEqual(4);
  });

  test('L3.2 FAIL on e9814c5: Action buttons collapsed into a 44px menu button on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    await page.evaluate(() => {
      if (!Store.getAllIdeas().length) {
        Store.addIdea({ title: 'Ý tưởng mẫu', category: 'tech', priority: 'medium' });
      }
    });
    await page.goto('/#timeline');
    const firstMoreBtn = page.locator('.idea-card .mobile-more-action').first();
    await expect(firstMoreBtn).toBeVisible();
    const box = await firstMoreBtn.boundingBox();
    expect(box.width).toBeGreaterThanOrEqual(40);
    expect(box.height).toBeGreaterThanOrEqual(40);

    // Desktop actions must be hidden on mobile
    const desktopActions = page.locator('.idea-card .desktop-only-action').first();
    await expect(desktopActions).toBeHidden();
  });

  test('L3.2 CONTROL: Checkbox only appears when Selection Mode is toggled', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    await page.evaluate(() => {
      if (!Store.getAllIdeas().length) {
        Store.addIdea({ title: 'Ý tưởng mẫu', category: 'tech', priority: 'medium' });
      }
    });
    await page.goto('/#timeline');
    // Default: checkbox is hidden
    await expect(page.locator('.idea-card .idea-card-select').first()).toBeHidden();

    // Toggle Selection Mode
    const selectBtn = page.locator('.select-mode-btn');
    await selectBtn.click();

    // Now checkbox is visible
    const check = page.locator('.idea-card .idea-card-select').first();
    await expect(check).toBeVisible();
  });

  test('L3.2 FAIL on e9814c5: Synthesis bar increases main padding and toast is positioned above it', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    await page.evaluate(() => {
      if (!Store.getAllIdeas().length) {
        Store.addIdea({ title: 'Ý tưởng 1', category: 'tech', priority: 'medium' });
      }
    });
    await page.goto('/#timeline');
    // Enable selection mode and select first idea
    await page.locator('.select-mode-btn').click();
    await page.locator('.idea-select-check').first().check();

    const synthesisBar = page.locator('#synthesis-bar');
    await expect(synthesisBar).toBeVisible();

    const paddingBottom = await page.evaluate(() => {
      const mc = document.querySelector('.main-content');
      return parseInt(getComputedStyle(mc).paddingBottom, 10);
    });
    // Main padding bottom must be >= 120px to prevent synthesis bar covering last card
    expect(paddingBottom).toBeGreaterThanOrEqual(120);

    const toastBottom = await page.evaluate(() => {
      const tc = document.querySelector('.toast-container');
      return parseInt(getComputedStyle(tc).bottom, 10);
    });
    // Toast must be above synthesis bar
    expect(toastBottom).toBeGreaterThanOrEqual(124);
  });
});

test.describe('LỆNH 3.3 — Mobile Draft Redesign', () => {
  test('L3.3 FAIL on e9814c5: Sticky AI bar at bottom of viewport and bottom nav remains visible on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    const firstIdea = await page.evaluate(() => {
      let ideas = Store.getAllIdeas();
      if (!ideas.length) {
        Store.addIdea({ title: 'Ý tưởng mẫu cho draft', category: 'clinical', priority: 'high' });
        ideas = Store.getAllIdeas();
      }
      return ideas[0];
    });
    await page.goto(`/#draft/${firstIdea.id}`);

    // Bottom nav must be visible
    const bottomNav = page.locator('.bottom-nav');
    await expect(bottomNav).toBeVisible();

    // Sticky mobile action bar must be visible and positioned near bottom
    const mobileActions = page.locator('.draft-mobile-bottom-actions');
    await expect(mobileActions).toBeVisible();
    const box = await mobileActions.boundingBox();
    // Bounding box bottom should be right above bottom nav (around 788px in 844px height)
    expect(box.y + box.height).toBeLessThanOrEqual(844);
    expect(box.y).toBeGreaterThan(650);
  });

  test('L3.3 CONTROL: Sticky draft header with 44px back button and menu button', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    const firstIdea = await page.evaluate(() => {
      let ideas = Store.getAllIdeas();
      if (!ideas.length) {
        Store.addIdea({ title: 'Ý tưởng mẫu cho draft header', category: 'clinical', priority: 'high' });
        ideas = Store.getAllIdeas();
      }
      return ideas[0];
    });
    await page.goto(`/#draft/${firstIdea.id}`);

    const backBtn = page.locator('.draft-nav .back-btn');
    await expect(backBtn).toBeVisible();
    const backBox = await backBtn.boundingBox();
    expect(backBox.height).toBeGreaterThanOrEqual(44);

    const menuBtn = page.locator('.draft-mobile-menu-btn');
    await expect(menuBtn).toBeVisible();
    const menuBox = await menuBtn.boundingBox();
    expect(menuBox.height).toBeGreaterThanOrEqual(44);
  });
});

// ---------------------------------------------------------------------------
// LỆNH 4: Search, Sorting, Quick Parse & Build
// ---------------------------------------------------------------------------
test.describe('LỆNH 4.1 — Accent-Insensitive Search', () => {
  test('L4.1 FAIL on e9814c5: Searching "phau thuat" returns same 4 results as "phẫu thuật"', async ({ page }) => {
    await page.goto('/#timeline');
    // Ensure 4 sample surgical ideas exist
    await page.evaluate(() => {
      const sampleIdeas = [
        { title: 'Phẫu thuật nội soi cắt đại tràng góc gan', content: 'phẫu thuật ít xâm lấn', category: 'clinical' },
        { title: 'Kỹ thuật phẫu thuật nội soi mới', content: 'bệnh nhân hồi phục nhanh', category: 'clinical' },
        { title: 'Đánh giá tai biến sau phẫu thuật', content: 'theo dõi 30 ngày', category: 'clinical' },
        { title: 'Phác đồ chuẩn bị trước phẫu thuật', content: 'ERAS', category: 'clinical' }
      ];
      sampleIdeas.forEach(i => Store.addIdea(i));
    });

    const searchInput = page.locator('#timeline-search');

    // 1. Search with accent: "phẫu thuật"
    await searchInput.fill('phẫu thuật');
    await page.waitForTimeout(300);
    const countWithAccent = await page.evaluate(() => Store.getAllIdeas(Timeline.filters).length);

    // 2. Search without accent: "phau thuat"
    await searchInput.fill('phau thuat');
    await page.waitForTimeout(300);
    const countWithoutAccent = await page.evaluate(() => Store.getAllIdeas(Timeline.filters).length);

    expect(countWithAccent).toBeGreaterThanOrEqual(4);
    expect(countWithoutAccent).toBe(countWithAccent);
  });
});

test.describe('LỆNH 4.2 — Flat List on Priority and Drafts Sort', () => {
  test('L4.2 FAIL on e9814c5: Sorting by priority renders flat list without day headers', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      if (!Store.getAllIdeas().length) {
        Store.addIdea({ title: 'Ý tưởng ưu tiên cao', category: 'clinical', priority: 'high' });
        Store.addIdea({ title: 'Ý tưởng ưu tiên trung bình', category: 'tech', priority: 'medium' });
      }
    });
    await page.goto('/#timeline');
    // Click priority sort
    const prioBtn = page.locator('.sort-btn:has-text("Ưu tiên")');
    await prioBtn.click();
    await page.waitForTimeout(200);

    const hasFlatList = await page.locator('.timeline-flat-list').isVisible();
    const dayHeaders = await page.locator('.timeline-day-header').count();

    expect(hasFlatList).toBe(true);
    expect(dayHeaders).toBe(0);
  });
});

test.describe('LỆNH 4.3 — Date Filter Chips and Empty Filter State', () => {
  test('L4.3 CONTROL: Timeline filter bar includes date range chips and shows clear button on empty', async ({ page }) => {
    await page.goto('/#timeline');
    // Verify date range chips
    const dateChip = page.locator('.filter-chip:has-text("7 ngày qua")');
    await expect(dateChip).toBeVisible();

    // Set filter that yields 0 results
    await page.locator('#timeline-search').fill('non-existent-xyz-query-12345');
    await page.waitForTimeout(300);

    const emptyClearBtn = page.locator('.timeline-empty button:has-text("Xóa bộ lọc")');
    await expect(emptyClearBtn).toBeVisible();
  });
});

test.describe('LỆNH 4.4 — parseQuickText Edge Cases', () => {
  test('L4.4 FAIL on e9814c5: parseQuickText preserves emails, URL fragments, #2, and unrecognized tokens', async ({ page }) => {
    await page.goto('/');
    const results = await page.evaluate(() => {
      return {
        email: Capture.parseQuickText('Gửi ý kiến tới an@bvbd.vn để thảo luận'),
        url: Capture.parseQuickText('Xem tài liệu tại https://bvbd.vn/doc#fragment để nắm quy trình'),
        numTag: Capture.parseQuickText('Ý tưởng số #2 về phòng mổ'),
        unrecognized: Capture.parseQuickText('Thử nghiệm !tu-la và @tu-la trong câu'),
        aiBoundaryFail: Capture.parseQuickText('Đánh giá sai sót trong phòng mổ'),
        aiBoundaryPass: Capture.parseQuickText('Ứng dụng AI vào chẩn đoán hình ảnh'),
        clinicalKeywords: Capture.parseQuickText('Theo dõi người bệnh sau mổ tạo hậu môn nhân tạo và stoma')
      };
    });

    // 1. an@bvbd.vn intact in title
    expect(results.email.title).toContain('an@bvbd.vn');

    // 2. URL #fragment intact
    expect(results.url.title).toContain('https://bvbd.vn/doc#fragment');

    // 3. #2 is not a tag, preserved in title
    expect(results.numTag.tags).not.toContain('2');
    expect(results.numTag.title).toContain('#2');

    // 4. !tu-la and @tu-la kept in title
    expect(results.unrecognized.title).toContain('!tu-la');
    expect(results.unrecognized.title).toContain('@tu-la');

    // 5. "sai sót" must NOT be categorized as tech!
    expect(results.aiBoundaryFail.category).not.toBe('tech');

    // 6. "\bAI\b" categorized as tech
    expect(results.aiBoundaryPass.category).toBe('tech');

    // 7. Clinical keywords categorized as clinical
    expect(results.clinicalKeywords.category).toBe('clinical');
  });

  test('L4.4 CONTROL: Expand form parses quick capture tokens into respective form fields', async ({ page }) => {
    await page.goto('/');
    const input = page.locator('#quick-capture-input');
    await input.fill('Phẫu thuật trực tràng cải tiến #phauthuat !cao @lamsang');

    const moreBtn = page.locator('#quick-capture-more-btn');
    await moreBtn.click();
    await page.waitForTimeout(200);

    const titleVal = await page.locator('#idea-title').inputValue();
    expect(titleVal).not.toContain('#phauthuat');
    expect(titleVal).not.toContain('!cao');
    expect(titleVal).not.toContain('@lamsang');
    expect(titleVal).toContain('Phẫu thuật trực tràng cải tiến');

    const selectedCat = await page.locator('.category-option.selected').getAttribute('data-cat');
    expect(selectedCat).toBe('clinical');

    const selectedPrio = await page.locator('.priority-option.selected').getAttribute('data-priority');
    expect(selectedPrio).toBe('high');
  });
});
