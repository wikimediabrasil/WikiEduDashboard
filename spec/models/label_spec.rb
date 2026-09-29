# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Label, type: :model do
  it 'is valid with valid attributes' do
    label = build(:label)
    expect(label).to be_valid
  end

  it 'is invalid without a name (labels field)' do
    label = build(:label, labels: nil)
    expect(label).to be_invalid
    expect(label.errors[:labels]).to include("can't be blank")
  end

  it 'is invalid without a url' do
    label = build(:label, url: nil)
    expect(label).to be_invalid
    expect(label.errors[:url]).to include("can't be blank")
  end

  it 'can have associated campaigns through campaigns_labels' do
    label = create(:label)
    campaign = create(:campaign)
    campaigns_label = create(:campaigns_label, campaign:, label:)

    expect(label.campaigns).to include(campaign)
    expect(label.campaigns_labels).to include(campaigns_label)
  end

  it 'rejects executable URLs' do
    expect(build(:label, url: 'javascript:alert(1)')).not_to be_valid
  end

  describe '.from_wikidata_tag' do
    let(:tag) { { qNumber: 'Q349', label: 'sport', description: 'A sport' } }

    it 'constructs the Wikidata URL instead of trusting the submitted URL' do
      label = described_class.from_wikidata_tag(tag.merge(url: 'javascript:alert(1)').to_json)
      expect(label.url).to eq('https://www.wikidata.org/wiki/Q349')
    end

    it 'reuses an existing entity and repairs its URL' do
      existing = create(:label, match: 'Q349', url: 'https://example.org')
      label = described_class.from_wikidata_tag(tag.to_json)
      expect(label.id).to eq(existing.id)
      expect(existing.reload.url).to eq('https://www.wikidata.org/wiki/Q349')
    end

    [nil, 123, 'null', 'true', '123', '[]', '{}', '"text"', 'invalid-json'].each do |value|
      it "ignores invalid payload #{value.inspect}" do
        expect(described_class.from_wikidata_tag(value)).to be_nil
      end
    end

    ['Q0', 'Q-1', 'Q349/evil', 'javascript:alert(1)', nil, 349].each do |value|
      it "ignores invalid identifiers #{value.inspect}" do
        expect(described_class.from_wikidata_tag(tag.merge(qNumber: value).to_json)).to be_nil
      end
    end

    ['', nil, [], 'a' * 256].each do |value|
      it "ignores an invalid label #{value.inspect}" do
        expect(described_class.from_wikidata_tag(tag.merge(label: value).to_json)).to be_nil
      end
    end

    it 'ignores structured descriptions' do
      expect(described_class.from_wikidata_tag(tag.merge(description: {}).to_json)).to be_nil
    end
  end

end
