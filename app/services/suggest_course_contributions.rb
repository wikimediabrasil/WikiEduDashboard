# frozen_string_literal: true

require_dependency "#{Rails.root}/lib/article_utils"

# Matches candidate page titles against the program's tracked Wikimedia categories.
class SuggestCourseContributions
  attr_reader :matches

  def initialize(course, candidates)
    @course = course
    @candidates = candidates
    @matches = find_matches
  end

  private

  def find_matches
    titles_by_wiki = category_titles_by_wiki
    @candidates.filter_map do |candidate|
      wiki_id = candidate[:wiki_id].to_i
      title = ArticleUtils.format_article_title(candidate[:title].to_s)
      next unless titles_by_wiki.fetch(wiki_id, Set.new).include?(title)

      { wiki_id:, title: candidate[:title] }
    end.uniq
  end

  def category_titles_by_wiki
    @course.categories.where(source: 'category').each_with_object({}) do |category, titles|
      titles[category.wiki_id] ||= Set.new
      titles[category.wiki_id].merge(category.article_titles)
    end
  end
end
