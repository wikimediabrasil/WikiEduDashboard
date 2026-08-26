import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import { useDispatch, useSelector } from 'react-redux';

import { fetchCourseWikidataLabels } from '../../actions/course_wikidata_label_actions';
import { wikidataLabelText } from '../../utils/wikidata_label_utils';

const CourseTags = ({ course }) => {
  const dispatch = useDispatch();
  const courseLabels = useSelector(state => state.wikidataLabels.courseLabels);

  useEffect(() => {
    document.title = `${course.title} - ${I18n.t('courses.tags_page_title')}`;
    dispatch(fetchCourseWikidataLabels(course.slug));
  }, [course.slug]);

  const tagGallery = courseLabels.length > 0 ? (
    <div className="course-tags-gallery">
      {courseLabels.map((label, index) => (
        <a
          className={`course-tag-card course-tag-card--${(index % 3) + 1}`}
          href={label.url}
          key={label.match}
          target="_blank"
          rel="noopener noreferrer"
        >
          <span className="course-tag-card__index">{String(index + 1).padStart(2, '0')}</span>
          <span className="course-tag-card__content">
            <span className="course-tag-card__label">{wikidataLabelText(label.label)}</span>
            <span className="course-tag-card__description">
              {label.description || I18n.t('courses.tags_no_description')}
            </span>
          </span>
          <span className="course-tag-card__meta">
            <span className="course-tag-card__qid">{label.match}</span>
            <span className="course-tag-card__arrow" aria-hidden="true">↗</span>
          </span>
        </a>
      ))}
    </div>
  ) : (
    <div className="course-tags-empty">
      <span className="course-tags-empty__mark" aria-hidden="true">#</span>
      <p>{I18n.t('courses.none')}</p>
    </div>
  );

  return (
    <div id="course-tags" className="course-tags-page">
      <header className="course-tags-header">
        <div>
          <span className="course-tags-header__eyebrow">{I18n.t('courses.wikidata_labels')}</span>
          <h3>{I18n.t('courses.tags_page_title')}</h3>
          <p>{I18n.t('courses.tags_page_description')}</p>
        </div>
        <div className="course-tags-header__total" aria-label={I18n.t('courses.tags_total', { count: courseLabels.length })}>
          <strong>{courseLabels.length}</strong>
          <span>{I18n.t('courses.tags_count_label')}</span>
        </div>
      </header>

      <section className="course-tags-index" aria-label={I18n.t('courses.tags_page_title')}>
        <div className="course-tags-index__heading">
          <span>{I18n.t('courses.tags_topic_index')}</span>
          <span>{course.title}</span>
        </div>
        {tagGallery}
      </section>
    </div>
  );
};

CourseTags.propTypes = {
  course: PropTypes.shape({
    title: PropTypes.string,
    slug: PropTypes.string,
  }).isRequired,
};

export default CourseTags;
