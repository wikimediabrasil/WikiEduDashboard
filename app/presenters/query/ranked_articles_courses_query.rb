# frozen_string_literal: true

# RankedArticlesCoursesQuery builds a subquery and join scope for retrieving articles_courses
# with optional ordering, pagination, and filtering for tracked articles only.
# This is used to cleanly separate query logic from presenter code.
# It uses a deferred join via a subquery for improved performance on large datasets.
class Query::RankedArticlesCoursesQuery
  def initialize(courses:, per_page:, offset:, too_many:, article_title: nil, course_title: nil,
                 char_added_from: nil, char_added_to: nil,
                 references_count_from: nil, references_count_to: nil,
                 view_count_from: nil, view_count_to: nil, school: nil,
                 sort_column: nil, sort_direction: nil)
    @courses = courses
    @per_page = per_page
    @offset = offset
    @too_many = too_many
    @article_title = article_title
    @course_title = course_title
    @school = school
    @char_added_from = char_added_from
    @char_added_to = char_added_to
    @references_count_from = references_count_from
    @references_count_to = references_count_to
    @view_count_from = view_count_from
    @view_count_to = view_count_to
    @sort_column = sort_column
    @sort_direction = sort_direction
  end

  # Builds the final scope by joining the subquery on ID, used to fetch paginated and ranked results. # rubocop:disable Layout/LineLength
  # The subquery picks the page; the page is ordered again here, since a join
  # returns a derived table's rows in no promised order. The articles join is
  # spelled out: Rails would alias `left_joins(:article)` because the
  # subquery's text already names the table.
  def scope
    ArticlesCourses
      .joins("INNER JOIN (#{subquery.to_sql}) AS ranked_articles " \
             'ON ranked_articles.id = articles_courses.id')
      .select(:article_id, :course_id, :character_sum, :references_count,
              :first_revision, :average_views, :view_count, :updated_at)
      .then { |q| skip_sorting? ? q : q.joins(ARTICLES_JOIN).order(order_clause) }
  end

  def total_count
    @total_count ||= base_subquery.count
  end

  ARTICLES_JOIN = 'LEFT OUTER JOIN articles ON articles.id = articles_courses.article_id'

  private

  # The views the page shows are computed per row (ArticleHelper#calculate_view_count):
  # average daily views times the days since the first revision, or the stored
  # view_count when either is missing. Ordering by the same arithmetic keeps the
  # sort in step with the numbers on screen; `articles_courses` has no `view_sum`.
  # UTC_DATE matches the helper's `Time.now.utc`, whatever the server's time zone.
  VIEWS_SQL = 'COALESCE(DATEDIFF(UTC_DATE(), articles_courses.first_revision) * ' \
              'COALESCE(articles_courses.average_views, articles.average_views), ' \
              'articles_courses.view_count)'

  # Sort parameter => SQL to order by. The keys are the names the controller accepts.
  SORT_COLUMNS = {
    'title' => 'articles.title',
    'view_sum' => VIEWS_SQL,
    'views' => VIEWS_SQL,
    'char_added' => 'articles_courses.character_sum',
    'character_sum' => 'articles_courses.character_sum',
    'references' => 'articles_courses.references_count',
    'references_count' => 'articles_courses.references_count'
  }.freeze
  DIRECTIONS = %w[ASC DESC].freeze
  DEFAULT_ORDER = 'articles.deleted ASC, articles_courses.character_sum DESC'

  def skip_sorting?
    total_count > 50_000
  end

  # Builds a subquery that includes optional ordering and pagination depending on the "too_many" flag. # rubocop:disable Layout/LineLength
  # The order spans the articles table, so it is joined: `includes` would make
  # Rails eager-load it and select every articles column into the subquery.
  def subquery
    base_subquery
      .then { |q| skip_sorting? ? q : q.order(order_clause) }
      .limit(@per_page)
      .offset(@offset)
  end

  def base_subquery
    q = ArticlesCourses
        .left_joins(:article)
        .where(course_id: @courses.map(&:id), tracked: true)

    q = apply_text_filters(q)
    q = apply_range_filters(q)
    q.select(:id)
  end

  def order_clause
    column = SORT_COLUMNS[@sort_column]
    direction = DIRECTIONS.find { |d| d.casecmp?(@sort_direction.to_s) }
    return DEFAULT_ORDER unless column && direction

    Arel.sql(column).public_send(direction.downcase)
  end

  def apply_text_filters(query)
    q = query
    if @article_title.present?
      sanitized_title = ActiveRecord::Base.sanitize_sql_like(@article_title)
      q = q.where(Article.arel_table[:title].matches("%#{sanitized_title}%", '\\'))
    end
    apply_course_filters(q)
  end

  def apply_course_filters(query)
    has_course_filter = @course_title.present? || Array(@school).reject(&:blank?).any?
    return query unless has_course_filter

    q = query.joins(:course)
    if @course_title.present?
      sanitized = ActiveRecord::Base.sanitize_sql_like(@course_title)
      q = q.where(Course.arel_table[:title].matches("%#{sanitized}%", '\\'))
    end
    school_list = Array(@school).reject(&:blank?)
    q = q.where(courses: { school: school_list }) if school_list.any?
    q
  end

  def apply_range_filters(query)
    q = query
    q = apply_min_max(q, 'articles_courses.character_sum', @char_added_from, @char_added_to)
    q = apply_min_max(q, 'articles_courses.references_count', @references_count_from,
                      @references_count_to)
    apply_min_max(q, 'articles_courses.view_count', @view_count_from, @view_count_to)
  end

  def apply_min_max(query, column, min_val, max_val)
    q = query
    q = q.where("#{column} >= ?", min_val) if min_val.present?
    q = q.where("#{column} <= ?", max_val) if max_val.present?
    q
  end
end
