# frozen_string_literal: true

require 'rails_helper'

RSpec.describe SummarizeReviewedContributions do
  let(:course) { create(:course) }
  let(:other_course) { create(:course, slug: 'other/course') }
  let(:user) { create(:user) }
  let(:wiki) { Wiki.find(1) }
  let(:metadata) do
    { 'page_id' => 5, 'title' => 'Example', 'namespace' => 0,
      'characters' => 100, 'references' => 2 }
  end

  it 'counts only validated revisions of the requested user and course' do
    create(:revision_acceptance, course:, user:, wiki:, accepted_by: user, mw_rev_id: 1,
                                 revision_metadata: metadata)
    create(:revision_acceptance, course:, user:, wiki:, accepted_by: user, mw_rev_id: 2,
                                 status: 'invalidated', revision_metadata: metadata)
    create(:revision_acceptance, course: other_course, user:, wiki:, accepted_by: user,
                                 mw_rev_id: 1, revision_metadata: metadata)

    stats = described_class.new(course:, user:).stats
    expect(stats).to include(revision_count: 1, word_count: 19, references_count: 2,
                             article_count: 1)
  end

  it 'does not invent statistics for older reviews without revision metadata' do
    create(:revision_acceptance, course:, user:, wiki:, accepted_by: user)
    stats = described_class.new(course:, user:).stats
    expect(stats).to include(revision_count: 1, word_count: nil, references_count: nil,
                             article_count: nil)
  end
end
