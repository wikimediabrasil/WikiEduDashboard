import '../testHelper';
import React from 'react';
import { act } from 'react-dom/test-utils';
import { createRoot } from 'react-dom/client';
import API from '../../app/assets/javascripts/utils/api';
import RevisionFeedback from '../../app/assets/javascripts/components/students/shared/StudentList/StudentDrawer/RevisionFeedback';

jest.mock('../../app/assets/javascripts/utils/api');

describe('revision feedback after reloading', () => {
  let container;
  let root;
  const props = {
    revision: { revid: 123 }, course: { id: 8 }, editor: { id: 92 },
    currentUser: { isInstructor: true }
  };

  beforeEach(() => {
    global.IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement('div');
    root = createRoot(container);
    API.fetchRevisionFeedback.mockResolvedValue([
      { id: 1, author: 'Instructor', text: 'Saved feedback' }
    ]);
  });

  afterEach(async () => {
    await act(async () => root.unmount());
    jest.clearAllMocks();
  });

  it('fetches and displays saved comments again after remounting without opening the form', async () => {
    await act(async () => root.render(<RevisionFeedback {...props} />));
    expect(container.textContent).toContain('Saved feedback');
    expect(container.querySelector('textarea')).toBeNull();

    await act(async () => root.unmount());
    root = createRoot(container);
    await act(async () => root.render(<RevisionFeedback {...props} />));

    expect(API.fetchRevisionFeedback).toHaveBeenCalledTimes(2);
    expect(API.fetchRevisionFeedback).toHaveBeenLastCalledWith(123, 8, 92);
    expect(container.textContent).toContain('Saved feedback');
    expect(container.querySelector('textarea')).toBeNull();
  });

  it('shows only the submit button when the editor is opened', async () => {
    await act(async () => root.render(<RevisionFeedback {...props} />));
    await act(async () => container.querySelector('button').click());
    expect(container.querySelector('textarea')).not.toBeNull();
    expect(container.querySelector('button')).toBeNull();
    expect(container.querySelectorAll('input[type="submit"]')).toHaveLength(1);
    expect(container.textContent).toContain('Saved feedback');
  });
});
