import './utils/editable';

document.addEventListener('DOMContentLoaded', () => {
  const createCampaignButton = document.querySelector('.create-campaign-button');
  const createModalWrapper = document.querySelector('.create-modal-wrapper');
  const wizardPanel = document.querySelector('.wizard__panel');

  document.querySelector('.campaign-delete')?.addEventListener('submit', (e) => {
    const title = prompt(I18n.t('campaign.confirm_campaign_deletion', { title: e.target.dataset.title }));
    if (title !== e.target.dataset.title) {
      if (title !== null) {
        alert(I18n.t('campaign.confirm_campaign_deletion_failed', { title }));
      }
      e.preventDefault();
    }
  });

  const campaignDetailsElements = document.querySelectorAll('.campaign-details, .campaign-description');
  let clickOutsideHandler = null;

  campaignDetailsElements.forEach((campaignDetails) => {
    campaignDetails.addEventListener('editable:edit', (e) => {
      const form = e.target;
      const popContainer = form.querySelector('.pop__container');
      const popButton = form.querySelector('.plus');

      if (popButton) {
        popButton.style.display = 'block';
        popButton.onclick = () => {
          const pop = popContainer?.querySelector('.pop');
          if (pop) {
            pop.classList.toggle('open');
          }

          if (clickOutsideHandler) {
            document.removeEventListener('click', clickOutsideHandler);
          }

          clickOutsideHandler = (clickEvent) => {
            if (popContainer && !popContainer.contains(clickEvent.target)) {
              const popElement = popContainer.querySelector('.pop');
              if (popElement) {
                popElement.classList.remove('open');
              }
            }
          };

          document.addEventListener('click', clickOutsideHandler);
        };
      }
    });

    campaignDetails.addEventListener('editable:read', (e) => {
      const target = e.target;
      const plusButton = target.querySelector('.plus');
      const popContainer = target.querySelector('.pop__container');

      if (plusButton) {
        plusButton.style.display = 'none';
      }
      if (popContainer) {
        popContainer.classList.remove('open');
      }
    });
  });

  document.querySelector('.remove-organizer-form')?.addEventListener('submit', (e) => {
    if (!confirm(I18n.t('users.remove_confirmation', { username: e.target.dataset.username }))) {
      e.preventDefault();
    }
  });

  document.querySelector('#use_dates')?.addEventListener('change', (e) => {
    if (e.target.checked) {
      document.querySelector('.campaign-dates')?.classList.remove('hidden');
    } else {
      document.querySelector('.campaign-dates')?.classList.add('hidden');
      document.querySelector('#campaign_start').value = '';
      document.querySelector('#campaign_end').value = '';
    }
  });

  document.querySelectorAll('.campaign_passcode')?.forEach((radio) => {
    radio.addEventListener('change', () => {
      if (document.querySelector('#campaign_default_passcode_custom')?.checked) {
        document.querySelector('.customized_passcode')?.classList.remove('hidden');
      } else {
        document.querySelector('.customized_passcode')?.classList.add('hidden');
        document.querySelector('#campaign_custom_default_passcode').value = '';
      }
    });
  });

  // this event listener fires when you click outside the modal
  // it hides the modal, and then removes itself as an event handler
  const clickOutsideModalHandler = (event) => {
    if (!wizardPanel.contains(event.target)) {
      createModalWrapper.classList.add('hidden');
      document.removeEventListener('click', clickOutsideModalHandler);
    }
  };

  createCampaignButton?.addEventListener('click', () => {
    createModalWrapper.classList.remove('hidden');
    setTimeout(() => {
      document.addEventListener('click', clickOutsideModalHandler);
    });
  });

  document.querySelector('.button__cancel')?.addEventListener('click', (e) => {
    e.preventDefault();
    createModalWrapper.classList.add('hidden');
    document.removeEventListener('click', clickOutsideModalHandler);
  });

  if (createModalWrapper?.classList.contains('show-create-modal')) {
    createCampaignButton.click();
  }

  // Advanced Search Toggle
  const toggleAdvancedSearchBtn = document.getElementById('toggle_advanced_search');
  const advancedSearchFields = document.getElementById('advanced_search_fields');

  if (toggleAdvancedSearchBtn && advancedSearchFields) {
    toggleAdvancedSearchBtn.addEventListener('click', () => {
      advancedSearchFields.classList.toggle('hidden');
    });
  }
});
