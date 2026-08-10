# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Label, type: :model do
  it 'is valid with valid attributes' do
    label = build(:label)
    expect(label).to be_valid
  end

  it 'is invalid without a name (labels field)' do
    label = build(:label, labels: nil)
    expect(label).to be_invalid
    expect(label.errors[:labels]).to include("can't be blank")
  end

  it 'is invalid without a url' do
    label = build(:label, url: nil)
    expect(label).to be_invalid
    expect(label.errors[:url]).to include("can't be blank")
  end

  it 'can have associated campaigns through campaigns_labels' do
    label = create(:label)
    campaign = create(:campaign)
    campaigns_label = create(:campaigns_label, campaign:, label:)

    expect(label.campaigns).to include(campaign)
    expect(label.campaigns_labels).to include(campaigns_label)
  end
end
