# frozen_string_literal: true

FactoryBot.define do
  factory :revision_acceptance do
    mw_rev_id { 12345 }
    accepted_at { Time.zone.now }
    association :course
    association :wiki
    association :user
    association :accepted_by, factory: :user
  end
end
