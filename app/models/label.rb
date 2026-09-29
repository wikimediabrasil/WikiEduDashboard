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
  has_many :campaigns_labels, class_name: 'CampaignsLabels', dependent: :destroy
  has_many :campaigns, through: :campaigns_labels

  validates :labels, presence: true, length: { maximum: 255 }
  validates :url, presence: true, format: { with: %r{\Ahttps?://[^\s]+\z} },
                  length: { maximum: 255 }

  def self.from_wikidata_tag(tag_json)
    return unless tag_json.is_a?(String)

    data = JSON.parse(tag_json)
    return unless valid_wikidata_tag?(data)

    label = find_or_initialize_by(match: data['qNumber'])
    if label.new_record?
      label.assign_attributes(labels: data['label'], description: data['description'])
    end
    label.url = "https://www.wikidata.org/wiki/#{data['qNumber']}"
    label if label.save
  rescue JSON::ParserError
    nil
  end

  def self.valid_wikidata_tag?(data)
    data.is_a?(Hash) && data['qNumber'].is_a?(String) &&
      /\AQ[1-9]\d*\z/.match?(data['qNumber']) && data['qNumber'].length <= 255 &&
      data['label'].is_a?(String) && data['label'].present? &&
      data['label'].length <= 255 &&
      (data['description'].nil? || data['description'].is_a?(String))
  end
  private_class_method :valid_wikidata_tag?

  scope :matching_query, lambda { |query|
    sanitized = sanitize_sql_like(query)
    where('`match` LIKE :q OR labels LIKE :q', q: "%#{sanitized}%")
  }
end
