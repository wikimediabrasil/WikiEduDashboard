# frozen_string_literal: true

require 'rails_helper'

RSpec.describe RevisionAcceptance, type: :model do
  describe 'associations' do
    it 'belongs to a course' do
      association = described_class.reflect_on_association(:course)
      expect(association.macro).to eq(:belongs_to)
    end

    it 'belongs to a user' do
      association = described_class.reflect_on_association(:user)
      expect(association.macro).to eq(:belongs_to)
    end

    it 'belongs to accepted_by (User)' do
      association = described_class.reflect_on_association(:accepted_by)
      expect(association.macro).to eq(:belongs_to)
      expect(association.options[:class_name]).to eq('User')
    end

    it 'belongs to a wiki' do
      association = described_class.reflect_on_association(:wiki)
      expect(association.macro).to eq(:belongs_to)
    end
  end


  describe 'scopes' do
    it 'has a for_course scope' do
      expect(described_class).to respond_to(:for_course)
    end
  end
end
