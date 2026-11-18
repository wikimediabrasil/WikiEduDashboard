# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Profile course contributions', type: :request do
  let(:user) { create(:user) }
  let(:course) { create(:course, slug: 'School/Program') }
  let(:wiki) { Wiki.find(1) }
  let(:path) { "/users/#{user.username}/course_contributions.json" }

  before do
    create(:courses_user, course:, user:, role: CoursesUsers::Roles::STUDENT_ROLE,
                          revision_count: 24)
  end

  it 'returns the selected public course and its saved total' do
    get path, params: { course_id: course.id }
    expect(response).to have_http_status(:ok)
    expect(response.parsed_body).to include('course_id' => course.id, 'total' => 24,
                                            'reviewed' => false)
  end

  it 'includes the participant’s saved revision count for each wiki' do
    create(:course_user_wiki_timeslice, course:, user:, wiki:, revision_count: 12)
    get path, params: { course_id: course.id }
    item = response.parsed_body['wikis'].find { |entry| entry['id'] == wiki.id }
    expect(item['revision_count']).to eq(12)
  end

  it 'does not expose private program participation' do
    course.update!(private: true)
    get path, params: { course_id: course.id }
    expect(response).to have_http_status(:not_found)
  end

  it 'returns only validated revisions for a reviewed course' do
    course.update!(flags: { reviewed_contributions: true })
    create(:revision_acceptance, course:, user:, wiki:, accepted_by: user, mw_rev_id: 11)
    create(:revision_acceptance, course:, user:, wiki:, accepted_by: user, mw_rev_id: 12,
                                 status: 'invalidated')
    get path, params: { course_id: course.id }
    expect(response.parsed_body['total']).to eq(1)
    expect(response.parsed_body['revisions'].pluck('revid')).to eq([11])
  end

  it 'returns only validated revisions when requested for an automatic course' do
    create(:revision_acceptance, course:, user:, wiki:, accepted_by: user, mw_rev_id: 11)
    create(:revision_acceptance, course:, user:, wiki:, accepted_by: user, mw_rev_id: 12,
                                 status: 'invalidated')
    get path, params: { course_id: course.id, validated: '1' }
    expect(response.parsed_body).to include('total' => 1, 'reviewed' => true)
    expect(response.parsed_body['revisions'].pluck('revid')).to eq([11])
  end
end
