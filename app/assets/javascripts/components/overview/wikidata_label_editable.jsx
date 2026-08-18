import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import AsyncSelect from 'react-select/async';
import { useDispatch, useSelector } from 'react-redux';

import Conditional from '../high_order/conditional.jsx';
import {
  fetchCourseWikidataLabels,
  addCourseWikidataLabel,
  removeCourseWikidataLabel,
} from '../../actions/course_wikidata_label_actions';
import selectStyles from '../../styles/select';
import { searchLabelOptions } from '../../utils/wikidata_label_search';

const WikidataLabelEditable = ({ course }) => {
  const dispatch = useDispatch();
  const courseLabels = useSelector(state => state.wikidataLabels.courseLabels);

  useEffect(() => {
    dispatch(fetchCourseWikidataLabels(course.slug));
  }, [course.slug]);

  const selectedLabels = courseLabels.map(label => ({
    ...label,
    value: label.match,
    label: label.label,
  }));

  const loadOptions = async (query) => {
    if (!query.trim()) return [];

    const suggestions = await searchLabelOptions(query);
    return suggestions.map(suggestion => ({
      ...suggestion,
      value: suggestion.match || suggestion.qNumber,
      label: suggestion.label,
    }));
  };

  const handleChange = (nextLabels) => {
    const selected = nextLabels || [];
    const selectedQNumbers = new Set(selected.map(label => label.value));
    const existingQNumbers = new Set(courseLabels.map(label => label.match));

    courseLabels
      .filter(label => !selectedQNumbers.has(label.match))
      .forEach(label => dispatch(removeCourseWikidataLabel(course.slug, label.match)));

    selected
      .filter(label => !existingQNumbers.has(label.value))
      .forEach(label => dispatch(addCourseWikidataLabel(course.slug, {
        qNumber: label.value,
        label: label.label,
        url: label.url,
        description: label.description || '',
      })));
  };

  return (
    <div className="wikidata-label-editor">
      <label
        id="wikidata-labels-label"
        className="text-input-component__label"
        htmlFor="wikidata-labels"
      >
        <strong>{I18n.t('courses.wikidata_labels')}:</strong>
      </label>
      <AsyncSelect
        id="wikidata-labels"
        aria-labelledby="wikidata-labels-label"
        className="multi-wiki-selector"
        closeMenuOnSelect={false}
        isMulti
        loadOptions={loadOptions}
        noOptionsMessage={() => I18n.t('courses.wikidata_label_search_placeholder')}
        onChange={handleChange}
        placeholder={I18n.t('courses.wikidata_label_search_placeholder')}
        styles={selectStyles}
        value={selectedLabels}
        formatOptionLabel={(option, { context }) => (
          <>
            {option.label}
            {context === 'menu' && ` (${option.value})`}
          </>
        )}
      />
    </div>
  );
};

WikidataLabelEditable.propTypes = {
  course: PropTypes.shape({
    slug: PropTypes.string.isRequired,
  }).isRequired,
};

export default Conditional(WikidataLabelEditable);
