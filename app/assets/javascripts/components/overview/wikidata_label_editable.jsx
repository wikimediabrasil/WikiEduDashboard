import React, { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { useDispatch, useSelector } from 'react-redux';

import Popover from '../common/popover.jsx';
import Conditional from '../high_order/conditional.jsx';
import {
  fetchCourseWikidataLabels,
  addCourseWikidataLabel,
  removeCourseWikidataLabel,
} from '../../actions/course_wikidata_label_actions';
import useExpandablePopover from '../../hooks/useExpandablePopover';
import { searchLabelOptions } from '../../utils/wikidata_label_search';

const WikidataLabelEditable = ({ course }) => {
  const dispatch = useDispatch();
  const courseLabels = useSelector(state => state.wikidataLabels.courseLabels);

  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [searching, setSearching] = useState(false);
  const searchTimeout = useRef(null);

  const getKey = () => 'wikidata_label_editable';
  const { isOpen, ref, open } = useExpandablePopover(getKey);

  useEffect(() => {
    dispatch(fetchCourseWikidataLabels(course.slug));
  }, [course.slug]);

  const handleQueryChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    clearTimeout(searchTimeout.current);
    if (!val.trim()) {
      setSuggestions([]);
      return;
    }
    setSearching(true);
    searchTimeout.current = setTimeout(async () => {
      try {
        const results = await searchLabelOptions(val);
        setSuggestions(results);
      } catch (_) {
        setSuggestions([]);
      } finally {
        setSearching(false);
      }
    }, 350);
  };

  const handleAdd = (suggestion) => {
    dispatch(addCourseWikidataLabel(course.slug, {
      qNumber: suggestion.match || suggestion.qNumber,
      label: suggestion.label,
      url: suggestion.url,
      description: suggestion.description || '',
    }));
    setQuery('');
    setSuggestions([]);
  };

  const handleRemove = (qNumber) => {
    dispatch(removeCourseWikidataLabel(course.slug, qNumber));
  };

  const labelRows = courseLabels.map(lbl => (
    <tr key={lbl.match}>
      <td>
        <a href={lbl.url} target="_blank" rel="noopener noreferrer" title={lbl.description}>
          {lbl.label}
        </a>
        {' '}
        <span className="tag-qnum">({lbl.match})</span>
        <button
          className="button border plus"
          aria-label={`Remove ${lbl.label}`}
          onClick={() => handleRemove(lbl.match)}
        >
          -
        </button>
      </td>
    </tr>
  ));

  const addRow = (
    <tr>
      <th>
        <div className="wikidata-label-search-wrapper">
          <input
            type="text"
            className="wikidata-label-search-input"
            placeholder={I18n.t('courses.wikidata_label_search_placeholder')}
            value={query}
            onChange={handleQueryChange}
            aria-label={I18n.t('courses.wikidata_label_search_placeholder')}
          />
          {searching && <span className="wikidata-label-searching">…</span>}
          {suggestions.length > 0 && (
            <ul className="wikidata-label-suggestions">
              {suggestions.map(s => (
                <li
                  key={s.match || s.qNumber}
                  className="wikidata-label-suggestion"
                  onClick={() => handleAdd(s)}
                  onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && handleAdd(s)}
                  role="option"
                  tabIndex={0}
                  aria-selected="false"
                >
                  <span className="wikidata-label-suggestion__label">{s.label}</span>
                  <span className="wikidata-label-suggestion__id">{s.match || s.qNumber}</span>
                  {s.description && (
                    <span className="wikidata-label-suggestion__desc">{s.description}</span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </th>
    </tr>
  );

  return (
    <div key="wikidata_labels" className="pop__container wikidata-labels open" ref={ref}>
      <button
        className="button border plus open"
        onClick={open}
        aria-label={I18n.t('courses.wikidata_label_add_aria_label')}
      >
        +
      </button>
      <Popover
        is_open={isOpen}
        edit_row={addRow}
        rows={labelRows}
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
