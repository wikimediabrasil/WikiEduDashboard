# frozen_string_literal: true

require 'rails_helper'

RSpec.describe CampaignHelper, type: :helper do
  let(:campaign) { create(:campaign) }
  let(:label) { create(:label, match: 'Q349', labels: 'sport') }

  before do
    create(:campaigns_label, campaign:, label:)
    allow(WikidataLabelService).to receive(:translations_for)
      .with(campaign.labels)
      .and_return('Q349' => 'deporte')
  end

  describe '#translated_labels_for' do
    it 'loads translations for the campaign labels' do
      helper.translated_labels_for(campaign)
      expect(helper.instance_variable_get(:@label_translations)).to eq('Q349' => 'deporte')
    end
  end

  describe '#translated_label' do
    it 'returns the translated label when translation exists' do
      helper.translated_labels_for(campaign)
      expect(helper.translated_label(label)).to eq('deporte')
    end

    it 'falls back to the stored label when no translation is loaded' do
      helper.instance_variable_set(:@label_translations, nil)
      expect(helper.translated_label(label)).to eq('sport')
    end

    it 'falls back to the stored label when no translation exists' do
      helper.instance_variable_set(:@label_translations, { 'Q739' => 'Venezuela' })
      expect(helper.translated_label(label)).to eq('sport')
    end
  end

  describe '#campaign_breadcrumb_title_for_action' do
    it 'returns the courses label for the programs action' do
      expect(helper.campaign_breadcrumb_title_for_action(campaign, 'programs'))
        .to eq(I18n.t("#{campaign.course_string_prefix}.courses"))
    end

    it 'returns the students label for the users action' do
      expect(helper.campaign_breadcrumb_title_for_action(campaign, 'users'))
        .to eq(I18n.t("#{campaign.course_string_prefix}.students"))
    end

    it 'returns the tags page title for the tags action' do
      expect(helper.campaign_breadcrumb_title_for_action(campaign, 'tags'))
        .to eq(I18n.t('campaign.tags_page_title'))
    end

    it 'returns the localized courses label for other known actions' do
      expect(helper.campaign_breadcrumb_title_for_action(campaign, 'articles'))
        .to eq(I18n.t('courses.articles'))
    end

    it 'falls back to a titleized action name when no translation exists' do
      expect(helper.campaign_breadcrumb_title_for_action(campaign, 'unknown_action'))
        .to eq('Unknown Action')
    end
  end
end
