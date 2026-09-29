# frozen_string_literal: true

label_translations = WikidataLabelService.translations_for(@values.flat_map(&:labels))

json.campaigns @values do |campaign|
  json.call(campaign, :id, :title, :slug)
  json.labels campaign.labels.map { |label| label_translations[label.match] || label.labels }
  json.label_matches campaign.labels.map(&:match)
end
