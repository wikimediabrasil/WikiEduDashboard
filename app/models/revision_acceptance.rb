# frozen_string_literal: true

#= Per-revision acceptance record for campaign contribution review
class RevisionAcceptance < ApplicationRecord
  belongs_to :course
  belongs_to :user
  belongs_to :accepted_by, class_name: 'User', foreign_key: :accepted_by_id
  belongs_to :wiki

  validates :mw_rev_id, uniqueness: { scope: %i[wiki_id course_id] }
  validates :status, inclusion: { in: %w[validated invalidated] }

  scope :for_course, ->(course_id) { where(course_id:) }
end
