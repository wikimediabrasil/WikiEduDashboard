# frozen_string_literal: true

# Groups the program's validated revisions by wiki and page for profile details.
class GetReviewedArticles
  attr_reader :articles

  def initialize(course:, user:)
    @course = course
    @user = user
    @articles = build_articles
  end

  private

  def build_articles
    records = RevisionAcceptance.where(course: @course, user: @user, status: 'validated')
                                .includes(:wiki).select do |record|
      record.revision_metadata['namespace']&.zero?
    end
    records.group_by { |record| [record.wiki_id, record.revision_metadata['page_id']] }
           .map { |_key, revisions| article_data(revisions) }
  end

  def article_data(revisions)
    first = revisions.first
    wiki = first.wiki
    data = first.revision_metadata
    article = Article.new(wiki:, title: data['title'], namespace: 0)
    stats = article_stats(revisions, wiki)
    { article_id: "#{wiki.id}-#{data['page_id']}", title: data['title'], url: article.url,
      **stats,
      new_article: revisions.any? { |record| record.revision_metadata['new_article'] },
      language: wiki.language, wiki_language: wiki.language, project: wiki.project }
  end

  def article_stats(revisions, wiki)
    refs = revisions.map { |record| record.revision_metadata['references'] }
    characters = revisions.sum { |record| record.revision_metadata['characters'].to_i }
    characters = 0 if WordCount::EXCLUDED_PROJECTS.include?(wiki.project)
    { character_sum: characters, word_count: WordCount.from_characters(characters),
      references_count: refs.any?(&:nil?) ? nil : refs.sum }
  end
end
