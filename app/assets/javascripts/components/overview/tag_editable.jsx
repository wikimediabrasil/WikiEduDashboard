import React, { useEffect } from 'react';
import CreatableSelect from 'react-select/creatable';
import { useDispatch, useSelector } from 'react-redux';

import { getAvailableTags } from '../../selectors';
import selectStyles from '../../styles/select';
import CourseUtils from '../../utils/course_utils.js';
import { removeTag, fetchAllTags, addTag } from '../../actions/tag_actions';
import { tagText } from './tag_list.jsx';

const optionForTag = tag => ({ label: tagText(tag), value: tag.tag });

// Uses the same multi-value select pattern as Tracked Wikis, so selected tags
// are visible and removable directly inside the field.
const TagEditable = ({ course, course_id }) => {
  const tags = useSelector(state => state.tags.tags);
  const dispatch = useDispatch();
  const availableTags = useSelector(state => getAvailableTags(state));

  useEffect(() => { dispatch(fetchAllTags()); }, []);

  const selectedOptions = tags.map(optionForTag);
  const options = availableTags.map(tag => ({ label: tag, value: tag }));

  const handleChange = (nextOptions = []) => {
    const nextValues = new Set(nextOptions.map(option => option.value));
    const currentValues = new Set(tags.map(tag => tag.tag));

    tags.forEach((tag) => {
      if (!nextValues.has(tag.tag)) dispatch(removeTag(course_id, tag.tag));
    });

    nextOptions.forEach((option) => {
      if (!currentValues.has(option.value)) dispatch(addTag(course_id, option.value));
    });
  };

  const label = CourseUtils.i18n('tags', course.string_prefix);

  return (
    <div className="form-group tags tag-selector">
      <label id="course-tags-label" htmlFor="course-tags" className="text-input-component__label">
        <strong>{label}:&nbsp;</strong>
      </label>
      <CreatableSelect
        id="course-tags"
        aria-labelledby="course-tags-label"
        className="multi-wiki-selector"
        closeMenuOnSelect={false}
        isClearable={false}
        isMulti
        noOptionsMessage={() => I18n.t('courses.tag_select')}
        onChange={handleChange}
        options={options}
        placeholder={I18n.t('courses.tag_select')}
        styles={{ ...selectStyles, singleValue: null }}
        value={selectedOptions}
      />
    </div>
  );
};

export default TagEditable;
