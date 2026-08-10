# frozen_string_literal: true

class CreateCoursesLabels < ActiveRecord::Migration[8.1]
  def change
    create_table :courses_labels do |t|
      t.integer :course_id
      t.integer :label_id

      t.timestamps
    end

    add_index :courses_labels, :course_id
    add_index :courses_labels, :label_id
    add_index :courses_labels, %i[course_id label_id], unique: true
  end
end
