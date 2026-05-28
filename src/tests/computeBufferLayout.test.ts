import { describe, expect, it } from 'vitest';
import { computeBufferLayout, writeUniformValuesToBuffer } from '../utilities/computeBufferLayout';

describe('computeBufferLayout', () => {
  it('computes offsets using per-type alignment and pads final struct size to 16 bytes', () => {
    const uniforms = {
      a: { type: 'u32', value: 7 },
      b: { type: 'vec3<f32>', value: new Float32Array([1, 2, 3]) },
      c: { type: 'f32', value: 9 },
    };

    const { bufferData, layoutEntries } = computeBufferLayout(uniforms);

    expect(bufferData.byteLength).toBe(32);

    expect(layoutEntries).toHaveLength(3);
    expect(layoutEntries[0].key).toBe('a');
    expect(layoutEntries[0].offset).toBe(0);

    expect(layoutEntries[1].key).toBe('b');
    expect(layoutEntries[1].offset).toBe(16);

    expect(layoutEntries[2].key).toBe('c');
    expect(layoutEntries[2].offset).toBe(28);

    const u32View = new Uint32Array(bufferData, 0, 1);
    const f32View = new Float32Array(bufferData);

    expect(u32View[0]).toBe(7);
    expect(f32View[4]).toBe(1);
    expect(f32View[5]).toBe(2);
    expect(f32View[6]).toBe(3);
    expect(f32View[7]).toBe(9);
  });

  it('supports WGSL shorthand aliases like vec3f and mat3x3f', () => {
    const uniforms = {
      direction: { type: 'vec3f', value: new Float32Array([4, 5, 6]) },
      transform: { type: 'mat3x3f', value: new Float32Array([1, 2, 3, 4, 5, 6, 7, 8, 9]) },
    };

    const { layoutEntries } = computeBufferLayout(uniforms);

    expect(layoutEntries[0].layout.kind).toBe('vector');
    expect(layoutEntries[0].layout.align).toBe(16);
    expect(layoutEntries[0].layout.size).toBe(12);

    const matrixLayout = layoutEntries[1].layout;
    expect(matrixLayout.kind).toBe('matrix');
    if (matrixLayout.kind !== 'matrix') {
      throw new Error('Expected matrix layout for transform.');
    }
    expect(matrixLayout.align).toBe(16);
    expect(matrixLayout.size).toBe(48);
    expect(matrixLayout.stride).toBe(16);
  });

  it('writes matrices with correct column stride and preserved padding slots', () => {
    const uniforms = {
      m: { type: 'mat3x3<f32>', value: new Float32Array([1, 2, 3, 4, 5, 6, 7, 8, 9]) },
    };

    const { bufferData, layoutEntries } = computeBufferLayout(uniforms);

    expect(layoutEntries[0].offset).toBe(0);
    expect(layoutEntries[0].layout.kind).toBe('matrix');
    expect(layoutEntries[0].layout.size).toBe(48);

    const f32View = new Float32Array(bufferData);
    expect(Array.from(f32View.slice(0, 12))).toEqual([1, 2, 3, 0, 4, 5, 6, 0, 7, 8, 9, 0]);
  });

  it('computes array stride correctly for array<vec3f, N> and writes each element at stride boundaries', () => {
    const uniforms = {
      points: { type: 'array<vec3f, 2>', value: new Float32Array([10, 11, 12, 20, 21, 22]) },
    };

    const { bufferData, layoutEntries } = computeBufferLayout(uniforms);
    const layout = layoutEntries[0].layout;

    expect(layout.kind).toBe('array');
    if (layout.kind !== 'array') {
      throw new Error('Expected array layout for points.');
    }
    expect(layout.align).toBe(16);
    expect(layout.stride).toBe(16);
    expect(layout.size).toBe(32);
    expect(layout.elementCount).toBe(6);

    const f32View = new Float32Array(bufferData);
    expect(Array.from(f32View.slice(0, 8))).toEqual([10, 11, 12, 0, 20, 21, 22, 0]);
  });

  it('supports nested arrays by splitting the top-level comma only', () => {
    const uniforms = {
      nested: {
        type: 'array<array<vec2<f32>, 2>, 2>',
        value: new Float32Array([1, 2, 3, 4, 5, 6, 7, 8]),
      },
    };

    const { bufferData, layoutEntries } = computeBufferLayout(uniforms);
    const layout = layoutEntries[0].layout;

    expect(layout.kind).toBe('array');
    if (layout.kind !== 'array') {
      throw new Error('Expected array layout for nested.');
    }
    expect(layout.size).toBe(64);
    expect(layout.stride).toBe(32);
    expect(layout.elementCount).toBe(8);

    const f32View = new Float32Array(bufferData);
    expect(Array.from(f32View.slice(0, 16))).toEqual([1, 2, 0, 0, 3, 4, 0, 0, 5, 6, 0, 0, 7, 8, 0, 0]);
  });

  it('uses 16-byte stride for scalar arrays in uniform address space', () => {
    const uniforms = {
      weights: { type: 'array<f32, 2>', value: new Float32Array([2, 4]) },
    };

    const { bufferData, layoutEntries } = computeBufferLayout(uniforms);
    const layout = layoutEntries[0].layout;

    expect(layout.kind).toBe('array');
    if (layout.kind !== 'array') {
      throw new Error('Expected array layout for weights.');
    }

    expect(layout.align).toBe(4);
    expect(layout.stride).toBe(16);
    expect(layout.size).toBe(32);

    const f32View = new Float32Array(bufferData);
    expect(Array.from(f32View.slice(0, 8))).toEqual([2, 0, 0, 0, 4, 0, 0, 0]);
  });

  it('supports tightly-packed scalar arrays in storage address space', () => {
    const uniforms = {
      weights: { type: 'array<f32, 2>', value: new Float32Array([2, 4]) },
    };

    const { bufferData, layoutEntries } = computeBufferLayout(uniforms, { addressSpace: 'storage' });
    const layout = layoutEntries[0].layout;

    expect(layout.kind).toBe('array');
    if (layout.kind !== 'array') {
      throw new Error('Expected array layout for weights.');
    }

    expect(layout.stride).toBe(4);
    expect(layout.size).toBe(8);

    const f32View = new Float32Array(bufferData);
    expect(Array.from(f32View.slice(0, 2))).toEqual([2, 4]);
  });

  it('rewrites an existing buffer with writeUniformValuesToBuffer using precomputed layout entries', () => {
    const uniforms = {
      color: { type: 'vec4<f32>', value: new Float32Array([1, 0, 0, 1]) },
      intensity: { type: 'f32', value: 2 },
    };

    const { bufferData, layoutEntries } = computeBufferLayout(uniforms);

    uniforms.color.value = new Float32Array([0, 1, 0, 1]);
    uniforms.intensity.value = 4;

    writeUniformValuesToBuffer(uniforms, bufferData, layoutEntries);

    const f32View = new Float32Array(bufferData);
    expect(Array.from(f32View.slice(0, 5))).toEqual([0, 1, 0, 1, 4]);
  });

  it('throws on unsupported type names', () => {
    const uniforms = {
      bad: { type: 'vec5<f32>', value: new Float32Array([1, 2, 3, 4, 5]) },
    };

    expect(() => computeBufferLayout(uniforms)).toThrow('Unsupported data type');
  });

  it('throws on malformed array declarations', () => {
    expect(() =>
      computeBufferLayout({
        bad: { type: 'array<f32>', value: new Float32Array([1]) },
      }),
    ).toThrow('Invalid array type declaration');

    expect(() =>
      computeBufferLayout({
        bad: { type: 'array<f32, 0>', value: new Float32Array([]) },
      }),
    ).toThrow('Invalid array element count');

    expect(() =>
      computeBufferLayout({
        bad: { type: 'array<f32, 2.5>', value: new Float32Array([1, 2, 3]) },
      }),
    ).toThrow('Invalid array element count');
  });

  it('throws when vector, matrix, or array value lengths do not match declared shape', () => {
    expect(() =>
      computeBufferLayout({
        v: { type: 'vec3<f32>', value: new Float32Array([1, 2]) },
      }),
    ).toThrow('expects 3 values');

    expect(() =>
      computeBufferLayout({
        m: { type: 'mat2x2<f32>', value: new Float32Array([1, 0, 0]) },
      }),
    ).toThrow('expects 4 values');

    expect(() =>
      computeBufferLayout({
        a: { type: 'array<vec2<f32>, 2>', value: new Float32Array([1, 2, 3]) },
      }),
    ).toThrow('expects 4 values');
  });

  it('throws when scalar uniform is provided with multi-value typed array', () => {
    expect(() =>
      computeBufferLayout({
        s: { type: 'f32', value: new Float32Array([1, 2]) },
      }),
    ).toThrow('expects 1 value');
  });
});
