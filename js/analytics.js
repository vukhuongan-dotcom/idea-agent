/* ========================================
   IDEA AGENT — Analytics Module
   Charts, stats, heatmap
   ======================================== */

var Analytics = {
  render() {
    const data = Store.getData();
    const ideas = data.ideas;
    const catCounts = Store.getCategoryCounts();
    const totalDrafts = data.stats.totalDrafts || 0;

    return `
      <div class="page-header">
        <div>
          <h1>📊 Phân tích & Thống kê</h1>
          <div class="page-subtitle">Tổng quan hoạt động ý tưởng</div>
        </div>
      </div>

      <div class="capture-stats" style="margin-bottom: var(--space-xl)">
        <div class="capture-stat-card">
          <div class="capture-stat-icon purple">💡</div>
          <div>
            <div class="capture-stat-value">${ideas.length}</div>
            <div class="capture-stat-label">Tổng ý tưởng</div>
          </div>
        </div>
        <div class="capture-stat-card">
          <div class="capture-stat-icon green">📝</div>
          <div>
            <div class="capture-stat-value">${totalDrafts}</div>
            <div class="capture-stat-label">Bản thảo AI</div>
          </div>
        </div>
        <div class="capture-stat-card">
          <div class="capture-stat-icon amber">🔥</div>
          <div>
            <div class="capture-stat-value">${ideas.filter(i => i.priority === 'high' || i.priority === 'critical').length}</div>
            <div class="capture-stat-label">Ưu tiên cao</div>
          </div>
        </div>
        <div class="capture-stat-card">
          <div class="capture-stat-icon blue">📅</div>
          <div>
            <div class="capture-stat-value">${this.getStreakDays(ideas)}</div>
            <div class="capture-stat-label">Ngày liên tiếp</div>
          </div>
        </div>
      </div>

      <div class="analytics-grid">
        ${this.renderMonthlyChart(ideas)}
        ${this.renderCategoryBreakdown(catCounts)}
        ${this.renderStatusPipeline(ideas)}
        ${this.renderHeatmap(ideas)}
        ${this.renderTopTags(ideas)}
        ${this.renderRecentActivity(ideas)}
      </div>
    `;
  },

  renderMonthlyChart(ideas) {
    // Get last 6 months
    const months = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const monthNames = ['Th1','Th2','Th3','Th4','Th5','Th6','Th7','Th8','Th9','Th10','Th11','Th12'];
      months.push({
        key,
        label: monthNames[d.getMonth()],
        count: ideas.filter(i => i.id.startsWith(key)).length
      });
    }

    const maxCount = Math.max(...months.map(m => m.count), 1);

    return `
      <div class="analytics-card">
        <h3>📈 Ý tưởng theo tháng</h3>
        <div class="chart-container">
          ${months.map(m => `
            <div class="chart-bar" style="height: ${Math.max((m.count / maxCount) * 100, 3)}%"
              title="${m.label}: ${m.count} ý tưởng">
              <span class="chart-bar-label">${m.label}</span>
            </div>
          `).join('')}
        </div>
        <div style="text-align: center; margin-top: var(--space-lg); font-size: 0.78rem; color: var(--text-muted)">
          ${months.map(m => `${m.count}`).join(' · ')} ý tưởng
        </div>
      </div>
    `;
  },

  renderCategoryBreakdown(catCounts) {
    const total = Object.values(catCounts).reduce((s, c) => s + c, 0) || 1;
    const cats = Object.entries(Utils.categories);

    return `
      <div class="analytics-card">
        <h3>🏷️ Phân bổ danh mục</h3>
        <div class="donut-legend" style="margin-top: var(--space-md)">
          ${cats.map(([key, cat]) => {
            const count = catCounts[key] || 0;
            const pct = Math.round((count / total) * 100);
            return `
              <div class="donut-legend-item">
                <div class="donut-legend-dot" style="background: var(--cat-${key})"></div>
                <span style="flex: 1">${cat.icon} ${cat.label}</span>
                <strong style="color: var(--text-primary)">${count}</strong>
                <span style="color: var(--text-muted); font-size: 0.75rem">(${pct}%)</span>
                <div style="flex: 2; height: 6px; background: var(--bg-tertiary); border-radius: 3px; overflow: hidden">
                  <div style="height: 100%; width: ${pct}%; background: var(--cat-${key}); border-radius: 3px; transition: width 0.5s ease"></div>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  },

  renderStatusPipeline(ideas) {
    const statuses = [
      { key: 'raw', label: 'Ý tưởng thô', icon: '💭', count: ideas.filter(i => i.status === 'raw').length },
      { key: 'developing', label: 'Đang phát triển', icon: '⚙️', count: ideas.filter(i => i.status === 'developing').length },
      { key: 'draft', label: 'Có bản thảo', icon: '📝', count: ideas.filter(i => i.status.startsWith('draft')).length },
      { key: 'reviewed', label: 'Đã review', icon: '✅', count: ideas.filter(i => i.status === 'reviewed').length },
      { key: 'archived', label: 'Lưu trữ', icon: '📦', count: ideas.filter(i => i.status === 'archived').length },
    ];

    return `
      <div class="analytics-card">
        <h3>📋 Pipeline trạng thái</h3>
        <div style="display: flex; flex-direction: column; gap: var(--space-sm); margin-top: var(--space-md)">
          ${statuses.map(s => `
            <div style="display: flex; align-items: center; gap: var(--space-sm)">
              <span style="width: 28px; text-align: center">${s.icon}</span>
              <span style="flex: 1; font-size: 0.85rem">${s.label}</span>
              <strong style="font-size: 1.1rem; color: var(--text-primary)">${s.count}</strong>
              <div style="width: 80px; height: 6px; background: var(--bg-tertiary); border-radius: 3px; overflow: hidden">
                <div style="height: 100%; width: ${ideas.length ? (s.count / ideas.length) * 100 : 0}%; background: var(--primary); border-radius: 3px; transition: width 0.5s ease"></div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  },

  renderHeatmap(ideas) {
    // Generate last 90 days
    const cells = [];
    const now = new Date();
    for (let i = 89; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateKey = Store.formatDateId(d);
      const count = ideas.filter(idea => idea.id.startsWith(dateKey)).length;
      let level = 0;
      if (count >= 4) level = 4;
      else if (count >= 3) level = 3;
      else if (count >= 2) level = 2;
      else if (count >= 1) level = 1;

      cells.push({ date: dateKey, count, level });
    }

    return `
      <div class="analytics-card" style="grid-column: 1 / -1">
        <h3>🔥 Activity Heatmap (90 ngày)</h3>
        <div style="display: grid; grid-template-columns: repeat(${Math.ceil(cells.length / 7)}, 1fr); gap: 3px; margin-top: var(--space-md)">
          ${cells.map(c => `
            <div class="heatmap-cell level-${c.level}" title="${c.date}: ${c.count} ý tưởng"
              style="aspect-ratio: 1; border-radius: 3px; min-height: 12px"></div>
          `).join('')}
        </div>
        <div style="display: flex; align-items: center; gap: var(--space-xs); justify-content: flex-end; margin-top: var(--space-sm); font-size: 0.72rem; color: var(--text-muted)">
          Ít <div class="heatmap-cell" style="width: 12px; height: 12px; display: inline-block; border-radius: 2px"></div>
          <div class="heatmap-cell level-1" style="width: 12px; height: 12px; display: inline-block; border-radius: 2px"></div>
          <div class="heatmap-cell level-2" style="width: 12px; height: 12px; display: inline-block; border-radius: 2px"></div>
          <div class="heatmap-cell level-3" style="width: 12px; height: 12px; display: inline-block; border-radius: 2px"></div>
          <div class="heatmap-cell level-4" style="width: 12px; height: 12px; display: inline-block; border-radius: 2px"></div> Nhiều
        </div>
      </div>
    `;
  },

  renderTopTags(ideas) {
    const tagCounts = {};
    ideas.forEach(idea => {
      (idea.tags || []).forEach(t => {
        tagCounts[t] = (tagCounts[t] || 0) + 1;
      });
    });

    const sorted = Object.entries(tagCounts).sort((a, b) => b[1] - a[1]).slice(0, 10);
    const maxTagCount = sorted.length ? sorted[0][1] : 1;

    return `
      <div class="analytics-card">
        <h3>🏷️ Tags phổ biến</h3>
        ${sorted.length ? `
          <div style="display: flex; flex-direction: column; gap: var(--space-xs); margin-top: var(--space-md)">
            ${sorted.map(([tag, count]) => `
              <div style="display: flex; align-items: center; gap: var(--space-sm)">
                <span class="chip chip-tag" style="min-width: 60px; justify-content: center">#${tag}</span>
                <div style="flex: 1; height: 6px; background: var(--bg-tertiary); border-radius: 3px; overflow: hidden">
                  <div style="height: 100%; width: ${(count / maxTagCount) * 100}%; background: var(--accent); border-radius: 3px"></div>
                </div>
                <span style="font-size: 0.78rem; font-weight: 700; color: var(--text-primary)">${count}</span>
              </div>
            `).join('')}
          </div>
        ` : '<p style="text-align: center; color: var(--text-muted); margin-top: var(--space-lg)">Chưa có tag nào</p>'}
      </div>
    `;
  },

  renderRecentActivity(ideas) {
    const recent = ideas.slice(0, 5);

    return `
      <div class="analytics-card">
        <h3>⚡ Hoạt động gần đây</h3>
        ${recent.length ? `
          <div style="display: flex; flex-direction: column; gap: var(--space-sm); margin-top: var(--space-md)">
            ${recent.map(idea => `
              <div style="display: flex; align-items: center; gap: var(--space-sm); padding: var(--space-xs) 0; border-bottom: 1px solid var(--border-light); cursor: pointer" onclick="App.viewDraft('${idea.id}')">
                <span style="font-size: 0.9rem">${Utils.getCategoryIcon(idea.category)}</span>
                <span style="flex: 1; font-size: 0.82rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis">${Utils.escapeHtml(idea.title)}</span>
                <span style="font-size: 0.72rem; color: var(--text-muted); white-space: nowrap">${Utils.formatRelative(idea.createdAt)}</span>
              </div>
            `).join('')}
          </div>
        ` : '<p style="text-align: center; color: var(--text-muted); margin-top: var(--space-lg)">Chưa có hoạt động</p>'}
      </div>
    `;
  },

  // Calculate streak days
  getStreakDays(ideas) {
    if (!ideas.length) return 0;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let streak = 0;
    let checkDate = new Date(today);

    while (true) {
      const dateKey = Store.formatDateId(checkDate);
      const hasIdea = ideas.some(i => i.id.startsWith(dateKey));
      if (hasIdea) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    return streak;
  },
};
