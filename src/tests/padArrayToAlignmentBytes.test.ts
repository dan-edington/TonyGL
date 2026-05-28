import { describe, it, expect } from 'vitest';
import { padArrayToAlignmentBytes } from '../utilities/padArrayToAlignmentBytes';

describe('padArrayToAlignmentBytes', () => {
  it('pads a Float32Array to 16 bytes (default padWith)', () => {
    const arr = new Float32Array([1, 2, 3]); // 3*4 = 12 bytes
    const { paddedArray, unpaddedLength } = padArrayToAlignmentBytes<Float32Array>(arr, { alignmentBytes: 16 });
    expect(unpaddedLength).toBe(3);
    expect(paddedArray).toBeInstanceOf(Float32Array);
    expect(paddedArray.length).toBe(4); // 4*4 = 16 bytes
    expect(Array.from(paddedArray)).toEqual([1, 2, 3, 0]);
  });

  it('pads a Float32Array with custom padWith', () => {
    const arr = new Float32Array([1, 2, 3]);
    const { paddedArray } = padArrayToAlignmentBytes<Float32Array>(arr, { alignmentBytes: 16, padWith: 9 });
    expect(Array.from(paddedArray)).toEqual([1, 2, 3, 9]);
  });

  it('does not pad if already aligned', () => {
    const arr = new Float32Array([1, 2, 3, 4]); // 16 bytes
    const { paddedArray, unpaddedLength } = padArrayToAlignmentBytes<Float32Array>(arr, { alignmentBytes: 16 });
    expect(unpaddedLength).toBe(4);
    expect(paddedArray).toBe(arr); // Should be the same instance
    expect(Array.from(paddedArray)).toEqual([1, 2, 3, 4]);
  });

  it('pads a Uint8Array to 8 bytes', () => {
    const arr = new Uint8Array([1, 2, 3, 4, 5]); // 5 bytes
    const { paddedArray } = padArrayToAlignmentBytes<Uint8Array>(arr, { alignmentBytes: 8 });
    expect(paddedArray.length).toBe(8);
    expect(Array.from(paddedArray)).toEqual([1, 2, 3, 4, 5, 0, 0, 0]);
  });

  it('pads a BigInt64Array to 32 bytes (default padWith)', () => {
    const arr = new BigInt64Array([1n, 2n, 3n]); // 3*8 = 24 bytes
    const { paddedArray, unpaddedLength } = padArrayToAlignmentBytes<BigInt64Array>(arr, { alignmentBytes: 32 });
    expect(unpaddedLength).toBe(3);
    expect(paddedArray).toBeInstanceOf(BigInt64Array);
    expect(paddedArray.length).toBe(4); // 4*8 = 32 bytes
    expect(Array.from(paddedArray)).toEqual([1n, 2n, 3n, 0n]);
  });

  it('pads a BigInt64Array with custom padWith', () => {
    const arr = new BigInt64Array([1n, 2n]);
    const { paddedArray } = padArrayToAlignmentBytes<BigInt64Array>(arr, { alignmentBytes: 24, padWith: -5n });
    expect(Array.from(paddedArray)).toEqual([1n, 2n, -5n]);
  });

  it('does not pad if already aligned (bigint)', () => {
    const arr = new BigInt64Array([1n, 2n, 3n, 4n]); // 32 bytes
    const { paddedArray, unpaddedLength } = padArrayToAlignmentBytes<BigInt64Array>(arr, { alignmentBytes: 32 });
    expect(unpaddedLength).toBe(4);
    expect(paddedArray).toBe(arr);
    expect(Array.from(paddedArray)).toEqual([1n, 2n, 3n, 4n]);
  });

  it('throws on unsupported array type', () => {
    // @ts-expect-error
    expect(() => padArrayToAlignmentBytes(new DataView(new ArrayBuffer(8)), { alignmentBytes: 8 })).toThrow();
  });
});
