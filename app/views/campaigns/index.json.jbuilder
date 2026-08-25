# frozen_string_literal: true

json.current_page @campaigns.current_page.to_i
json.total_pages @campaigns.total_pages
json.total_entries @campaigns.total_entries

json.campaigns @campaigns do |campaign|
  json.call(campaign, :id, :title, :slug, :description)
  label_translations = WikidataLabelService.translations_for(campaign.labels)
  json.labels campaign.labels.map { |label| label_translations[label.match] || label.labels }
  json.label_matches campaign.labels.pluck(:match)
end
