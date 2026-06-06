# frozen_string_literal: true

class CreateRevisionAcceptances < ActiveRecord::Migration[7.0]
  def change
    create_table :revision_acceptances do |t|
      t.bigint  :mw_rev_id,      null: false
      t.integer :wiki_id,        null: false
      t.integer :course_id,      null: false
      t.integer :user_id,        null: false
      t.integer :accepted_by_id, null: false
      t.datetime :accepted_at,   null: false

      t.timestamps
    end

    add_index :revision_acceptances, [:mw_rev_id, :wiki_id, :course_id], unique: true,
              name: 'index_revision_acceptances_unique'
    add_index :revision_acceptances, :course_id
    add_index :revision_acceptances, :user_id
  end
end
