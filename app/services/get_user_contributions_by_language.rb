# frozen_string_literal: true

class GetUserContributionsByLanguage
  attr_reader :result

  def initialize(user)
    @user = user
    @result = contributions
  end

  private

  def student_courses
    @user.courses_users.includes(course: :home_wiki).joins(:course)
         .where(courses: { private: false }, role: CoursesUsers::Roles::STUDENT_ROLE)
  end

  def article_counts(course_ids)
    ArticlesCourses.where('user_ids LIKE ?', "%- #{@user.id}\n%")
                   .where(course_id: course_ids).joins(:article)
                   .where(articles: { deleted: false, namespace: Article::Namespaces::MAINSPACE })
                   .group(:course_id).count
  end

  def contributions
    courses_users = student_courses
    return [] if courses_users.empty?

    counts = article_counts(courses_users.map(&:course_id).uniq)
    courses_users.group_by { |cu| wiki_key(cu) }.map do |(language, project), rows|
      totals(language, project, rows, counts)
    end.sort_by { |row| -row[:word_count] }
  end

  def wiki_key(courses_user)
    wiki = courses_user.course.home_wiki
    language = wiki&.language || 'unknown'
    project = wiki&.project || 'unknown'

    language = 'wikidata' if project == 'wikidata'

    [language, project]
  end

  def totals(language, project, rows, counts)
    {
      language:,
      project:,
      word_count: WordCount.from_characters(rows.sum { |cu| cu.character_sum_ms.to_i }),
      references_count: rows.sum { |cu| cu.references_count.to_i },
      article_count: rows.sum { |cu| counts[cu.course_id].to_i }
    }
  end
end
