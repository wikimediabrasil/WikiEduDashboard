# frozen_string_literal: true

require 'rails_helper'

RSpec.describe GetReviewedRevision do
  let(:user) { create(:user) }
  let(:wiki) { Wiki.find(1) }
  let(:course) { create(:course) }
  let(:api) { instance_double(WikiApi) }
  let(:revision) do
    { 'revid' => 11, 'parentid' => 0, 'user' => user.username,
      'timestamp' => '2015-03-01T00:00:00Z', 'size' => 100 }
  end

  before do
    create(:courses_user, course:, user:, role: CoursesUsers::Roles::STUDENT_ROLE)
    allow(WikiApi).to receive(:new).and_return(api)
    allow(api).to receive(:query).and_return(double(data: {
      'pages' => { '5' => { 'pageid' => 5, 'title' => 'Example', 'ns' => 0,
                            'revisions' => [revision] } }
    }))
    importer = instance_double(RevisionScoreImporter)
    allow(RevisionScoreImporter).to receive(:new).and_return(importer)
    allow(importer).to receive(:get_revision_scores) { |records| records }
  end

  it 'fetches metadata for an enrolled participant within the program dates' do
    result = described_class.new(course:, user:, wiki:, revision_id: 11).metadata
    expect(result).to include('page_id' => 5, 'characters' => 100, 'references' => nil)
  end

  it 'rejects an edit authored by another user' do
    revision['user'] = 'Someone else'
    expect(described_class.new(course:, user:, wiki:, revision_id: 11).metadata).to be_nil
  end

  it 'rejects an edit outside the program dates' do
    revision['timestamp'] = '2016-03-01T00:00:00Z'
    expect(described_class.new(course:, user:, wiki:, revision_id: 11).metadata).to be_nil
  end
end
