# frozen_string_literal: true

FactoryBot.define do
  factory :campaigns_label, class: 'CampaignsLabels' do
    campaign
    label
  end
end
