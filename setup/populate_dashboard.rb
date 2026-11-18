# frozen_string_literal: true
require 'net/http'
require_dependency "#{Rails.root}/lib/importers/user_importer"
require_dependency "#{Rails.root}/app/services/update_course_stats"
require_dependency "#{Rails.root}/lib/timeslice_manager"

def make_copy_of(url)
  # Get the main course data
  course_data = JSON.parse(Net::HTTP.get URI(url + '/course.json'))['course']

  # Check if it exists already
  existing_course = Course.find_by(slug: course_data['slug'])
  if existing_course.present?
    puts "Course #{existing_course.slug} already exists!"
    return existing_course
  end

  # Extract the attributes we want to copy
  params_to_copy = %w[school title term description start end subject slug timeline_start timeline_end type]
  copied_data = {}
  params_to_copy.each { |p| copied_data[p] = course_data[p] }
  home_wiki = Wiki.get_or_create(language: course_data['home_wiki']['language'], project: course_data['home_wiki']['project'])
  copied_data['home_wiki_id'] = home_wiki.id
  copied_data['passcode'] = 'passcode' # set an arbitrary passcode
  # Create the course
  course = Course.create!(
    copied_data
  )
  # Add the tracked wikis
  course_data['wikis'].each do |wiki_hash|
    wiki = Wiki.get_or_create(language: wiki_hash['language'], project: wiki_hash['project'])
    next if wiki.id == home_wiki.id # home wiki was automatically added already
    course.wikis << wiki
  end

  # Get the user list
  user_data = JSON.parse(Net::HTTP.get URI(url + '/users.json'))['course']['users']
  # Add the users to the course
  user_data.each do |user_hash|
    user = User.find_or_create_by!(username: user_hash['username'])
    CoursesUsers.create!(user_id: user.id, role: user_hash['role'], course_id: course.id)
  end

  # Get assignments
  assignments_data = JSON.parse(Net::HTTP.get URI(url + '/assignments.json'))['course']['assignments']
  # Replicate the assignments as available articles
  # This is a quick hack so stats are counted for an ArticleScopedProgram.
  # It assumes all assignments are on home wiki.
  assignments_data.each do |assignment_hash|
    Assignment.create(course_id: course.id, article_title: assignment_hash['article_title'], role: 0, wiki_id: home_wiki.id)
  end

  puts "Course #{url} copied! "
  puts "http://localhost:3000/courses/#{course.slug}"
  return course
end

# Set up some example data in the dashboard
def populate_dashboard

  puts "Importing real dashboard programs..."
  populate_real_campaigns
  populate_example_campaigns if ENV['POPULATE_DEMO_DATA'] == 'true'
  example_courses = ENV.fetch('POPULATE_COURSE_URLS', [
    'https://outreachdashboard.wmflabs.org/courses/Uffizi/WDG_-_AF_2018_Florence',
    'https://outreachdashboard.wmflabs.org/courses/QCA/Brisbane_QCA_ArtandFeminism_2018',
    'https://dashboard.wikiedu.org/courses/Stanford_Law_School/Advanced_Legal_Research_Winter_2020_(Winter)',
    'https://dashboard.wikiedu.org/courses/University_of_Nebraska-Lincoln/Jour303_Editing_for_Digital_Media_(Spring_2026)/',
    'https://dashboard.wikiedu.org/courses/DePaul_University/Modern_Languages_Capstone_Seminar_(Spring_2026)/',
    'https://dashboard.wikiedu.org/courses/Northeastern_University/ENGW3307_32275_Adv._Writing_in_the_Sciences_(Spring_2026)/',
    'https://dashboard.wikiedu.org/courses/North_Carolina_State_University/Chemistry_of_Materials_(Spring_2026)/',
    'https://dashboard.wikiedu.org/courses/University_of_Southern_California/Writing_340_-_Advanced_Writing_for_Arts_and_Humanities_-_3_(Spring_2026)/',
    'https://dashboard.wikiedu.org/courses/American_University_of_Armenia/Sophomore_Writing_II_(Spring_2026)/',
    'https://dashboard.wikiedu.org/courses/University_of_North_Carolina_at_Greensboro/ARH_372_African_Art_-_Modern_to_Contemporary_(Spring_2026)/',
    'https://dashboard.wikiedu.org/courses/University_of_Wisconsin-_Whitewater/Foundations_of_Professional_Writing_(Spring_2026)/',
    'https://dashboard.wikiedu.org/courses/California_State_University_Monterey_Bay/Biochemistry_I_(Spring_2026)/',
    'https://dashboard.wikiedu.org/courses/Montclair_State_Univ/Humanities_2_HYBRID_(Spring_2026)/',
    'https://dashboard.wikiedu.org/courses/UNC_Pembroke/Writing_in_Digital_Environments_(Spring_2026)/',
    'https://dashboard.wikiedu.org/courses/RPI/MTLE_4470_-_Biology_in_Materials_Science_(Spring_2026)/',
    'https://dashboard.wikiedu.org/courses/University_of_British_Columbia/Marine_Microbiology_(Spring_2026)/',
    'https://dashboard.wikiedu.org/courses/University_of_California,_Los_Angeles/Queer_Art_(Winter_2026)',
    'https://dashboard.wikiedu.org/courses/Saint_Leo_University/Scandal_and_Corruption_in_Politics_(Spring_2026)',
    'https://dashboard.wikiedu.org/courses/University_of_Texas_at_Arlington/Public_History_(Spring_2026)',
    'https://dashboard.wikiedu.org/courses/TCU_School_of_Medicine/TCU_SOM_Wikipedia_Elective_Spring_2026_Block_11B_(Spring_2026)',
    'https://dashboard.wikiedu.org/courses/University_of_California_Santa_Cruz/Systematic_Botany_of_Flowering_Plants_(Winter_2026)',
    'https://dashboard.wikiedu.org/courses/University_of_Maryland/Slavery_in_Latin_America_(Spring_2026)',
    'https://dashboard.wikiedu.org/courses/University_of_Washington/Geographies_of_Energy_and_Sustainability_(Winter_2026)',
    'https://dashboard.wikiedu.org/courses/College_of_Wooster/Modern_Brazil_(Spring_2025)',
    'https://dashboard.wikiedu.org/courses/Iowa_State_University/Micro_3020H_Biology_of_Microorganisms_(Spring_2026)',
    'https://dashboard.wikiedu.org/courses/Western_Michigan_University_Homer_Stryker_MD_School_of_Medicine/MEDU_9320-WikiProject_Medical_Translation-Spanish_(April_6,_2026)',
    'https://dashboard.wikiedu.org/courses/UCSB/Holocaust_and_other_genocides_in_European_history_(Winter_2026)',
    'https://outreachdashboard.wmflabs.org/courses/WMCO/Hidropoeticas_Ambientales_-_Hacerwiki_2026-1',
    'https://outreachdashboard.wmflabs.org/campaigns/universidade_federal_de_s%C3%A3o_paulo/programs',
    'https://outreachdashboard.wmflabs.org/courses/Universidade_Federal_de_S%C3%A3o_Paulo,_EFLCH,_Departamento_de_Hist%C3%B3ria/Hist%C3%B3ria_Moderna_I',
    'https://outreachdashboard.wmflabs.org/courses/UNIFESP/Oficina_de_Literatura_Infantil',
    'https://outreachdashboard.wmflabs.org/courses/UNIFESP/Oficina_Hist%C3%B3ria_do_Brasil_Contempor%C3%A2neo',
    'https://outreachdashboard.wmflabs.org/courses/UNIFESP/Sess%C3%A3o_Comunit%C3%A1ria_Projeto_LER_UNIFESP'
  ].join(',')).split(',').map(&:strip).reject(&:empty?)

  example_courses.each do |url|
    begin
      # Try to find or create the default campaign
      default_campaign = Campaign.find_or_create_by!(title: 'Default Campaign', slug: ENV['default_campaign'])

      # Attempt to make a copy of the course
      course = make_copy_of(url)

      # Check if the course already exists before associating it with the campaign
      if default_campaign.courses.exists?(slug: course.slug)
        Rails.logger.error("Course with slug #{course.slug} already exists in the campaign. Skipping...")
      else
        # Add the course to the campaign if it doesn't already exist
        default_campaign.courses << course
        puts "Getting data for #{course.slug}..."
        UpdateCourseStats.new(course)
      end
    rescue ActiveRecord::RecordInvalid => e
      # Handle specific error when record creation fails
      Rails.logger.error("Error processing course at #{url}: #{e.message}")
    rescue StandardError => e
      # Generic error handling for other issues
      Rails.logger.error("An error occurred for course at #{url}: #{e.message}")
    end
  end
end

def populate_real_campaigns
  campaign_urls = ENV.fetch('POPULATE_CAMPAIGN_URLS', '').split(',').map(&:strip).reject(&:empty?)
  campaign_urls.each do |campaign_url|
    import_campaign_from_url(campaign_url)
  rescue StandardError => e
    Rails.logger.error("Could not import campaign #{campaign_url}: #{e.message}")
  end
end

def import_campaign_from_url(campaign_url)
  uri = URI(campaign_url)
  slug = uri.path.split('/').reject(&:empty?).last
  raise ArgumentError, 'Campaign URL has no slug' if slug.blank?

  payload = JSON.parse(Net::HTTP.get(URI("#{uri.scheme}://#{uri.host}/campaigns/#{slug}.json")))
  campaign_data = payload.fetch('campaign')
  campaign = Campaign.find_or_initialize_by(slug:)
  campaign.assign_attributes(title: campaign_data.fetch('title'),
                             description: campaign_data['description'],
                             default_course_type: campaign_data['default_course_type'])
  campaign.save!

  html = Net::HTTP.get(URI("#{uri.scheme}://#{uri.host}/campaigns/#{slug}/programs"))
  course_paths = html.scan(%r{href=["'](/courses/[^"']+)}).flatten.uniq
  course_paths.each do |course_path|
    course = make_copy_of("#{uri.scheme}://#{uri.host}#{course_path}")
    campaign.courses << course unless campaign.courses.exists?(course.id)
  end
  puts "Imported #{campaign.title}: #{course_paths.length} programs"
end

def populate_example_campaigns
  campaign_names = [
    'African History and Heritage', 'Art and Feminism', 'Climate Change',
    'Digital Humanities', 'Education and Social Justice', 'Environmental Science',
    'Feminist Knowledge', 'Food and Agriculture', 'Global Health',
    'Indigenous Knowledge', 'Journalism and Media', 'Language and Culture',
    'Law and Public Policy', 'Literature and Writing', 'Local History',
    'Mathematics and Statistics', 'Medicine and Society', 'Migration Studies',
    'Museum Studies', 'Music and Sound', 'Open Knowledge', 'Philosophy and Ethics',
    'Political Science', 'Public History', 'Reference and Libraries',
    'Science Communication', 'Sociology and Community', 'Technology and Society',
    'Theatre and Performance', 'Urban Studies', 'Visual Arts', 'Women in Science'
  ]

  campaign_names.each_with_index do |title, index|
    campaign = Campaign.find_or_initialize_by(title:)
    campaign.description = "Development campaign for #{title.downcase}."
    campaign.default_course_type = Campaign::ALLOWED_TYPES[index % Campaign::ALLOWED_TYPES.length]
    campaign.start = index.months.ago.beginning_of_month
    campaign.end = (index + 2).months.from_now.end_of_month
    campaign.save!
    populate_campaign_course(campaign, index)
  end

  puts "Created or reused #{campaign_names.length} example campaigns."
end

def populate_campaign_course(campaign, index)
  wiki = Wiki.get_or_create(language: 'en', project: 'wikipedia')
  course = Course.find_or_initialize_by(title: "#{campaign.title} Demo Course")
  course.assign_attributes(
    slug: "Demo_University/#{campaign.slug}", school: 'Development University',
    term: 'Demo term', start: campaign.start, end: campaign.end,
    passcode: 'demo-passcode', type: campaign.default_course_type.presence || 'ClassroomProgramCourse',
    home_wiki: wiki
  )
  course.save!
  campaign.courses << course unless campaign.courses.exists?(course.id)

  instructor = User.find_or_create_by!(username: "demo-instructor-#{index}")
  add_demo_course_user(course, instructor, CoursesUsers::Roles::INSTRUCTOR_ROLE)

  3.times do |student_index|
    student = User.find_or_create_by!(username: "demo-editor-#{index}-#{student_index}")
    course_user = add_demo_course_user(course, student, CoursesUsers::Roles::STUDENT_ROLE)
    course_user.update!(recent_revisions: 8 + student_index, revision_count: 8 + student_index,
                        character_sum_ms: 450 + (student_index * 100), references_count: 2)
    article_title = "Demo #{campaign.slug} article #{student_index}"
    mw_page_id = 100_000 + (index * 10) + student_index + 1
    article = Article.find_or_initialize_by(mw_page_id:, wiki:)
    article.assign_attributes(title: article_title, namespace: 0, language: 'en')
    article.save!
    ArticlesCourses.find_or_create_by!(course:, article:)
    Assignment.find_or_create_by!(course:, user: student, article:, article_title: article.title,
                                  role: Assignment::Roles::ASSIGNED_ROLE, wiki:)
  end
  course.update!(user_count: course.users.count, article_count: course.articles.count,
                 revision_count: course.students.sum(:revision_count),
                 character_sum: course.students.sum(:character_sum_ms))
end

def add_demo_course_user(course, user, role)
  CoursesUsers.find_or_create_by!(course:, user:, role:)
end
