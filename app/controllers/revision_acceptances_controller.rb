# frozen_string_literal: true

#= Controller for per-revision acceptance by course admins
class RevisionAcceptancesController < ApplicationController
  respond_to :json

  # GET /courses/:course_id/revision_acceptances
  # Returns all accepted mw_rev_ids for a course so the frontend can render per-revision state
  ACCEPTANCE_COLUMNS = %i[id mw_rev_id wiki_id user_id accepted_by_id accepted_at status].freeze

  def index
    course = Course.find_by!(slug: params[:course_id])
    acceptances = RevisionAcceptance.for_course(course.id).select(*ACCEPTANCE_COLUMNS)
    render json: { revision_acceptances: acceptances }
  end

  # POST /courses/:course_id/revision_acceptances
  # Body: { mw_rev_id:, wiki_id:, user_id: }
  def create
    require_signed_in
    course = Course.find_by!(slug: params[:course_id])
    raise NotPermittedError unless current_user.can_edit?(course)

    acceptance = build_acceptance(course)
    acceptance.save!
    render json: acceptance.as_json(only: ACCEPTANCE_COLUMNS), status: :created
  end

  private

  def build_acceptance(course)
    acceptance = RevisionAcceptance.find_or_initialize_by(
      mw_rev_id: params[:mw_rev_id],
      wiki_id:   params[:wiki_id],
      course_id: course.id
    )
    acceptance.assign_attributes(
      user_id:        params[:user_id],
      accepted_by_id: current_user.id,
      accepted_at:    Time.zone.now,
      status:         params[:status].presence_in(%w[validated invalidated]) || 'validated'
    )
    acceptance
  end

  public

  # DELETE /courses/:course_id/revision_acceptances/:id
  def destroy
    require_signed_in
    course = Course.find_by!(slug: params[:course_id])
    raise NotPermittedError unless current_user.can_edit?(course)

    acceptance = RevisionAcceptance.find_by!(id: params[:ra_id], course_id: course.id)
    acceptance.destroy!
    render json: { id: params[:ra_id] }
  end
end
