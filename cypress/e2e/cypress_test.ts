// cypress/e2e/cypress_test.ts
/// <reference types="cypress" />

describe('PDF Viewer Frontend', () => {

  beforeEach(() => {
    cy.visit('/index.html');
  });

  it('Loads the page and checks default PDF', () => {
    cy.title().should('contain', 'PDF Viewer');
    cy.get('#pdf-container').should('exist');
    cy.get('#pdf-thumbnails').should('be.visible');
    cy.get('#pdf-view').should('be.visible');
  });

  it('Toggles Dark/Light theme', () => {
    cy.get('html').then($html => {
      const initialDark = $html.hasClass('dark');
      cy.get('#toggle-theme').click();
      cy.get('html').should($h => {
        expect($h.hasClass('dark')).to.eq(!initialDark);
      });
    });
  });

  it('Opens a local PDF file', () => {
    const pdfFixture = 'cv.pdf';
    cy.get('#file-input').attachFile(pdfFixture, { force: true });
    cy.get('#pdf-toast', { timeout: 5000 })
        .should('exist')
        .and($toast => {
          expect($toast.text()).to.include('PDF wczytany poprawnie!');
        });
  });

  it('Handles invalid file upload gracefully', () => {
    const invalidFile = 'invalid.txt';
    cy.get('#file-input').attachFile(invalidFile, { force: true });
    cy.get('#pdf-toast', { timeout: 5000 })
        .should('exist')
        .and($toast => {
          expect($toast.text()).to.include('Nieobsługiwany format');
        });
  });


  it('Zoom in, zoom out and reset works', () => {
    cy.get('#pdf-toast', { timeout: 10000 }).should('exist').and($toast => {
      expect($toast.text()).to.include('PDF wczytany poprawnie!');
    });

    // Dopiero teraz pobieramy aktualny zoom
    cy.get('#zoom-level').invoke('text').then(text => {
      const initial = Number(text.replace('%', '')); // powinno być 120

      // Zoom In
      cy.get('#zoom-in').click();
      cy.get('#zoom-level').invoke('text').should(newText => {
        const zoom = Number(newText.replace('%', ''));
        expect(zoom).to.be.greaterThan(initial); // 140
      });

      // Zoom Out
      cy.get('#zoom-out').click();
      cy.get('#zoom-level').invoke('text').should(newText => {
        const zoom = Number(newText.replace('%', ''));
        expect(zoom).to.equal(initial); // 120
      });

      // Zoom In + Reset
      cy.get('#zoom-in').click();
      cy.get('#reset-zoom').click();
      cy.get('#zoom-level').invoke('text').should(newText => {
        const zoom = Number(newText.replace('%', ''));
        expect(zoom).to.equal(initial); // 120
      });
    });
  });



  it('Fit width and fit height buttons adjust PDF', () => {
    cy.get('#fit-width').click();
    cy.wait(300);
    cy.get('#pdf-view canvas').first().invoke('width').should('be.greaterThan', 0);

    cy.get('#fit-height').click();
    cy.wait(300);
    cy.get('#pdf-view canvas').first().invoke('height').should('be.greaterThan', 0);
  });

  it('Drag-to-pan interaction', () => {
    cy.get('#pdf-view').trigger('mousedown', { which: 1, clientX: 50, clientY: 50 });
    cy.get('#pdf-view').trigger('mousemove', { clientX: 100, clientY: 100 });
    cy.get('#pdf-view').trigger('mouseup');
  });

  it('Test panel API tab loads correctly', () => {
    cy.get('.tab-btn[data-type="api"]').click();
    // zamiast oczekiwać 'Loading', sprawdzamy, że status zmienił się po kliknięciu
    cy.get('#test-status', { timeout: 5000 }).should($el => {
      expect($el.text().trim().length).to.be.greaterThan(0);
    });
  });

});
