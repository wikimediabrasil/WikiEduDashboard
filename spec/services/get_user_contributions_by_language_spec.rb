# frozen_string_literal: true

require 'rails_helper'

describe GetUserContributionsByLanguage do
  let(:user) { create(:user) }

  it 'returns no metrics for a user with no student courses' do
    expect(described_class.new(user).result).to eq([])
  end

  it 'combines student contributions from public courses sharing a wiki' do
    first = create(:course)
    second = create(:course, slug: 'Example/Second', home_wiki: first.home_wiki)
    [first, second].each do |course|
      create(:courses_user, user:, course:, character_sum_ms: 100, references_count: 3)
    end
    article = create(:article)
    create(:articles_course, course: first, article:, user_ids: [user.id])

    expect(described_class.new(user).result).to eq(
      [{ language: first.home_wiki.language, project: first.home_wiki.project,
         word_count: WordCount.from_characters(200), references_count: 6, article_count: 1 }]
    )
  end

  it 'excludes private courses and instructor contributions' do
    private_course = create(:course, private: true)
    taught_course = create(:course, slug: 'Example/Taught')
    create(:courses_user, user:, course: private_course, character_sum_ms: 100)
    create(:courses_user, user:, course: taught_course,
                         role: CoursesUsers::Roles::INSTRUCTOR_ROLE, character_sum_ms: 100)

    expect(described_class.new(user).result).to eq([])
  end
end
