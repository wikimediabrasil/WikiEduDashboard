# frozen_string_literal: true

require_dependency "#{Rails.root}/lib/wiki_api"
require_dependency "#{Rails.root}/lib/importers/revision_score_importer"

# Fetches and verifies the wiki's revision data before associating it with a program.
class GetReviewedRevision
  attr_reader :metadata

  def initialize(course:, user:, wiki:, revision_id:)
    @course = course
    @user = user
    @wiki = wiki
    @revision_id = revision_id.to_i
    @api = WikiApi.new(wiki)
    @metadata = fetch_metadata
  end

  private

  def fetch_metadata
    return unless @course.students.exists?(id: @user.id) && @course.wikis.exists?(id: @wiki.id)

    page, revision = fetch_revision(@revision_id)
    return unless page && revision && revision['user'] == @user.username
    timestamp = valid_timestamp(revision)
    return unless timestamp

    size = added_bytes(revision)
    return if size.nil?

    { 'page_id' => page['pageid'], 'title' => page['title'], 'namespace' => page['ns'],
      'timestamp' => timestamp.iso8601, 'characters' => size,
      'new_article' => revision['parentid'].zero?, 'references' => references_added(revision) }
  rescue ArgumentError, TypeError
    nil
  end

  def valid_timestamp(revision)
    timestamp = Time.zone.parse(revision['timestamp'].to_s)
    return unless timestamp && timestamp >= @course.start && timestamp <= @course.end
    timestamp
  end

  def fetch_revision(id)
    response = @api.query(prop: 'revisions', revids: id, rvprop: 'ids|timestamp|user|size')
    page = response&.data&.dig('pages')&.values&.first
    [page, page&.dig('revisions')&.first]
  end

  def added_bytes(revision)
    return unless revision['size'].is_a?(Integer) && revision['parentid'].is_a?(Integer)
    return revision['size'] if revision['parentid'].zero?

    _, parent = fetch_revision(revision['parentid'])
    return unless parent && parent['size'].is_a?(Integer)
    [revision['size'] - parent['size'], 0].max
  end

  def references_added(revision)
    record = RevisionOnMemory.new(mw_rev_id: @revision_id)
    record.new_article = revision['parentid'].zero?
    importer = RevisionScoreImporter.new(wiki: @wiki, course: @course)
    scored = importer.get_revision_scores([record]).first
    return if scored.error || scored.features.blank?
    return if !record.new_article && scored.features_previous.blank?
    scored.references_added
  rescue StandardError => e
    Rails.logger.warn("Could not score revision #{@revision_id}: #{e.class}")
    nil
  end
end
