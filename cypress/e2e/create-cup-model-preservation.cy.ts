describe('Create cup model switching', () => {
  it('preserves design layers after changing the mug model', () => {
    cy.visit('/uk/create-cup');

    cy.get('[data-testid="add-text-button"]', {timeout: 20000}).click();

    cy.get('[data-testid="mug-option-large15oz"]').click();

    cy.get('[data-testid="layer-item-0"]').should('exist');
    cy.get('[data-testid="text-layer-content"]').should('have.value', 'Твоя власна кружка');
    cy.get('[data-testid="layer-opacity"]').should('have.value', '1');
    cy.get('[data-testid="layer-rotation"]').should('have.value', '0');
  });
});
