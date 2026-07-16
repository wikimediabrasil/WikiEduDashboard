# frozen_string_literal: true

#= Controller for collections of courses with a common tag
class TaggedCoursesController < ApplicationController
  before_action :require_admin_permissions
  before_action :set_tag

  def articles
    set_page
    set_courses_and_presenter
  end

  def alerts
    set_courses_and_presenter
    respond_to do |format|
      format.html { render }
      format.json do
        @alerts = Alert.includes(:course, :user, article: :wiki).where(course: @courses)
      end
    end
  end

  def programs
    set_page
    set_courses_and_presenter
    load_wiki_experts
  end

  def stats
    set_courses_and_presenter
    respond_to do |format|
      format.json { render 'stats' }
    end
  end

  def tags
    set_courses_and_presenter
    course_label_ids = CoursesLabels.where(course_id: @courses.select(:id)).pluck(:label_id).uniq
    @course_labels = Label.where(id: course_label_ids, display: true).order(:labels)
    respond_to do |format|
      format.html
      format.json { render json: tags_chart_data }
    end
  end

  private

  def tags_chart_data
    labels       = @course_labels
    translations = WikidataLabelService.translations_for(labels)
    {
      tag:           @tag,
      total_courses: @courses.count,
      total_labels:  labels.count,
      labels:        labels.map { |l| label_stat(l, translations) }
    }
  end

  def label_stat(label, translations)
    tagged = @courses
             .joins(:courses_labels)
             .where(courses_labels: { label_id: label.id })
             .distinct
             .pluck(:title, :slug)
    {
      id:           label.id,
      match:        label.match,
      label:        translations[label.match] || label.labels,
      url:          label.url,
      description:  label.description || '',
      course_count: tagged.size,
      courses:      tagged.map { |title, slug| { title:, slug: } }
    }
  end

  def set_page
    @page = params[:page]&.to_i
    @page = nil unless @page&.positive?
  end

  def set_tag
    @tag = params[:tag]
  end

  def set_courses_and_presenter
    @courses = Tag.courses_tagged_with(@tag)
    @presenter = CoursesPresenter.new(current_user:, tag: @tag,
                                      courses_list: @courses, page: @page)
  end

  # Loads CoursesUsers records with role 4 and filters by wiki experts, avoiding N+1 queries
  def load_wiki_experts
    @wiki_experts = CoursesUsers.where(course: @courses, user: SpecialUsers.wikipedia_experts,
                                       role: CoursesUsers::Roles::WIKI_ED_STAFF_ROLE)
  end
end
