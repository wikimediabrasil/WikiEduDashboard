# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Reviewed profile statistics', type: :request do
  let(:user) { create(:user) }
  let(:wiki) { Wiki.find(1) }
  let(:course) { create(:course, flags: { reviewed_contributions: true }) }
  let(:metadata) do
    { 'page_id' => 17, 'title' => 'Example', 'namespace' => 0,
      'characters' => 100, 'references' => 2, 'new_article' => false }
  end

  before do
    create(:courses_user, course:, user:, role: CoursesUsers::Roles::STUDENT_ROLE,
                          character_sum_ms: 9999, revision_count: 200, total_uploads: 12)
    create(:revision_acceptance, course:, user:, wiki:, accepted_by: user,
                                 revision_metadata: metadata)
  end

  it 'reports validated metrics rather than the historical totals' do
    get "/users/#{user.username}/stats.json"
    expect(response).to have_http_status(:ok)
    data = response.parsed_body
    expect(data['validated_contributions_by_course'].first)
      .to include('revision_count' => 1, 'word_count' => 19, 'references_count' => 2)
    expect(data['as_student']['individual_word_count']).to be_nil
    expect(data['validated_contributions_by_course'].first['commons_upload_count']).to be_nil
  end

  it 'returns the cached Commons upload total for a course without instructor review' do
    course.update!(flags: {})
    get "/users/#{user.username}/stats.json"
    expect(response.parsed_body['validated_contributions_by_course'].first['commons_upload_count'])
      .to eq(12)
  end

  it 'shows only validated articles in program details' do
    get "/users/#{user.username}/user_articles.json"
    expect(response).to have_http_status(:ok)
    group = response.parsed_body.fetch('articles_by_course').first
    expect(group['articles'].map { |article| article['title'] }).to eq(['Example'])
    expect(group['word_count']).to eq(19)
  end
end
