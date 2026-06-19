# frozen_string_literal: true

json.campaigns @values do |campaign|
  json.call(campaign, :id, :title, :slug)
  json.labels campaign.labels.pluck(:labels)
  json.label_matches campaign.labels.pluck(:match)
end
