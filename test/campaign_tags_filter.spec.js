const mockAddEventListener = jest.fn();
const mockChart = jest.fn(() => ({
  canvas: {
    addEventListener: jest.fn(),
  },
  _tagTotal: 0,
}));

jest.mock('chart.js/auto', () => mockChart);

const jsonData = {
  campaign: { slug: 'prueba_de_tags_', title: 'prueba de tags' },
  total_courses: 7,
  total_labels: 13,
  labels: [
    {
      id: 14,
      match: 'Q57354899',
      label: 'child health',
      url: 'https://www.wikidata.org/wiki/Q57354899',
      description: '',
      course_count: 3,
      courses: [
        { title: 'Salud en Brasil', slug: 'Dev_Test/Salud_en_Brasil' },
        { title: 'Salud en Bolivia', slug: 'Dev_Test/Salud_en_Bolivia' },
        { title: 'Salud en Chile', slug: 'Dev_Test/Salud_en_Chile' },
      ],
    },
    {
      id: 3,
      match: 'Q155',
      label: 'Brazil',
      url: 'https://www.wikidata.org/wiki/Q155',
      description: '',
      course_count: 1,
      courses: [
        { title: 'Salud en Brasil', slug: 'Dev_Test/Salud_en_Brasil' },
      ],
    },
  ],
};

describe('campaign tags filter table', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <section class="campaign-tags-filter-section" id="campaign-tags-filter-section">
        <div class="campaign-tags-filter-bar">
          <div class="campaign-tags-filter-dropdown">
            <button class="campaign-tags-filter-toggle" id="tags-filter-toggle" type="button">Filter</button>
            <span class="campaign-tags-filter-count" id="tags-filter-count"></span>
            <div class="campaign-tags-filter-panel" id="tags-filter-panel" hidden>
              <div class="campaign-tags-filter-options" id="tags-filter-options"></div>
              <div class="campaign-tags-filter-actions">
                <button class="campaign-tags-filter-clear" id="tags-filter-clear" type="button">Clear</button>
                <button class="campaign-tags-filter-apply" id="tags-filter-apply" type="button">Apply</button>
              </div>
            </div>
          </div>
        </div>
        <div class="campaign-tags-filter-table-wrapper">
          <table class="campaign-tags-filter-table">
            <tbody id="tags-filter-table-body">
              <tr><td colspan="2">Loading</td></tr>
            </tbody>
          </table>
        </div>
      </section>
      <section class="tags-charts-section" id="campaign-tags-charts" data-url="/campaigns/prueba_de_tags_/tags.json">
        <p class="tags-charts-loading">Loading charts…</p>
      </section>
    `;

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue(jsonData),
    });

    jest.resetModules();
    require('../app/assets/javascripts/campaign_tags.js');
  });

  afterEach(() => {
    jest.clearAllMocks();
    document.body.innerHTML = '';
  });

  const flushPromises = () => new Promise(resolve => setTimeout(resolve, 0));

  it('renders the filter options and all courses after loading', async () => {
    await flushPromises();

    const options = document.querySelectorAll('.campaign-tags-filter-option');
    const rows = document.querySelectorAll('#tags-filter-table-body tr');

    expect(options.length).toBe(2);
    expect(rows.length).toBe(3);
  });

  it('filters the table when Apply is clicked', async () => {
    await flushPromises();

    // open dropdown
    document.getElementById('tags-filter-toggle').click();
    // select "child health" (Q57354899)
    const checkbox = document.querySelector('input[value="Q57354899"]');
    checkbox.checked = true;

    document.getElementById('tags-filter-apply').click();

    const rows = document.querySelectorAll('#tags-filter-table-body tr');
    expect(rows.length).toBe(3);
    expect(rows[0].textContent).toContain('Salud en Bolivia');
    expect(rows[1].textContent).toContain('Salud en Brasil');
    expect(rows[2].textContent).toContain('Salud en Chile');
  });
});
