import React, { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { searchLabelOptions } from '../../utils/wikidata_label_search';

const LabelSearchFilter = ({ selectedTags, onChange, placeholder, inputName, inputId, initialQuery }) => {
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const debounceRef = useRef(null);
  const searchRequestRef = useRef(0);
  const containerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!containerRef.current?.contains(event.target)) {
        setDropdownOpen(false);
        setResults([]);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => {
      clearTimeout(debounceRef.current);
      searchRequestRef.current += 1;
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

  const runSearch = async (searchQuery) => {
    const requestId = searchRequestRef.current + 1;
    searchRequestRef.current = requestId;
    setLoading(true);
    try {
      const options = await searchLabelOptions(searchQuery);
      if (requestId !== searchRequestRef.current) return;
      const selectedMatches = new Set(selectedTags.map(tag => tag.match));
      const availableOptions = options.filter(option => !selectedMatches.has(option.match));
      setResults(availableOptions);
      setDropdownOpen(availableOptions.length > 0);
    } catch (_error) {
      if (requestId !== searchRequestRef.current) return;
      setResults([]);
      setDropdownOpen(false);
    } finally {
      if (requestId === searchRequestRef.current) setLoading(false);
    }
  };

  const handleInputChange = (event) => {
    const value = event.target.value;
    setQuery(value);
    clearTimeout(debounceRef.current);
    if (value.trim().length < 2) {
      searchRequestRef.current += 1;
      setLoading(false);
      setResults([]);
      setDropdownOpen(false);
      return;
    }
    debounceRef.current = setTimeout(() => runSearch(value.trim()), 350);
  };

  const selectTag = (tag) => {
    onChange([...selectedTags, tag]);
    setQuery('');
    setResults([]);
    setDropdownOpen(false);
  };

  const removeTag = (match) => {
    onChange(selectedTags.filter(tag => tag.match !== match));
  };

  const toggleTagMode = (match) => {
    onChange(selectedTags.map(tag => (
      tag.match === match ? { ...tag, excluded: !tag.excluded } : tag
    )));
  };

  return (
    <div className="wikidata-tags-widget" ref={containerRef}>
      <div className="wikidata-tags-chips" aria-live="polite">
        {selectedTags.map((tag) => (
          <span
            className={`wikidata-tags-chip${tag.excluded ? ' wikidata-tags-chip--excluded' : ''}`}
            key={tag.match}
            data-tag-id={tag.match}
            data-filter-mode={tag.excluded ? 'exclude' : 'include'}
          >
            <button
              type="button"
              className="wikidata-tags-chip__mode"
              aria-label={I18n.t(tag.excluded ? 'campaign.include_tag' : 'campaign.exclude_tag', { tag: tag.label })}
              title={I18n.t(tag.excluded ? 'campaign.include_tag' : 'campaign.exclude_tag', { tag: tag.label })}
              onClick={() => toggleTagMode(tag.match)}
            >
              {tag.excluded ? '−' : '+'}
            </button>
            <a
              href={tag.url}
              target="_blank"
              rel="noopener"
              className="wikidata-tags-chip__link"
              title={tag.description}
            >
              {tag.label}
              <span className="wikidata-tags-chip__qnum">{tag.match}</span>
            </a>
            <button
              type="button"
              className="wikidata-tags-chip__remove"
              aria-label={`${I18n.t('assignments.remove')} ${tag.label}`}
              onClick={() => removeTag(tag.match)}
            />
          </span>
        ))}
      </div>
      <div className="wikidata-tags-input-row">
        <input
          type="text"
          name={inputName}
          id={inputId}
          className="wikidata-tags-search"
          placeholder={placeholder}
          autoComplete="off"
          aria-label={placeholder}
          value={query}
          onChange={handleInputChange}
          onKeyDown={(event) => {
            if (event.key === 'Escape') {
              setDropdownOpen(false);
              setResults([]);
            }
          }}
        />
        <div className={`wikidata-tags-spinner${loading ? '' : ' hidden'}`} />
      </div>
      <ul className={`wikidata-tags-dropdown${dropdownOpen ? '' : ' hidden'}`} role="listbox">
        {results.map((item) => (
          <li
            key={item.match}
            role="option"
            aria-selected="false"
            tabIndex={0}
            className="wikidata-tags-option"
            onMouseDown={(event) => {
              event.preventDefault();
              selectTag(item);
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                selectTag(item);
              }
            }}
          >
            <span className="wikidata-tags-option__label">{item.label}</span>
            <span className="wikidata-tags-option__id">{item.match}</span>
            {item.description && (
              <span className="wikidata-tags-option__desc">{item.description}</span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

LabelSearchFilter.propTypes = {
  selectedTags: PropTypes.arrayOf(PropTypes.shape({
    match: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
    description: PropTypes.string,
    url: PropTypes.string,
    excluded: PropTypes.bool,
  })).isRequired,
  onChange: PropTypes.func.isRequired,
  placeholder: PropTypes.string.isRequired,
  inputName: PropTypes.string,
  inputId: PropTypes.string,
  initialQuery: PropTypes.string,
};

LabelSearchFilter.defaultProps = {
  inputName: undefined,
  inputId: undefined,
  initialQuery: '',
};

export default LabelSearchFilter;
