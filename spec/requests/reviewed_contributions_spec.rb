# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Reviewed contributions', type: :request do
  let(:course) { create(:course, slug: 'School/Program', flags: { reviewed_contributions: true }) }
  let(:user) { create(:user) }
  let(:instructor) { create(:instructor) }
  let(:wiki) { Wiki.find(1) }
  let(:path) { "/courses/#{course.slug}/revision_acceptances" }
  let(:params) { { user_id: user.id, wiki_id: wiki.id, mw_rev_id: 10, status: 'validated' } }

  before do
    create(:courses_user, course:, user:, role: CoursesUsers::Roles::STUDENT_ROLE)
    create(:courses_user, course:, user: instructor, role: CoursesUsers::Roles::INSTRUCTOR_ROLE)
  end

  it 'refuses review by a participant without instructor permissions' do
    login_as user
    expect { post(path, params:) }.not_to change(RevisionAcceptance, :count)
  end

  it 'rejects an edit that cannot be verified against the wiki and program' do
    login_as instructor
    result = instance_double(GetReviewedRevision, metadata: nil)
    allow(GetReviewedRevision).to receive(:new).and_return(result)
    expect { post(path, params:) }.not_to change(RevisionAcceptance, :count)
    expect(response).to have_http_status(422)
  end

  it 'stores the verified edit data for an instructor review' do
    login_as instructor
    metadata = { 'page_id' => 1, 'title' => 'Example', 'namespace' => 0,
                 'characters' => 100, 'references' => 2 }
    result = instance_double(GetReviewedRevision, metadata:)
    allow(GetReviewedRevision).to receive(:new).and_return(result)
    post(path, params:)
    expect(response).to have_http_status(:created)
    expect(RevisionAcceptance.last.revision_metadata).to eq(metadata)
  end

  it 'does not expose a private program review list to the public' do
    course.update!(private: true)
    get path
    expect(response).to have_http_status(:not_found)
  end
end
