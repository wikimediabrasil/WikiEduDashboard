# frozen_string_literal: true

json.current_page @campaigns.current_page.to_i
json.total_pages @campaigns.total_pages
json.total_entries @campaigns.total_entries

json.campaigns @campaigns do |campaign|
  json.call(campaign, :id, :title, :slug, :description)
end
