# frozen_string_literal: true

class UserProfilesController < ApplicationController
  include UserProfileAnalytics
  include UserProfileCallbacks
  respond_to :html, :json

  before_action :set_user
  before_action :set_user_profile, only: [:update, :update_email_preferences]
  before_action :require_write_permissions, only: [:update, :delete_profile_image]

  def taught_courses_articles
    user = User.find_by(username: params[:username])
    return render json: { error: 'User not found' }, status: :not_found if user.nil?

    data = user.taught_courses_with_edited_articles(viewer: current_user)

    render json: data, status: :ok
  end

  def user_articles
    return render json: { error: 'User not found' }, status: :not_found unless @user

    @user_articles = fetch_user_articles(params[:course_id])
                     .reject { |row| row.course.reviewed_contributions? }
    course_ids = @user_articles.map(&:course_id).uniq
    @user_article_stats = fetch_user_article_stats(course_ids)
    @courses_with_acuwt = courses_with_acuwt(course_ids)
    @courses_users = @user.courses_users.where(course_id: course_ids,
                                               role: CoursesUsers::Roles::STUDENT_ROLE)
                          .index_by(&:course_id)
    set_reviewed_articles
  end

  def course_contributions
    render json: GetProfileCourseContributions.new(public_student_enrollment,
                                                    validated_only: params[:validated] == '1').data
  end

  def course_uploads
    enrollment = public_student_enrollment
    @course = enrollment.course
    @uploads = @course.uploads.where(commons_uploads: { user_id: @user.id })
                      .includes(:user).order(uploaded_at: :desc)
  end

  def show
    if @user
      @last_courses_user = @user.courses_users.includes(:course)
                                .where(courses: { private: false }).last
      @user_profile = @user.user_profile || UserProfile.new(user_id: @user.id)
    else
      flash[:notice] = 'User not found'
      redirect_to controller: 'dashboard', action: 'index'
    end
  end

  def update
    if params[:user_profile][:image].present? || params[:user_profile][:image_file_link].present?
      @user_profile.image.destroy
      @user_profile.image_file_link = nil
    end
    validate_update
  end

  def validate_update
    email_must_be_present_for_instructors
    if @user.errors.empty? &&
       @user_profile.update(user_profile_params) && @user.update(user_email_params)
      flash[:notice] = 'Profile Updated'
    else
      flash[:error] = (@user.errors.full_messages + @user_profile.errors.full_messages).join(', ')
    end
  rescue Paperclip::Errors::CommandNotFoundError
    flash[:error] = I18n.t('users.imagemagick_not_installed')
  ensure
    user_profile_redirect
  end

  def stats
    return render json: { error: 'User not found' }, status: :not_found unless @user
    @courses_users = @user.courses_users.includes(:course).where(courses: { private: false })
    @individual_stats_presenter = IndividualStatisticsTimeslicePresenter.new(user: @user)
    @courses_list = public_courses
                    .where(courses_users: { role: CoursesUsers::Roles::INSTRUCTOR_ROLE })
    @courses_presenter = CoursesPresenter.new(current_user:,
                                              courses_list: @courses_list)
    @user_uploads = CommonsUpload.where(user_id: @user.id).order(uploaded_at: :desc).first(20)
    @max_project = max_project
    set_reviewed_contribution_stats

    # Get articles by language/project for stats
    @articles_by_language = @reviewed_stats.empty? ? get_articles_by_language : []
  end

  def stats_graphs
    @courses_list = public_courses
                    .where(courses_users: { role: CoursesUsers::Roles::INSTRUCTOR_ROLE })
    @courses_presenter = CoursesPresenter.new(current_user:,
                                              courses_list: @courses_list)
  end

  def update_email_preferences
    require_email_preferences_token
    @user_profile.email_opt_out(params[:type])
    flash[:notice] = 'Email Preferences Updated'
    redirect_to '/'
  end

  def delete_profile_image
    @user.user_profile.image.destroy
    @user.user_profile.update(image_file_link: nil)
    @user.user_profile.save
    redirect_to controller: 'user_profiles', action: 'show', username: @user.username
  end

  private

  def public_student_enrollment
    raise ActiveRecord::RecordNotFound unless @user
    @user.courses_users.joins(:course)
         .where(role: CoursesUsers::Roles::STUDENT_ROLE,
                courses: { private: false, id: params[:course_id] }).first!
  end

  def set_reviewed_articles
    @reviewed_courses = public_courses
                        .where(courses_users: { role: CoursesUsers::Roles::STUDENT_ROLE })
                        .select(&:reviewed_contributions?)
    if params[:course_id].present?
      @reviewed_courses.select! { |course| course.id == params[:course_id].to_i }
    end
    @reviewed_articles = @reviewed_courses.to_h do |course|
      [course.id, GetReviewedArticles.new(course:, user: @user).articles]
    end
  end

  def set_reviewed_contribution_stats
    @wiki_contribution_counts = GetCourseWikiContributionCounts.new(
      user: @user, courses: @courses_users.map(&:course).uniq
    )
    @historical_article_counts = student_articles_count_by_course(@courses_users.map(&:course_id))
    @validated_revision_counts = RevisionAcceptance
                                 .where(user: @user, status: 'validated',
                                        course_id: @courses_users.map(&:course_id))
                                 .group(:course_id).count
    reviewed = @courses_users.select do |cu|
      cu.role == CoursesUsers::Roles::STUDENT_ROLE && cu.course.reviewed_contributions?
    end
    @reviewed_stats = reviewed.to_h do |cu|
      [cu.course_id, SummarizeReviewedContributions.new(course: cu.course, user: @user).stats]
    end
  end
end
