describe('Create cup buttons and primary actions', () => {
  it('covers the main create-cup controls and captures a screenshot', () => {
    cy.intercept('POST', '/api/print', {
      statusCode: 200,
      body: {message: 'Queued for print successfully.'}
    }).as('printRequest');

    cy.visit('/uk/create-cup');
    cy.get('[data-testid="add-text-button"]', {timeout: 20000}).should('be.visible');
    cy.contains('h1', 'Створи власний дизайн кружки', {timeout: 20000}).should('be.visible');

    cy.get('[data-testid="site-nav-home"]').should('be.visible');
    cy.get('[data-testid="locale-switch-en"]').click();
    cy.url({timeout: 20000}).should('include', '/en/create-cup');
    cy.get('[data-testid="locale-switch-pl"]').click();
    cy.url({timeout: 20000}).should('include', '/pl/create-cup');
    cy.get('[data-testid="locale-switch-uk"]').click();
    cy.url({timeout: 20000}).should('include', '/uk/create-cup');

    cy.get('[data-testid="mug-scroll-right"]').click();
    cy.get('[data-testid="mug-scroll-left"]').click();
    cy.get('[data-testid="mug-option-large15oz"]').click();
    cy.contains('230 × 100 mm').should('be.visible');

    cy.get('[data-testid="send-to-print-button"]').should('be.disabled');

    cy.get('[data-testid="image-input"]').selectFile('cypress/fixtures/sample-art.svg', {force: true});
    cy.get('[data-testid="layer-item-0"]').should('exist');
    cy.get('[data-testid="add-text-button"]').click();
    cy.get('[data-testid="layer-item-1"]').should('exist');
    cy.get('[data-testid="layer-item-1"]').click();
    cy.get('[data-testid="text-layer-content"]').clear().type('Подарункова кружка');
    cy.get('[data-testid="text-layer-font"]').select('Playfair Display');
    cy.get('[data-testid="text-layer-color"]').invoke('val', '#0f172a').trigger('input').trigger('change');
    cy.get('[data-testid="text-layer-font-size"]').invoke('val', 58).trigger('input').trigger('change');
    cy.get('[data-testid="layer-blend-mode"]').select('multiply').should('have.value', 'multiply');
    cy.get('[data-testid="layer-opacity"]').invoke('val', 0.85).trigger('input').trigger('change');
    cy.get('[data-testid="layer-rotation"]').invoke('val', 12).trigger('input').trigger('change');
    const dataTransfer = new DataTransfer();
    cy.get('[data-testid="layer-item-1"]').trigger('dragstart', {dataTransfer});
    cy.get('[data-testid="layer-item-0"]').trigger('dragover', {dataTransfer}).trigger('drop', {dataTransfer});
    cy.get('[data-testid="layer-item-0"]').should('have.attr', 'data-layer-type', 'text');
    cy.get('[data-testid="layer-up-button"]').click();
    cy.get('[data-testid="layer-down-button"]').click();

    cy.get('[data-testid="preview-open-fullscreen"]').click();
    cy.get('[data-testid="preview-modal"]').should('be.visible');
    cy.get('[data-testid="preview-close-fullscreen"]').click();
    cy.get('[data-testid="preview-modal"]').should('not.exist');

    cy.get('[data-testid="send-to-print-button"]').should('not.be.disabled').click();
    cy.wait('@printRequest');
    cy.get('[data-testid="status-message"]').should('contain.text', 'Queued for print successfully.');

    cy.get('[data-testid="layer-item-1"]').click();
    cy.get('[data-testid="layer-delete-button"]').click();
    cy.get('[data-testid="clear-design-button"]').click();
    cy.get('[data-testid="layers-empty"]').should('be.visible');

    cy.screenshot('buttons-main-flow', {capture: 'fullPage'});
  });
});
