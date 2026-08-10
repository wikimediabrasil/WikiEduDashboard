# frozen_string_literal: true

require 'rails_helper'

RSpec.describe CampaignsLabelsController, type: :controller do
  let(:admin) { create(:admin) }
  let(:user) { create(:user) }
  let(:campaign) { create(:campaign) }
  let(:label) { create(:label) }

  describe 'authorization' do
    it 'returns 401 for non-admin on create' do
      allow(controller).to receive(:current_user).and_return(user)
      post :create, params: { campaign_id: campaign.slug, label_id: label.id }, format: :json
      expect(response.status).to eq(401)
    end

    it 'returns 401 for non-admin on destroy' do
      allow(controller).to receive(:current_user).and_return(user)
      delete :destroy, params: { campaign_id: campaign.slug, label_id: label.id }, format: :json
      expect(response.status).to eq(401)
    end
  end

  context 'when user is admin' do
    before do
      allow(controller).to receive(:current_user).and_return(admin)
    end

    describe 'POST #create' do
      it 'links a label to a campaign and returns created' do
        post :create, params: { campaign_id: campaign.slug, label_id: label.id }, format: :json
        expect(response.status).to eq(201)
        expect(campaign.labels.reload).to include(label)
      end
    end

    describe 'DELETE #destroy' do
      it 'unlinks a label from a campaign' do
        create(:campaigns_label, campaign:, label:)
        delete :destroy, params: { campaign_id: campaign.slug, label_id: label.id }, format: :json
        expect(response.status).to eq(204)
        expect(campaign.labels.reload).not_to include(label)
      end
    end
  end

  context 'when user is a campaign organizer' do
    before do
      allow(controller).to receive(:current_user).and_return(user)
      create(:campaigns_user, campaign:, user:, role: CampaignsUsers::Roles::ORGANIZER_ROLE)
    end

    describe 'POST #create' do
      it 'links a label to a campaign' do
        post :create, params: { campaign_id: campaign.slug, label_id: label.id }, format: :json
        expect(response.status).to eq(201)
        expect(campaign.labels.reload).to include(label)
      end
    end

    describe 'DELETE #destroy' do
      it 'unlinks a label from a campaign' do
        create(:campaigns_label, campaign:, label:)
        delete :destroy, params: { campaign_id: campaign.slug, label_id: label.id }, format: :json
        expect(response.status).to eq(204)
        expect(campaign.labels.reload).not_to include(label)
      end
    end
  end
end
