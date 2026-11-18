import React, { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { Link, useLocation } from 'react-router-dom';
import { chunk, forEach, get } from 'lodash-es';
import { GALLERY_VIEW } from '../../constants';
import UploadList from '../uploads/upload_list.jsx';
import { fetchUploadMetadata } from '../../actions/uploads_actions.js';
import request, { ensureOk } from '../../utils/request';
import Loading from '../common/loading.jsx';

const PAGE_SIZE = 50;

// Fetches missing thumburls and credits from the Commons API for a list of
// uploads rendered on the user profile. The course page does this through
// Redux (setUploadMetadata), but the profile page receives its uploads from
// stats.json directly, so we enrich them locally here.
const enrichUploads = async (uploads) => {
  const missing = uploads.filter(u => !u.thumburl || !u.credit);
  if (missing.length === 0) return uploads;

  const batches = chunk(missing, 25);
  const responses = await Promise.all(batches.map(fetchUploadMetadata));

  let fetchedPages = {};
  forEach(responses, (data) => {
    if (data && data.query) {
      fetchedPages = { ...fetchedPages, ...data.query.pages };
    }
  });

  return uploads.map((upload) => {
    const page = fetchedPages[upload.id];
    if (!page) return upload;
    const thumburl = upload.thumburl || get(page, 'imageinfo[0].thumburl');
    const credit = upload.credit || get(page, 'imageinfo[0].extmetadata.Credit.value', 'Not found');
    return { ...upload, thumburl, credit };
  });
};

const UserUploads = ({ uploads, username }) => {
  const location = useLocation();
  const courseId = new URLSearchParams(location.search).get('course_id');
  const [sourceUploads, setSourceUploads] = useState(uploads || []);
  const [enrichedUploads, setEnrichedUploads] = useState([]);
  const [courseTitle, setCourseTitle] = useState(null);
  const [loading, setLoading] = useState(!!courseId);
  const [error, setError] = useState(false);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const visibleUploads = useMemo(() => sourceUploads.slice(0, visibleCount),
                                 [sourceUploads, visibleCount]);

  useEffect(() => {
    let cancelled = false;
    setVisibleCount(PAGE_SIZE);
    setError(false);
    if (!courseId) {
      setSourceUploads(uploads || []);
      setCourseTitle(null);
      setLoading(false);
      return undefined;
    }
    setLoading(true);
    request(`/users/${encodeURIComponent(username)}/course_uploads.json?course_id=${encodeURIComponent(courseId)}`)
      .then(response => ensureOk(response))
      .then(response => response.json())
      .then((data) => {
        if (cancelled) return;
        setSourceUploads(data.uploads);
        setCourseTitle(data.course_title);
        setLoading(false);
      })
      .catch(() => { if (!cancelled) { setError(true); setLoading(false); } });
    return () => { cancelled = true; };
  }, [courseId, username, uploads]);

  useEffect(() => {
    let cancelled = false;
    if (visibleUploads.length === 0) {
      setEnrichedUploads([]);
      return undefined;
    }
    setEnrichedUploads(visibleUploads);
    enrichUploads(visibleUploads)
      .then((result) => {
        if (!cancelled) setEnrichedUploads(result);
      })
      .catch(() => { /* silent: fall back to raw uploads */ });
    return () => { cancelled = true; };
  }, [visibleUploads]);

  let uploadList = (<UploadList uploads={enrichedUploads} view={GALLERY_VIEW} />);
  if (enrichedUploads.length === 0) {
    uploadList = (<span>{I18n.t('courses.user_uploads_none')}</span>);
  }
  return (
    <div id="recent-uploads">
      <div className="user-articles__navigation">
        <Link to={`/users/${encodeURIComponent(username)}`} className="button ghost small">
          ← {I18n.t('users.back_to_profile')}
        </Link>
      </div>
      <h3>{courseTitle ? `${I18n.t('metrics.upload_count')}: ${courseTitle}` : I18n.t('courses.user_recent_uploads')}</h3>
      {loading ? <Loading /> : error ? <p role="alert">{I18n.t('users.course_contributions_load_failed')}</p> : uploadList}
      {!loading && !error && visibleCount < sourceUploads.length && (
        <button type="button" className="button border" onClick={() => setVisibleCount(count => count + PAGE_SIZE)}>
          {I18n.t('revisions.see_more')}
        </button>
      )}
    </div>
  );
};

UserUploads.propTypes = {
  uploads: PropTypes.array,
  username: PropTypes.string
};

export default UserUploads;
