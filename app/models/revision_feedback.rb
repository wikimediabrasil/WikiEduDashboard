# frozen_string_literal: true

class RevisionFeedback < ApplicationRecord
  self.table_name = 'revision_feedback'

  belongs_to :course
  belongs_to :editor, class_name: 'User', foreign_key: :editor_id
  belongs_to :author, class_name: 'User', foreign_key: :author_id

  validates :revision_id, :text, presence: true
end
