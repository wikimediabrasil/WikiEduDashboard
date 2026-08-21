# frozen_string_literal: true

FactoryBot.define do
  factory :label do
    labels { 'Featured Label' }
    url { 'https://www.wikidata.org/wiki/Q52' }
    sequence(:match) { |n| "Q#{n + 100}" }
    description { 'A description of Wikipedia labels' }
    display { true }
  end
end
