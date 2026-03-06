import React, { useEffect, useRef } from 'react';
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

  useEffect(() => {
    // This useEffect is no longer needed as enrollMultipleUsers handles success notifications
    // Kept for potential future use
  }, [users]);

  const getKey = () => {
    return `add_user_role_${role}`;
  };

  const { isOpen, ref, open } = useExpandablePopover(getKey);

  const enrollMultipleUsers = (usersArray, courseId) => {
    const chainSubmissions = (usersQueue, promise) => {
      const user = usersQueue.shift();
      if (user === undefined) return promise;

      let extendedPromise;
      if (promise) {
        extendedPromise = promise.then(() => dispatch(addUser(courseId, { user })));
      } else {
        extendedPromise = dispatch(addUser(courseId, { user }));
      }
      return chainSubmissions(usersQueue, extendedPromise);
    };

    return chainSubmissions([...usersArray])
      .then(() => {
        usernameRef.current.value = '';
        dispatch(addNotification({
          message: `Successfully enrolled ${usersArray.length} student(s)`,
          closable: true,
          type: 'success'
        }));
      })
      .catch((error) => {
        dispatch(addNotification({
          message: `Error enrolling students: ${error.message || 'Unknown error'}`,
          closable: true,
          type: 'error'
        }));
      });
  };

  const enroll = (e) => {
    e.preventDefault();
    const textareaContent = usernameRef.current.value;
    const inputLines = textareaContent.match(/[^\r\n]+/g);

    // Validate textarea is not empty
    if (!inputLines || inputLines.length === 0) {
      dispatch(addNotification({
        message: 'No usernames provided',
        closable: true,
        type: 'error'
      }));
      return;
    }

    const courseId = course.slug;

    // Get optional fields
    let realName;
    let roleDescription;
    if (realNameRef.current && roleDescriptionRef.current) {
      realName = realNameRef.current.value;
      roleDescription = roleDescriptionRef.current.value;
    }

    // Process usernames
    const usernames = inputLines.map(line => line.trim());
    const validUsernames = usernames.filter(name => name.length > 0);
    const uniqueUsernames = [...new Set(validUsernames)];

    // Check for duplicates in input
    if (uniqueUsernames.length !== validUsernames.length) {
      dispatch(addNotification({
        message: 'Duplicate usernames found in input',
        closable: true,
        type: 'warning'
      }));
    }

    // Filter already enrolled users
    const newUsernames = uniqueUsernames.filter((name) => {
      return getFiltered(users, { username: name, role }).length === 0;
    });

    const alreadyEnrolled = uniqueUsernames.filter((name) => {
      return getFiltered(users, { username: name, role }).length > 0;
    });

    // Show warning for already enrolled users
    if (alreadyEnrolled.length > 0) {
      dispatch(addNotification({
        message: `Already enrolled: ${alreadyEnrolled.join(', ')}`,
        closable: true,
        type: 'warning'
      }));
    }

    // Check if there are new users to enroll
    if (newUsernames.length === 0) {
      return;
    }

    // Create user objects
    const usersToEnroll = newUsernames.map(name => ({
      username: name,
      role,
      role_description: roleDescription || null,
      real_name: realName || null
    }));

    const confirmMessage = `Are you sure you want to enroll ${newUsernames.length} student(s)?\n${newUsernames.join(', ')}`;

    const onConfirm = () => {
      enrollMultipleUsers(usersToEnroll, courseId);
    };

    return dispatch(initiateConfirm({ confirmMessage, onConfirm }));
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
      massEnrollmentLink = <p><a href={massEnrollmentUrl}>Add multiple users at once.</a></p>;
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
      realNameInput = (
        <input
          type="text"
          ref={realNameRef}
          placeholder={I18n.t('users.name')}
        />
      );
      roleDescriptionInput = (
        <input
          type="text"
          ref={roleDescriptionRef}
          placeholder={I18n.t('users.role.description')}
        />
      );
    }

    editRows.push(
      <tr className="edit" key="add_students">
        <td>
          <div className="pop__padded-content">
            <form onSubmit={enroll}>
              <textarea
                ref={usernameRef}
                id="add_available_articles"
                rows="8"
                maxLength="30000"
                placeholder="Add one article title or URL per line"
              />
              {realNameInput}
              {roleDescriptionInput}
              <button
                className="button border pull-right"
                type="submit"
              >
                {CourseUtils.i18n('enroll', course.string_prefix)}
              </button>
            </form>
          </div>
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
