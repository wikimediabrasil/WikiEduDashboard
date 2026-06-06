# frozen_string_literal: true

#= Controller for finding the course roles for a user
class CoursesUsersController < ApplicationController
  respond_to :json

  def index
    @courses_users = CoursesUsers
                     .joins(:course)
                     .where(user_id: params['user_id'].to_i)
                     .order(id: :desc)
  end

  def accept
    courses_user = CoursesUsers.find(params[:id])
    require_signed_in
    raise NotPermittedError unless current_user.can_edit?(courses_user.course)
    courses_user.accept!(current_user)
    render json: { accepted_by_id: courses_user.accepted_by_id,
                   accepted_at: courses_user.accepted_at }
  end

  def unaccept
    courses_user = CoursesUsers.find(params[:id])
    require_signed_in
    raise NotPermittedError unless current_user.can_edit?(courses_user.course)
    courses_user.unaccept!
    render json: { accepted_by_id: nil, accepted_at: nil }
  end
end
