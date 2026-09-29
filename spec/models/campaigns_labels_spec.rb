# frozen_string_literal: true

require 'rails_helper'

RSpec.describe CampaignsLabels, type: :model do
  it 'is valid with valid attributes' do
    campaigns_label = build(:campaigns_label)
    expect(campaigns_label).to be_valid
  end

  it 'is invalid if the campaign-label pair is not unique' do
    campaign = create(:campaign)
    label = create(:label)
    create(:campaigns_label, campaign:, label:)

    duplicate_campaigns_label = build(:campaigns_label, campaign:, label:)
    expect(duplicate_campaigns_label).to be_invalid
    expect(duplicate_campaigns_label.errors[:campaign_id]).to include('has already been taken')
  end
end
