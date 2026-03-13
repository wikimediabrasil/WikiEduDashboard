# frozen_string_literal: true

json.course do
  total_users = @course.courses_users.count
  total_pages = (total_users.to_f / @users_per_page).ceil

  json.pagination do
    json.current_page @users_page
    json.per_page @users_per_page
    json.total_entries total_users
    json.total_pages total_pages
    json.previous_page (@users_page > 1 ? @users_page -1 : nil)
    json.next_page (@users_page < total_pages ? @users_page + 1 : nil)
  end
  json.partial! 'courses/users', course: @course,
                                page: @users_page,
                                per_page: @users_per_page
end
