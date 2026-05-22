import type { BigIntTypedArray, NumericTypedArray } from '../core/core.types';

const BYTES_PER_ELEMENT = new Map<any, number>([
  [Int8Array, 1],
  [Uint8Array, 1],
  [Uint8ClampedArray, 1],
  [Int16Array, 2],
  [Uint16Array, 2],
  [Int32Array, 4],
  [Uint32Array, 4],
  [Float32Array, 4],
  [Float64Array, 8],
  [BigInt64Array, 8],
  [BigUint64Array, 8],
]);

function padArrayToAlignmentBytes<T>(
  arrayToPad: NumericTypedArray,
  options?: { alignmentBytes?: number; padWith?: number },
): { paddedArray: T; unpaddedLength: number };

function padArrayToAlignmentBytes<T>(
  arrayToPad: BigIntTypedArray,
  options?: { alignmentBytes?: number; padWith?: bigint },
): { paddedArray: T; unpaddedLength: number };

function padArrayToAlignmentBytes<T>(arrayToPad: any, options: any = {}): any {
  const { alignmentBytes = 4 } = options;
  let padWith = options.padWith;

  const unpaddedLength = arrayToPad.length;
  const arrayConstructor = arrayToPad.constructor;

  if (!BYTES_PER_ELEMENT.has(arrayConstructor)) throw new Error('Unsupported array type');

  const bytesPerElement = BYTES_PER_ELEMENT.get(arrayConstructor)!;

  if (padWith === undefined) {
    padWith = arrayConstructor === BigInt64Array || arrayConstructor === BigUint64Array ? 0n : 0;
  }

  const totalBytes = unpaddedLength * bytesPerElement;
  const alignmentOffset = totalBytes % alignmentBytes;

  if (alignmentOffset === 0) {
    return { paddedArray: arrayToPad as T, unpaddedLength };
  }

  const paddingBytes = alignmentBytes - alignmentOffset;
  const paddingElements = Math.ceil(paddingBytes / bytesPerElement);
  const paddedLength = unpaddedLength + paddingElements;

  const paddedArray = new arrayConstructor(paddedLength);
  paddedArray.fill(padWith);
  paddedArray.set(arrayToPad);

  return { paddedArray, unpaddedLength };
}

export { padArrayToAlignmentBytes };
