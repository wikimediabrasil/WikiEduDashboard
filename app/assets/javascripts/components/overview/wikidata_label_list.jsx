import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import { useDispatch, useSelector } from 'react-redux';
import { fetchCourseWikidataLabels } from '../../actions/course_wikidata_label_actions';

const WikidataLabelList = ({ course }) => {
  const dispatch = useDispatch();
  const courseLabels = useSelector(state => state.wikidataLabels.courseLabels);

  useEffect(() => {
    dispatch(fetchCourseWikidataLabels(course.slug));
  }, [course.slug]);

  if (!courseLabels.length) {
    return (
      <span key="wikidata_labels_list" className="wikidata-labels-list">
        <strong>{I18n.t('courses.wikidata_labels')}</strong>
        {' '}
        <span>{I18n.t('courses.none')}</span>
      </span>
    );
  }

  return (
    <span key="wikidata_labels_list" className="wikidata-labels-list">
      <strong>{I18n.t('courses.wikidata_labels')}</strong>
      {' '}
      {courseLabels.map((lbl, i) => (
        <span key={lbl.match}>
          <a href={lbl.url} target="_blank" rel="noopener noreferrer" title={lbl.description}>
            {lbl.label}
          </a>
          {i < courseLabels.length - 1 ? ', ' : ''}
        </span>
      ))}
    </span>
  );
};

WikidataLabelList.propTypes = {
  course: PropTypes.shape({ slug: PropTypes.string.isRequired }).isRequired,
};

export default WikidataLabelList;
