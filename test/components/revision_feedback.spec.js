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

it('removes a comment when an instructor deletes it', async () => {
  const savedComment = {
    id: 5, author: 'Instructor', text: 'borrar', can_delete: true, created_at: '2026-11-20T15:30:00Z'
  };
  API.fetchRevisionFeedback.mockResolvedValue([savedComment]);
  API.deleteRevisionFeedback.mockResolvedValue();
  const container = document.createElement('div');
  const root = createRoot(container);
  await act(async () => {
    root.render(<Feedback revision={{ revid: 99 }} course={{ id: 34 }}
      editor={{ id: 725 }} currentUser={{ id: 1, isInstructor: true }} />);
  });
  await act(async () => container.querySelector('button').click());
  await act(async () => container.querySelector('.revision-feedback-item__delete').click());
  expect(API.deleteRevisionFeedback).toHaveBeenCalledWith(99, 34, 725, 5);
  expect(container.querySelector('.revision-feedback-item')).toBeNull();
  await act(async () => root.unmount());
});

it('shows one feedback button and closes the editor after saving', async () => {
  API.fetchRevisionFeedback.mockResolvedValue([]);
  API.createRevisionFeedback.mockResolvedValue({ id: 6, author: 'Instructor', text: 'Saved' });
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  await act(async () => {
    root.render(<Feedback revision={{ revid: 123 }} course={{ id: 34 }}
      editor={{ id: 725 }} currentUser={{ id: 1, isInstructor: true }} />);
  });
  await act(async () => container.querySelector('button').click());
  expect(container.querySelectorAll('button.button, input[type="submit"]')).toHaveLength(1);

  const textarea = container.querySelector('textarea');
  const setValue = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value').set;
  await act(async () => {
    setValue.call(textarea, 'Saved');
    textarea.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await act(async () => container.querySelector('input[type="submit"]').click());

  expect(API.createRevisionFeedback).toHaveBeenCalledWith(123, 34, 725, 'Saved');
  expect(container.querySelector('textarea')).toBeNull();
  expect(container.querySelectorAll('button.button, input[type="submit"]')).toHaveLength(1);
  expect(container.querySelector('.revision-feedback-item__comment').textContent).toBe('Saved');
  await act(async () => root.unmount());
  container.remove();
});

it('loads saved comments from the server after remounting the component', async () => {
  const createdAt = '2026-11-20T15:30:00Z';
  const savedComment = { id: 2, author: 'Instructor', text: 'falta x', created_at: createdAt };
  API.fetchRevisionFeedback.mockResolvedValue({ revision_feedback: [savedComment] });
  const container = document.createElement('div');

  for (let load = 0; load < 2; load += 1) {
    const root = createRoot(container);
    await act(async () => {
      root.render(<Feedback revision={{ revid: 73092914 }} course={{ id: 34 }}
        editor={{ id: 725 }} currentUser={{ id: 1, isInstructor: true }} />);
    });
    const lines = container.querySelectorAll('.revision-feedback-item p');
    expect(lines[0].textContent).toBe('Instructor');
    expect(lines[1].textContent).toBe(new Date(createdAt).toLocaleString());
    expect(lines[2].textContent).toBe('falta x');
    await act(async () => root.unmount());
  }
});
