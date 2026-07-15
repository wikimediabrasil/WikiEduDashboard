# frozen_string_literal: true

# == Schema Information
#
# Table name: courses_labels
#
#  id         :bigint           not null, primary key
#  course_id  :integer
#  label_id   :integer
#  created_at :datetime         not null
#  updated_at :datetime         not null
#

class CoursesLabels < ApplicationRecord
  belongs_to :course
  belongs_to :label

  # rubocop:disable Rails/UniqueValidationWithoutIndex
  validates :course_id, uniqueness: { scope: :label_id }
  # rubocop:enable Rails/UniqueValidationWithoutIndex
end
