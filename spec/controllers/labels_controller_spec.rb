# frozen_string_literal: true

require 'rails_helper'

RSpec.describe LabelsController, type: :controller do
  let(:admin) { create(:admin) }
  let(:user) { create(:user) }
  let(:label) { create(:label) }

  describe 'authorization' do
    it 'allows non-admin to index' do
      allow(controller).to receive(:current_user).and_return(user)
      get :index
      expect(response).to be_successful
    end

    it 'allows non-admin to show' do
      allow(controller).to receive(:current_user).and_return(user)
      get :show, params: { id: label.id }
      expect(response).to be_successful
    end

    it 'returns 401 for non-admin on create' do
      allow(controller).to receive(:current_user).and_return(user)
      post :create, params: { label: { labels: 'Test', url: 'http://test.com' } }
      expect(response.status).to eq(401)
    end

    it 'returns 401 for non-admin on update' do
      allow(controller).to receive(:current_user).and_return(user)
      patch :update, params: { id: label.id, label: { labels: 'New Name' } }
      expect(response.status).to eq(401)
    end

    it 'returns 401 for non-admin on destroy' do
      allow(controller).to receive(:current_user).and_return(user)
      delete :destroy, params: { id: label.id }
      expect(response.status).to eq(401)
    end
  end

  context 'when user is admin' do
    before do
      allow(controller).to receive(:current_user).and_return(admin)
    end

    describe 'GET #index' do
      it 'returns a successful response and lists labels' do
        label
        get :index
        expect(response).to be_successful
      end
    end

    describe 'POST #create' do
      it 'creates a new label and redirects' do
        expect {
          post :create, params: { label: { labels: 'New Label', url: 'http://example.com' } }
        }.to change(Label, :count).by(1)
        expect(response).to redirect_to(label_path(Label.last))
      end
    end

    describe 'PATCH #update' do
      it 'updates label attributes' do
        patch :update, params: { id: label.id, label: { labels: 'Updated Label' } }
        expect(label.reload.labels).to eq('Updated Label')
        expect(response).to redirect_to(label_path(label))
      end
    end

    describe 'DELETE #destroy' do
      it 'destroys the label' do
        label
        expect {
          delete :destroy, params: { id: label.id }
        }.to change(Label, :count).by(-1)
        expect(response).to redirect_to(labels_path)
      end
    end
  end
end
