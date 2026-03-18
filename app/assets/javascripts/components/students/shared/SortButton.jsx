import React from 'react';
import PropTypes from 'prop-types';

export const SortButton = ({ sortSelect, showOverviewFilters = true }) => {
  return (
    <div className="sort-select users">
      <select className="sorts" name="sorts" onChange={sortSelect}>
        <option value="username">{I18n.t('users.username')}</option>
        {
          showOverviewFilters && (
            <>
              <option value="character_sum_ms">{I18n.t('users.characters_added_mainspace')}</option>
              <option value="references_count">{I18n.t('users.references_count')}</option>
              <option value="total_uploads">{I18n.t('users.total_uploads')}</option>
              <option value="recent_revisions">{I18n.t('users.recent_revisions')}</option>
            </>
          )
        }
      </select>
    </div>
  );
};

SortButton.propTypes = {
  sortSelect: PropTypes.func.isRequired
};

export default SortButton;
