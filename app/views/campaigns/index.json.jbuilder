# frozen_string_literal: true

label_translations = WikidataLabelService.translations_for(@campaigns.flat_map(&:labels))

json.campaigns @campaigns do |campaign|
  json.call(campaign, :id, :title, :slug, :description)
  json.labels campaign.labels.map { |label| label_translations[label.match] || label.labels }
  json.label_matches campaign.labels.map(&:match)
end
