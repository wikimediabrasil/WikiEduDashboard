# frozen_string_literal: true

json.course_title @course.title
json.uploads @uploads do |upload|
  json.call(upload, :id, :uploaded_at, :usage_count, :url, :thumburl, :thumbwidth,
            :thumbheight, :deleted)
  json.file_name pretty_filename(upload)
  json.uploader upload.user.username
end
