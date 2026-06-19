import './utils/editable';
import { searchLabelOptions } from './utils/wikidata_label_search';

// ── Wikidata Tags Widget ──────────────────────────────────────────────────────
// Renders an autocomplete input that queries local labels first, then Wikidata,
// and lets the user add multiple entity tags (chips) to the campaign creation form.

class WikidataTagsWidget {
  constructor(container) {
    this.container = container;
    this.selectedTags = []; // { id, label, description, qNumber }
    this._debounceTimer = null;
    this._initialTags = WikidataTagsWidget.parseInitialTags(container.dataset.initialTags);

    this._render();
    this._bindEvents();
    this._initialTags.forEach((tag) => this._selectTag(tag));
  }

  static parseInitialTags(raw) {
    if (!raw) {
      return [];
    }
    try {
      return JSON.parse(raw).map((tag) => ({
        match: tag.qNumber,
        label: tag.label,
        description: tag.description || '',
        url: tag.url || `https://www.wikidata.org/wiki/${tag.qNumber}`,
      }));
    } catch (_error) {
      return [];
    }
  }

  _render() {
    this.container.innerHTML = `
      <div class="wikidata-tags-widget">
        <div class="wikidata-tags-chips" aria-live="polite"></div>
        <div class="wikidata-tags-input-row">
          <input
            type="text"
            class="wikidata-tags-search"
            placeholder="Search Wikidata (e.g. Sport, Music…)"
            autocomplete="off"
            aria-label="Search Wikidata tags"
          />
          <div class="wikidata-tags-spinner hidden"></div>
        </div>
        <ul class="wikidata-tags-dropdown hidden" role="listbox"></ul>
      </div>
    `;

    this.chipsEl    = this.container.querySelector('.wikidata-tags-chips');
    this.inputEl    = this.container.querySelector('.wikidata-tags-search');
    this.spinnerEl  = this.container.querySelector('.wikidata-tags-spinner');
    this.dropdownEl = this.container.querySelector('.wikidata-tags-dropdown');
  }

  _bindEvents() {
    this.inputEl.addEventListener('input', (e) => {
      const query = e.target.value.trim();
      clearTimeout(this._debounceTimer);
      if (query.length < 2) {
        this._hideDropdown();
        return;
      }
      this._debounceTimer = setTimeout(() => this._search(query), 350);
    });

    this.inputEl.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') { this._hideDropdown(); }
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
      if (!this.container.contains(e.target)) { this._hideDropdown(); }
    });
  }

  async _search(query) {
    this.spinnerEl.classList.remove('hidden');
    this._hideDropdown();

    try {
      const results = await searchLabelOptions(query);
      this._renderDropdown(results);
    } catch (_e) {
      // silently ignore network errors
    } finally {
      this.spinnerEl.classList.add('hidden');
    }
  }

  _renderDropdown(results) {
    if (results.length === 0) { this._hideDropdown(); return; }

    this.dropdownEl.innerHTML = '';
    results.forEach((item) => {
      if (this.selectedTags.some(t => t.id === item.match)) { return; }

      const li = document.createElement('li');
      li.setAttribute('role', 'option');
      li.className = 'wikidata-tags-option';
      li.innerHTML = `
        <span class="wikidata-tags-option__label">${this._escape(item.label)}</span>
        <span class="wikidata-tags-option__id">${this._escape(item.match)}</span>
        ${item.description ? `<span class="wikidata-tags-option__desc">${this._escape(item.description)}</span>` : ''}
      `;
      li.addEventListener('mousedown', (e) => {
        e.preventDefault();
        this._selectTag(item);
      });
      this.dropdownEl.appendChild(li);
    });

    if (this.dropdownEl.children.length === 0) { this._hideDropdown(); return; }
    this.dropdownEl.classList.remove('hidden');
  }

  _selectTag(item) {
    const tag = {
      id:          item.match,
      label:       item.label,
      description: item.description || '',
      qNumber:     item.match,
      url:         item.url || `https://www.wikidata.org/wiki/${item.match}`
    };
    this.selectedTags.push(tag);
    this._renderChip(tag);
    this._addHiddenInput(tag);
    this.inputEl.value = '';
    this._hideDropdown();
    this.inputEl.focus();
  }

  _renderChip(tag) {
    const chip = document.createElement('span');
    chip.className = 'wikidata-tags-chip';
    chip.dataset.tagId = tag.id;
    chip.innerHTML = `
      <a href="${this._escape(tag.url)}" target="_blank" rel="noopener" class="wikidata-tags-chip__link" title="${this._escape(tag.description)}">
        ${this._escape(tag.label)}
        <span class="wikidata-tags-chip__qnum">${this._escape(tag.qNumber)}</span>
      </a>
      <button type="button" class="wikidata-tags-chip__remove" aria-label="Remove ${this._escape(tag.label)}">✕</button>
    `;
    chip.querySelector('.wikidata-tags-chip__remove').addEventListener('click', () => {
      this._removeTag(tag.id);
    });
    this.chipsEl.appendChild(chip);
  }

  _addHiddenInput(tag) {
    const input = document.createElement('input');
    input.type  = 'hidden';
    input.name  = 'campaign[wikidata_tags][]';
    input.value = JSON.stringify({
      qNumber:     tag.qNumber,
      label:       tag.label,
      url:         tag.url,
      description: tag.description
    });
    input.dataset.tagId = tag.id;
    this.container.appendChild(input);
  }

  _removeTag(tagId) {
    this.selectedTags = this.selectedTags.filter(t => t.id !== tagId);
    this.container.querySelector(`.wikidata-tags-chip[data-tag-id="${tagId}"]`)?.remove();
    this.container.querySelector(`input[data-tag-id="${tagId}"]`)?.remove();
  }

  _hideDropdown() {
    this.dropdownEl.classList.add('hidden');
    this.dropdownEl.innerHTML = '';
  }

  _escape(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
}

// ── End Wikidata Tags Widget ──────────────────────────────────────────────────

window.onload = () => {
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

  $('.campaign-details').on('editable:edit', (e) => {
    const detailsEl = e.target;
    const $popContainer = $(detailsEl).find('.pop__container');
    const $popButton = $(detailsEl).find('.plus');

    initEditLabelsWidget(detailsEl);

    // add listener to show/hide the popup, removing any existing listener
    $popButton.show().off('click').on('click', () => {
      $popContainer.find('.pop').toggleClass('open');

      // allow popup to be closed when clicking outside the popup, again removing any existing listener
      $(document).off('click.campaign-popover').on('click.campaign-popover', (cp) => {
        if (!$(cp.target).parents('.pop__container').length) {
          $popContainer.find('.pop').removeClass('open');
        }
      });
    });

    // campaign details form submission
    $('.campaign-details .rails_editable-save').on('click', () => {
      $('#edit_campaign_details').trigger('submit');
    });
  });

  // close out the popup and hide pop button if existing edit mode
  $('.campaign-details').on('editable:read', (e) => {
    $(e.target).find('.plus').hide();
    $(e.target).find('.pop__container').removeClass('open');
    resetEditLabelsWidget(e.target);
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

  let wikidataWidget = null;
  let editLabelsWidget = null;

  const initWikidataWidget = () => {
    const mountEl = document.querySelector('.create-modal-wrapper .campaign-wikidata-tags-mount');
    if (mountEl && !wikidataWidget) {
      wikidataWidget = new WikidataTagsWidget(mountEl);
    }
  };

  const resetEditLabelsWidget = (detailsEl) => {
    const mountEl = detailsEl?.querySelector('.campaign-wikidata-tags-mount');
    if (mountEl) {
      mountEl.innerHTML = '';
    }
    editLabelsWidget = null;
  };

  const initEditLabelsWidget = (detailsEl) => {
    const mountEl = detailsEl?.querySelector('.campaign-wikidata-tags-mount');
    if (mountEl) {
      editLabelsWidget = new WikidataTagsWidget(mountEl);
    }
  };

  createCampaignButton?.addEventListener('click', () => {
    createModalWrapper.classList.remove('hidden');
    initWikidataWidget();
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

  // Also initialize widget if the modal is already open on page load
  initWikidataWidget();
};
