import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import { useDispatch, useSelector } from 'react-redux';
import AsyncSelect from 'react-select/async';

import {
  fetchCourseWikidataLabels,
  addCourseWikidataLabel,
  removeCourseWikidataLabel,
} from '../../actions/course_wikidata_label_actions';
import { searchLabelOptions } from '../../utils/wikidata_label_search';
import { wikidataLabelText } from '../../utils/wikidata_label_utils';
import selectStyles from '../../styles/select';

const optionForLabel = label => ({
  value: label.match,
  label: wikidataLabelText(label.label),
  labelData: label,
});

const wikidataTagStyles = {
  ...selectStyles,
  multiValue: base => ({
    ...selectStyles.multiValue(base),
    backgroundColor: '#676EB4',
    borderColor: '#676EB4',
  }),
  multiValueLabel: base => ({ ...base, color: 'white' }),
  multiValueRemove: base => ({
    ...base,
    backgroundColor: '#676EB4',
    color: 'white',
    '&:hover': { backgroundColor: '#525993', color: 'white' },
  }),
};

const WikidataLabelEditable = ({ course }) => {
  const dispatch = useDispatch();
  const courseLabels = useSelector(state => state.wikidataLabels.courseLabels);

  useEffect(() => {
    dispatch(fetchCourseWikidataLabels(course.slug));
  }, [course.slug]);

  const loadOptions = async (query) => {
    if (!query.trim()) return [];

    try {
      return (await searchLabelOptions(query)).map(optionForLabel);
    } catch (_) {
      return [];
    }
  };

  const handleChange = (nextOptions = []) => {
    const nextMatches = new Set(nextOptions.map(option => option.value));
    const currentMatches = new Set(courseLabels.map(label => label.match));

    courseLabels.forEach((label) => {
      if (!nextMatches.has(label.match)) {
        dispatch(removeCourseWikidataLabel(course.slug, label.match));
      }
    });

    nextOptions.forEach((option) => {
      if (currentMatches.has(option.value)) return;

      const label = option.labelData;
      dispatch(addCourseWikidataLabel(course.slug, {
        qNumber: option.value,
        label: label.label,
        url: label.url,
        description: label.description || '',
      }));
    });
  };

  return (
    <div className="form-group wikidata-labels wikidata-label-selector">
      <label id="wikidata-labels-label" htmlFor="wikidata-labels" className="text-input-component__label">
        <strong>{I18n.t('courses.wikidata_labels')}:&nbsp;</strong>
      </label>
      <AsyncSelect
        id="wikidata-labels"
        aria-labelledby="wikidata-labels-label"
        cacheOptions
        className="multi-wiki-selector"
        closeMenuOnSelect={false}
        defaultOptions={false}
        formatOptionLabel={(option, { context }) => (
          context === 'value' ? option.label : (
            <div>
              <strong>{option.label}</strong> <span className="tag-qnum">({option.value})</span>
              {option.labelData.description && <div>{option.labelData.description}</div>}
            </div>
          )
        )}
        isClearable={false}
        isMulti
        loadOptions={loadOptions}
        noOptionsMessage={() => I18n.t('courses.wikidata_label_search_placeholder')}
        onChange={handleChange}
        placeholder={I18n.t('courses.wikidata_label_search_placeholder')}
        styles={{ ...wikidataTagStyles, singleValue: null }}
        value={courseLabels.map(optionForLabel)}
      />
    </div>
  );
};

WikidataLabelEditable.propTypes = {
  course: PropTypes.shape({
    slug: PropTypes.string.isRequired,
  }).isRequired,
};

export default WikidataLabelEditable;
