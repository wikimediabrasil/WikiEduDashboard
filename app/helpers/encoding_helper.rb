# frozen_string_literal: true

module EncodingHelper
  # This is a workaround for encoding errors at the database level.
  # Updating the production databases to use utf8mb4 for all tables
  # would remove the need for it.
  # TODO: All tables now use utf8mb4 (confirmed in db/schema.rb). Consider
  # removing this workaround, as CGI.escape produces percent-encoded slugs
  # like %F0%9F%98%80 instead of storing the characters directly.
  def sanitize_4_byte_string(string)
    if string&.chars&.any? { |c| c.bytes.count >= 4 }
      CGI.escape(string)
    else
      string
    end
  end
end
