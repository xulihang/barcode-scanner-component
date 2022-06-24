import { newSpecPage } from '@stencil/core/testing';
import { BarcodeScanner } from '../barcode-scanner';

describe('barcode-scanner', () => {
  it('renders', async () => {
    const page = await newSpecPage({
      components: [BarcodeScanner],
      html: `<barcode-scanner></barcode-scanner>`,
    });
    expect(page.root).toEqualHtml(`
      <barcode-scanner>
        <mock:shadow-root>
          <slot></slot>
        </mock:shadow-root>
      </barcode-scanner>
    `);
  });
});
