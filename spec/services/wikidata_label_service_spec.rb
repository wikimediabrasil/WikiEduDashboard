# frozen_string_literal: true

require 'rails_helper'

RSpec.describe WikidataLabelService, type: :service do
  let(:label) { create(:label, match: 'Q349', labels: 'sport') }
  let(:label2) { create(:label, match: 'Q739', labels: 'Colombia') }

  describe '.translations_for' do
    context 'when Wikidata API returns translations' do
      before do
        stub_request(:get, %r{https://www\.wikidata\.org/w/api\.php.*action=wbgetentities.*})
          .to_return(
            status: 200,
            body: {
              entities: {
                'Q349' => { labels: { 'es' => { value: 'deporte' } } },
                'Q739' => { labels: { 'es' => { value: 'Colombia' } } }
              }
            }.to_json,
            headers: { 'Content-Type' => 'application/json' }
          )
      end

      it 'returns a hash of q-number to translated label' do
        translations = described_class.translations_for([label, label2], 'es')
        expect(translations).to eq('Q349' => 'deporte', 'Q739' => 'Colombia')
      end

      it 'uses the stored label as fallback when no translation exists' do
        stub_request(:get, %r{https://www\.wikidata\.org/w/api\.php.*action=wbgetentities.*})
          .to_return(
            status: 200,
            body: {
              entities: {
                'Q349' => { labels: {} }
              }
            }.to_json,
            headers: { 'Content-Type' => 'application/json' }
          )
        translations = described_class.translations_for([label], 'es')
        expect(translations).to eq({})
      end
    end

    context 'when Wikidata API fails' do
      before do
        stub_request(:get, %r{https://www\.wikidata\.org/w/api\.php.*action=wbgetentities.*})
          .to_return(status: 500, body: '')
      end

      it 'returns an empty hash and does not raise' do
        expect { described_class.translations_for([label], 'es') }.not_to raise_error
        expect(described_class.translations_for([label], 'es')).to eq({})
      end
    end

    context 'when there are no labels' do
      it 'returns an empty hash without calling the API' do
        expect(Faraday).not_to receive(:get)
        expect(described_class.translations_for([], 'es')).to eq({})
      end
    end
  end
end
