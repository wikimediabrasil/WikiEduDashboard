require 'rack'
require 'rack/files'

begin
  Rack::File
rescue NameError
  Rack.send(:remove_const, :File) if Rack.const_defined?(:File, false)
  Rack.const_set(:File, Rack::Files)
end

if Rails.env.production?
  Rack::MiniProfiler.config.storage_options = { url: "localhost:11211" }
  Rack::MiniProfiler.config.storage = Rack::MiniProfiler::MemcacheStore
else
  Rack::MiniProfiler.config.storage = Rack::MiniProfiler::MemoryStore
  Rack::MiniProfiler.config.auto_inject = false
end


