import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import API from '../../../../../utils/api';

const RevisionFeedback = ({ revision, course, editor, currentUser }) => {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState(null);
  const [text, setText] = useState('');
  const canWrite = Boolean(currentUser && (
    currentUser.isInstructor || currentUser.isStaff || currentUser.admin
    || currentUser.campaign_organizer
  ));

  const feedbackItems = (data) => {
    if (Array.isArray(data)) return data;
    if (data && Array.isArray(data.revision_feedback)) return data.revision_feedback;
    if (data && Array.isArray(data.feedback)) return data.feedback;
    return [];
  };

  useEffect(() => {
    let active = true;
    setItems(null);
    setOpen(false);
    setText('');
    API.fetchRevisionFeedback(revision.revid, course.id, editor.id)
      .then((data) => {
        if (active) setItems(feedbackItems(data));
      });
    return () => { active = false; };
  }, [revision.revid, course.id, editor.id]);

  const toggle = () => setOpen(!open);

  const submit = (event) => {
    event.preventDefault();
    if (!text.trim()) return;
    API.createRevisionFeedback(revision.revid, course.id, editor.id, text).then((item) => {
      setItems(existing => feedbackItems(existing).concat(item));
      setText('');
    });
  };

  const remove = (id) => {
    API.deleteRevisionFeedback(revision.revid, course.id, editor.id, id).then(() => {
      setItems(existing => feedbackItems(existing).filter(item => item.id !== id));
    });
  };

  return (
    <>
      {!(open && canWrite) && (
        <button type="button" className="button dark small" onClick={toggle}>
          {I18n.t('courses.feedback')}
        </button>
      )}
      {(open || feedbackItems(items).length > 0) && (
        <div className="revision-feedback-panel">
          {feedbackItems(items).map(item => (
            <p key={item.id}>
              <strong>{item.author}</strong>: {item.text}
              {item.can_delete && (
                <button type="button" className="button small" onClick={() => remove(item.id)}>
                  {I18n.t('application.delete')}
                </button>
              )}
            </p>
          ))}
          {open && canWrite && (
            <form onSubmit={submit}>
              <textarea aria-label={I18n.t('courses.feedback')} rows={4} value={text} onChange={event => setText(event.target.value)} />
              <input className="button dark small" type="submit" value={I18n.t('courses.feedback')} />
            </form>
          )}
        </div>
      )}
    </>
  );
};

RevisionFeedback.propTypes = {
  revision: PropTypes.shape({ revid: PropTypes.number.isRequired }).isRequired,
  course: PropTypes.object.isRequired,
  editor: PropTypes.object.isRequired,
  currentUser: PropTypes.object.isRequired
};

export default RevisionFeedback;
