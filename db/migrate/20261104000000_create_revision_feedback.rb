# frozen_string_literal: true

class CreateRevisionFeedback < ActiveRecord::Migration[7.0]
  def change
    create_table :revision_feedback do |t|
      t.bigint :revision_id, null: false
      t.integer :course_id, null: false
      t.integer :editor_id, null: false
      t.integer :author_id, null: false
      t.text :text, null: false
      t.datetime :read_at
      t.timestamps
    end

    add_index :revision_feedback, %i[revision_id course_id]
    add_foreign_key :revision_feedback, :courses
    add_foreign_key :revision_feedback, :users, column: :editor_id
    add_foreign_key :revision_feedback, :users, column: :author_id
  end
end
