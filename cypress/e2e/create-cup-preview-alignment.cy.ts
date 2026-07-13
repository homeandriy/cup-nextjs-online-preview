    type CupStudioLayer = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type CupStudioState = {
  stageWidth: number;
  stageHeight: number;
  safeZoneWidth: number;
  layers: CupStudioLayer[];
  mugType: string;
};

type CupStudioWindow = Window & {
  __cupStudioTest: {
    getState: () => CupStudioState;
    setLayerPosition: (index: number, patch: {x?: number; y?: number}) => void;
  };
};

const sourceImage = 'public/images/4_ua.webp';

function positionFirstLayer(mode: 'center' | 'left' | 'right') {
  cy.window().then((win) => {
    const api = (win as unknown as CupStudioWindow).__cupStudioTest;
    const state = api.getState();
    const layer = state.layers[0];

    expect(layer, 'first layer').to.exist;

    const targetX =
      mode === 'center'
        ? Math.round((state.stageWidth - layer.width) / 2)
        : mode === 'left'
          ? 0
          : state.stageWidth - layer.width;
    const targetY = Math.round((state.stageHeight - layer.height) / 2);

    api.setLayerPosition(0, {x: targetX, y: targetY});
  });
}

function captureScenario(name: string) {
  cy.wait(500);
  cy.get('[data-testid="stage-wrapper"]').screenshot(`preview-alignment-${name}-stage`);
  cy.get('[data-testid="preview-canvas"]').screenshot(`preview-alignment-${name}-preview`);
  cy.get('[data-testid="preview-open-fullscreen"]').click();
  cy.get('[data-testid="preview-modal"]').should('be.visible');
  cy.get('[data-testid="preview-canvas-fullscreen"]').screenshot(`preview-alignment-${name}-fullscreen`);
  cy.get('[data-testid="preview-close-fullscreen"]').click();
}

describe('Create cup preview alignment with 4_ua.webp', () => {
  beforeEach(() => {
    cy.intercept('POST', '/api/print', {
      statusCode: 200,
      body: {message: 'Queued for print successfully.'}
    }).as('printRequest');

    cy.visit('/uk/create-cup');
    cy.get('[data-testid="add-text-button"]', {timeout: 20000}).should('be.visible');
    cy.window().its('__cupStudioTest').should('exist');
    cy.get('[data-testid="image-input"]').selectFile(sourceImage, {force: true});
    cy.get('[data-testid="layer-item-0"]', {timeout: 20000}).should('exist');
    cy.window().should((win) => {
      const state = (win as unknown as CupStudioWindow).__cupStudioTest.getState();
      expect(state.layers.length).to.be.greaterThan(0);
    });
  });

  it('checks centered image against preview and print export', () => {
    positionFirstLayer('center');
    captureScenario('center');

    cy.get('[data-testid="send-to-print-button"]').click();
    cy.wait('@printRequest').then(({request}) => {
      expect(request.body.imageDataUrl).to.match(/^data:image\/png;base64,/);
      expect(request.body.printProfile.dpi).to.equal(300);
    });
    cy.get('[data-testid="status-message"]').should('contain.text', 'Queued for print successfully.');
    cy.screenshot('preview-alignment-center-print', {capture: 'fullPage'});
  });

  it('checks left-edge image against preview and print export', () => {
    positionFirstLayer('left');
    captureScenario('left');

    cy.get('[data-testid="send-to-print-button"]').click();
    cy.wait('@printRequest').then(({request}) => {
      expect(request.body.imageDataUrl).to.match(/^data:image\/png;base64,/);
      expect(request.body.printProfile.dpi).to.equal(300);
    });
    cy.get('[data-testid="status-message"]').should('contain.text', 'Queued for print successfully.');
    cy.screenshot('preview-alignment-left-print', {capture: 'fullPage'});
  });

  it('checks right-edge image against preview and print export', () => {
    positionFirstLayer('right');
    captureScenario('right');

    cy.get('[data-testid="send-to-print-button"]').click();
    cy.wait('@printRequest').then(({request}) => {
      expect(request.body.imageDataUrl).to.match(/^data:image\/png;base64,/);
      expect(request.body.printProfile.dpi).to.equal(300);
    });
    cy.get('[data-testid="status-message"]').should('contain.text', 'Queued for print successfully.');
    cy.screenshot('preview-alignment-right-print', {capture: 'fullPage'});
  });
});
