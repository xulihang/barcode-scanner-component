/* eslint-disable */
/* tslint:disable */
/**
 * This is an autogenerated file created by the Stencil compiler.
 * It contains typing information for all components that exist in this project.
 */
import { HTMLStencilElement, JSXBase } from "@stencil/core/internal";
export namespace Components {
    interface BarcodeScanner {
        "license": string;
    }
}
declare global {
    interface HTMLBarcodeScannerElement extends Components.BarcodeScanner, HTMLStencilElement {
    }
    var HTMLBarcodeScannerElement: {
        prototype: HTMLBarcodeScannerElement;
        new (): HTMLBarcodeScannerElement;
    };
    interface HTMLElementTagNameMap {
        "barcode-scanner": HTMLBarcodeScannerElement;
    }
}
declare namespace LocalJSX {
    interface BarcodeScanner {
        "license": string;
    }
    interface IntrinsicElements {
        "barcode-scanner": BarcodeScanner;
    }
}
export { LocalJSX as JSX };
declare module "@stencil/core" {
    export namespace JSX {
        interface IntrinsicElements {
            "barcode-scanner": LocalJSX.BarcodeScanner & JSXBase.HTMLAttributes<HTMLBarcodeScannerElement>;
        }
    }
}
