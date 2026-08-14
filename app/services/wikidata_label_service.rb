# frozen_string_literal: true

# Fetches canonical, localized Wikidata entity metadata via the Wikidata API.
class WikidataLabelService
  WIKIDATA_API = 'https://www.wikidata.org/w/api.php'
  DEFAULT_LOCALE = 'en'
  CACHE_TTL = 12.hours
  MAX_IDS_PER_REQUEST = 50

  attr_reader :successful

  def self.translations_for(labels, locale = I18n.locale)
    new(labels, locale).translations
  end

  def self.metadata_for(labels, locale = I18n.locale)
    new(labels, locale).metadata
  end

  def self.entity_for(match, locale = I18n.locale)
    normalized_match = normalize_match(match)
    return if normalized_match.nil?

    metadata_for([normalized_match], locale)[normalized_match]
  end

  def self.normalize_match(match)
    qid = match.to_s.upcase
    qid if qid.match?(/\AQ[1-9]\d*\z/)
  end

  def initialize(labels, locale = I18n.locale)
    @matches = Array(labels).filter_map do |label|
      match = label.is_a?(ApplicationRecord) ? label.match : label
      self.class.normalize_match(match)
    end.uniq
    @locale = normalize_locale(locale)
    @successful = true
  end

  def translations
    metadata.transform_values { |entity| entity[:label] }
  end

  # Returns canonical data keyed by QID. Missing/deleted entities are omitted.
  def metadata
    return @metadata if defined?(@metadata)
    return @metadata = {} if @matches.empty?

    cached = {}
    missing = []

    @matches.each do |match|
      entity = Rails.cache.read(cache_key(match))
      if entity.is_a?(Hash) && entity[:label].present?
        cached[match] = entity
      else
        Rails.cache.delete(cache_key(match)) if entity
        missing << match
      end
    end

    fetched = missing.any? ? fetch_metadata(missing) : {}
    @metadata = cached.merge(fetched)
  end

  private

  def normalize_locale(locale)
    normalized = locale.to_s.tr('_', '-').downcase
    normalized.presence || DEFAULT_LOCALE
  end

  def requested_languages
    [@locale, @locale.split('-').first, DEFAULT_LOCALE].uniq
  end

  def cache_key(match)
    "wikidata_label/#{match}/#{@locale}"
  end

  def fetch_metadata(matches)
    matches.each_slice(MAX_IDS_PER_REQUEST).each_with_object({}) do |batch, result|
      response = fetch_batch(batch)
      unless response.success?
        @successful = false
        next
      end

      result.merge!(parse_response(response.body, batch))
    end
  rescue StandardError => e
    @successful = false
    Rails.logger.error("WikidataLabelService fetch failed: #{e.message}")
    {}
  end

  def fetch_batch(matches)
    Faraday.get(WIKIDATA_API, {
      action: 'wbgetentities',
      ids: matches.join('|'),
      props: 'labels|descriptions',
      languages: requested_languages.join('|'),
      languagefallback: '1',
      format: 'json'
    })
  end

  def parse_response(body, matches)
    data = JSON.parse(body)
    entities = data['entities'] || {}
    result = {}

    matches.each do |match|
      metadata = metadata_from_entity(match, entities[match])
      next if metadata.nil?

      result[match] = metadata
      Rails.cache.write(cache_key(match), metadata, expires_in: CACHE_TTL)
    end

    result
  end

  def metadata_from_entity(match, entity)
    return if entity.nil? || entity.key?('missing')

    label = localized_value(entity['labels'])
    return if label.blank?

    {
      match:,
      label:,
      description: localized_value(entity['descriptions']).to_s,
      url: "https://www.wikidata.org/wiki/#{match}"
    }
  end

  def localized_value(values)
    return if values.blank?

    requested_languages.each do |language|
      value = values.dig(language, 'value')
      return value if value.present?
    end
    values.values.first&.dig('value')
  end
end
