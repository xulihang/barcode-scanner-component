import { newE2EPage } from '@stencil/core/testing';

describe('barcode-scanner', () => {
  it('renders', async () => {
    const page = await newE2EPage();
    await page.setContent('<barcode-scanner></barcode-scanner>');

    const element = await page.find('barcode-scanner');
    expect(element).toHaveClass('hydrated');
  });
});
