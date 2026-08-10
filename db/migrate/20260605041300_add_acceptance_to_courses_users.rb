# frozen_string_literal: true

class AddAcceptanceToCoursesUsers < ActiveRecord::Migration[7.0]
  def change
    add_column :courses_users, :accepted_by_id, :integer, default: nil
    add_column :courses_users, :accepted_at, :datetime, default: nil
    add_index :courses_users, :accepted_by_id
  end
end
