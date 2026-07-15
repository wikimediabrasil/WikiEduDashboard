# frozen_string_literal: true

# Fetches translated Wikidata labels via the Wikidata API.
# Used to render campaign labels in the user's current language.
class WikidataLabelService
  WIKIDATA_API = 'https://www.wikidata.org/w/api.php'
  DEFAULT_LOCALE = 'en'
  CACHE_TTL = 12.hours

  def self.translations_for(labels, locale = I18n.locale)
    new(labels, locale).translations
  end

  def initialize(labels, locale = I18n.locale)
    @labels = Array(labels)
    @locale = normalize_locale(locale)
  end

  # Returns a hash: { 'Q349' => 'deporte', 'Q739' => 'Colombia', ... }
  def translations
    return {} if @labels.empty?

    matches = @labels.map(&:match).compact.uniq
    cached = {}
    missing = []

    matches.each do |match|
      translation = Rails.cache.read(cache_key(match))
      if translation
        cached[match] = translation
      else
        missing << match
      end
    end

    fetched = missing.any? ? fetch_translations(missing) : {}

    cached.merge(fetched)
  end

  private

  def normalize_locale(locale)
    locale.to_s.split('-').first.downcase
  end

  def cache_key(match)
    "wikidata_label/#{match}/#{@locale}"
  end

  def fetch_translations(matches)
    return {} if matches.empty?

    response = Faraday.get(WIKIDATA_API, {
      action: 'wbgetentities',
      ids: matches.join('|'),
      props: 'labels',
      languages: @locale,
      languagefallback: '1',
      format: 'json'
    })

    return {} unless response.success?

    parse_response(response.body, matches)
  rescue StandardError => e
    Rails.logger.error("WikidataLabelService fetch failed: #{e.message}")
    {}
  end

  def parse_response(body, matches)
    data = JSON.parse(body)
    entities = data['entities'] || {}
    result = {}

    matches.each do |match|
      label = entities.dig(match, 'labels', @locale, 'value')
      if label
        result[match] = label
        Rails.cache.write(cache_key(match), label, expires_in: CACHE_TTL)
      end
    end

    result
  end
end
