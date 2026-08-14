# frozen_string_literal: true

# == Schema Information
#
# Table name: labels
#
#  id          :integer          not null, primary key
#  labels      :string(255)
#  url         :string(255)
#  match       :string(255)
#  description :text(65535)
#  display     :boolean          default(TRUE)
#  created_at  :datetime         not null
#  updated_at  :datetime         not null
#

class Label < ApplicationRecord
  before_validation :normalize_wikidata_identity

  has_many :campaigns_labels, class_name: 'CampaignsLabels', dependent: :destroy
  has_many :campaigns, through: :campaigns_labels

  has_many :courses_labels, class_name: 'CoursesLabels', dependent: :destroy
  has_many :courses, through: :courses_labels

  validates :labels, presence: true
  validates :url, presence: true
  validates :match, presence: true, format: { with: /\AQ[1-9]\d*\z/ }

  scope :matching_query, lambda { |query|
    sanitized = sanitize_sql_like(query)
    where('`match` LIKE :q OR labels LIKE :q', q: "%#{sanitized}%")
  }

  private

  def normalize_wikidata_identity
    self.match = match.to_s.upcase
    return unless match.match?(/\AQ[1-9]\d*\z/)

    self.url = "https://www.wikidata.org/wiki/#{match}"
  end
end
