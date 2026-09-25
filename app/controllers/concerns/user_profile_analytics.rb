# frozen_string_literal: true

module UserProfileAnalytics
  extend ActiveSupport::Concern

  def course_article_data(cu)
    ac_records = ArticlesCourses.tracked_for_user_and_course(cu.course, @user.id)
    articles = format_articles(ac_records)

    return nil unless articles.any? || 
                      cu.character_sum_ms.positive? || 
                      cu.references_count.positive?

    {
      course_title: cu.course.title,
      course_slug: cu.course.slug,
      word_count: WordCount.from_characters(cu.character_sum_ms),
      references_count: cu.references_count,
      articles_edited: articles.length,
      articles:
    }
  end

  def format_articles(ac_records)
    ac_records.map do |ac|
      {
        article_id: ac.article.id,
        title: ac.article.title,
        url: ac.article.url,
        word_count: WordCount.from_characters(ac.character_sum.to_i),
        references_count: ac.references_count.to_i
      }
    end
  end

  def max_project
    ids_array = public_courses.map(&:home_wiki_id)
    max_ids = ids_array.tally.select { |_k, v| v == ids_array.tally.values.max }.keys
    projects = Wiki.where(id: max_ids).map(&:project)
    projects.include?('wikipedia') ? 'wikipedia' : projects[0]
  end

  def get_articles_by_language
    GetUserContributionsByLanguage.new(@user).result
  end

  def public_courses
    @user.courses.nonprivate
  end

  private

  def require_write_permissions
    return if current_user == @user
    raise ActionController::InvalidAuthenticityToken, 'Unauthorized'
  end

  def require_email_preferences_token
    return if @user_profile.email_preferences_token == params[:token]
    raise ActionController::InvalidAuthenticityToken, 'Unauthorized'
  end

  def user_profile_params
    params.require(:user_profile).permit(:bio, :image, :location, :institution, :image_file_link)
  end

  def user_email_params
    params.require(:email).permit(:email)
  end

  def email_must_be_present_for_instructors
    return unless current_user.active_course_instructor?
    submitted_email = user_email_params[:email].to_s.strip

    return if submitted_email.present?

    @user.errors.add(:email, :blank, message: I18n.t('users.email_required_instructor'))
    flash[:error] = I18n.t('users.email_required_instructor')
  end

  def user_profile_redirect
    redirect_to controller: 'user_profiles', action: 'show', username: @user.username
  end

  def set_user
    # Per MediaWiki convention, underscores in username urls represent spaces
    username = CGI.unescape(params[:username].to_s).tr('_', ' ')
    @user = User.find_by(username:)
  end

  def set_user_profile
    @user_profile = @user.user_profile
    @user_profile = @user.create_user_profile if @user_profile.nil?
  end
end