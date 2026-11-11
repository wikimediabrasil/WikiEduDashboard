# frozen_string_literal: true

require_dependency "#{Rails.root}/lib/revision_feedback_service"
require_dependency "#{Rails.root}/lib/lift_wing_api"
require_dependency "#{Rails.root}/lib/wiki_api/article_content"

class RevisionFeedbackController < ApplicationController
  include CourseHelper

  before_action :require_signed_in, only: %i[revision create notifications]
  before_action :set_course_and_editor, only: %i[revision create]
  before_action :verify_access, only: [:create]

  def index
    assignment = Assignment.find(params['assignment_id'])
    require_course_visible(assignment.course)
    set_latest_revision_id
    return if @rev_id.nil?
    revision_data = LiftWingApi.new(@wiki).get_revision_data([@rev_id])[@rev_id.to_s]
    @feedback = RevisionFeedbackService.new(revision_data['features']).feedback
    @user_feedback = assignment.assignment_suggestions
    @rating = revision_data['prediction']
  end

  def revision
    require_course_visible(@course)
    feedback = RevisionFeedback.where(course: @course, editor: @editor,
                                      revision_id: params[:revision_id]).includes(:author)
    feedback.update_all(read_at: Time.current) if current_user.id == @editor.id
    render json: feedback.map { |item| serialize(item) }
  end

  def create
    return head :forbidden unless current_user.can_edit?(@course)

    item = RevisionFeedback.create!(course: @course, editor: @editor,
                                   author: current_user, revision_id: params[:revision_id],
                                   text: params.require(:text))
    render json: serialize(item), status: :created
  end

  def notifications
    count = RevisionFeedback.where(course_id: params.require(:course_id),
                                   editor: current_user, read_at: nil).count
    render json: { count: count }
  end

  private

  def set_latest_revision_id
    @wiki = Wiki.find_by(language: 'en', project: 'wikipedia')
    @rev_id = WikiApi::ArticleContent.new(@wiki).latest_revision_id(params['title'])
  end

  def set_course_and_editor
    @course = Course.find(params.require(:course_id))
    @editor = User.find(params.require(:editor_id))
  end

  def verify_access
    allowed = current_user.id == @editor.id || current_user.can_edit?(@course)
    raise NotPermittedError unless allowed
  end

  def serialize(item)
    { id: item.id, text: item.text, author: item.author.username,
      created_at: item.created_at, read: item.read_at.present? }
  end
end
