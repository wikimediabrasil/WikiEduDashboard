import React, { useEffect } from 'react';
import PropTypes from 'prop-types';

import WikidataLabelList from '../overview/wikidata_label_list.jsx';
import WikidataLabelEditable from '../overview/wikidata_label_editable.jsx';

const CourseTags = ({ course, current_user: currentUser }) => {
  useEffect(() => {
    document.title = `${course.title} - ${I18n.t('courses.tags_page_title')}`;
  }, []);

  return (
    <div id="course-tags" className="w75">
      <div className="section-header">
        <h3>{I18n.t('courses.tags_page_title')}</h3>
        <p>{I18n.t('courses.tags_page_description')}</p>
      </div>
      <div className="tags">
        <WikidataLabelList course={course} />
        {currentUser.isAdmin && (
          <WikidataLabelEditable course={course} show={currentUser.isAdmin} />
        )}
      </div>
    </div>
  );
};

CourseTags.propTypes = {
  course: PropTypes.shape({
    title: PropTypes.string,
    slug: PropTypes.string,
  }).isRequired,
  current_user: PropTypes.shape({
    isAdmin: PropTypes.bool,
  }),
};

export default CourseTags;
