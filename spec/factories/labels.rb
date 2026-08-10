# frozen_string_literal: true

FactoryBot.define do
  factory :label do
    labels { 'Featured Label' }
    url { 'https://en.wikipedia.org/wiki/Wikipedia' }
    match { 'Wikipedia' }
    description { 'A description of Wikipedia labels' }
    display { true }
  end
end
