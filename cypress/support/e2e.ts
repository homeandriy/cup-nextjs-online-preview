Cypress.on('uncaught:exception', (error) => {
  if (error.message.includes('THREE.Clock')) {
    return false;
  }

  return true;
});
