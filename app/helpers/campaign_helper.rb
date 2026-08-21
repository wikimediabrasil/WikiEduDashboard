# frozen_string_literal: true

#= Helpers for campaigns views
module CampaignHelper
  def translated_label(label)
    wikidata_metadata(label)&.dig(:label) || label.labels
  end

  def translated_description(label)
    wikidata_metadata(label)&.dig(:description) || label.description.to_s
  end

  def wikidata_label_url(label)
    wikidata_metadata(label)&.dig(:url) || canonical_wikidata_url(label.match)
  end

  def translated_labels_for(campaign_or_labels)
    labels = campaign_or_labels.is_a?(Campaign) ? campaign_or_labels.labels : campaign_or_labels
    lookup = WikidataLabelService.new(labels)
    @label_metadata = lookup.metadata
    @wikidata_lookup_successful = lookup.successful
  end

  def wikidata_label_visible?(label)
    !@wikidata_lookup_successful || wikidata_metadata(label).present?
  end

  def localized_label_details_for(labels)
    labels.select { |label| wikidata_label_visible?(label) }.map do |label|
      {
        qNumber: label.match.to_s.upcase,
        label: translated_label(label),
        description: translated_description(label),
        url: wikidata_label_url(label)
      }
    end
  end

  def nav_link(link_text, link_path)
    class_name = current_page?(link_path) ? 'active' : ''

    content_tag(:li, class: 'nav__item', id: "#{params[:action]}-link") do
      content_tag(:p) do
        link_to(link_text, link_path, class: class_name)
      end
    end
  end

  def html_from_markdown(markdown)
    return unless markdown
    converter = Redcarpet::Markdown.new(Redcarpet::Render::HTML)
    sanitize converter.render(markdown)
  end

  private

  def wikidata_metadata(label)
    @label_metadata&.dig(label.match.to_s.upcase)
  end

  def canonical_wikidata_url(match)
    qid = WikidataLabelService.normalize_match(match)
    qid ? "https://www.wikidata.org/wiki/#{qid}" : ''
  end
end
