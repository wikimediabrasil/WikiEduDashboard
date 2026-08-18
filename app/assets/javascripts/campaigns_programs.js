import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import LabelSearchFilter from './components/common/label_search_filter';
import { localizeLabelOptions } from './utils/wikidata_label_search';

window.DISABLE_COURSES_LISTJS = true;

const serializedTag = tag => JSON.stringify({
  qNumber: tag.match,
  label: tag.label,
  description: tag.description || '',
  url: `https://www.wikidata.org/wiki/${tag.match}`,
});

const ProgramTagFilter = ({ initialTags }) => {
  const [selectedTags, setSelectedTags] = useState(initialTags);

  useEffect(() => {
    let cancelled = false;
    localizeLabelOptions(initialTags).then((localizedTags) => {
      if (!cancelled) setSelectedTags(localizedTags);
    });
    return () => { cancelled = true; };
  }, []);

  return (
    <>
      <LabelSearchFilter
        selectedTags={selectedTags}
        onChange={setSelectedTags}
        placeholder={I18n.t('campaign.search_programs_and_tags')}
        inputId="program_tag_search_input"
      />
      {selectedTags.map(tag => (
        <input
          key={tag.match}
          type="hidden"
          name={tag.excluded ? 'excluded_tag_details[]' : 'tag_details[]'}
          value={serializedTag(tag)}
        />
      ))}
    </>
  );
};

document.addEventListener('DOMContentLoaded', () => {
  const programTagSearch = document.getElementById('program_tag_search');
  if (programTagSearch) {
    const initialTags = JSON.parse(programTagSearch.dataset.selectedTags || '[]');
    createRoot(programTagSearch).render(<ProgramTagFilter initialTags={initialTags} />);
  }

  const toggleAdvancedSearchBtn = document.getElementById('toggle_advanced_search');
  const advancedSearchFields = document.getElementById('advanced_search_fields');

  if (toggleAdvancedSearchBtn && advancedSearchFields) {
    toggleAdvancedSearchBtn.addEventListener('click', () => {
      advancedSearchFields.classList.toggle('hidden');
      const icon = toggleAdvancedSearchBtn.querySelector('.icon');
      if (icon) {
        if (advancedSearchFields.classList.contains('hidden')) {
          icon.classList.remove('icon-arrow-up');
          icon.classList.add('icon-arrow-down');
        } else {
          icon.classList.remove('icon-arrow-down');
          icon.classList.add('icon-arrow-up');
        }
      }
    });
  }

  if (typeof TomSelect !== 'undefined') {

    new TomSelect('#school_select', {
      plugins: ['remove_button'],
      placeholder: `${I18n.t('assignments.select')} ${I18n.t('courses_generic.creator.course_school')}...`,
      allowEmptyOption: true
    });
  }

  // This controls the date display format for flatpickr.
  // Additional locales can be registered in main.js (flatpickrLocales)
  // and added to the isLatin check below as needed.
  const isLatin = ['es', 'pt'].some(l => locale.startsWith(l));
  const currentLocale = locale.split('-')[0];
  const dateFormat = isLatin ? 'd/m/Y' : 'm/d/Y';

  const setupRangePicker = (rangeSelector, startSelector, endSelector) => {
    const startInput = document.querySelector(startSelector);
    const endInput = document.querySelector(endSelector);
    const startVal = startInput.value;
    const endVal = endInput.value;
    const defaultDate = (startVal && endVal) ? [startVal, endVal] : null;

    flatpickr(rangeSelector, {
      mode: 'range',
      altInput: true,
      altFormat: dateFormat,
      dateFormat: 'Y-m-d',
      defaultDate,
      locale: isLatin ? currentLocale : 'default',
      allowInput: true,
      onClose(selectedDates, dateStr, instance) {
        if (selectedDates.length === 2) {
          startInput.value = instance.formatDate(selectedDates[0], 'Y-m-d');
          endInput.value = instance.formatDate(selectedDates[1], 'Y-m-d');
        } else {
          startInput.value = '';
          endInput.value = '';
        }
      }
    });
  };

  setupRangePicker('#creation_date_range', '#creation_start', '#creation_end');
  setupRangePicker('#start_date_range', '#start_date_start', '#start_date_end');

  document.querySelector('#clear_filters')?.addEventListener('click', () => {
    const form = document.getElementById('campaign_search_form');
    const fields = form.querySelectorAll('input, select');
    fields.forEach((field) => {
      if (field.name === 'sort' || field.name === 'direction') return;
      field.disabled = true;
    });
    form.action = `${form.action.replace(/#.*$/, '')}#courses_table`;
    form.submit();
  });
});
