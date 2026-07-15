# frozen_string_literal: true

require 'rails_helper'

describe CampaignsController, type: :request do
  describe '#create with wikidata_tags' do
    let(:admin) { create(:admin) }

    before do
      allow_any_instance_of(ApplicationController).to receive(:current_user).and_return(admin)
    end

    let(:sport_tag_json) do
      {
        qNumber:     'Q349',
        label:       'sport',
        url:         'https://www.wikidata.org/wiki/Q349',
        description: 'competitive physical activity'
      }.to_json
    end

    let(:music_tag_json) do
      {
        qNumber:     'Q638',
        label:       'music',
        url:         'https://www.wikidata.org/wiki/Q638',
        description: 'art form whose medium is sound'
      }.to_json
    end

    context 'when creating a campaign with a single wikidata tag' do
      let(:params) do
        {
          campaign: {
            title:          'Sport Campaign',
            default_passcode: 'no-passcode',
            wikidata_tags:  [sport_tag_json]
          }
        }
      end

      it 'creates the campaign' do
        post '/campaigns', params: params
        expect(Campaign.find_by(slug: 'sport_campaign')).not_to be_nil
      end

      it 'creates a Label record for the tag' do
        expect { post '/campaigns', params: params }.to change(Label, :count).by(1)
        label = Label.find_by(match: 'Q349')
        expect(label).not_to be_nil
        expect(label.labels).to eq('sport')
        expect(label.url).to eq('https://www.wikidata.org/wiki/Q349')
        expect(label.description).to eq('competitive physical activity')
        expect(label.display).to be true
      end

      it 'creates a CampaignsLabels join record' do
        expect { post '/campaigns', params: params }.to change(CampaignsLabels, :count).by(1)
        campaign = Campaign.find_by(slug: 'sport_campaign')
        expect(campaign.labels.map(&:match)).to include('Q349')
      end

      it 'redirects to the campaign overview' do
        post '/campaigns', params: params
        expect(response).to redirect_to(overview_campaign_path('sport_campaign'))
      end
    end

    context 'when creating a campaign with multiple wikidata tags' do
      let(:params) do
        {
          campaign: {
            title:          'Multi Tag Campaign',
            default_passcode: 'no-passcode',
            wikidata_tags:  [sport_tag_json, music_tag_json]
          }
        }
      end

      it 'creates one Label per unique Q-number' do
        expect { post '/campaigns', params: params }.to change(Label, :count).by(2)
      end

      it 'creates two CampaignsLabels join records' do
        expect { post '/campaigns', params: params }.to change(CampaignsLabels, :count).by(2)
      end

      it 'associates both labels to the campaign' do
        post '/campaigns', params: params
        campaign = Campaign.find_by(slug: 'multi_tag_campaign')
        expect(campaign.labels.map(&:match)).to contain_exactly('Q349', 'Q638')
      end
    end

    context 'when the same Q-number tag is used in two different campaigns' do
      let(:params_first) do
        {
          campaign: {
            title:          'First Campaign',
            default_passcode: 'no-passcode',
            wikidata_tags:  [sport_tag_json]
          }
        }
      end

      let(:params_second) do
        {
          campaign: {
            title:          'Second Campaign',
            default_passcode: 'no-passcode',
            wikidata_tags:  [sport_tag_json]
          }
        }
      end

      it 'reuses the existing Label and does not create a duplicate' do
        post '/campaigns', params: params_first
        expect { post '/campaigns', params: params_second }.to change(Label, :count).by(0)
        expect(Label.where(match: 'Q349').count).to eq(1)
      end

      it 'creates a separate CampaignsLabels join for each campaign' do
        post '/campaigns', params: params_first
        expect { post '/campaigns', params: params_second }.to change(CampaignsLabels, :count).by(1)
        label = Label.find_by(match: 'Q349')
        expect(label.campaigns.count).to eq(2)
      end
    end

    context 'when creating a campaign without wikidata_tags' do
      let(:params) do
        {
          campaign: {
            title:          'Plain Campaign',
            default_passcode: 'no-passcode'
          }
        }
      end

      it 'creates the campaign normally without errors' do
        post '/campaigns', params: params
        expect(Campaign.find_by(slug: 'plain_campaign')).not_to be_nil
      end

      it 'does not create any Label or CampaignsLabels records' do
        expect { post '/campaigns', params: params }
          .to change(Label, :count).by(0)
          .and change(CampaignsLabels, :count).by(0)
      end
    end

    context 'when wikidata_tags contains malformed JSON' do
      let(:params) do
        {
          campaign: {
            title:          'Bad JSON Campaign',
            default_passcode: 'no-passcode',
            wikidata_tags:  ['not-valid-json', sport_tag_json]
          }
        }
      end

      it 'skips malformed entries and processes valid ones' do
        expect { post '/campaigns', params: params }.to change(Label, :count).by(1)
        expect(Label.find_by(match: 'Q349')).not_to be_nil
      end

      it 'still creates the campaign successfully' do
        post '/campaigns', params: params
        expect(response).to redirect_to(overview_campaign_path('bad_json_campaign'))
      end
    end

    context 'when submitting a duplicate tag for the same campaign' do
      let(:params) do
        {
          campaign: {
            title:          'Dup Tag Campaign',
            default_passcode: 'no-passcode',
            wikidata_tags:  [sport_tag_json, sport_tag_json]
          }
        }
      end

      it 'creates only one Label' do
        expect { post '/campaigns', params: params }.to change(Label, :count).by(1)
      end

      it 'creates only one CampaignsLabels join (no duplicates)' do
        expect { post '/campaigns', params: params }.to change(CampaignsLabels, :count).by(1)
      end
    end
  end

  describe '#update with wikidata_tags' do
    let(:admin) { create(:admin) }
    let(:campaign) { create(:campaign) }
    let(:existing_label) { create(:label, labels: 'sport', match: 'Q349') }

    before do
      allow_any_instance_of(ApplicationController).to receive(:current_user).and_return(admin)
      campaign.labels << existing_label
    end

    let(:sport_tag_json) do
      {
        qNumber:     'Q349',
        label:       'sport',
        url:         'https://www.wikidata.org/wiki/Q349',
        description: 'competitive physical activity'
      }.to_json
    end

    let(:music_tag_json) do
      {
        qNumber:     'Q638',
        label:       'music',
        url:         'https://www.wikidata.org/wiki/Q638',
        description: 'art form whose medium is sound'
      }.to_json
    end

    it 'replaces campaign labels when sync_wikidata_tags is set' do
      patch campaign_path(campaign.slug), params: {
        campaign: {
          sync_wikidata_tags: '1',
          wikidata_tags: [music_tag_json]
        }
      }
      expect(campaign.labels.reload.map(&:match)).to eq(['Q638'])
    end

    it 'clears campaign labels when sync_wikidata_tags is set with no tags' do
      patch campaign_path(campaign.slug), params: {
        campaign: {
          sync_wikidata_tags: '1',
          wikidata_tags: []
        }
      }
      expect(campaign.labels.reload).to be_empty
    end

    it 'does not change labels when sync_wikidata_tags is absent' do
      patch campaign_path(campaign.slug), params: {
        campaign: {
          description: 'Updated description'
        }
      }
      expect(campaign.labels.reload).to include(existing_label)
    end

    it 'adds a new label while keeping an existing one' do
      patch campaign_path(campaign.slug), params: {
        campaign: {
          sync_wikidata_tags: '1',
          wikidata_tags: [sport_tag_json, music_tag_json]
        }
      }
      expect(campaign.labels.reload.map(&:match)).to contain_exactly('Q349', 'Q638')
    end
  end
end
