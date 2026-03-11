import React, { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { useDispatch } from 'react-redux';

// Components
import Popover from '@components/common/popover.jsx';
import Conditional from '@components/high_order/conditional.jsx';

import CourseUtils from '~/app/assets/javascripts/utils/course_utils.js';
import { addNotification } from '~/app/assets/javascripts/actions/notification_actions.js';
import { initiateConfirm } from '~/app/assets/javascripts/actions/confirm_actions';
import { getFiltered } from '~/app/assets/javascripts/utils/model_utils';
import { addUser, removeUser } from '~/app/assets/javascripts/actions/user_actions';
import useExpandablePopover from '../../hooks/useExpandablePopover';
import { useParams } from 'react-router-dom';
import { INSTRUCTOR_ROLE, STUDENT_ROLE } from '../../constants/user_roles';

const EnrollButton = ({ users, role, course, current_user, allowed, inline }) => {
  const usernameRef = useRef(null);
  const realNameRef = useRef(null);
  const roleDescriptionRef = useRef(null);

  const dispatch = useDispatch();
  const { course_school, course_title } = useParams();

  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchError, setSearchError] = useState(false);

  useEffect(() => {
    if (searchTerm.length < 2) {
      setSearchResults([]);
      setShowDropdown(false);
      setSearchError(false);
      return;
    }
    setSearchError(false);
    setShowDropdown(false);
    const timeoutId = setTimeout(() => {
      const courseSlug = course.slug;
      fetch(`/courses/${courseSlug}/available_users.json?search=${encodeURIComponent(searchTerm)}`)
        .then((response) => {
          if (!response.ok) { throw new Error('Network response was not ok'); }
          return response.json();
        })
        .then((data) => {
          setSearchResults(data);
          setShowDropdown(data.length > 0);
          setSearchError(false);
        })
        .catch((error) => {
          // eslint-disable-next-line no-console
          console.error('Error fetching available users:', error);
          setSearchResults([]);
          setShowDropdown(false);
          setSearchError(true);
        });
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [searchTerm, course.slug, dispatch]);

  const selectUserFromDropdown = (user) => {
    // Cuando selecciona del dropdown, poner el username en el input
    setSearchTerm(user.username);
    setSearchResults([]);
    setShowDropdown(false);

    // Focus en el input para que pueda hacer submit
    if (usernameRef.current) {
      usernameRef.current.focus();
    }
  };

  useEffect(() => {
  const handleClickOutside = (event) => {
    if (showDropdown && !event.target.closest('.autocomplete-container')) {
      setShowDropdown(false);
    }
  };

  document.addEventListener('mousedown', handleClickOutside);

  return () => {
    document.removeEventListener('mousedown', handleClickOutside);
  };
}, [showDropdown]);

  const checkEnrollmentSuccess = useRef(null);

  useEffect(() => {
    if (!checkEnrollmentSuccess.current) { return; }
    const username = checkEnrollmentSuccess.current;
    if (getFiltered(users, { username, role }).length > 0) {
      dispatch(addNotification({
        message: I18n.t('users.enrolled_success', { username }),
        closable: true,
        type: 'success'
      }));
      setSearchTerm('');
      checkEnrollmentSuccess.current = null;
    }
  }, [users, role, dispatch]);

  const getKey = () => {
    return `add_user_role_${role}`;
  };

  const { isOpen, ref, open } = useExpandablePopover(getKey);

  const enroll = (e) => {
    e.preventDefault();
    const username = searchTerm.trim();
    if (!username) { return; }
    const courseId = course.slug;
    // Optional fields
    let realName;
    let roleDescription;
    if (realNameRef.current && roleDescriptionRef.current) {
      realName = realNameRef.current.value;
      roleDescription = roleDescriptionRef.current.value;
    }

    const userObject = {
      username,
      role,
      role_description: roleDescription,
      real_name: realName
    };

    const onConfirm = () => {
      // Mark that we're checking for this user's enrollment
      checkEnrollmentSuccess.current = username;
      // Post the new user enrollment to the server
      dispatch(addUser(courseId, { user: userObject }));
    };
    const confirmMessage = I18n.t('users.enroll_confirmation', { username });

    // If the user is not already enrolled
    if (getFiltered(users, { username, role }).length === 0) {
      return dispatch(initiateConfirm({ confirmMessage, onConfirm }));
    }
    // If the user is already enrolled
    return dispatch(addNotification({
      message: I18n.t('users.already_enrolled'),
      closable: true,
      type: 'error'
    }));
  };

  const unenroll = (userId) => {
    const user = getFiltered(users, { id: userId, role })[0];
    const courseId = course.slug;
    const userObject = { user_id: userId, role };

    const onConfirm = () => {
      // Post the user deletion request to the server
      dispatch(removeUser(courseId, { user: userObject }));
    };
    const confirmMessage = I18n.t('users.remove_confirmation', { username: user.username });
    return dispatch(initiateConfirm({ confirmMessage, onConfirm }));
  };

  const stop = (e) => {
    return e.stopPropagation();
  };

  const courseLinkParams = () => {
    return `/courses/${course_school}/${course_title}`;
  };

  // Disable the button for courses controlled by Wikimedia Event Center
  // except for the Facilitator role
  if (course.flags.event_sync && role !== INSTRUCTOR_ROLE) { return null; }

  const usersList = users.map((user) => {
    let removeButton;
    if (role !== INSTRUCTOR_ROLE || users.length >= 2 || current_user.admin) {
      removeButton = (
        <button className="button border plus" aria-label="Remove user" onClick={() => unenroll(user.id)}>-</button>
      );
    }
    return (
      <tr key={`${user.id}_enrollment`}>
        <td>{user.username}{removeButton}</td>
      </tr>
    );
  });

  const enrollParam = '?enroll=';
  const enrollUrl = window.location.origin + courseLinkParams() + enrollParam + course.passcode;

  const editRows = [];

  if (role === STUDENT_ROLE) {
    let massEnrollmentLink;
    let requestedAccountsLink;
    if (!Features.wikiEd) {
      const massEnrollmentUrl = `/mass_enrollment/${course.slug}`;
      massEnrollmentLink = <p><a href={massEnrollmentUrl}>{I18n.t('courses.mass_enrollment')}</a></p>;
    }
    if (!Features.wikiEd) {
      const requestedAccountsUrl = `/requested_accounts/${course.slug}`;
      requestedAccountsLink = <p key="requested_accounts"><a href={requestedAccountsUrl}>{I18n.t('courses.requested_accounts')}</a></p>;
    }

    editRows.push(
      <tr className="edit" key="enroll_students">
        <td>
          <p>{I18n.t('users.course_passcode')}&nbsp;<b>{course.passcode}</b></p>
          <p>{I18n.t('users.enroll_url')}</p>
          <input type="text" readOnly={true} value={enrollUrl} style={{ width: '100%' }} />
          {massEnrollmentLink}
          {requestedAccountsLink}
        </td>
      </tr>
    );
  }

  // This row allows permitted users to add usrs to the course by username
  // @role controls its presence in the Enrollment popup on /students
  // @allowed controls its presence in Edit Details mode on Overview
  if (role === STUDENT_ROLE || allowed) {
    // Instructor-specific extra fields
    let realNameInput;
    let roleDescriptionInput;
    if (role === INSTRUCTOR_ROLE) {
      realNameInput = <input type="text" ref={realNameRef} placeholder={I18n.t('users.name')} style={{ width: '100%', marginTop: '10px' }} />;
      roleDescriptionInput = <input type="text" ref={roleDescriptionRef} placeholder={I18n.t('users.role.description')} style={{ width: '100%', marginTop: '10px' }} />;
    }

    editRows.push(
      <tr className="edit" key="add_students">
        <td>
          <form onSubmit={enroll}>
            <div className="autocomplete-container" style={{ position: 'relative', marginBottom: '10px' }}>
              <input
                ref={usernameRef}
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder={I18n.t('users.username_placeholder')}
                style={{ width: '100%', padding: '8px' }}
                onFocus={() => {
                  if (searchResults.length > 0) {
                    setShowDropdown(true);
                  }
                }}
              />
              {searchError && (
                <span style={{
                  position: 'absolute',
                  right: '10px',
                  top: '10px',
                  color: '#d33'
                }}
                >
                  {I18n.t('users.search_error')}
                </span>
              )}
              {showDropdown && searchResults.length > 0 && (
                <ul style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  backgroundColor: 'white',
                  border: '1px solid #ccc',
                  borderTop: 'none',
                  maxHeight: '200px',
                  overflowY: 'auto',
                  margin: 0,
                  padding: 0,
                  listStyle: 'none',
                  zIndex: 1000,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                }}
                >
                  {searchResults.map(user => (
                    <li
                      key={user.id}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        selectUserFromDropdown(user);
                      }}
                      style={{
                        padding: '8px 12px',
                        cursor: 'pointer',
                        borderBottom: '1px solid #f0f0f0'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.backgroundColor = '#f5f5f5';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.backgroundColor = 'white';
                      }}
                    >
                      {user.username}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            {realNameInput}
            {roleDescriptionInput}
            <button className="button border" type="submit">{CourseUtils.i18n('enroll', course.string_prefix)}</button>
          </form>
        </td>
      </tr>
    );
  }

  let buttonClass = 'button';
  buttonClass += inline ? ' border plus' : ' dark';
  const buttonText = inline ? '+' : CourseUtils.i18n('enrollment', course.string_prefix);

  const button = (
    <button
      aria-label={I18n.t('courses.enroll_button_aria_label')}
      className={buttonClass}
      onClick={() => {
        open();
        setTimeout(() => {
          usernameRef.current.focus();
        }, 125);
      }}
    >
      {buttonText}
    </button>
  );

  return (
    <div className="pop__container" onClick={stop} ref={ref}>
      {button}
      <Popover
        is_open={isOpen}
        edit_row={editRows}
        rows={usersList}
        styles={{ minWidth: '450px' }}
      />
    </div>
  );
};

EnrollButton.propTypes = {
  allowed: PropTypes.bool.isRequired,
  course: PropTypes.shape({
    passcode: PropTypes.string.isRequired,
    slug: PropTypes.string.isRequired,
    string_prefix: PropTypes.string.isRequired
  }).isRequired,
  current_user: PropTypes.shape({
    admin: PropTypes.bool.isRequired
  }).isRequired,
  role: PropTypes.number.isRequired,
  users: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.number.isRequired,
    username: PropTypes.string.isRequired,
    role: PropTypes.number.isRequired
  })).isRequired,
};

export default Conditional(EnrollButton);
