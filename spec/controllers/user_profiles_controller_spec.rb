# frozen_string_literal: true

require 'rails_helper'

describe UserProfilesController, type: :request do
  describe '#show' do
    let(:route) { "/users/#{user.username}/" }

    context 'when user not found' do
      let(:user) { build(:user) }

      it 'redirects to the home page' do
        get route, params: { username: 'non existing user' }
        expect(response.body).to redirect_to(root_path)
      end
    end

    context 'when current_user is same user' do
      let(:user) { create(:user, email: 'fake_email@gmail.com') }

      it 'shows the email id' do
        allow_any_instance_of(ApplicationController)
          .to receive(:current_user).and_return(user)
        get route, params: { username: user.username }
        expect(response.body).to include(user.email)
      end
    end

    context 'when current_user is admin' do
      let(:user) { create(:user, email: 'fake_email@gmail.com') }
      let(:admin) { create(:admin) }

      it 'shows the email id' do
        allow_any_instance_of(ApplicationController)
          .to receive(:current_user).and_return(admin)
        get route, params: { username: user.username }
        expect(response.body).to include(user.email)
      end
    end

    context 'when current_user is not the same user nor an admin' do
      let(:user) { create(:user, email: 'fake_email@gmail.com') }
      let(:unauthorised_user) { create(:user, username: 'unauthorized') }

      it 'does not shows the email id' do
        allow_any_instance_of(ApplicationController)
          .to receive(:current_user).and_return(unauthorised_user)
        get route, params: { username: user.username }
        expect(response.body).not_to include(user.email)
      end
    end

    context 'when user is an instructor' do
      let(:course) { create(:course, private: false) }
      let(:user) { create(:user) }
      let!(:courses_user) do
        create(:courses_user, course_id: course.id,
                              user_id: user.id,
                              role: CoursesUsers::Roles::INSTRUCTOR_ROLE)
      end

      it 'renders the contribution dashboard' do
        get route, params: { username: user.username }
        expect(response).to have_http_status(:ok)
      end
    end

    context 'when user is a student' do
      let(:course) { create(:course, private: false) }
      let(:user) { create(:user) }
      let!(:courses_user) do
        create(:courses_user, course_id: course.id,
                              user_id: user.id,
                              role: CoursesUsers::Roles::STUDENT_ROLE)
      end

      it 'renders the contribution dashboard' do
        get route, params: { username: user.username }
        expect(response).to have_http_status(:ok)
      end
    end

    context 'when user has participated in zero courses' do
      let(:course) { create(:course) }
      let(:user) { create(:user) }

      it 'does not render the contribution dashboard' do
        get route, params: { username: user.username }
        expect(response).to have_http_status(:ok)
      end
    end
  end

  describe '#user_articles' do
    let(:user) { create(:user) }
    let(:route) { "/users/#{user.username}/user_articles.json" }
    let(:first_course) { create(:course) }
    let(:second_course) { create(:course, slug: 'second/course') }
    let(:english_wiki) { Wiki.find_by!(language: 'en', project: 'wikipedia') }
    let(:spanish_wiki) do
      Wiki.insert!({ language: 'es', project: 'wikipedia' })
      Wiki.find_by!(language: 'es', project: 'wikipedia')
    end

    before do
      [
        [first_course, english_wiki, false, 300],
        [first_course, english_wiki, false, 200],
        [second_course, spanish_wiki, true, 100]
      ].each_with_index do |(course, wiki, new_article, character_sum), index|
        article = create(:article, title: "Article_#{index}", wiki:, language: wiki.language)
        create(:articles_course, article:, course:, new_article:, character_sum:,
                                 user_ids: [user.id])
      end
    end

    it 'counts course articles before paginating' do
      get route, params: { course_id: second_course.id, per_page: 1, page: 1 }

      body = response.parsed_body
      expect(body['total_count']).to eq(1)
      expect(body['articles_by_course'].flat_map { |group| group['articles'] }
                                         .pluck('title')).to eq(['Article_2'])
    end

    it 'filters by wiki and newness before paginating' do
      get route, params: { wiki: 'es.wikipedia', newness: 'new', per_page: 1, page: 1 }

      body = response.parsed_body
      expect(body['total_count']).to eq(1)
      expect(body['articles_by_course'].flat_map { |group| group['articles'] }
                                         .pluck('title')).to eq(['Article_2'])
      expect(body['wiki_options']).to include(['en', 'wikipedia'], ['es', 'wikipedia'])
      expect(body['newness_options']).to contain_exactly(true, false)
    end

    it 'returns only the requested page in stable order' do
      get route, params: { per_page: 1, page: 2 }

      body = response.parsed_body
      expect(body['total_count']).to eq(3)
      expect(body['articles_by_course'].flat_map { |group| group['articles'] }
                                         .pluck('title')).to eq(['Article_1'])
    end
  end

  describe '#delete_profile_image' do
    let(:route) { "/users/#{user.username}/profile_image" }

    context 'user profile is of the current user' do
      let(:user) { create(:user) }
      let(:file) { fixture_file_upload('wiki-logo.png', 'image/png') }

      before do
        allow_any_instance_of(ApplicationController)
          .to receive(:current_user).and_return(user)
      end

      it 'deletes profile image file' do
        user.user_profile = create(:user_profile, user_id: user.id, image: file)
        delete route, params: { username: user.username }
        expect(user.user_profile.image).not_to exist
      end

      it 'deletes profile image link' do
        file_link = 'https://fake_link.com/fake_picture.jpg'
        user.user_profile = create(:user_profile, user_id: user.id,
                                                  image_file_link: file_link)
        delete route, params: { username: user.username }
        expect(user.user_profile.reload.image_file_link).to be_nil
      end
    end

    context 'user profile is not of the current user' do
      let(:user) { create(:user) }
      let(:file) { fixture_file_upload('wiki-logo.png', 'image/png') }

      it 'doesn\'t delete profile image file' do
        user.user_profile = create(:user_profile, user_id: user.id, image: file)
        delete route, params: { username: user.username }
        expect(user.user_profile.image).to be_present
      end

      it 'doesn\'t delete profile image file link' do
        file_link = 'https://fake_link.com/fake_picture.jpg'
        user.user_profile = create(:user_profile, user_id: user.id,
                                                  image_file_link: file_link)
        delete route, params: { username: user.username }
        expect(user.user_profile.image_file_link).not_to be_nil
      end
    end
  end

  describe '#update' do
    let(:route) { '/users/update' }

    context 'user profile is of the current user' do
      let(:user) { create(:user, email: 'fake_email@gmail.com') }
      let(:profile) { create(:user_profile, user_id: user.id) }

      before do
        allow_any_instance_of(ApplicationController)
          .to receive(:current_user).and_return(user)
      end

      it 'updates the bio' do
        post route, params: { username: user.username,
                              email: { email: user.email },
                              user_profile: { id: profile.id,
                                              user_id: profile.user_id,
                                              bio: 'Howdy' } }
        expect(user.user_profile.bio).to eq('Howdy')
      end

      it 'updates the location' do
        post route, params: { username: user.username,
                              email: { email: user.email },
                              user_profile: { id: profile.id,
                                              user_id: profile.user_id,
                                              location: 'Seattle' } }
        expect(user.user_profile.location).to eq('Seattle')
      end

      it 'updates the Institution' do
        post route, params: { username: user.username,
                              email: { email: user.email },
                              user_profile: { id: profile.id,
                                              user_id: profile.user_id,
                                              institution: 'Institution' } }
        expect(user.user_profile.institution).to eq('Institution')
      end

      it 'updates the Image' do
        file = fixture_file_upload('wiki-logo.png', 'image/png')
        post route, params: { username: user.username,
                              email: { email: user.email },
                              user_profile: { id: profile.id,
                                              user_id: profile.user_id,
                                              image: file } }
        expect(response.status).to eq(302)
        expect(user.user_profile.image).not_to be_nil
      end

      it 'updates the Image Link' do
        file_link = 'https://fake_link.com/fake_picture.jpg'
        post route, params: { username: user.username,
                              email: { email: user.email },
                              user_profile: { id: profile.id,
                                              user_id: profile.user_id,
                                              image_file_link: file_link } }
        expect(user.user_profile.image_file_link).to eq(file_link)
      end

      it 'shows a helpful message when ImageMagick is missing' do
        file = fixture_file_upload('wiki-logo.png', 'image/png')
        message = 'Could not run the `identify` command. Please install ImageMagick.'
        allow_any_instance_of(UserProfile)
          .to receive(:update)
          .and_raise(Paperclip::Errors::CommandNotFoundError.new(message))

        post route, params: { username: user.username,
                              email: { email: user.email },
                              user_profile: { id: profile.id,
                                              user_id: profile.user_id,
                                              image: file } }

        expect(response).to redirect_to("/users/#{user.username}")
        expect(flash[:error]).to include('ImageMagick')
      end

      it 'updates users email address' do
        updated_email = 'updated_email@gmail.com'
        post route, params: { username: user.username,
                              email: { email: updated_email },
                              user_profile: { id: profile.id,
                                              user_id: profile.user_id } }
        expect(user.reload.email).to eq(updated_email)
      end
    end

    context 'user profile is not of the current user' do
      let(:user) { create(:user) }
      let(:profile) { create(:user_profile, user_id: user.id) }

      it 'doesn\'t update the bio' do
        post route, params: { username: user.username,
                              user_profile: { id: profile.id,
                                              user_id: profile.user_id,
                                              bio: 'Howdy' } }
        expect(user.user_profile.bio).not_to eq('Howdy')
      end

      it 'doesn\'t update the location' do
        post route, params: { username: user.username,
                              user_profile: { id: profile.id,
                                              user_id: profile.user_id,
                                              location: 'Seattle' } }
        expect(user.user_profile.location).not_to eq('Seattle')
      end

      it 'doesn\'t update the Institution' do
        post route, params: { username: user.username,
                              user_profile: { id: profile.id,
                                              user_id: profile.user_id,
                                              institution: 'Institution' } }
        expect(user.user_profile.institution).not_to eq('Institution')
      end

      it 'doesn\'t update the Image' do
        file = fixture_file_upload('wiki-logo.png', 'image/png')
        post route, params: { username: user.username,
                              user_profile: { id: profile.id,
                                              user_id: profile.user_id,
                                              image: file } }
        expect(response.status).not_to eq(302)
      end

      it 'doesn\'t update the Image Link' do
        file_link = 'https://fake_link.com/fake_picture.jpg'
        post route, params: { username: user.username,
                              user_profile: { id: profile.id,
                                              user_id: profile.user_id,
                                              image_file_link: file_link } }
        expect(user.user_profile.image_file_link).not_to eq(file_link)
      end
    end

    context 'when updating as an instructor' do
      let(:user) { create(:user, email: 'instructor@example.com') }
      let(:course) { create(:course, start: 1.day.ago, end: 1.day.from_now) }
      let!(:courses_user) do
        create(:courses_user, user: user, course: course,
                             role: CoursesUsers::Roles::INSTRUCTOR_ROLE)
      end
      let(:profile) { create(:user_profile, user: user) }

      before do
        allow_any_instance_of(ApplicationController).to receive(:current_user).and_return(user)
      end

      it 'prevents update with blank email' do
        post route, params: {
          username: user.username,
          email: { email: '' },
          user_profile: { bio: 'New bio' }
        }
        expect(response).to redirect_to("/users/#{user.username}")
        expect(flash[:error]).to match('Email Is required for current instructors')
      end

      it 'when updating with an invalid email' do
        post route, params: {
          username: user.username,
          email: { email: 'email' },
          user_profile: { bio: 'Bio' }
        }
        expect(response).to redirect_to("/users/#{user.username}")
        expect(flash[:error]).to be_nil
      end

      it 'allows update with valid email' do
        post route, params: {
          username: user.username,
          email: { email: 'new@email.com' },
          user_profile: { bio: 'New bio' }
        }
        expect(flash[:notice]).to eq('Profile Updated')
        expect(user.reload.email).to eq('new@email.com')
        expect(user.user_profile.bio).to eq('New bio')
      end

      context 'when instructor has an expired course' do
        let(:course) { create(:course, start: 2.months.ago, end: 1.month.ago) }

        it 'does not require an email because they are not currently active' do
          post route, params: {
            email: { email: '' },
            user_profile: { bio: 'Old bio' }
          }

          expect(flash[:error]).not_to match('Email Is required for current instructors')
        end
      end
    end

    context 'when updating as a non-instructor' do
      let(:user) { create(:user, email: 'student@example.com') }
      let(:profile) { create(:user_profile, user: user) }

      before do
        allow_any_instance_of(ApplicationController).to receive(:current_user).and_return(user)
      end

      it 'allows update with blank email' do
        post route, params: {
          username: user.username,
          email: { email: '' },
          user_profile: { bio: 'New bio' }
        }
        expect(flash[:notice]).to eq('Profile Updated')
        expect(user.user_profile.bio).to eq('New bio')
      end
    end
  end

  describe '#stats' do
    let(:route) { "/users/#{user.username}/stats.json" }

    context 'when user found' do
      let(:user) { create(:user) }

      it 'returns 200 OK' do
        get route
        expect(response.status).to eq(200)
      end
    end

    context 'when user not found' do

      it 'returns 404 not found' do
        get '/users/non%20existing%20user/stats.json'
        expect(response.status).to eq(404)
      end
    end
  end
end
