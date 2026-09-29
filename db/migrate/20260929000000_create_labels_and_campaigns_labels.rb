# frozen_string_literal: true

class CreateLabelsAndCampaignsLabels < ActiveRecord::Migration[7.0]
  def change
    create_table :labels do |t|
      t.string :labels
      t.string :url
      t.string :match
      t.text :description
      t.boolean :display, default: true

      t.timestamps
    end

    create_table :campaigns_labels do |t|
      t.integer :campaign_id
      t.integer :label_id

      t.timestamps
    end

    add_index :campaigns_labels, :campaign_id
    add_index :campaigns_labels, :label_id
    add_index :campaigns_labels, [:campaign_id, :label_id], unique: true
  end
end
