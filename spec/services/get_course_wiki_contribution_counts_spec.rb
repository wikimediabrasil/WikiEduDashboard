# frozen_string_literal: true

require 'rails_helper'

RSpec.describe GetCourseWikiContributionCounts do
  let(:user) { create(:user) }
  let(:wiki) do
    build(:wiki, language: nil, project: 'wikidata').tap { |w| w.save!(validate: false) }
  end
  let(:commons) do
    build(:wiki, language: 'commons', project: 'wikimedia').tap { |w| w.save!(validate: false) }
  end
  let(:course) { create(:course) }

  it 'groups the participant’s cached edits by wiki and course' do
    create(:course_user_wiki_timeslice, course:, user:, wiki:, revision_count: 12)
    create(:course_user_wiki_timeslice, course:, user:, wiki: commons, revision_count: 7)
    rows = described_class.new(user:, courses: [course]).for_course(course)
    expect(rows.map { |row| [row[:wiki_id], row[:revision_count]] }).to contain_exactly(
      [wiki.id, 12], [commons.id, 7]
    )
  end

  it 'uses only validated edits for a course with instructor review' do
    course.update!(flags: { reviewed_contributions: true })
    create(:course_user_wiki_timeslice, course:, user:, wiki:, revision_count: 12)
    create(:revision_acceptance, course:, user:, wiki:, accepted_by: user, mw_rev_id: 1)
    create(:revision_acceptance, course:, user:, wiki:, accepted_by: user, mw_rev_id: 2,
                                 status: 'invalidated')
    rows = described_class.new(user:, courses: [course]).for_course(course)
    expect(rows.map { |row| [row[:wiki_id], row[:revision_count]] }).to eq([[wiki.id, 1]])
  end
end
