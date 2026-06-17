# frozen_string_literal: true

json.campaigns @campaigns do |campaign|
  json.call(campaign, :id, :title, :slug, :description)
  json.labels campaign.labels.pluck(:labels)
end
