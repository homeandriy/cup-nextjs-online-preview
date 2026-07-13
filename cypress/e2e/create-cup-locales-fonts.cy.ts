const localeCases = [
  {locale: 'uk', expected: 'Створи власний дизайн кружки', text: 'Твоя власна кружка', font: 'Rubik'},
  {locale: 'en', expected: 'Create your own mug design', text: 'Your custom mug', font: 'Montserrat'},
  {locale: 'pl', expected: 'Stworz wlasny projekt kubka', text: 'Twoj wlasny kubek', font: 'PT Serif'}
];

describe('Locales and free fonts', () => {
  localeCases.forEach(({locale, expected, text, font}) => {
    it(`supports text layers and font switching for ${locale}`, () => {
      cy.visit(`/${locale}/create-cup`);
      cy.contains('h1', expected).should('be.visible');

      cy.get('[data-testid="add-text-button"]').click();
      cy.get('[data-testid="layer-item-0"]').click();
      cy.get('[data-testid="text-layer-content"]').clear().type(text);
      cy.get('[data-testid="text-layer-font"]').select(font);
      cy.get('[data-testid="text-layer-font-size"]').invoke('val', 52).trigger('input').trigger('change');
      cy.get('[data-testid="text-layer-color"]').invoke('val', '#7c2d12').trigger('input').trigger('change');
      cy.get('[data-testid="preview-open-fullscreen"]').click();
      cy.get('[data-testid="preview-modal"]').should('be.visible');
      cy.screenshot(`locale-font-${locale}`, {capture: 'fullPage'});
      cy.get('[data-testid="preview-close-fullscreen"]').click();
    });
  });
});
