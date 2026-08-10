# frozen_string_literal: true

json.campaigns @campaigns do |campaign|
  json.call(campaign, :id, :title, :slug, :description)
  label_translations = WikidataLabelService.translations_for(campaign.labels)
  json.labels campaign.labels.map { |label| label_translations[label.match] || label.labels }
  json.label_matches campaign.labels.pluck(:match)
end
