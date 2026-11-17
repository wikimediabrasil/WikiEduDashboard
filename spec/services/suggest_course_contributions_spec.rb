# frozen_string_literal: true

require 'rails_helper'

RSpec.describe SuggestCourseContributions do
  it 'matches category members only on their own wiki' do
    category = instance_double(Category, wiki_id: 1, article_titles: ['Birds'])
    categories = double('categories')
    course = instance_double(Course, categories:)
    allow(categories).to receive(:where).with(source: 'category').and_return([category])
    candidates = [{ wiki_id: 1, title: 'Birds' }, { wiki_id: 2, title: 'Birds' },
                  { wiki_id: 1, title: 'Trees' }]

    expect(described_class.new(course, candidates).matches).to eq([{ wiki_id: 1, title: 'Birds' }])
  end
end
