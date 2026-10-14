# frozen_string_literal: true

json.current_page @campaigns.current_page.to_i
json.total_pages @campaigns.total_pages
json.total_entries @campaigns.total_entries

json.campaigns @campaigns do |campaign|
  json.call(campaign, :id, :title, :slug, :description)
  label_translations = WikidataLabelService.translations_for(campaign.labels)
  json.labels campaign.labels.map { |label| label_translations[label.match] || label.labels }
  json.label_matches campaign.labels.pluck(:match)
  json.cache! [locale, campaign], expires_in: 1.day do
    presenter = CoursesPresenter.new(
      current_user:,
      campaign_param: campaign.slug
    )
    json.call(campaign, :id, :title, :slug, :description)
    json.call(
      presenter,
      :course_count,
      :new_article_count,
      :article_count,
      :word_count,
      :references_count,
      :view_sum,
      :user_count,
      :creation_date
    )
    json.human_course_count number_to_human(presenter.course_count)
    json.human_new_article_count number_to_human(presenter.new_article_count)
    json.human_article_count number_to_human(presenter.article_count)
    json.human_word_count number_to_human(presenter.word_count)
    json.human_references_count number_to_human(presenter.references_count)
    json.human_view_sum number_to_human(presenter.view_sum)
  end
end
