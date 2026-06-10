# frozen_string_literal: true

class CampaignsLabelsController < ApplicationController
  before_action :set_campaign
  before_action :require_write_permissions

  def create
    @label = Label.find(params[:label_id])
    @campaigns_label = CampaignsLabels.new(campaign: @campaign, label: @label)

    respond_to do |format|
      if @campaigns_label.save
        format.json { render json: @campaigns_label, status: :created }
      else
        format.json { render json: @campaigns_label.errors, status: :unprocessable_entity }
      end
    end
  end

  def destroy
    @campaigns_label = CampaignsLabels.find_by(campaign: @campaign, label_id: params[:label_id])
    if @campaigns_label
      @campaigns_label.destroy
      respond_to do |format|
        format.json { head :no_content }
      end
    else
      respond_to do |format|
        format.json { render json: { error: 'Not found' }, status: :not_found }
      end
    end
  end

  private

  def set_campaign
    @campaign = Campaign.find_by(slug: params[:campaign_id]) || Campaign.find_by(id: params[:campaign_id])
    return if @campaign
    raise ActionController::RoutingError.new('Not Found'), 'Campaign does not exist'
  end

  def require_write_permissions
    return if current_user&.admin? || user_is_organizer?

    exception = ActionController::InvalidAuthenticityToken.new('Unauthorized')
    raise exception
  end

  def user_is_organizer?
    return false unless current_user
    @campaign.campaigns_users.where(user_id: current_user.id,
                                    role: CampaignsUsers::Roles::ORGANIZER_ROLE).any?
  end
end
