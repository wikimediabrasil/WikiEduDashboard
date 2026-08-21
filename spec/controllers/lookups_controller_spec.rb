# frozen_string_literal: true

require 'rails_helper'

describe LookupsController, type: :request do
  describe '#campaign' do
    let(:campaign) { create(:campaign) }
    let(:label) { create(:label, labels: 'test_lookup_label') }

    before do
      campaign.labels << label
    end

    it 'returns campaigns lookup with labels for unauthenticated requests' do
      get '/lookups/campaign.json', params: { format: :json }
      expect(response.status).to eq(200)
      json = JSON.parse(response.body)
      campaign_json = json['campaigns'].find { |c| c['slug'] == campaign.slug }
      expect(campaign_json['labels']).to include('test_lookup_label')
      expect(campaign_json['label_matches']).to include(label.match)
    end
  end

  describe '#tag' do
    let!(:tag) { create(:tag, tag: 'sample_tag') }

    it 'returns tags lookup for unauthenticated requests' do
      get '/lookups/tag.json', params: { format: :json }
      expect(response.status).to eq(200)
      json = JSON.parse(response.body)
      expect(json['values']).to include('sample_tag')
    end

    it 'returns tags lookup for non-admin users' do
      user = create(:user, permissions: 0)
      login_as(user, scope: :user)

      get '/lookups/tag.json', params: { format: :json }
      expect(response.status).to eq(200)
      json = JSON.parse(response.body)
      expect(json['values']).to include('sample_tag')
    end
  end
end
