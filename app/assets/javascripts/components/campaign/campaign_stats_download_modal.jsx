import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { startDownload } from '../../actions/download_actions.js';
import { addNotification } from '../../actions/notification_actions.js';

const CampaignStatsDownloadModal = ({ campaign_slug, campaign_title }) => {
  const dispatch = useDispatch();
  const [show, setShow] = useState(false);

  const exportOptions = [
    { id: 'courses', href: `/campaigns/${campaign_slug}/courses.csv`, label: I18n.t('campaign.data_courses'), info: I18n.t('campaign.data_courses_info') },
    { id: 'articles', href: `/campaigns/${campaign_slug}/articles_csv.csv`, label: I18n.t('campaign.data_articles'), info: I18n.t('campaign.data_articles_info') },
    { id: 'editors', href: `/campaigns/${campaign_slug}/students.csv`, label: I18n.t('campaign.data_editor_usernames'), info: I18n.t('campaign.data_editor_usernames_info') },
    { id: 'editors-by-course', href: `/campaigns/${campaign_slug}/students.csv?course=true`, label: I18n.t('campaign.data_editors_by_course'), info: I18n.t('campaign.data_editors_by_course_info') },
    { id: 'instructors-by-course', href: `/campaigns/${campaign_slug}/instructors.csv?course=true`, label: I18n.t('campaign.data_instructors'), info: I18n.t('campaign.data_instructors_info') },
    { id: 'wikidata', href: `/campaigns/${campaign_slug}/wikidata.csv`, label: I18n.t('campaign.data_wikidata'), info: I18n.t('campaign.data_wikidata_info') },
    { id: 'all', href: `/campaigns/${campaign_slug}/all_csv`, label: I18n.t('campaign.all_data'), info: I18n.t('campaign.data_all_info') },
  ];

  const handleDownload = (option, event) => {
    event.preventDefault();
    dispatch(startDownload({
      ...option,
      id: `${campaign_slug}-${option.id}`,
      label: `${campaign_title} — ${option.label}`
    }));
    dispatch(addNotification({
      message: I18n.t('campaign.data_download_generating'),
      closable: true,
      type: 'success'
    }));
    setShow(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (!show) {
    return (
      <button onClick={() => setShow(true)} className="button">{I18n.t('courses.download_stats_data')}</button>
    );
  }

  return (
    <div className="basic-modal course-stats-download-modal">
      <button onClick={() => setShow(false)} className="pull-right article-viewer-button icon-close" />
      <h2>{I18n.t('campaign.data_download_info')}</h2>
      <hr />
      {exportOptions.map(option => (
        <React.Fragment key={option.id}>
          <p>
            <a href={option.href} onClick={(event) => handleDownload(option, event)} className="button right campaign-stats-download-button">{option.label}</a>
            {option.info}
          </p>
          <hr />
        </React.Fragment>
      ))}
    </div>
  );
};

export default CampaignStatsDownloadModal;
