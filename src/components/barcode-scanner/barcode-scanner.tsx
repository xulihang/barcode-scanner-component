import { Component, h } from '@stencil/core';

@Component({
  tag: 'barcode-scanner',
  styleUrl: 'barcode-scanner.css',
  shadow: true,
})
export class BarcodeScanner {

  render() {
    return (
      <div>Barcode Scanner</div>
    );
  }

}
