hot_loading = ENV['hot_loading'] == 'true'
if Rails.env.development? && hot_loading
  require_dependency "#{Rails.root}/lib/development/dev_server_proxy"
  Rails.application.config.middleware.use WebpackDevServerProxy, dev_server_host: "localhost:8080"
end

