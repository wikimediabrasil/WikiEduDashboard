window.DISABLE_COURSES_LISTJS = true;

document.addEventListener('DOMContentLoaded', () => {
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

  const setupDatePicker = (selector) => {
    const input = document.querySelector(selector);
    if (!input) return;
    flatpickr(input, {
      altInput: true,
      altFormat: dateFormat,
      dateFormat: 'Y-m-d',
      defaultDate: input.value || null,
      locale: isLatin ? currentLocale : 'default',
      allowInput: true,
    });
  };

  setupDatePicker('#creation_start');
  setupDatePicker('#creation_end');
  setupDatePicker('#start_date_start');
  setupDatePicker('#start_date_end');

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
