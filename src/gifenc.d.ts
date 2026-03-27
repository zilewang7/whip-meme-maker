declare module 'gifenc' {
  interface WriteFrameOptions {
    palette?: number[][];
    transparent?: boolean;
    transparentIndex?: number;
    delay?: number;
    repeat?: number;
    dispose?: number;
  }

  interface GIFEncoderInstance {
    writeFrame(
      index: Uint8Array,
      width: number,
      height: number,
      opts?: WriteFrameOptions,
    ): void;
    finish(): void;
    bytes(): Uint8Array<ArrayBuffer>;
    bytesView(): Uint8Array<ArrayBuffer>;
  }

  interface QuantizeOptions {
    format?: 'rgb565' | 'rgb444' | 'rgba4444';
    oneBitAlpha?: boolean | number;
  }

  function GIFEncoder(opts?: {
    auto?: boolean;
    initialCapacity?: number;
  }): GIFEncoderInstance;

  function quantize(
    rgba: Uint8Array | Uint8ClampedArray,
    maxColors: number,
    options?: QuantizeOptions,
  ): number[][];

  function applyPalette(
    rgba: Uint8Array | Uint8ClampedArray,
    palette: number[][],
    format?: string,
  ): Uint8Array;
}
