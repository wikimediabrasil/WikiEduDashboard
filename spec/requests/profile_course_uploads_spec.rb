# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Profile course uploads', type: :request do
  let(:user) { create(:user) }
  let(:other_user) { create(:user, username: 'OtherEditor') }
  let(:course) { create(:course, slug: 'School/Program') }
  let(:path) { "/users/#{user.username}/course_uploads.json" }

  before do
    create(:courses_user, course:, user:, role: CoursesUsers::Roles::STUDENT_ROLE)
    create(:courses_user, course:, user: other_user, role: CoursesUsers::Roles::STUDENT_ROLE)
    create(:commons_upload, id: 1001, user:, file_name: 'File:In course.jpg',
                            uploaded_at: course.start + 1.day)
    create(:commons_upload, id: 1002, user:, file_name: 'File:Outside.jpg',
                            uploaded_at: course.end + 1.day)
    create(:commons_upload, id: 1003, user: other_user, file_name: 'File:Other.jpg',
                            uploaded_at: course.start + 1.day)
  end

  it 'returns only the participant’s uploads during the requested course' do
    get path, params: { course_id: course.id }
    expect(response).to have_http_status(:ok)
    expect(response.parsed_body['uploads'].pluck('id')).to eq([1001])
  end

  it 'does not expose uploads for a private course' do
    course.update!(private: true)
    get path, params: { course_id: course.id }
    expect(response).to have_http_status(:not_found)
  end
end
