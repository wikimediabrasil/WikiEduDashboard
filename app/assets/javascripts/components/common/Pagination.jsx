import React from 'react';
import PropTypes from 'prop-types';

/**
 * Pagination component with numbered buttons
 * Shows up to 10 pages at a time with ellipsis to avoid overflow
 */
const Pagination = ({ currentPage, totalPages, onPageChange, itemsPerPage, totalItems }) => {
  if (totalPages <= 1) return null;

  /**
   * Generates array of page numbers to display
   * Logic: Shows 5 pages before and 5 after current, with a limit of 10 total
   */
  const getPageNumbers = () => {
    const pages = [];
    const maxPagesToShow = 10;
    const sidePages = 2; // Pages to show on each side of current

    if (totalPages <= maxPagesToShow) {
      // If there are 10 or fewer pages, show all
      for (let i = 1; i <= totalPages; i += 1) {
        pages.push(i);
      }
    } else {
      // Complex logic for pages with ellipsis

      // Always show first page
      pages.push(1);

      // Calculate range of pages around current
      let startPage = Math.max(2, currentPage - sidePages);
      let endPage = Math.min(totalPages - 1, currentPage + sidePages);

      // Adjust if we are near the beginning
      if (currentPage <= sidePages + 2) {
        endPage = Math.min(maxPagesToShow - 1, totalPages - 1);
        startPage = 2;
      }

      // Adjust if we are near the end
      if (currentPage >= totalPages - sidePages - 1) {
        startPage = Math.max(2, totalPages - maxPagesToShow + 2);
        endPage = totalPages - 1;
      }

      // Add ellipsis if there's a gap after the first page
      if (startPage > 2) {
        pages.push('...');
      }

      // Add pages from the range
      for (let i = startPage; i <= endPage; i += 1) {
        pages.push(i);
      }

      // Add ellipsis if there's a gap before the last page
      if (endPage < totalPages - 1) {
        pages.push('...');
      }

      // Always show last page
      if (totalPages > 1) {
        pages.push(totalPages);
      }
    }

    return pages;
  };

  const pageNumbers = getPageNumbers();

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
          pageNumbers.map((number, index) => {
            if (number === '...') {
              return (
                <span key={`ellipsis-${index}`} style={{ padding: '0 5px' }}>
                  ...
                </span>
              );
            }

            return (
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
            );
          })
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

Pagination.propTypes = {
  currentPage: PropTypes.number.isRequired,
  totalPages: PropTypes.number.isRequired,
  onPageChange: PropTypes.func.isRequired,
  itemsPerPage: PropTypes.number.isRequired,
  totalItems: PropTypes.number.isRequired
};

export default Pagination;
