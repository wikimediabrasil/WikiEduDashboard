class AddStatusToRevisionAcceptances < ActiveRecord::Migration[7.0]
  def change
    add_column :revision_acceptances, :status, :string, default: 'accepted', null: false
  end
end
