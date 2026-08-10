import React, { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useSearchParams } from 'react-router-dom';
import { fetchAllCampaigns, fetchCampaignStatistics, sortCampaigns } from '../../actions/campaign_actions';
import List from '../common/list';
import Loading from '../common/loading';
import DropdownSortSelect from '../common/dropdown_sort_select';
import SearchBar from '../common/search_bar';
import LabelSearchFilter from '../common/label_search_filter';
import { fetchLabelsByMatch } from '../../utils/wikidata_label_search';

const CampaignList = ({ keys, showSearch, RowElement, headerText, userOnly, showStatistics = false }) => {
  const { all_campaigns, all_campaigns_loaded, sort } = useSelector(state => state.campaigns);
  const [searchParams, setSearchParams] = useSearchParams();
  const search = searchParams.get('search');
  const labelSearch = searchParams.get('label_search');
  const selectedMatches = labelSearch ? labelSearch.split(',') : [];

  const [selectedTags, setSelectedTags] = useState([]);

  useEffect(() => {
    if (!labelSearch) {
      setSelectedTags([]);
      return;
    }
    const matches = labelSearch.split(',').filter(Boolean);
    fetchLabelsByMatch(matches).then((labels) => {
      const labelByMatch = Object.fromEntries(labels.map(label => [label.match, label]));
      setSelectedTags(matches.map((match) => (
        labelByMatch[match] || { match, label: match, description: '', url: '' }
      )));
    }).catch(err => console.error('Error fetching labels:', err));
  }, [labelSearch]);

  const filteredCampaigns = all_campaigns.filter((campaign) => {
    if (showSearch) {
      if (search && !campaign.title.toLowerCase().includes(search.toLowerCase())) {
        return false;
      }
      if (selectedMatches.length > 0) {
        const campaignMatches = campaign.label_matches || [];
        const hasMatch = campaignMatches.some(match =>
          selectedMatches.some(sel => sel.toLowerCase() === match.toLowerCase())
        );
        if (!hasMatch) {
          return false;
        }
      }
    }
    return true;
  });

  const dispatch = useDispatch();
  const inputRef = useRef();

  const sortBy = (key) => {
    dispatch(sortCampaigns(key));
  };

  if (sort.key) {

    for (const key of Object.keys(keys)) {
      if (key === sort.key) {
        keys[sort.key].order = (sort.sortKey) ? 'asc' : 'desc';
      } else {
        keys[key].order = undefined;
      }
    }
  }

  const buildSearchParams = (tags) => {
    const params = {};
    if (inputRef?.current?.value) {
      params.search = inputRef.current.value;
    } else if (search) {
      params.search = search;
    }
    if (tags.length > 0) {
      params.label_search = tags.map(tag => tag.match).join(',');
    }
    return params;
  };

  const onClickHandler = () => {
    setSearchParams(buildSearchParams(selectedTags));
  };

  const handleLabelChange = (tags) => {
    setSelectedTags(tags);
    setSearchParams(buildSearchParams(tags));
  };

  useEffect(() => {
    if (showStatistics) {
      dispatch(fetchCampaignStatistics(userOnly));
    } else {
      dispatch(fetchAllCampaigns());
    }
  }, []);


  if (!all_campaigns_loaded) {
    return <Loading/>;
  }
  const campaignElements = filteredCampaigns.map(campaign => <RowElement campaign={campaign} key={campaign.slug}/>);

  const getNoResultsMessage = () => {
    const queryParts = [];
    if (search) {
      queryParts.push(search);
    }
    if (selectedTags.length > 0) {
      queryParts.push(`label: ${selectedTags.map(tag => tag.label).join(', ')}`);
    }
    const query = queryParts.join(', ') || ' ';
    return I18n.t('application.no_results', { query });
  };

  return (
    <div className="container">
      {headerText && (
        <div className="section-header">
          <h2>{headerText}</h2>
          <DropdownSortSelect keys={keys} sortSelect={sortBy}/>
        </div>
      )}
      {
      showSearch && (
        <div className="explore-courses" style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: '1 1 300px' }}>
            <SearchBar
              ref={inputRef}
              onClickHandler={onClickHandler}
              value={search || ''}
              placeholder={I18n.t('campaign.search_campaigns')}
            />
          </div>
          <div style={{ flex: '1 1 300px' }}>
            <LabelSearchFilter
              selectedTags={selectedTags}
              onChange={handleLabelChange}
              placeholder={I18n.t('campaign.search_campaigns_by_label')}
            />
          </div>
        </div>
        )
      }
      <List
        elements={campaignElements}
        keys={keys}
        none_message={getNoResultsMessage()}
        sortable={true}
        sortBy={sortBy}
        className="table--expandable table--hoverable"
      />
    </div>
  );
};

export default CampaignList;