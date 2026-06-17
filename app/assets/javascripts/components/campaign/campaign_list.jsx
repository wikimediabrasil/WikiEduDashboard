import React, { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useSearchParams } from 'react-router-dom';
import { fetchAllCampaigns, fetchCampaignStatistics, sortCampaigns } from '../../actions/campaign_actions';
import List from '../common/list';
import Loading from '../common/loading';
import DropdownSortSelect from '../common/dropdown_sort_select';
import SearchBar from '../common/search_bar';
import Select from 'react-select';
import selectStyles from '../../styles/select';
import request from '../../utils/request';

const CampaignList = ({ keys, showSearch, RowElement, headerText, userOnly, showStatistics = false }) => {
  const { all_campaigns, all_campaigns_loaded, sort } = useSelector(state => state.campaigns);
  const [searchParams, setSearchParams] = useSearchParams();
  const search = searchParams.get('search');
  const labelSearch = searchParams.get('label_search');
  const selectedLabelStrings = labelSearch ? labelSearch.split(',') : [];

  const [allLabels, setAllLabels] = useState([]);

  useEffect(() => {
    request('/labels.json')
      .then(resp => resp.json())
      .then((data) => {
        const labelsList = data.labels || [];
        const labelNames = Array.from(new Set(labelsList.map(l => l.labels))).filter(Boolean);
        labelNames.sort();
        setAllLabels(labelNames);
      })
      .catch(err => console.error('Error fetching labels:', err));
  }, []);

  const filteredCampaigns = all_campaigns.filter((campaign) => {
    if (showSearch) {
      if (search && !campaign.title.toLowerCase().includes(search.toLowerCase())) {
        return false;
      }
      if (selectedLabelStrings.length > 0) {
        const hasLabel = campaign.labels && campaign.labels.some(label =>
          selectedLabelStrings.some(sel => sel.toLowerCase() === label.toLowerCase())
        );
        if (!hasLabel) {
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

  const onClickHandler = () => {
    const params = {};
    if (inputRef?.current?.value) {
      params.search = inputRef.current.value;
    }
    if (labelSearch) {
      params.label_search = labelSearch;
    }
    setSearchParams(params);
  };

  const handleLabelSelectChange = (options) => {
    const selected = options ? options.map(o => o.value) : [];
    const params = {};
    if (inputRef?.current?.value) {
      params.search = inputRef.current.value;
    } else if (search) {
      params.search = search;
    }
    if (selected.length > 0) {
      params.label_search = selected.join(',');
    }
    setSearchParams(params);
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
    if (labelSearch) {
      queryParts.push(`label: ${labelSearch}`);
    }
    const query = queryParts.join(', ') || ' ';
    return I18n.t('application.no_results', { query });
  };

  const selectedLabels = selectedLabelStrings.map(lbl => ({ value: lbl, label: lbl }));
  const labelOptions = allLabels.map(label => ({ value: label, label: label }));

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
            <Select
              isMulti
              placeholder={I18n.t('campaign.search_campaigns_by_label')}
              styles={selectStyles}
              options={labelOptions}
              value={selectedLabels}
              onChange={handleLabelSelectChange}
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
