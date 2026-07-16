import Chart from 'chart.js/auto';

// ── Palette ───────────────────────────────────────────────────────────────────
// All 20 colors derived from $brand_primary hue (235°).
// Ordered light → dark → light alternating so adjacent bars always contrast.
// HSL anchor: hsl(235, 38%, 55%) ≈ #676EB4
const PALETTE = [
  '#6168b8', // hsl(235,38%,55%) — brand_primary
  '#4049a5', // hsl(235,44%,45%) — mid-dark
  '#8087cb', // hsl(235,42%,65%) — light
  '#2b3497', // hsl(235,56%,38%) — deep saturated
  '#a2a6cd', // hsl(235,30%,72%) — muted light
  '#363ea1', // hsl(235,50%,42%) — saturated dark
  '#bbbdd3', // hsl(235,22%,78%) — very light muted
  '#4a54bf', // hsl(235,48%,52%) — medium saturated
  '#363c7d', // hsl(235,40%,35%) — dark
  '#838ad8', // hsl(235,52%,68%) — light saturated
  '#21276e', // hsl(235,54%,28%) — very deep
  '#636bc5', // hsl(235,46%,58%) — saturated mid
  '#323767', // hsl(235,34%,30%) — very dark
  '#9fa1bc', // hsl(235,18%,68%) — very muted light
  '#2a37c0', // hsl(235,64%,46%) — rich deep
  '#8387b9', // hsl(235,28%,62%) — desaturated mid
  '#5e64a1', // hsl(235,26%,50%) — muted mid
  '#5c66d6', // hsl(235,60%,60%) — vivid mid
  '#babdde', // hsl(235,36%,80%) — pale
  '#565981', // hsl(235,20%,42%) — grey-blue dark
];

// ── Helpers ───────────────────────────────────────────────────────────────────
const truncate = (str, n) => (str.length > n ? `${str.slice(0, n - 1)}…` : str);

// Map from label name → { courses, description, url, match }
let labelMeta = {};

// ── Custom HTML Tooltip ───────────────────────────────────────────────────────
//
// A single floating <div> is reused across all charts. It renders:
//   • Tag name  (bold, with Wikidata QID as a pill)
//   • Description (italic, if present)
//   • Divider
//   • List of programs with clickable links
//   • "N programs" summary line
//
function getOrCreateTooltipEl() {
  let el = document.getElementById('tags-chart-tooltip');
  if (!el) {
    el = document.createElement('div');
    el.id = 'tags-chart-tooltip';
    el.setAttribute('role', 'tooltip');
    el.setAttribute('aria-live', 'polite');
    document.body.appendChild(el);
  }
  return el;
}

function externalTooltipHandler(context) {
  const { chart, tooltip } = context;
  const el = getOrCreateTooltipEl();

  // Hide when no active element
  if (tooltip.opacity === 0) {
    el.classList.remove('visible');
    return;
  }

  // Resolve the hovered label name (works for bar, doughnut, polar)
  const rawLabel = tooltip.dataPoints?.[0]?.label ?? '';
  // Strip any truncation to find the full label in meta
  const metaKey = Object.keys(labelMeta).find(k =>
    k === rawLabel || k.startsWith(rawLabel.replace(/…$/, ''))
  ) ?? rawLabel;
  const meta = labelMeta[metaKey] ?? {};
  const courses   = meta.courses ?? [];
  const count     = courses.length;
  const qid       = meta.match ?? '';
  const desc      = meta.description ?? '';
  const wdUrl     = meta.url ?? (qid ? `https://www.wikidata.org/wiki/${qid}` : '');
  const colorDot  = tooltip.dataPoints?.[0]?.dataset?.backgroundColor;
  const dotColor  = Array.isArray(colorDot)
    ? colorDot[tooltip.dataPoints[0].dataIndex]
    : (colorDot ?? '#888');

  // Build inner HTML
  const courseItems = courses.map(c => {
    const href = `/courses/${c.slug}`;
    return `<li class="tct-course-item">
      <span class="tct-course-dot"></span>
      <a class="tct-course-link" href="${href}" target="_blank" rel="noopener">${c.title}</a>
    </li>`;
  }).join('');

  const descHtml = desc
    ? `<p class="tct-description">${desc}</p>`
    : '';

  const countLabel = count === 1
    ? I18n.t('campaign.tags_tooltip_one_program')
    : I18n.t('campaign.tags_tooltip_n_programs', { count });

  el.innerHTML = `
    <div class="tct-header">
      <span class="tct-color-swatch" style="background:${dotColor}"></span>
      <span class="tct-tag-name">${metaKey}</span>
      ${qid ? `<a class="tct-qid" href="${wdUrl}" target="_blank" rel="noopener" title="View on Wikidata">${qid}</a>` : ''}
    </div>
    ${descHtml}
    <div class="tct-divider"></div>
    <p class="tct-section-label">${I18n.t('campaign.tags_tooltip_programs_label')}</p>
    <ul class="tct-course-list">${courseItems || `<li class="tct-course-item tct-course-none">${I18n.t('campaign.tags_tooltip_no_programs')}</li>`}</ul>
    <div class="tct-footer">
      <span class="tct-count">${countLabel}</span>
    </div>
  `;

  // Position: anchor to chart canvas, avoid viewport edges
  const canvasRect = chart.canvas.getBoundingClientRect();
  const pos        = tooltip.caretX !== undefined ? tooltip.caretX : 0;
  const posY       = tooltip.caretY !== undefined ? tooltip.caretY : 0;

  el.classList.add('visible');

  // Position after making visible so offsetWidth is real
  requestAnimationFrame(() => {
    const tw = el.offsetWidth;
    const th = el.offsetHeight;
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    let left = canvasRect.left + window.scrollX + pos + 16;
    let top  = canvasRect.top  + window.scrollY + posY - th / 2;

    // Flip left if overflows right edge
    if (left + tw > vw + window.scrollX - 12) {
      left = canvasRect.left + window.scrollX + pos - tw - 16;
    }
    // Clamp vertically
    top = Math.max(window.scrollY + 8, Math.min(top, window.scrollY + vh - th - 8));

    el.style.left = `${left}px`;
    el.style.top  = `${top}px`;
  });
}

// ── Shared tooltip config ─────────────────────────────────────────────────────
const TOOLTIP_CONFIG = {
  enabled: false,       // disable Chart.js built-in canvas tooltip
  external: externalTooltipHandler,
};

// Hide tooltip when mouse leaves the canvas
function attachTooltipHide(chart) {
  chart.canvas.addEventListener('mouseleave', () => {
    const el = document.getElementById('tags-chart-tooltip');
    if (el) el.classList.remove('visible');
  });
}

// ── Chart builders ────────────────────────────────────────────────────────────

/**
 * Horizontal bar chart: courses per tag (sorted descending).
 */
function buildHorizontalBar(canvasId, labelList) {
  const ctx = document.getElementById(canvasId);
  if (!ctx) return;

  const sorted = [...labelList].sort((a, b) => b.course_count - a.course_count);
  const names  = sorted.map(d => truncate(d.label, 28));
  const counts = sorted.map(d => d.course_count);

  const chart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: names,
      datasets: [{
        label: I18n.t('campaign.tags_chart_courses'),
        data: counts,
        backgroundColor: sorted.map((_, i) => PALETTE[i % PALETTE.length]),
        borderColor:     sorted.map((_, i) => PALETTE[i % PALETTE.length]),
        borderWidth: 1,
        borderRadius: 4,
      }],
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: TOOLTIP_CONFIG,
        title: {
          display: true,
          text: I18n.t('campaign.tags_chart_horizontal_title'),
          font: { size: 14, weight: '600' },
          padding: { bottom: 12 },
        },
      },
      scales: {
        x: {
          beginAtZero: true,
          ticks: { precision: 0 },
          grid: { color: 'rgba(0,0,0,0.06)' },
          title: {
            display: true,
            text: I18n.t('campaign.tags_chart_courses'),
            font: { size: 12 },
          },
        },
        y: { grid: { display: false } },
      },
    },
  });
  attachTooltipHide(chart);
  return chart;
}

/**
 * Vertical bar chart.
 */
function buildVerticalBar(canvasId, labelList) {
  const ctx = document.getElementById(canvasId);
  if (!ctx) return;

  const names  = labelList.map(d => truncate(d.label, 16));
  const counts = labelList.map(d => d.course_count);

  const chart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: names,
      datasets: [{
        label: I18n.t('campaign.tags_chart_courses'),
        data: counts,
        backgroundColor: labelList.map((_, i) => `${PALETTE[i % PALETTE.length]}cc`),
        borderColor:     labelList.map((_, i) => PALETTE[i % PALETTE.length]),
        borderWidth: 2,
        borderRadius: 5,
        borderSkipped: false,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: TOOLTIP_CONFIG,
        title: {
          display: true,
          text: I18n.t('campaign.tags_chart_vertical_title'),
          font: { size: 14, weight: '600' },
          padding: { bottom: 12 },
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: { precision: 0 },
          grid: { color: 'rgba(0,0,0,0.06)' },
          title: {
            display: true,
            text: I18n.t('campaign.tags_chart_courses'),
            font: { size: 12 },
          },
        },
        x: {
          grid: { display: false },
          ticks: { maxRotation: 35, minRotation: 20 },
        },
      },
    },
  });
  attachTooltipHide(chart);
  return chart;
}

/**
 * Doughnut chart.
 */
function buildDoughnut(canvasId, labelList) {
  const ctx = document.getElementById(canvasId);
  if (!ctx) return;

  const total = labelList.reduce((s, l) => s + l.course_count, 0);
  const names  = labelList.map(d => truncate(d.label, 24));
  const counts = labelList.map(d => d.course_count);

  const chart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: names,
      datasets: [{
        data: counts,
        backgroundColor: labelList.map((_, i) => PALETTE[i % PALETTE.length]),
        borderColor: '#fff',
        borderWidth: 2,
        hoverOffset: 8,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'right',
          labels: { boxWidth: 14, font: { size: 12 }, padding: 10 },
        },
        tooltip: {
          ...TOOLTIP_CONFIG,
          // Augment external handler with percentage via afterLabel (not needed —
          // the custom tooltip already shows course list; pct shown in footer)
        },
        title: {
          display: true,
          text: I18n.t('campaign.tags_chart_doughnut_title'),
          font: { size: 14, weight: '600' },
          padding: { bottom: 12 },
        },
      },
    },
  });
  // Store total on chart for tooltip use
  chart._tagTotal = total;
  attachTooltipHide(chart);
  return chart;
}

/**
 * Polar area chart.
 */
function buildPolarArea(canvasId, labelList) {
  const ctx = document.getElementById(canvasId);
  if (!ctx) return;

  const names  = labelList.map(d => truncate(d.label, 24));
  const counts = labelList.map(d => d.course_count);

  const chart = new Chart(ctx, {
    type: 'polarArea',
    data: {
      labels: names,
      datasets: [{
        data: counts,
        backgroundColor: labelList.map((_, i) => `${PALETTE[i % PALETTE.length]}bb`),
        borderColor:     labelList.map((_, i) => PALETTE[i % PALETTE.length]),
        borderWidth: 1,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'right',
          labels: { boxWidth: 14, font: { size: 12 }, padding: 10 },
        },
        tooltip: TOOLTIP_CONFIG,
        title: {
          display: true,
          text: I18n.t('campaign.tags_chart_polar_title'),
          font: { size: 14, weight: '600' },
          padding: { bottom: 12 },
        },
      },
      scales: {
        r: {
          ticks: { precision: 0, backdropColor: 'transparent', font: { size: 10 } },
          grid: { color: 'rgba(0,0,0,0.08)' },
        },
      },
    },
  });
  attachTooltipHide(chart);
  return chart;
}

// ── Program filter table ──────────────────────────────────────────────────────
//
// Reuses the same labelList already fetched for the charts to let users
// filter the campaign's programs by one or more tags via a checkbox dropdown.

function renderFilterOptions(labelList) {
  const container = document.getElementById('tags-filter-options');
  if (!container) return;

  container.innerHTML = '';
  const sorted = [...labelList].sort((a, b) => b.course_count - a.course_count);

  sorted.forEach((l) => {
    const optionEl = document.createElement('label');
    optionEl.className = 'campaign-tags-filter-option';

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'campaign-tags-filter-checkbox';
    checkbox.value = l.match;
    checkbox.dataset.label = l.label;

    const nameEl = document.createElement('span');
    nameEl.className = 'campaign-tags-filter-option__name';
    nameEl.textContent = l.label;

    const countEl = document.createElement('span');
    countEl.className = 'campaign-tags-filter-option__count';
    countEl.textContent = l.course_count;

    optionEl.append(checkbox, nameEl, countEl);
    container.appendChild(optionEl);
  });
}

function renderFilterTable(courses) {
  const tbody = document.getElementById('tags-filter-table-body');
  if (!tbody) return;

  tbody.innerHTML = '';

  if (courses.length === 0) {
    const tr = document.createElement('tr');
    tr.className = 'campaign-tags-filter-table-empty';
    const td = document.createElement('td');
    td.colSpan = 2;
    td.textContent = I18n.t('campaign.tags_filter_table_empty');
    tr.appendChild(td);
    tbody.appendChild(tr);
    return;
  }

  courses.forEach((course) => {
    const tr = document.createElement('tr');

    const nameTd = document.createElement('td');
    const link = document.createElement('a');
    link.href = `/courses/${course.slug}`;
    link.target = '_blank';
    link.rel = 'noopener';
    link.textContent = course.title;
    nameTd.appendChild(link);

    const tagsTd = document.createElement('td');
    tagsTd.className = 'campaign-tags-filter-table-tags';
    course.tags.forEach((t) => {
      const chip = document.createElement('span');
      chip.className = 'campaign-tags-filter-chip';

      if (t.url) {
        const link = document.createElement('a');
        link.href = t.url;
        link.target = '_blank';
        link.rel = 'noopener';
        link.textContent = t.label;
        chip.appendChild(link);
      } else {
        chip.textContent = t.label;
      }

      tagsTd.appendChild(chip);
    });

    tr.append(nameTd, tagsTd);
    tbody.appendChild(tr);
  });
}

function updateFilterCount(selectedCount) {
  const countEl = document.getElementById('tags-filter-count');
  if (!countEl) return;
  countEl.textContent = selectedCount > 0 ? selectedCount : '';
  countEl.classList.toggle('visible', selectedCount > 0);
}

function applyFilter(allCourses) {
  const checkboxes = document.querySelectorAll('.campaign-tags-filter-checkbox:checked');
  const selectedMatches = new Set([...checkboxes].map(cb => cb.value));
  updateFilterCount(selectedMatches.size);

  const filtered = selectedMatches.size === 0
    ? allCourses
    : allCourses.filter(course => course.tags.some(t => selectedMatches.has(t.match)));

  renderFilterTable(filtered);
}

function initTagFilterTable(labelList) {
  const panel = document.getElementById('tags-filter-panel');
  const toggle = document.getElementById('tags-filter-toggle');
  if (!panel || !toggle) return;

  const courseMap = {};
  labelList.forEach((l) => {
    (l.courses || []).forEach((c) => {
      if (!courseMap[c.slug]) courseMap[c.slug] = { title: c.title, slug: c.slug, tags: [] };
      courseMap[c.slug].tags.push({
        label: l.label,
        match: l.match,
        url: l.url || (l.match ? `https://www.wikidata.org/wiki/${l.match}` : ''),
      });
    });
  });
  const allCourses = Object.values(courseMap).sort((a, b) => a.title.localeCompare(b.title));

  renderFilterOptions(labelList);
  renderFilterTable(allCourses);

  const closePanel = () => {
    panel.hidden = true;
    toggle.setAttribute('aria-expanded', 'false');
    toggle.classList.remove('active');
  };

  toggle.addEventListener('click', () => {
    const isOpen = !panel.hidden;
    panel.hidden = isOpen;
    toggle.setAttribute('aria-expanded', String(!isOpen));
    toggle.classList.toggle('active', !isOpen);
  });

  document.addEventListener('click', (e) => {
    if (!panel.hidden && !panel.contains(e.target) && !toggle.contains(e.target)) {
      closePanel();
    }
  });

  const applyBtn = document.getElementById('tags-filter-apply');
  if (applyBtn) {
    applyBtn.addEventListener('click', () => {
      applyFilter(allCourses);
      closePanel();
    });
  }

  const clearBtn = document.getElementById('tags-filter-clear');
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      document.querySelectorAll('.campaign-tags-filter-checkbox').forEach((cb) => { cb.checked = false; });
      updateFilterCount(0);
      renderFilterTable(allCourses);
    });
  }
}

// ── Chart switcher tabs ───────────────────────────────────────────────────────

function initChartTabs() {
  document.querySelectorAll('.tags-chart-tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      const group = tab.closest('.tags-charts-section');
      group.querySelectorAll('.tags-chart-tab').forEach(t => t.classList.remove('active'));
      group.querySelectorAll('.tags-chart-panel').forEach(p => p.classList.remove('active'));
      tab.classList.add('active');
      const target = group.querySelector(`#${tab.dataset.target}`);
      if (target) target.classList.add('active');
      // Hide tooltip when switching tabs
      const ttEl = document.getElementById('tags-chart-tooltip');
      if (ttEl) ttEl.classList.remove('visible');
    });
  });
}

// ── Init ──────────────────────────────────────────────────────────────────────

function initTagCharts() {
  const container = document.getElementById('campaign-tags-charts');
  if (!container) return;

  const url = container.dataset.url || `/campaigns/${encodeURIComponent(container.dataset.slug)}/tags.json`;
  const noDataMsg = container.querySelector('.tags-charts-loading');

  fetch(url, {
    headers: { Accept: 'application/json' },
    credentials: 'same-origin',
  })
    .then((r) => {
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.json();
    })
    .then((data) => {
      if (noDataMsg) noDataMsg.remove();

      const labelList = data.labels || [];

      initTagFilterTable(labelList);

      if (labelList.length === 0) {
        const emptyEl = document.createElement('p');
        emptyEl.className = 'tags-charts-empty';
        emptyEl.textContent = I18n.t('campaign.tags_charts_no_data');
        container.appendChild(emptyEl);
        return;
      }

      // Build labelMeta map: full label name → metadata for tooltips
      labelMeta = {};
      labelList.forEach((l) => {
        labelMeta[l.label] = {
          courses:     l.courses || [],
          description: l.description || '',
          url:         l.url || '',
          match:       l.match || '',
        };
      });

      // Update summary counts
      const totalLabelsEl  = document.getElementById('tags-total-labels');
      const totalCoursesEl = document.getElementById('tags-total-courses');
      if (totalLabelsEl)  totalLabelsEl.textContent  = data.total_labels;
      if (totalCoursesEl) totalCoursesEl.textContent = data.total_courses;

      // Build all charts passing full labelList
      buildHorizontalBar('tags-chart-horizontal', labelList);
      buildVerticalBar('tags-chart-vertical', labelList);
      buildDoughnut('tags-chart-doughnut', labelList);
      buildPolarArea('tags-chart-polar', labelList);

      initChartTabs();
      container.classList.remove('hidden');
    })
    .catch((err) => {
      console.error('[campaign_tags] fetch failed:', err);
      if (noDataMsg) noDataMsg.textContent = I18n.t('campaign.tags_charts_error');
      const filterTbody = document.getElementById('tags-filter-table-body');
      if (filterTbody) {
        filterTbody.innerHTML = '';
        const tr = document.createElement('tr');
        tr.className = 'campaign-tags-filter-table-empty';
        const td = document.createElement('td');
        td.colSpan = 2;
        td.textContent = I18n.t('campaign.tags_charts_error');
        tr.appendChild(td);
        filterTbody.appendChild(tr);
      }
    });
}

// Fire when DOM is ready, whether the script loaded early or late
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initTagCharts);
} else {
  initTagCharts();
}
