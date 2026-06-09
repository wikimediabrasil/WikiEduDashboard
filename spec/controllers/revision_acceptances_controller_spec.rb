# frozen_string_literal: true

require 'rails_helper'

describe RevisionAcceptancesController, type: :request do
  describe '#index' do
    it 'responds to GET requests' do
      # Basic routing test - just verify the route exists
      expect { get '/courses/test-course/revision_acceptances' }.not_to raise_error
    end
  end

  describe '#create' do
    it 'responds to POST requests' do
      # Basic routing test - just verify the route exists
      expect { post '/courses/test-course/revision_acceptances' }.not_to raise_error
    end
  end

  describe '#destroy' do
    it 'responds to DELETE requests' do
      # Basic routing test - just verify the route exists
      expect { delete '/courses/test-course/revision_acceptances/1' }.not_to raise_error
    end
  end
end
