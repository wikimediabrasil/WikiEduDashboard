import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import API from '../../../../../utils/api';

const RevisionFeedback = ({ revision, course, editor, currentUser }) => {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
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
    setEditing(false);
    setText('');
    API.fetchRevisionFeedback(revision.revid, course.id, editor.id)
      .then((data) => {
        if (active) setItems(feedbackItems(data));
      });
    return () => { active = false; };
  }, [revision.revid, course.id, editor.id]);

  const toggle = () => {
    setOpen(canWrite || !open);
    setEditing(canWrite);
  };

  const submit = (event) => {
    event.preventDefault();
    if (!text.trim() || saving || !items) return;
    setSaving(true);
    API.createRevisionFeedback(revision.revid, course.id, editor.id, text).then((item) => {
      setItems(existing => feedbackItems(existing).concat(item));
      setText('');
      setEditing(false);
    }).finally(() => {
      setSaving(false);
    });
  };

  const remove = (id) => {
    API.deleteRevisionFeedback(revision.revid, course.id, editor.id, id).then(() => {
      setItems(existing => feedbackItems(existing).filter(item => item.id !== id));
    });
  };

  return (
    <>
      {!editing && (
        <button type="button" className="button dark small" onClick={toggle}>
          {I18n.t('courses.feedback')}
        </button>
      )}
      {(open || feedbackItems(items).length > 0) && (
        <div className="revision-feedback-panel">
          {feedbackItems(items).map(item => (
            <div key={item.id} className="revision-feedback-item">
              <div className="revision-feedback-item__header">
                <p className="revision-feedback-item__author">{item.author}</p>
                {item.can_delete && (
                  <button type="button" className="revision-feedback-item__delete"
                    aria-label={I18n.t('courses.delete_suggestion')} onClick={() => remove(item.id)}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                      stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"
                      strokeLinejoin="round" aria-hidden="true">
                      <path d="M4 6h16M9 6V4h6v2M6 6l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13M10 10v6m4-6v6" />
                    </svg>
                  </button>
                )}
              </div>
              <p className="revision-feedback-item__date">
                {item.created_at ? new Date(item.created_at).toLocaleString() : ''}
              </p>
              <p className="revision-feedback-item__comment">{item.text}</p>
            </div>
          ))}
          {editing && canWrite && (
            <form onSubmit={submit}>
              <textarea aria-label={I18n.t('courses.feedback')} rows={4} value={text}
                disabled={saving} onChange={event => setText(event.target.value)} />
              <input className="button dark small" type="submit" disabled={saving || !items}
                value={I18n.t('courses.feedback')} />
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
