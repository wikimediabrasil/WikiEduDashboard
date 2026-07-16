import React, { useEffect, useRef, useState } from 'react';
import { searchLabelOptions } from '../../utils/wikidata_label_search';

const LabelSearchFilter = ({ selectedTags, onChange, placeholder }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const debounceRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!containerRef.current?.contains(event.target)) {
        setDropdownOpen(false);
        setResults([]);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const runSearch = async (searchQuery) => {
    setLoading(true);
    try {
      const options = await searchLabelOptions(searchQuery);
      const selectedMatches = new Set(selectedTags.map(tag => tag.match));
      setResults(options.filter(option => !selectedMatches.has(option.match)));
      setDropdownOpen(options.length > 0);
    } catch (_error) {
      setResults([]);
      setDropdownOpen(false);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (event) => {
    const value = event.target.value;
    setQuery(value);
    clearTimeout(debounceRef.current);
    if (value.trim().length < 2) {
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

  return (
    <div className="wikidata-tags-widget" ref={containerRef}>
      <div className="wikidata-tags-chips" aria-live="polite">
        {selectedTags.map((tag) => (
          <span className="wikidata-tags-chip" key={tag.match} data-tag-id={tag.match}>
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
            >
              {String.fromCharCode(215)}
            </button>
          </span>
        ))}
      </div>
      <div className="wikidata-tags-input-row">
        <input
          type="text"
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
            className="wikidata-tags-option"
            onMouseDown={(event) => {
              event.preventDefault();
              selectTag(item);
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

export default LabelSearchFilter;