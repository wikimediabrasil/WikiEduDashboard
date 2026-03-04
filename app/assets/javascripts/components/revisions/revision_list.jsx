import React, { useState } from 'react';
import PropTypes from 'prop-types';
import List from '../common/list.jsx';
import Revision from './revision.jsx';
import CourseUtils from '../../utils/course_utils.js';
import ArticleUtils from '../../utils/article_utils.js';

const RevisionPagination = ({ totalItems, itemsPerPage, currentPage, onPageChange, totalPages }) => {
  const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1);
  return (
    <>
      <div className="pagination" style={{ margin: '5px 10px' }}>
        <a
          className={`previous_page ${currentPage === 1 ? 'disabled' : ''}`}
          onClick={(e) => {
            e.preventDefault();
            if (currentPage > 1) onPageChange(currentPage - 1);
          }}
          href="#"
        >
          {I18n.t('articles.previous')}
        </a>
        {
          pageNumbers.map(number => (
            <a
              key={number}
              className={currentPage === number ? 'current' : ''}
              onClick={(e) => {
                e.preventDefault();
                if (currentPage !== number) onPageChange(number);
              }}
              href="#"
              style={currentPage === number ? {
                cursor: 'default',
                backgroundColor: '#676eb4',
                color: '#fff',
                border: 'none'
              } : {}}
            >
              {number}
            </a>
          ))
        }
        <a
          className={`next_page ${currentPage === totalPages ? 'disabled' : ''}`}
          onClick={(e) => {
            e.preventDefault();
            if (currentPage < totalPages) onPageChange(currentPage + 1);
          }}
          href="#"
        >
          {I18n.t('articles.next')}
        </a>
      </div>
      <div className="page-entries-info" style={{ textAlign: 'center', color: '#666', fontSize: '14px', marginTop: '0' }}>
        {I18n.t('articles.page_info', {
          current: currentPage,
          total_pages: totalPages,
          count: itemsPerPage,
          total: totalItems
        })}
      </div>
    </>
  );
};

const RevisionList = ({ revisions, course, sortBy, wikidataLabels, sort, loaded, students }) => {
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const showDiff = (index) => {
    setSelectedIndex(index);
  };

  const [page, setPage] = React.useState(1);
  const perPage = 15;
  const paginatedRevisions = revisions.slice((page - 1) * perPage, page * perPage);
  const totalPages = Math.ceil(revisions.length / perPage);

  const elements = paginatedRevisions.map((revision, index) => (
    <Revision
      revision={revision}
      key={revision.id}
      index={index}
      wikidataLabel={wikidataLabels[CourseUtils.removeNamespace(revision.title)]}
      course={course}
      setSelectedIndex={showDiff}
      lastIndex={revisions.length}
      selectedIndex={selectedIndex}
      student={students.find(student => student.username === revision.revisor)}
    />
  ));

  const keys = {
    rating_num: {
      label: I18n.t('revisions.class'),
      desktop_only: true
    },
    title: {
      label: I18n.t('revisions.title'),
      desktop_only: false
    },
    revisor: {
      label: I18n.t('revisions.edited_by'),
      desktop_only: true
    },
    characters: {
      label: I18n.t('revisions.chars_added'),
      desktop_only: true
    },
    references_added: {
      label: I18n.t('revisions.references'),
      desktop_only: true,
      info_key: `metrics.${ArticleUtils.projectSuffix(course.home_wiki.project, 'references_doc')}`
    },
    date: {
      label: I18n.t('revisions.date_time'),
      desktop_only: true,
      info_key: 'revisions.time_doc'
    }
  };
  if (sort.key) {
    const order = sort.sortKey ? 'asc' : 'desc';
    keys[sort.key].order = order;
  }

  // Until the revisions are loaded, we do not pass the none_message prop
  // This is done to avoid showing the none_message when the revisions are loading
  // initially because at that time the revisions is an empty array
  // Whether or not the revisions is really an empty array is confirmed after the revisions
  // are successfully loaded
  return (
    <>
      <List
        elements={elements}
        keys={keys}
        table_key="revisions"
        none_message={loaded ? CourseUtils.i18n('revisions_none', course.string_prefix) : ''}
        sortBy={sortBy}
        sortable={true}
      />
      <RevisionPagination
        totalItems={revisions.length}
        itemsPerPage={perPage}
        currentPage={page}
        onPageChange={setPage}
        totalPages={totalPages}
      />
    </>
  );
};

RevisionList.propTypes = {
  revisions: PropTypes.array,
  course: PropTypes.object,
  sortBy: PropTypes.func,
  wikidataLabels: PropTypes.object,
  sort: PropTypes.object,
  loaded: PropTypes.bool,
  students: PropTypes.array
};

export default RevisionList;
