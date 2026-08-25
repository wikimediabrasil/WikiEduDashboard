# frozen_string_literal: true

require 'rails_helper'

describe CampaignsController, type: :request do
  describe '#index' do
    it 'paginates campaigns with the same will_paginate interface as courses' do
      11.times { |index| create(:campaign, title: "Campaign #{index}") }
      total_entries = Campaign.count

      get '/campaigns.json', params: { page: 2 }

      body = JSON.parse(response.body)
      expect(body['campaigns'].length).to eq([total_entries - 10, 10].min)
      expect(body).to include(
        'current_page' => 2,
        'total_pages' => (total_entries / 10.0).ceil,
        'total_entries' => total_entries
      )
    end

    it 'filters campaign titles without treating SQL wildcards as search wildcards' do
      create(:campaign, title: 'Campaign 100%')
      create(:campaign, title: 'Campaign 1000')

      get '/campaigns.json', params: { search: '100%' }

      expect(JSON.parse(response.body)['campaigns'].pluck('title')).to eq(['Campaign 100%'])
    end
  end
end
