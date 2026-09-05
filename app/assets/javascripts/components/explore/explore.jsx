import React from 'react';
import { useSelector } from 'react-redux';
import { getCurrentUser } from '../../selectors';
import DetailedCampaignList from '../campaign/detailed_campaign_list';
import CampaignSearch from './campaign_search';

const Explore = () => {
  const user = getCurrentUser(useSelector(state => state));
  const showCreateButton = user.admin || Features.open_course_creation;
  return (
    <>
      <header className="main-page explore-header">
        <div className="header"><h1>{I18n.t('campaign.explore_campaigns')}</h1></div>
      </header>
      <section className="container">
        <p>{I18n.t('campaign.explore_description')}</p>
        <CampaignSearch />
      </section>
      <div id="campaigns_list">
        <DetailedCampaignList paginated showTags />
        <div className="campaigns-actions">
          {showCreateButton && <a className="button dark" href="/campaigns/new?create=true">{I18n.t('campaign.create_campaign')}</a>}
        </div>
      </div>
    </>
  );
};

export default Explore;
