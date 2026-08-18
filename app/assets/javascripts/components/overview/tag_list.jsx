import React from 'react';
import { connect } from 'react-redux';
import { map } from 'lodash-es';

import CourseUtils from '../../utils/course_utils.js';

// Legacy administrative tags are strings, while course-topic labels are objects.
// The latter can be returned alongside tags for courses that use Wikidata labels.
export const tagText = (tag) => {
  if (typeof tag.tag !== 'object' || tag.tag === null) return tag.tag;

  return tag.tag.label || tag.tag.match || '';
};

const TagList = ({ tags, course }) => {
  const lastIndex = tags.length - 1;
  const renderedTags = (tags.length > 0
    ? map(tags, (tag, index) => {
      const comma = (index !== lastIndex) ? ', ' : '';
      const text = tagText(tag);
      return <span key={`${text}${tag.id}`}>{text}{comma}</span>;
    })
    : <span>{I18n.t('courses.none')}</span>);

  return (
    <span key="tags_list" className="tags">
      <strong>{CourseUtils.i18n('tags', course.string_prefix)}</strong>
      <span> {renderedTags}</span>
    </span>
  );
};

const mapStateToProps = state => ({
  tags: state.tags.tags
});

export default connect(mapStateToProps)(TagList);
