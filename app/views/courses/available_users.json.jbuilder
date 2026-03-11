json.array! @available_users do |user|
    json.id user.id
    json.username user.username
    json.real_name user.real_name
    json.email user.email if current_user&.admin?
end