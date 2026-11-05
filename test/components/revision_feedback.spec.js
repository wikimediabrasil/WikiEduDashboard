import '../testHelper';
import React from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react-dom/test-utils';
import Feedback from '../../app/assets/javascripts/components/students/shared/StudentList/StudentDrawer/RevisionFeedback';
import API from '../../app/assets/javascripts/utils/api';

jest.mock('../../app/assets/javascripts/utils/api');
global.IS_REACT_ACT_ENVIRONMENT = true;

it('opens an editable textarea for an instructor after clicking comments', async () => {
  API.fetchRevisionFeedback.mockResolvedValue([]);
  const container = document.createElement('div');
  const root = createRoot(container);
  await act(async () => {
    root.render(<Feedback revision={{ revid: 123 }} course={{ id: 34 }}
      editor={{ id: 725 }} currentUser={{ id: 1, isInstructor: true }} />);
  });
  expect(container.querySelector('textarea')).toBeNull();
  await act(async () => container.querySelector('button').click());
  expect(API.fetchRevisionFeedback).toHaveBeenCalledWith(123, 34, 725);
  expect(container.querySelector('textarea')).not.toBeNull();
  expect(container.querySelector('textarea').disabled).toBe(false);
  await act(async () => root.unmount());
});

it('loads saved comments from the server after remounting the component', async () => {
  const savedComment = { id: 2, author: 'Instructor', text: 'falta x' };
  API.fetchRevisionFeedback.mockResolvedValue({ revision_feedback: [savedComment] });
  const container = document.createElement('div');

  for (let load = 0; load < 2; load += 1) {
    const root = createRoot(container);
    await act(async () => {
      root.render(<Feedback revision={{ revid: 73092914 }} course={{ id: 34 }}
        editor={{ id: 725 }} currentUser={{ id: 1, isInstructor: true }} />);
    });
    await act(async () => container.querySelector('button').click());
    expect(container.querySelector('.revision-feedback-panel p').textContent)
      .toBe('Instructor: falta x');
    await act(async () => root.unmount());
  }
});
