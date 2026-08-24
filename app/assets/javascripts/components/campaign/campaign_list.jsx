import React, { useEffect, useRef, useState } from 'react';
import ReactPaginate from 'react-paginate';
import { useDispatch, useSelector } from 'react-redux';
import { useSearchParams } from 'react-router-dom';
import { fetchAllCampaigns, fetchCampaignStatistics, sortCampaigns } from '../../actions/campaign_actions';
import List from '../common/list';
import Loading from '../common/loading';
import DropdownSortSelect from '../common/dropdown_sort_select';
import SearchBar from '../common/search_bar';

const CAMPAIGNS_PER_PAGE = 10;

const CampaignList = ({ keys, showSearch, RowElement, headerText, userOnly, showStatistics = false, featuredOrNewestOnly = false, paginate = false }) => {
  const { all_campaigns, all_campaigns_loaded, campaign_pagination, sort } = useSelector(state => state.campaigns);
  const [searchParams, setSearchParams] = useSearchParams();
  const search = searchParams.get('search');
  const filteredCampaigns = paginate ? all_campaigns : (showSearch && search ? all_campaigns.filter(campaign => campaign.title.toLowerCase().includes(search.toLowerCase())) : all_campaigns);
  const [currentPage, setCurrentPage] = useState(0);
  const dispatch = useDispatch();
  const inputRef = useRef();

  const sortBy = (key) => {
    setCurrentPage(0);
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
    if (inputRef?.current) {
      setCurrentPage(0);
      setSearchParams({ search: inputRef.current.value });
    }
  };

  useEffect(() => {
    if (showStatistics) {
      dispatch(fetchCampaignStatistics(userOnly, featuredOrNewestOnly));
    } else if (paginate) {
      dispatch(fetchAllCampaigns({
        page: currentPage + 1,
        search,
      }));
    } else {
      dispatch(fetchAllCampaigns());
    }
  }, [currentPage, search]);

  if (!all_campaigns_loaded) {
    return <Loading/>;
  }
  const pageCount = paginate ? campaign_pagination.total_pages : Math.ceil(filteredCampaigns.length / CAMPAIGNS_PER_PAGE);
  const visibleCampaigns = filteredCampaigns;
  const campaignElements = visibleCampaigns.map(campaign => <RowElement campaign={campaign} key={campaign.slug}/>);

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
        <div className="explore-courses" >
          <SearchBar ref={inputRef} onClickHandler={onClickHandler} placeholder={I18n.t('campaign.search_campaigns')}/>
        </div>
        )
      }
      <List
        elements={campaignElements}
        keys={keys}
        none_message={I18n.t('application.no_results', { query: inputRef?.current?.value || ' ' })}
        sortable={true}
        sortBy={sortBy}
        className="table--expandable table--hoverable"
      />
      {paginate && pageCount > 1 && (
        <ReactPaginate
          previousLabel={I18n.t('application.back')}
          nextLabel={I18n.t('application.next')}
          breakLabel="..."
          pageCount={pageCount}
          marginPagesDisplayed={2}
          pageRangeDisplayed={6}
          onPageChange={({ selected }) => setCurrentPage(selected)}
          forcePage={currentPage}
          containerClassName={'pagination'}
        />
      )}
    </div>
  );
};

export default CampaignList;
