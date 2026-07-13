const layouts = [
  {id: 1, name: 'iphone-se', width: 375, height: 667},
  {id: 2, name: 'iphone-12', width: 390, height: 844},
  {id: 3, name: 'ipad-mini', width: 768, height: 1024},
  {id: 4, name: 'galaxy-tab-7', width: 600, height: 960},
  {id: 5, name: 'galaxy-tab-8', width: 800, height: 1280},
  {id: 6, name: 'galaxy-tab-9', width: 900, height: 1440},
  {id: 7, name: 'galaxy-tab-10', width: 1024, height: 1600},
  {id: 8, name: 'hd', width: 1280, height: 720},
  {id: 9, name: 'full-hd', width: 1920, height: 1080},
  {id: 10, name: 'qhd', width: 2560, height: 1440}
];

describe('Create cup responsive layouts', () => {
  layouts.forEach(({id, name, width, height}) => {
    it(`renders layout ${id} (${name})`, () => {
      cy.viewport(width, height);
      cy.visit('/uk/create-cup');
      cy.get('[data-testid="add-text-button"]', {timeout: 20000}).should('be.visible');
      cy.contains('h1', 'Створи власний дизайн кружки', {timeout: 20000}).should('be.visible');

      cy.get('[data-testid="image-input"]').selectFile('cypress/fixtures/sample-badge.svg', {force: true});
      cy.get('[data-testid="add-text-button"]').click();
      cy.get('[data-testid="layer-item-1"]').click();
      cy.get('[data-testid="text-layer-content"]').clear().type(`${name} viewport`);
      cy.get('[data-testid="preview-open-fullscreen"]').click();
      cy.get('[data-testid="preview-modal"]').should('be.visible');
      cy.get('[data-testid="preview-close-fullscreen"]').click();

      cy.get('[data-testid="preview-canvas"]').should('be.visible');
      cy.get('[data-testid="send-to-print-button"]').should('not.be.disabled');
      cy.screenshot(`layout-${String(id).padStart(2, '0')}-${name}`, {capture: 'fullPage'});
    });
  });
});
