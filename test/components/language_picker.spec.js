import '../testHelper';

const { TextEncoder, TextDecoder } = require('util');

global.TextEncoder = global.TextEncoder || TextEncoder;
global.TextDecoder = global.TextDecoder || TextDecoder;
global.IS_REACT_ACT_ENVIRONMENT = true;

const React = require('react');
const { createRoot } = require('react-dom/client');
const { act } = require('react-dom/test-utils');
const LanguagePicker = require('../../app/assets/javascripts/components/nav/language_picker.jsx').default;

describe('LanguagePicker', () => {
  beforeEach(() => {
    global.I18n = {
      availableLocales: ['en', 'es', 'fr', 'pt', 'pt-BR', 'pt-br'],
      locale: 'en'
    };
    global.currentUser = { id: '1' };
  });

  test('displays "Português (Brasil)" and does not display raw "pt-BR"', () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    act(() => {
      createRoot(container).render(React.createElement(LanguagePicker));
    });

    const input = container.querySelector('input[role="combobox"]');
    act(() => {
      input.dispatchEvent(new Event('focus', { bubbles: true }));
      input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', keyCode: 40, bubbles: true }));
    });

    const bodyText = document.body.innerHTML;
    expect(bodyText).toContain('Português (Brasil)');
    expect(bodyText).not.toContain('>pt-BR<');
  });
});
