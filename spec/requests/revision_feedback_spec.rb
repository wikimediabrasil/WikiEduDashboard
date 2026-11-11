# frozen_string_literal: true

require 'rails_helper'

describe 'Instructor revision feedback', type: :request do
  let(:course) { create(:course) }
  let(:instructor) { create(:instructor) }
  let(:editor) { create(:user) }
  let(:path) { '/revision_feedback/revisions/123' }
  let(:params) { { course_id: course.id, editor_id: editor.id } }

  before do
    create(:courses_user, course: course, user: instructor, role: 1)
    create(:courses_user, course: course, user: editor, role: 0)
  end

  it 'persists instructor feedback and retrieves it on a separate request' do
    login_as instructor
    expect { post path, params: params.merge(text: 'Check the source'), as: :json }
      .to change(RevisionFeedback, :count).by(1)
    expect(response).to have_http_status(:created)

    get path, params: params
    expect(response).to have_http_status(:ok)
    expect(response.parsed_body.fetch('revision_feedback').first.fetch('text'))
      .to eq('Check the source')
  end

  it 'counts unread feedback for the editor and marks it read when opened' do
    item = RevisionFeedback.create!(course: course, editor: editor, author: instructor,
                                    revision_id: 123, text: 'Check the source')
    login_as editor
    get '/revision_feedback/notifications', params: { course_id: course.id }
    expect(response.parsed_body.fetch('count')).to eq(1)
    get path, params: params
    expect(item.reload.read_at).to be_present
    get '/revision_feedback/notifications', params: { course_id: course.id }
    expect(response.parsed_body.fetch('count')).to eq(0)
  end

  it 'prevents an editor from submitting instructor feedback' do
    login_as editor
    expect { post path, params: params.merge(text: 'Unauthorized'), as: :json }
      .not_to change(RevisionFeedback, :count)
    expect(response).to have_http_status(:forbidden)
  end
  describe 'deleting feedback' do
    let!(:item) do
      RevisionFeedback.create!(course: course, editor: editor, author: instructor,
                               revision_id: 123, text: 'Check the source')
    end

    it 'allows the course instructor to delete feedback' do
      login_as instructor
      expect { delete "#{path}/#{item.id}", params: params, as: :json }
        .to change(RevisionFeedback, :count).by(-1)
      expect(response).to have_http_status(:no_content)
    end

    it 'prevents the participant from deleting feedback' do
      login_as editor
      expect { delete "#{path}/#{item.id}", params: params, as: :json }
        .not_to change(RevisionFeedback, :count)
      expect(response).to have_http_status(:forbidden)
    end

    it 'prevents an instructor of another course from deleting feedback' do
      login_as create(:instructor, username: 'OtherInstructor')
      expect { delete "#{path}/#{item.id}", params: params, as: :json }
        .not_to change(RevisionFeedback, :count)
      expect(response).to have_http_status(:forbidden)
    end

    it 'does not delete feedback for a different revision' do
      login_as instructor
      expect { delete "/revision_feedback/revisions/456/#{item.id}", params: params, as: :json }
        .not_to change(RevisionFeedback, :count)
      expect(response).to have_http_status(:not_found)
    end
  end

end
