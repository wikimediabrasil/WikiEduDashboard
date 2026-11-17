# frozen_string_literal: true

class AddMetadataToRevisionAcceptances < ActiveRecord::Migration[8.1]
  def change
    add_column :revision_acceptances, :revision_metadata, :text
  end
end
