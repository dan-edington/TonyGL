import {
  BufferAddressSpace,
  ArrayLayout,
  ComputeBufferLayoutOptions,
  ComputeBufferLayoutResult,
  ScalarType,
  UniformEntryMeta,
  UniformLayout,
  UniformValue,
  UniformValueInput,
  VectorLayout,
} from '../types';

function computeBufferLayout(
  uniforms: Record<string, UniformValue>,
  options: ComputeBufferLayoutOptions = {},
): ComputeBufferLayoutResult {
  const addressSpace = options.addressSpace ?? 'uniform';
  let bufferSize = 0;
  const layoutEntries: UniformEntryMeta[] = [];

  for (const key in uniforms) {
    const uniform = uniforms[key];
    const layout = getLayoutForType(uniform.type, addressSpace);
    bufferSize = alignTo(bufferSize, getRequiredAlignForAddressSpace(layout, addressSpace));

    layoutEntries.push({
      key,
      offset: bufferSize,
      layout,
    });

    bufferSize += layout.size;
  }

  bufferSize = alignTo(bufferSize, 16);

  const bufferData = new ArrayBuffer(bufferSize);
  writeUniformValuesToBuffer(uniforms, bufferData, layoutEntries);

  return { bufferData, layoutEntries };
}

function writeUniformValuesToBuffer(
  uniforms: Record<string, UniformValue>,
  bufferData: ArrayBuffer,
  layoutEntries: UniformEntryMeta[],
): void {
  for (const entry of layoutEntries) {
    const uniform = uniforms[entry.key];
    if (!uniform) {
      continue;
    }

    writeValueToLayout(bufferData, entry.layout, entry.offset, uniform.value, entry.key, uniform.type);
  }
}

function writeValueToLayout(
  bufferData: ArrayBuffer,
  layout: UniformLayout,
  offset: number,
  value: UniformValue['value'],
  key: string,
  typeName: string,
) {
  const label = `${key} (${typeName})`;

  switch (layout.kind) {
    case 'scalar': {
      if (typeof value !== 'number') {
        if (value.length !== 1) {
          throw new Error(`Uniform '${label}' expects 1 value, got ${value.length}.`);
        }
        writeComponentValues(bufferData, layout.scalar, offset, value, 0, 1);
        return;
      }

      writeScalar(bufferData, layout.scalar, offset, value);
      return;
    }

    case 'vector': {
      if (typeof value === 'number') {
        throw new Error(`Uniform '${label}' expects ${layout.length} values, got scalar.`);
      }
      if (value.length !== layout.elementCount) {
        throw new Error(`Uniform '${label}' expects ${layout.elementCount} values, got ${value.length}.`);
      }

      writeComponentValues(bufferData, layout.scalar, offset, value, 0, layout.length);
      return;
    }

    case 'matrix': {
      if (typeof value === 'number') {
        throw new Error(`Uniform '${label}' expects ${layout.elementCount} values, got scalar.`);
      }
      if (value.length !== layout.elementCount) {
        throw new Error(`Uniform '${label}' expects ${layout.elementCount} values, got ${value.length}.`);
      }

      for (let col = 0; col < layout.columns; col++) {
        const sourceIndex = col * layout.rows;
        const columnOffset = offset + col * layout.stride;
        writeComponentValues(bufferData, layout.scalar, columnOffset, value, sourceIndex, layout.rows);
      }
      return;
    }

    case 'array': {
      if (typeof value === 'number') {
        throw new Error(`Uniform '${label}' expects ${layout.elementCount} values, got scalar.`);
      }
      if (value.length !== layout.elementCount) {
        throw new Error(`Uniform '${label}' expects ${layout.elementCount} values, got ${value.length}.`);
      }

      let cursor = 0;
      for (let i = 0; i < layout.length; i++) {
        const elementOffset = offset + i * layout.stride;
        writeValueSliceToLayout(bufferData, layout.element, elementOffset, value, cursor);
        cursor += layout.element.elementCount;
      }
      return;
    }
  }
}

function writeValueSliceToLayout(
  bufferData: ArrayBuffer,
  layout: UniformLayout,
  offset: number,
  source: ArrayLike<number>,
  startIndex: number,
) {
  switch (layout.kind) {
    case 'scalar':
      writeComponentValues(bufferData, layout.scalar, offset, source, startIndex, 1);
      return;
    case 'vector':
      writeComponentValues(bufferData, layout.scalar, offset, source, startIndex, layout.length);
      return;
    case 'matrix':
      for (let col = 0; col < layout.columns; col++) {
        const sourceIndex = startIndex + col * layout.rows;
        const columnOffset = offset + col * layout.stride;
        writeComponentValues(bufferData, layout.scalar, columnOffset, source, sourceIndex, layout.rows);
      }
      return;
    case 'array': {
      let cursor = startIndex;
      for (let i = 0; i < layout.length; i++) {
        const elementOffset = offset + i * layout.stride;
        writeValueSliceToLayout(bufferData, layout.element, elementOffset, source, cursor);
        cursor += layout.element.elementCount;
      }
      return;
    }
  }
}

function writeComponentValues(
  bufferData: ArrayBuffer,
  scalar: ScalarType,
  byteOffset: number,
  source: ArrayLike<number>,
  sourceStart: number,
  count: number,
) {
  if (scalar === 'f16') {
    const view = new (globalThis as any).Float16Array(bufferData, byteOffset, count);
    for (let i = 0; i < count; i++) {
      view[i] = source[sourceStart + i];
    }
    return;
  }

  if (scalar === 'f32') {
    const view = new Float32Array(bufferData, byteOffset, count);
    for (let i = 0; i < count; i++) {
      view[i] = source[sourceStart + i];
    }
    return;
  }

  if (scalar === 'i32') {
    const view = new Int32Array(bufferData, byteOffset, count);
    for (let i = 0; i < count; i++) {
      view[i] = source[sourceStart + i];
    }
    return;
  }

  const view = new Uint32Array(bufferData, byteOffset, count);
  for (let i = 0; i < count; i++) {
    view[i] = source[sourceStart + i];
  }
}

function writeScalar(bufferData: ArrayBuffer, scalar: ScalarType, byteOffset: number, value: number) {
  if (scalar === 'f16') {
    new (globalThis as any).Float16Array(bufferData, byteOffset, 1)[0] = value;
    return;
  }

  if (scalar === 'f32') {
    new Float32Array(bufferData, byteOffset, 1)[0] = value;
    return;
  }

  if (scalar === 'i32') {
    new Int32Array(bufferData, byteOffset, 1)[0] = value;
    return;
  }

  new Uint32Array(bufferData, byteOffset, 1)[0] = value;
}

function getLayoutForType(type: string, addressSpace: BufferAddressSpace): UniformLayout {
  const normalizedType = normalizeTypeName(type);

  if (normalizedType.startsWith('array<')) {
    return parseArrayLayout(normalizedType, addressSpace);
  }

  const scalarMatch = /^(f16|f32|i32|u32)$/.exec(normalizedType);
  if (scalarMatch) {
    const scalar = scalarMatch[1] as ScalarType;
    const byteSize = getScalarByteSize(scalar);

    return {
      kind: 'scalar',
      scalar,
      align: byteSize,
      size: byteSize,
      elementCount: 1,
    };
  }

  const vectorMatch = /^vec([2-4])<(f16|f32|i32|u32)>$/.exec(normalizedType);
  if (vectorMatch) {
    const length = Number(vectorMatch[1]);
    const scalar = vectorMatch[2] as ScalarType;
    const scalarSize = getScalarByteSize(scalar);
    const align = length === 3 ? scalarSize * 4 : scalarSize * length;

    return {
      kind: 'vector',
      scalar,
      length,
      align,
      size: scalarSize * length,
      elementCount: length,
    };
  }

  const matrixMatch = /^mat([2-4])x([2-4])<(f16|f32)>$/.exec(normalizedType);
  if (matrixMatch) {
    const columns = Number(matrixMatch[1]);
    const rows = Number(matrixMatch[2]);
    const scalar = matrixMatch[3] as 'f16' | 'f32';
    const vectorLayout = getLayoutForType(`vec${rows}<${scalar}>`, addressSpace) as VectorLayout;
    const stride = alignTo(vectorLayout.size, vectorLayout.align);

    return {
      kind: 'matrix',
      scalar,
      columns,
      rows,
      align: vectorLayout.align,
      size: stride * columns,
      stride,
      elementCount: columns * rows,
    };
  }

  throw new Error(`Unsupported data type: ${type}`);
}

function parseArrayLayout(type: string, addressSpace: BufferAddressSpace): ArrayLayout {
  const inner = getArrayInner(type);
  const splitIndex = findTopLevelComma(inner);

  if (splitIndex === -1) {
    throw new Error(`Invalid array type declaration: ${type}`);
  }

  const elementTypeName = inner.slice(0, splitIndex).trim();
  const countValue = Number(inner.slice(splitIndex + 1).trim());

  if (!Number.isFinite(countValue) || countValue < 1 || !Number.isInteger(countValue)) {
    throw new Error(`Invalid array element count in type declaration: ${type}`);
  }

  const elementLayout = getLayoutForType(elementTypeName, addressSpace);
  const stride = getArrayElementStride(elementLayout, addressSpace);

  return {
    kind: 'array',
    element: elementLayout,
    length: countValue,
    align: elementLayout.align,
    size: stride * countValue,
    stride,
    elementCount: elementLayout.elementCount * countValue,
  };
}

function normalizeTypeName(rawType: string): string {
  const trimmed = rawType.replace(/\s+/g, '');

  const vectorAliasMatch = /^vec([2-4])([fihu])$/.exec(trimmed);
  if (vectorAliasMatch) {
    const scalarBySuffix: Record<string, ScalarType> = {
      f: 'f32',
      h: 'f16',
      i: 'i32',
      u: 'u32',
    };

    return `vec${vectorAliasMatch[1]}<${scalarBySuffix[vectorAliasMatch[2]]}>`;
  }

  const matrixAliasMatch = /^mat([2-4])x([2-4])([fh])$/.exec(trimmed);
  if (matrixAliasMatch) {
    const scalar = matrixAliasMatch[3] === 'f' ? 'f32' : 'f16';
    return `mat${matrixAliasMatch[1]}x${matrixAliasMatch[2]}<${scalar}>`;
  }

  return trimmed;
}

function getArrayInner(type: string): string {
  if (!type.startsWith('array<') || !type.endsWith('>')) {
    throw new Error(`Invalid array type declaration: ${type}`);
  }

  return type.slice(6, -1);
}

function findTopLevelComma(value: string): number {
  let depth = 0;

  for (let i = 0; i < value.length; i++) {
    const character = value[i];
    if (character === '<') {
      depth += 1;
    } else if (character === '>') {
      depth -= 1;
    } else if (character === ',' && depth === 0) {
      return i;
    }
  }

  return -1;
}

function getScalarByteSize(scalarType: ScalarType): number {
  return scalarType === 'f16' ? 2 : 4;
}

function alignTo(value: number, alignment: number): number {
  return Math.ceil(value / alignment) * alignment;
}

function roundUpTo16(value: number): number {
  return alignTo(value, 16);
}

function getRequiredAlignForAddressSpace(layout: UniformLayout, addressSpace: BufferAddressSpace): number {
  if (addressSpace === 'uniform' && layout.kind === 'array') {
    // Uniform arrays require 16-byte member alignment at use-sites.
    return roundUpTo16(layout.align);
  }

  return layout.align;
}

function getArrayElementStride(elementLayout: UniformLayout, addressSpace: BufferAddressSpace): number {
  if (addressSpace === 'uniform') {
    // Uniform arrays use a stride aligned to roundUp(16, AlignOf(element)).
    return alignTo(elementLayout.size, roundUpTo16(elementLayout.align));
  }

  return alignTo(elementLayout.size, elementLayout.align);
}

export { computeBufferLayout, writeUniformValuesToBuffer };
export type {
  ComputeBufferLayoutOptions,
  ComputeBufferLayoutResult,
  UniformEntryMeta,
  UniformLayout,
  UniformValue,
  UniformValueInput,
};
