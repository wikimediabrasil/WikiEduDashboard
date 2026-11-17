# frozen_string_literal: true

# Supplies public program settings and validated edits for a participant's profile.
class GetProfileCourseContributions
  attr_reader :data

  def initialize(enrollment, validated_only: false)
    @course = enrollment.course
    @user = enrollment.user
    @validated_only = validated_only
    @wiki_counts = wiki_counts
    @data = build_data(enrollment)
  end

  private

  def build_data(enrollment)
    { course_id: @course.id, course_title: @course.title, course_slug: @course.slug,
      start: @course.start, end: @course.end, reviewed: reviewed?,
      total: total(enrollment), wikis: wiki_data, revisions: reviewed_revisions }
  end

  def total(enrollment)
    return enrollment.revision_count unless reviewed?
    reviews.size
  end

  def reviewed?
    @validated_only || @course.reviewed_contributions?
  end

  def wiki_counts
    if @validated_only
      return reviews.group_by(&:wiki_id).transform_values { |rows| { revision_count: rows.size } }
    end
    counts = GetCourseWikiContributionCounts.new(user: @user, courses: [@course])
    counts.for_course(@course).index_by { |row| row[:wiki_id] }
  end

  def wiki_data
    wikis = @course.wikis.to_a
    wikis |= reviews.map(&:wiki) if reviewed?
    wikis.map do |wiki|
      excluded = @course.articles_courses.not_tracked.joins(:article)
                        .where(articles: { wiki_id: wiki.id }).pluck('articles.mw_page_id')
      wiki.as_json(only: %i[id language project]).merge(
        domain: wiki.domain,
        revision_count: @wiki_counts.dig(wiki.id, :revision_count) || 0,
        excluded_page_ids: excluded,
        scoped_titles: scoped_titles(wiki), scoped_page_ids: scoped_page_ids(wiki)
      )
    end
  end

  def scoped_titles(wiki)
    @course.scoped_article_titles(wiki).to_a if @course.only_scoped_articles_course?
  end

  def scoped_page_ids(wiki)
    @course.assigned_article_page_ids(wiki) if @course.only_scoped_articles_course?
  end

  def reviewed_revisions
    return [] unless reviewed?
    reviews.map do |record|
      { wiki_id: record.wiki_id, revid: record.mw_rev_id, metadata: record.revision_metadata }
    end
  end

  def reviews
    @reviews ||= RevisionAcceptance.where(course: @course, user: @user, status: 'validated')
                                   .includes(:wiki).to_a
  end
end
