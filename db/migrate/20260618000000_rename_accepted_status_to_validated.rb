# frozen_string_literal: true

# Renames the status value 'accepted' → 'validated' for semantic consistency
# with the instructor-facing UI (Validate/Validated vs. community accepted/reverted).
class RenameAcceptedStatusToValidated < ActiveRecord::Migration[7.0]
  def up
    # Migrate existing rows
    RevisionAcceptance.where(status: 'accepted').update_all(status: 'validated')
    # Update column default
    change_column_default :revision_acceptances, :status, from: 'accepted', to: 'validated'
  end

  def down
    RevisionAcceptance.where(status: 'validated').update_all(status: 'accepted')
    change_column_default :revision_acceptances, :status, from: 'validated', to: 'accepted'
  end
end
