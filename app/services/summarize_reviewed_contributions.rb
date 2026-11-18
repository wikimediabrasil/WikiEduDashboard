# frozen_string_literal: true

require_dependency "#{Rails.root}/lib/word_count"

# Summarizes only revisions explicitly validated for a participant in a program.
class SummarizeReviewedContributions
  attr_reader :stats

  def initialize(course:, user:)
    @course = course
    @user = user
    @stats = summarize
  end

  private

  def summarize
    records = RevisionAcceptance.where(course: @course, user: @user, status: 'validated')
                                .includes(:wiki).to_a
    metadata = records.map(&:revision_metadata)
    return { revision_count: records.size, word_count: nil, references_count: nil,
             article_count: nil } if metadata.any?(&:blank?)

    mainspace = records.select { |record| record.revision_metadata['namespace'].zero? }
    refs = metadata.any? { |data| data['references'].nil? } ? nil :
      metadata.sum { |data| data['references'] }
    { revision_count: records.size, word_count: word_count(mainspace),
      references_count: refs, article_count: article_count(mainspace) }
  end

  def word_count(records)
    characters = records.sum do |record|
      WordCount::EXCLUDED_PROJECTS.include?(record.wiki.project) ? 0 :
        record.revision_metadata['characters'].to_i
    end
    WordCount.from_characters(characters)
  end

  def article_count(records)
    records.map { |record| [record.wiki_id, record.revision_metadata['page_id']] }.uniq.size
  end
end
