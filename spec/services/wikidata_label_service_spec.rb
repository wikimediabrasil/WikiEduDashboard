# frozen_string_literal: true

require 'rails_helper'

describe WikidataLabelService do
  before { Rails.cache.clear }

  let(:response) do
    instance_double(Faraday::Response, success?: true, body: {
      entities: {
        Q349: {
          id: 'Q349',
          labels: {
            es: { language: 'es', value: 'deporte' },
            en: { language: 'en', value: 'sport' }
          },
          descriptions: {
            es: { language: 'es', value: 'formas de actividad recreativa' },
            en: { language: 'en', value: 'competitive activity' }
          }
        },
        Q999999999: { id: 'Q999999999', missing: '' }
      }
    }.to_json)
  end

  it 'returns canonical labels and descriptions in the requested dashboard locale' do
    expect(Faraday).to receive(:get).with(
      described_class::WIKIDATA_API,
      hash_including(action: 'wbgetentities', props: 'labels|descriptions',
                     languages: 'es|en')
    ).and_return(response)

    metadata = described_class.metadata_for(%w[Q349 Q999999999], :es)

    expect(metadata).to eq(
      'Q349' => {
        match: 'Q349', label: 'deporte',
        description: 'formas de actividad recreativa',
        url: 'https://www.wikidata.org/wiki/Q349'
      }
    )
  end

  it 'normalizes dashboard locales and falls back through base language and English' do
    allow(Faraday).to receive(:get).and_return(response)

    metadata = described_class.metadata_for(['q349'], :'es-MX')

    expect(metadata.dig('Q349', :label)).to eq('deporte')
    expect(Faraday).to have_received(:get).with(
      described_class::WIKIDATA_API,
      hash_including(languages: 'es-mx|es|en')
    )
  end

  it 'keeps localized labels and descriptions separate for each dashboard language' do
    allow(Faraday).to receive(:get) do |_url, params|
      spanish = params[:languages].start_with?('es')
      localized_response = {
        entities: {
          Q349: {
            id: 'Q349',
            labels: {
              (spanish ? :es : :en) => {
                value: spanish ? 'deporte' : 'sport'
              }
            },
            descriptions: {
              (spanish ? :es : :en) => {
                value: spanish ? 'actividad recreativa' : 'competitive activity'
              }
            }
          }
        }
      }
      instance_double(Faraday::Response, success?: true, body: localized_response.to_json)
    end

    english = described_class.metadata_for(['Q349'], :en)
    spanish = described_class.metadata_for(['Q349'], :es)

    expect(english['Q349']).to include(label: 'sport', description: 'competitive activity')
    expect(spanish['Q349']).to include(label: 'deporte', description: 'actividad recreativa')
  end

  it 'reports an unavailable API instead of treating the response as verified' do
    failed_response = instance_double(Faraday::Response, success?: false)
    allow(Faraday).to receive(:get).and_return(failed_response)
    service = described_class.new(['Q349'], :es)

    expect(service.metadata).to be_empty
    expect(service.successful).to be(false)
  end
end
