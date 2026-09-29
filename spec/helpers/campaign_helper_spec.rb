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
end
