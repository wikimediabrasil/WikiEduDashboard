import '../testHelper';

import React from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react-dom/test-utils';
import { MemoryRouter } from 'react-router-dom';
import LabelSearchFilter from '../../app/assets/javascripts/components/common/label_search_filter';
import CampaignNavbar from '../../app/assets/javascripts/components/common/campaign_navbar';
import {
  localizeLabelOptions,
  searchLabelOptions,
} from '../../app/assets/javascripts/utils/wikidata_label_search';

jest.mock('../../app/assets/javascripts/utils/wikidata_label_search', () => ({
  localizeLabelOptions: jest.fn(options => Promise.resolve(options)),
  searchLabelOptions: jest.fn(),
}));

global.IS_REACT_ACT_ENVIRONMENT = true;

describe('LabelSearchFilter', () => {
  let container;
  let root;

  beforeEach(() => {
    jest.useFakeTimers();
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  const renderFilter = (props = {}) => {
    const defaultProps = {
      selectedTags: [],
      onChange: jest.fn(),
      placeholder: 'Search programs or tags',
      inputName: 'title_query',
      inputId: 'campaign_search_query',
      initialQuery: '',
    };
    const allProps = { ...defaultProps, ...props };

    act(() => root.render(<LabelSearchFilter {...allProps} />));
    return allProps;
  };

  test('renders a named text input for the unified campaign search', () => {
    renderFilter({ initialQuery: 'Biology' });

    const input = container.querySelector('#campaign_search_query');
    expect(input.name).toBe('title_query');
    expect(input.value).toBe('Biology');
  });

  test('searches for and selects a Wikidata tag', async () => {
    const sport = {
      match: 'Q349', label: 'Sport', description: 'physical activity',
      url: 'https://www.wikidata.org/wiki/Q349'
    };
    searchLabelOptions.mockResolvedValue([sport]);
    const props = renderFilter();
    const input = container.querySelector('#campaign_search_query');
    const valueSetter = Object.getOwnPropertyDescriptor(
      window.HTMLInputElement.prototype, 'value'
    ).set;

    act(() => {
      valueSetter.call(input, 'sport');
      input.dispatchEvent(new Event('input', { bubbles: true }));
    });
    await act(async () => {
      jest.advanceTimersByTime(350);
      await Promise.resolve();
    });

    const option = container.querySelector('[role="option"]');
    expect(option).not.toBeNull();
    expect(option.getAttribute('aria-selected')).toBe('false');

    act(() => option.dispatchEvent(new MouseEvent('mousedown', { bubbles: true })));
    expect(props.onChange).toHaveBeenCalledWith([sport]);
  });

  test('toggles a selected tag between include and exclude modes', () => {
    const sport = {
      match: 'Q349', label: 'Sport', description: 'physical activity',
      url: 'https://www.wikidata.org/wiki/Q349', excluded: false
    };
    const props = renderFilter({ selectedTags: [sport] });

    const chip = container.querySelector('[data-tag-id="Q349"]');
    expect(chip.getAttribute('data-filter-mode')).toBe('include');

    act(() => chip.querySelector('.wikidata-tags-chip__mode').click());

    expect(props.onChange).toHaveBeenCalledWith([{ ...sport, excluded: true }]);
  });

  test('does not replace newer suggestions with a slower previous search', async () => {
    let resolveSoccer;
    let resolveSport;
    searchLabelOptions
      .mockReturnValueOnce(new Promise(resolve => { resolveSoccer = resolve; }))
      .mockReturnValueOnce(new Promise(resolve => { resolveSport = resolve; }));
    renderFilter();
    const input = container.querySelector('#campaign_search_query');
    const valueSetter = Object.getOwnPropertyDescriptor(
      window.HTMLInputElement.prototype, 'value'
    ).set;

    act(() => {
      valueSetter.call(input, 'soccer');
      input.dispatchEvent(new Event('input', { bubbles: true }));
      jest.advanceTimersByTime(350);
    });
    act(() => {
      valueSetter.call(input, 'sport');
      input.dispatchEvent(new Event('input', { bubbles: true }));
      jest.advanceTimersByTime(350);
    });

    await act(async () => {
      resolveSport([{
        match: 'Q349', label: 'Sport', description: 'competitive activity',
        url: 'https://www.wikidata.org/wiki/Q349'
      }]);
      await Promise.resolve();
    });
    expect(container.querySelector('.wikidata-tags-option__label').textContent).toBe('Sport');

    await act(async () => {
      resolveSoccer([{
        match: 'Q2736', label: 'association football', description: 'team sport',
        url: 'https://www.wikidata.org/wiki/Q2736'
      }]);
      await Promise.resolve();
    });
    expect(container.querySelector('.wikidata-tags-option__label').textContent).toBe('Sport');
  });

  test('restores selected tags in the campaign navigation search form', async () => {
    const tag = {
      qNumber: 'Q349', label: 'Sport', description: 'physical activity',
      url: 'https://www.wikidata.org/wiki/Q349'
    };
    const searchParams = new URLSearchParams();
    searchParams.append('tag_details[]', JSON.stringify(tag));
    const entry = `/campaigns/example/programs?${searchParams.toString()}`;

    await act(async () => {
      root.render(
        <MemoryRouter
          initialEntries={[entry]}
          future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
        >
          <CampaignNavbar campaign={{ slug: 'example', title: 'Example', course_string_prefix: 'courses' }} />
        </MemoryRouter>
      );
      await Promise.resolve();
    });

    const form = container.querySelector('.campaign-nav__search form');
    const hiddenTag = form.querySelector('input[name="tag_details[]"]');
    expect(form.getAttribute('action')).toBe('/campaigns/example/programs');
    expect(form.querySelector('input[name="title_query"]')).not.toBeNull();
    expect(JSON.parse(hiddenTag.value)).toEqual(tag);
    expect(container.textContent).toContain('Sport');
  });

  test('refreshes restored tag labels and descriptions in the dashboard language', async () => {
    const tag = {
      qNumber: 'Q349', label: 'Sport', description: 'physical activity',
      url: 'https://www.wikidata.org/wiki/Q349'
    };
    localizeLabelOptions.mockResolvedValueOnce([{
      match: 'Q349', label: 'Deporte', description: 'actividad recreativa',
      url: 'https://www.wikidata.org/wiki/Q349', excluded: false,
    }]);
    const searchParams = new URLSearchParams();
    searchParams.append('tag_details[]', JSON.stringify(tag));

    await act(async () => {
      root.render(
        <MemoryRouter
          initialEntries={[`/campaigns/example/programs?${searchParams.toString()}`]}
          future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
        >
          <CampaignNavbar campaign={{ slug: 'example', title: 'Example', course_string_prefix: 'courses' }} />
        </MemoryRouter>
      );
      await Promise.resolve();
    });

    expect(container.textContent).toContain('Deporte');
    expect(container.querySelector('[data-tag-id="Q349"] a').title).toBe('actividad recreativa');
  });

  test('submits selected tags from the tags page to the filtered programs list', async () => {
    const tag = {
      qNumber: 'Q349', label: 'Sport', description: 'physical activity',
      url: 'https://www.wikidata.org/wiki/Q349'
    };
    const searchParams = new URLSearchParams();
    searchParams.append('tag_details[]', JSON.stringify(tag));
    const entry = `/campaigns/example/tags?${searchParams.toString()}`;

    await act(async () => {
      root.render(
        <MemoryRouter
          initialEntries={[entry]}
          future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
        >
          <CampaignNavbar campaign={{ slug: 'example', title: 'Example', course_string_prefix: 'courses' }} />
        </MemoryRouter>
      );
      await Promise.resolve();
    });

    const form = container.querySelector('.campaign-nav__search form');
    expect(form.getAttribute('action')).toBe('/campaigns/example/programs');
    expect(form.querySelector('input[name="title_query"]')).not.toBeNull();
    expect(form.querySelector('input[name="tag_query"]')).toBeNull();
    expect(form.querySelector('input[name="tag_details[]"]')).not.toBeNull();
  });

  test('restores and submits reverse tags as exclusions', async () => {
    const tag = {
      qNumber: 'Q349', label: 'Sport', description: 'physical activity',
      url: 'https://www.wikidata.org/wiki/Q349'
    };
    const searchParams = new URLSearchParams();
    searchParams.append('excluded_tag_details[]', JSON.stringify(tag));
    const entry = `/campaigns/example/programs?${searchParams.toString()}`;

    await act(async () => {
      root.render(
        <MemoryRouter
          initialEntries={[entry]}
          future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
        >
          <CampaignNavbar campaign={{ slug: 'example', title: 'Example', course_string_prefix: 'courses' }} />
        </MemoryRouter>
      );
      await Promise.resolve();
    });

    const form = container.querySelector('.campaign-nav__search form');
    const chip = form.querySelector('[data-tag-id="Q349"]');
    expect(chip.getAttribute('data-filter-mode')).toBe('exclude');
    expect(form.querySelector('input[name="tag_details[]"]')).toBeNull();
    expect(form.querySelector('input[name="excluded_tag_details[]"]')).not.toBeNull();
  });
});
