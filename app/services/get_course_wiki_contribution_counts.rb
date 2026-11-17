# frozen_string_literal: true

# Counts participant edits by program and wiki using the same source as each program total.
class GetCourseWikiContributionCounts
  def initialize(user:, courses:)
    @user = user
    @courses = courses
    @counts = fetch_counts
    @wikis = Wiki.where(id: @counts.keys.map(&:last).uniq).index_by(&:id)
  end

  def for_course(course)
    @counts.filter_map do |(course_id, wiki_id), count|
      next unless course_id == course.id && count.positive? && @wikis[wiki_id]
      { wiki_id:, domain: @wikis[wiki_id].domain, project: @wikis[wiki_id].project,
        revision_count: count }
    end.sort_by { |row| [-row[:revision_count], row[:domain]] }
  end

  private

  def fetch_counts
    reviewed_ids, automatic_ids = @courses.partition(&:reviewed_contributions?)
                                          .map { |courses| courses.map(&:id) }
    automatic = CourseUserWikiTimeslice.where(course_id: automatic_ids, user: @user)
                                       .group(:course_id, :wiki_id).sum(:revision_count)
    reviewed = RevisionAcceptance.where(course_id: reviewed_ids, user: @user, status: 'validated')
                                 .group(:course_id, :wiki_id).count
    automatic.merge(reviewed)
  end
end
