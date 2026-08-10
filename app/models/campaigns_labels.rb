# frozen_string_literal: true

# == Schema Information
#
# Table name: campaigns_labels
#
#  id          :integer          not null, primary key
#  campaign_id :integer
#  label_id    :integer
#  created_at  :datetime         not null
#  updated_at  :datetime         not null
#

class CampaignsLabels < ApplicationRecord
  belongs_to :campaign
  belongs_to :label

  # rubocop:disable Rails/UniqueValidationWithoutIndex
  validates :campaign_id, uniqueness: { scope: :label_id }
  # rubocop:enable Rails/UniqueValidationWithoutIndex
end
