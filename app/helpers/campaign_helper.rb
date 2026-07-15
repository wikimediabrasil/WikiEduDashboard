# frozen_string_literal: true

#= Helpers for campaigns views
module CampaignHelper
  def translated_label(label)
    return label.labels unless @label_translations

    @label_translations[label.match] || label.labels
  end

  def translated_labels_for(campaign_or_labels)
    labels = campaign_or_labels.is_a?(Campaign) ? campaign_or_labels.labels : campaign_or_labels
    @label_translations = WikidataLabelService.translations_for(labels)
  end

  def nav_link(link_text, link_path)
    class_name = current_page?(link_path) ? 'active' : ''

    content_tag(:li, class: 'nav__item', id: "#{params[:action]}-link") do
      content_tag(:p) do
        link_to(link_text, link_path, class: class_name)
      end
    end
  end

  def campaign_breadcrumb_title_for_action(campaign, action)
    case action
    when 'programs'
      I18n.t("#{campaign.course_string_prefix}.courses")
    when 'users'
      I18n.t("#{campaign.course_string_prefix}.students")
    when 'tags'
      I18n.t('campaign.tags_page_title')
    else
      I18n.t("courses.#{action}", default: action.titleize)
    end
  end

  def html_from_markdown(markdown)
    return unless markdown
    converter = Redcarpet::Markdown.new(Redcarpet::Render::HTML)
    sanitize converter.render(markdown)
  end
end
