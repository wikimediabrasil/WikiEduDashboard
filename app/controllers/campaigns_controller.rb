# frozen_string_literal: true

require_dependency "#{Rails.root}/lib/analytics/ores_diff_csv_builder"

#= Controller for campaign data
class CampaignsController < ApplicationController
  layout 'admin', only: %i[index create]
  before_action :set_page, only: %i[programs articles users]
  before_action :set_sort, only: %i[programs articles users]
  before_action :set_campaign, only: %i[overview programs articles users edit
                                        update destroy add_organizer remove_organizer
                                        remove_course ores_plot
                                        alerts active_courses tags]
  before_action :require_create_permissions, only: [:create]
  before_action :require_write_permissions, only: %i[update destroy add_organizer
                                                     remove_organizer remove_course edit]
  before_action :add_campaign_index_breadcrumb, only: %i[index create]

  DETAILS_FIELDS = %w[title start end].freeze
  CAMPAIGNS_PER_PAGE = 10

  def index
    respond_to do |format|
      format.html { @campaign = Campaign.new }
      format.json do
        campaigns = Campaign.order(created_at: :desc)
        if params[:search].present?
          campaigns = campaigns.where('lower(title) LIKE ?', campaign_search)
        end
        @campaigns = campaigns.paginate(page: params[:page], per_page: CAMPAIGNS_PER_PAGE)
      end
    end
  end

  def show
    @campaign = if params[:slug] == 'current'
                  Campaign.default_campaign
                elsif params[:slug]
                  Campaign.find_by(slug: params[:slug])
                end
    respond_to do |format|
      format.json { set_presenter }
    end
  end

  def new
    redirect_to campaigns_path(create: true)
  end

  def create
    overrides = {}
    if campaign_params[:default_passcode] == 'custom'
      overrides[:default_passcode] = params[:campaign][:custom_default_passcode]
    end
    @campaign = Campaign.create campaign_params.except(:wikidata_tags).merge(overrides)

    if @campaign.valid?
      add_organizer_to_campaign(current_user)
      attach_labels_to_campaign
      redirect_to overview_campaign_path(@campaign.slug)
    else
      @campaigns = Campaign.all
      render :index
    end
  end

  def overview
    set_presenter
    @editable = current_user&.admin? || user_is_organizer?
    # @is_admin = current_user@.admin?
  end

  def articles
    respond_to do |format|
      format.html do
        set_page
        set_presenter
        # If there are more edited articles than the limit, we disable the feed of campaign articles
        if @presenter.too_many_articles?
          @too_many_message = t('campaign.too_many_articles')
          render 'too_many_articles'
          return
        end
      end
      format.json do
        set_campaign
        render json: { campaign: @campaign.slug, articles: @campaign.articles_to_json }
      end
    end
  end

  # rubocop:disable Metrics/MethodLength
  def users
    respond_to do |format|
      format.html do
        set_presenter

        if @presenter.too_large?
          @too_many_message = t('campaign.too_large')
          render 'too_many_articles'
          return
        end

        @courses_users = CoursesUsers.where(
          course: @campaign.nonprivate_courses, role: CoursesUsers::Roles::STUDENT_ROLE
        ).eager_load(:user, :course).order(revision_count: :desc)
      end

      format.json do
        set_campaign
        render json: { campaign: @campaign.slug, users: @campaign.users_to_json }
      end
    end
  end
  # rubocop:enable Metrics/MethodLength

  def assignments
    set_campaign
    render json: { campaign: @campaign.slug, assignments: @campaign.assignments_to_json }
  end

  def current_alerts
    @campaign = Campaign.default_campaign

    respond_to do |format|
      format.html { render :alerts }
      format.json { render :alerts }
    end
  end

  def alerts
    respond_to do |format|
      format.html { render }
      format.json do
        @campaign = Campaign.find_by(slug: params[:slug]) if params[:slug]
      end
    end
  end

  def edit
    set_presenter
  end

  def programs
    set_page
    set_sort
    set_presenter
    filters = extract_program_filters
    @selected_tag_details = filters[:tag_details]
    @selected_excluded_tag_details = filters[:excluded_tag_details]

    if filters.values.any?(&:present?)
      presenter = programs_presenter
      @search_terms = presenter.build_search_terms(filters)
      @results = presenter.filter_courses(filters)
    end
  end

  def ores_plot
    set_presenter
  end

  def tags
    @campaign_labels = @campaign.labels.where(display: true).order(:labels)
    course_label_ids = CoursesLabels
                       .where(course_id: @campaign.courses.select(:id))
                       .pluck(:label_id).uniq
    @course_labels   = Label.where(id: course_label_ids, display: true).order(:labels)
    @campaign_labels = verified_wikidata_labels(@campaign_labels)
    @course_labels   = verified_wikidata_labels(@course_labels)
    # The summary and chart totals describe program tags. Campaign-level tags
    # are displayed separately and must not inflate that count.
    @labels          = @course_labels
    respond_to do |format|
      format.html
      format.json { render json: tags_chart_data }
    end
  end

  def update
    if @campaign.update(campaign_params.except(:wikidata_tags, :sync_wikidata_tags))
      sync_labels_from_wikidata_tags(campaign_params[:wikidata_tags]) if sync_wikidata_tags?
      flash[:notice] = t('campaign.campaign_updated')
      redirect_to overview_campaign_path(@campaign.slug)
    else
      set_presenter
      @editable = true
      # If one of the Details fields was invalid, passing instance variable
      # used to show the Details form in 'edit mode'
      @open_details = (@campaign.errors.messages.keys & DETAILS_FIELDS).empty?
      render :edit
    end
  end

  def destroy
    @campaign.destroy
    flash[:notice] = t('campaign.campaign_deleted', title: @campaign.title)
    redirect_to campaigns_path
  end

  def add_organizer
    user = User.find_by(username: params[:username])

    if user.nil?
      flash[:error] = I18n.t('courses.error.user_exists', username: params[:username])
    else
      add_organizer_to_campaign(user)
      flash[:notice] = t('campaign.organizer_added', user: params[:username],
                                                     title: @campaign.title)
    end

    redirect_to overview_campaign_path(@campaign.slug)
  end

  def remove_organizer
    organizer = CampaignsUsers.find_by(user_id: params[:id],
                                       campaign: @campaign,
                                       role: CampaignsUsers::Roles::ORGANIZER_ROLE)
    unless organizer.nil?
      flash[:notice] = t('campaign.organizer_removed', user: organizer.user.username,
                                                       title: @campaign.title)
      organizer.destroy
    end

    redirect_to overview_campaign_path(@campaign.slug)
  end

  def remove_course
    campaigns_course = CampaignsCourses.find_by(course_id: params[:course_id],
                                                campaign_id: @campaign.id)
    result = campaigns_course&.destroy
    message = result ? 'campaign.course_removed' : 'campaign.course_already_removed'
    flash[:notice] = t(message, title: params[:course_title],
                                campaign_title: @campaign.title)
    redirect_to programs_campaign_path(@campaign.slug)
  end

  def active_courses
    presenter = CoursesPresenter.new(
      current_user:,
      campaign_param: @campaign.slug
    )
    @courses = presenter.active_courses_by_recent_edits
  end

  def statistics
    @campaigns = statistics_campaigns
    if params[:paginated] == 'true'
      @campaigns = @campaigns.paginate(page: params[:page], per_page: CAMPAIGNS_PER_PAGE)
    else
      @campaigns = @campaigns.limit(CAMPAIGNS_PER_PAGE) if params[:newest] == 'true'
    end
    render params[:user_only] == 'true' ? 'user_statistics' : 'statistics'
  end

  def featured_campaigns
    setting = Setting.find_or_create_by(key: 'featured_campaigns')
    campaign_slugs = setting.value['campaign_slugs'] ||= []
    featured_campaigns = Campaign.where(slug: campaign_slugs).pluck(:slug,
                                                                    :title).map do |slug, title|
      { slug:, title: }
    end
    render json: { featured_campaigns: }
  end

  def current_term
    redirect_to "/campaigns/#{Campaign.default_campaign.slug}/#{params[:subpage]}"
  end

  def refresh_stats
    set_campaign
    @campaign.clear_course_sums_cache

    flash[:notice] = t('campaign.refresh_campaign_stats')
    redirect_to overview_campaign_path(@campaign.slug)
  end

  private

  def campaign_search
    "%#{Campaign.sanitize_sql_like(params[:search].downcase)}%"
  end

  def statistics_campaigns
    campaigns = if params[:user_only] == 'true'
                  current_user.campaigns.includes(:labels)
                else
                  Campaign.includes(:labels).order(created_at: :desc)
                end
    if params[:search].present?
      campaigns = campaigns.where('lower(title) LIKE ?', campaign_search)
    end
    return campaigns unless params[:label_search].present?

    campaigns.joins(:labels).where(
      labels: { match: params[:label_search].split(',') }
    ).distinct
  end

  def extract_program_filters
    filters = params.slice(:title_query, :creation_start, :creation_end,
                           :start_date_start, :start_date_end,
                           :school, :revisions_min, :revisions_max,
                           :word_count_min, :word_count_max,
                           :references_min, :references_max,
                           :views_min, :views_max,
                           :users_min, :users_max)
                    .to_unsafe_h.symbolize_keys
    filters[:title_query] = params[:courses_query] if filters[:title_query].blank?
    add_program_tag_filters(filters)
  end

  def add_program_tag_filters(filters)
    included_qids = extract_tag_qids(:tag_details)
    excluded_qids = extract_tag_qids(:excluded_tag_details)
    resolved_tags = resolve_program_tags(included_qids | excluded_qids)
    filters[:excluded_tag_details] = excluded_qids.filter_map { |qid| resolved_tags[qid] }
    excluded_q_numbers = filters[:excluded_tag_details].pluck('qNumber')
    filters[:tag_details] = included_qids.filter_map { |qid| resolved_tags[qid] }.reject do |tag|
      excluded_q_numbers.include?(tag['qNumber'])
    end
    filters
  end

  # Only QIDs are accepted from the client. Display metadata is resolved from
  # Wikidata below instead of trusting serialized labels and descriptions.
  def extract_tag_qids(param_name)
    Array(params[param_name]).first(20).filter_map { |tag_json| parse_tag_qid(tag_json) }.uniq
  end

  def parse_tag_qid(tag_json)
    tag = JSON.parse(tag_json)
    return unless tag.is_a?(Hash)

    WikidataLabelService.normalize_match(tag['qNumber'])
  rescue JSON::ParserError
    nil
  end

  def resolve_program_tags(qids)
    lookup = WikidataLabelService.new(qids)
    metadata = lookup.metadata
    if lookup.successful
      return metadata.transform_values { |entity| serialized_wikidata_entity(entity) }
    end

    # A temporary Wikidata outage should not disable existing filters. The QID
    # remains authoritative and all client-provided metadata is still ignored.
    local_labels = Label.where(match: qids).index_by { |label| label.match.to_s.upcase }
    qids.index_with do |qid|
      label = local_labels[qid]
      {
        'qNumber' => qid,
        'label' => label&.labels || qid,
        'url' => "https://www.wikidata.org/wiki/#{qid}",
        'description' => label&.description.to_s
      }
    end
  end

  def serialized_wikidata_entity(entity)
    {
      'qNumber' => entity[:match],
      'label' => entity[:label],
      'url' => entity[:url],
      'description' => entity[:description]
    }
  end

  def programs_presenter
    CampaignProgramsPresenter.new(
      courses: @presenter.courses,
      page: @page,
      sort_column: @sort_column,
      sort_direction: @sort_direction
    )
  end

  def require_create_permissions
    require_signed_in
    require_admin_permissions unless Features.open_course_creation?
  end

  def require_write_permissions
    return if current_user&.admin? || user_is_organizer?

    exception = ActionController::InvalidAuthenticityToken.new('Unauthorized')
    raise exception
  end

  def set_campaign
    @campaign = Campaign.includes(:labels).find_by(slug: params[:slug])
    return if @campaign
    raise ActionController::RoutingError.new('Not Found'), 'Campaign does not exist'
  end

  def set_page
    @page = params[:page]&.to_i
    @page = nil unless @page&.positive?
  end

  def set_sort
    default_direction = 'DESC'
    @sort_column = params[:sort] || default_sort_column
    @sort_direction = params[:direction] || default_direction

    valid_columns = %w[title school recent_revision_count character_sum
                       average_word_count references_count view_sum
                       user_count trained_count created_at start
                       char_added references views lang_project course_title
                       username revision_count]

    @sort_column = default_sort_column unless valid_columns.include?(@sort_column)
    @sort_direction = default_direction unless %w[ASC DESC].include?(@sort_direction.upcase)
  end

  def default_sort_column
    case action_name
    when 'articles'
      'char_added'
    when 'users'
      'revision_count'
    else
      'recent_revision_count'
    end
  end

  def set_presenter
    @presenter = CoursesPresenter.new(
      current_user:,
      campaign_param: @campaign.slug,
      page: @page,
      sort_column: @sort_column,
      sort_direction: @sort_direction,
      articles_title: params[:title],
      school: params[:school],
      char_added_from: params[:char_added_from],
      char_added_to: params[:char_added_to],
      references_count_from: params[:references_count_from],
      references_count_to: params[:references_count_to],
      view_count_from: params[:view_count_from],
      view_count_to: params[:view_count_to]
    )
  end

  def tags_chart_data
    labels       = @course_labels
    lookup       = WikidataLabelService.new(labels)
    metadata     = lookup.metadata
    if lookup.successful
      labels = labels.select { |label| metadata.key?(label.match.to_s.upcase) }
    end
    {
      campaign:      { slug: @campaign.slug, title: @campaign.title },
      total_courses: @campaign.courses.count,
      total_labels:  @labels.count,
      labels:        labels.map { |l| label_stat(l, metadata) }
    }
  end

  def verified_wikidata_labels(labels)
    lookup = WikidataLabelService.new(labels)
    metadata = lookup.metadata
    return labels unless lookup.successful

    labels.select { |label| metadata.key?(label.match.to_s.upcase) }
  end

  def label_stat(label, metadata)
    tagged = @campaign.courses
                      .joins(:courses_labels)
                      .where(courses_labels: { label_id: label.id })
                      .distinct
                      .pluck(:title, :slug)
    {
      id:           label.id,
      course_count: tagged.size,
      courses:      tagged.map { |title, slug| { title:, slug: } }
    }.merge(localized_label_fields(label, metadata))
  end

  def localized_label_fields(label, metadata)
    entity = metadata[label.match.to_s.upcase]
    {
      match: entity&.dig(:match) || label.match,
      label: entity&.dig(:label) || label.labels,
      url: entity&.dig(:url) || "https://www.wikidata.org/wiki/#{label.match}",
      description: entity&.dig(:description) || label.description.to_s
    }
  end

  def add_organizer_to_campaign(user)
    CampaignsUsers.create(user:,
                          campaign: @campaign,
                          role: CampaignsUsers::Roles::ORGANIZER_ROLE)
  end

  def user_is_organizer?
    return false unless current_user
    @campaign.campaigns_users.where(user_id: current_user.id,
                                    role: CampaignsUsers::Roles::ORGANIZER_ROLE).any?
  end

  def csv_params
    params.permit(:slug, :course, :format)
  end

  def campaign_params
    params.require(:campaign)
          .permit(:slug, :description, :template_description, :title, :start, :end,
                  :default_course_type, :default_passcode, :sync_wikidata_tags,
                  wikidata_tags: [])
  end

  def sync_wikidata_tags?
    ActiveModel::Type::Boolean.new.cast(campaign_params[:sync_wikidata_tags])
  end

  def attach_labels_to_campaign
    sync_labels_from_wikidata_tags(campaign_params[:wikidata_tags])
  end

  def sync_labels_from_wikidata_tags(wikidata_tags)
    labels = build_labels_from_wikidata_tags(wikidata_tags || [])
    @campaign.labels = labels
  end

  def build_labels_from_wikidata_tags(wikidata_tags)
    qids = wikidata_tag_qids(wikidata_tags)
    lookup = WikidataLabelService.new(qids)
    metadata = lookup.metadata
    unless lookup.successful
      Rails.logger.warn(
        'Wikidata unavailable while synchronizing campaign tags; keeping known tags'
      )
      return Label.where(match: qids).to_a
    end

    qids.filter_map { |qid| upsert_campaign_label(metadata[qid]) }
  end

  def wikidata_tag_qids(wikidata_tags)
    wikidata_tags.filter_map do |tag_json|
      tag_data = JSON.parse(tag_json)
      WikidataLabelService.normalize_match(tag_data['qNumber'])
    rescue JSON::ParserError
      nil
    end.uniq
  end

  def upsert_campaign_label(entity)
    return if entity.nil?

    label = Label.find_or_initialize_by(match: entity[:match])
    label.update!(labels: entity[:label], url: entity[:url],
                  description: entity[:description], display: true)
    label
  end

  def add_campaign_index_breadcrumb
    add_breadcrumb I18n.t('campaign.campaigns'), :campaigns_path
  end
end
