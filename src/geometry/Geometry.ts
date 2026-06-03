import { padArrayToAlignmentBytes } from '../utilities/padArrayToAlignmentBytes';
import type { Geometry } from './geometry.types';
import { TonyModuleContext } from '../TonyGL.types';

export type GeometryOptions = {
  name?: string;
  vertices: Float32Array;
  indices?: Uint16Array | Uint32Array;
  normals: Float32Array;
  uvs: Float32Array;
  topology?: GPUPrimitiveTopology;
};

function Geometry(context: TonyModuleContext) {
  const { renderer } = context;

  function createGeometry(options: GeometryOptions): Geometry {
    const id = crypto.randomUUID();
    const name = options.name ?? '';
    const type = 'Geometry';
    const topology = options.topology ?? 'triangle-list';
    let isIndexed = false;
    let indices: Uint16Array | Uint32Array | null = null;
    let indexCount: number = 0;
    let indexFormat: GPUIndexFormat | null = null;
    let vertexBuffer: GPUBuffer | null = null;
    let indexBuffer: GPUBuffer | null = null;
    let normalBuffer: GPUBuffer | null = null;
    let tangentBuffer: GPUBuffer | null = null;
    let uvBuffer: GPUBuffer | null = null;

    if (options.indices) {
      isIndexed = true;

      const { paddedArray: paddedIndices, unpaddedLength } = padArrayToAlignmentBytes<Uint16Array | Uint32Array>(
        options.indices,
        { alignmentBytes: 4 },
      );

      indices = paddedIndices;
      indexCount = unpaddedLength;
      indexFormat = options.indices instanceof Uint16Array ? 'uint16' : 'uint32';
    }

    const vertices = padArrayToAlignmentBytes<Float32Array>(options.vertices, { alignmentBytes: 4 }).paddedArray;
    const normals = padArrayToAlignmentBytes<Float32Array>(options.normals, { alignmentBytes: 4 }).paddedArray;
    const uvs = padArrayToAlignmentBytes<Float32Array>(options.uvs, { alignmentBytes: 4 }).paddedArray;
    const tangents = generateTangents();

    vertexBuffer = renderer.device.createBuffer({
      size: vertices.byteLength,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    });

    renderer.device.queue.writeBuffer(vertexBuffer, 0, vertices.buffer);

    if (isIndexed && indices) {
      indexBuffer = renderer.device.createBuffer({
        size: indices.byteLength,
        usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
      });

      renderer.device.queue.writeBuffer(indexBuffer, 0, indices.buffer);
    }

    normalBuffer = renderer.device.createBuffer({
      size: normals.byteLength,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    });

    renderer.device.queue.writeBuffer(normalBuffer, 0, normals.buffer);

    uvBuffer = renderer.device.createBuffer({
      size: uvs.byteLength,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    });

    renderer.device.queue.writeBuffer(uvBuffer, 0, uvs.buffer);

    tangentBuffer = renderer.device.createBuffer({
      size: tangents ? tangents.byteLength : 0,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    });

    renderer.device.queue.writeBuffer(tangentBuffer, 0, tangents.buffer);

    function generateTangents(): Float32Array {
      const vertexCount = vertices.length / 3;
      const tAccum = new Float32Array(vertexCount * 3);
      const bAccum = new Float32Array(vertexCount * 3);

      const triCount = isIndexed ? indexCount / 3 : vertexCount / 3;

      for (let tri = 0; tri < triCount; tri++) {
        let i0: number, i1: number, i2: number;
        if (isIndexed && indices) {
          i0 = indices[tri * 3];
          i1 = indices[tri * 3 + 1];
          i2 = indices[tri * 3 + 2];
        } else {
          i0 = tri * 3;
          i1 = tri * 3 + 1;
          i2 = tri * 3 + 2;
        }

        const p0x = vertices[i0 * 3],
          p0y = vertices[i0 * 3 + 1],
          p0z = vertices[i0 * 3 + 2];
        const p1x = vertices[i1 * 3],
          p1y = vertices[i1 * 3 + 1],
          p1z = vertices[i1 * 3 + 2];
        const p2x = vertices[i2 * 3],
          p2y = vertices[i2 * 3 + 1],
          p2z = vertices[i2 * 3 + 2];

        const u0 = uvs[i0 * 2],
          v0 = uvs[i0 * 2 + 1];
        const u1 = uvs[i1 * 2],
          v1 = uvs[i1 * 2 + 1];
        const u2 = uvs[i2 * 2],
          v2 = uvs[i2 * 2 + 1];

        const e1x = p1x - p0x,
          e1y = p1y - p0y,
          e1z = p1z - p0z;
        const e2x = p2x - p0x,
          e2y = p2y - p0y,
          e2z = p2z - p0z;

        const du1 = u1 - u0,
          dv1 = v1 - v0;
        const du2 = u2 - u0,
          dv2 = v2 - v0;

        const det = du1 * dv2 - du2 * dv1;
        if (Math.abs(det) < 1e-8) continue;
        const r = 1 / det;

        const tx = (e1x * dv2 - e2x * dv1) * r;
        const ty = (e1y * dv2 - e2y * dv1) * r;
        const tz = (e1z * dv2 - e2z * dv1) * r;

        const bx = (e2x * du1 - e1x * du2) * r;
        const by = (e2y * du1 - e1y * du2) * r;
        const bz = (e2z * du1 - e1z * du2) * r;

        for (const idx of [i0, i1, i2]) {
          tAccum[idx * 3] += tx;
          tAccum[idx * 3 + 1] += ty;
          tAccum[idx * 3 + 2] += tz;
          bAccum[idx * 3] += bx;
          bAccum[idx * 3 + 1] += by;
          bAccum[idx * 3 + 2] += bz;
        }
      }

      const out = new Float32Array(vertexCount * 4);

      for (let i = 0; i < vertexCount; i++) {
        const nx = normals[i * 3],
          ny = normals[i * 3 + 1],
          nz = normals[i * 3 + 2];
        let tx = tAccum[i * 3],
          ty = tAccum[i * 3 + 1],
          tz = tAccum[i * 3 + 2];
        const bx = bAccum[i * 3],
          by = bAccum[i * 3 + 1],
          bz = bAccum[i * 3 + 2];

        // Gram-Schmidt orthogonalize T against N
        const dot = tx * nx + ty * ny + tz * nz;
        tx -= nx * dot;
        ty -= ny * dot;
        tz -= nz * dot;

        const len = Math.sqrt(tx * tx + ty * ty + tz * tz);
        if (len < 1e-8) {
          out[i * 4] = 1;
          out[i * 4 + 1] = 0;
          out[i * 4 + 2] = 0;
          out[i * 4 + 3] = 1;
          continue;
        }
        tx /= len;
        ty /= len;
        tz /= len;

        // Handedness: sign of dot(cross(N, T), B_accum)
        const cx = ny * tz - nz * ty;
        const cy = nz * tx - nx * tz;
        const cz = nx * ty - ny * tx;
        const w = cx * bx + cy * by + cz * bz < 0 ? -1 : 1;

        out[i * 4] = tx;
        out[i * 4 + 1] = ty;
        out[i * 4 + 2] = tz;
        out[i * 4 + 3] = w;
      }

      return out;
    }

    function destroy() {
      self.vertexBuffer?.destroy();
      self.indexBuffer?.destroy();
      self.normalBuffer?.destroy();
      self.uvBuffer?.destroy();
      self.tangentBuffer?.destroy();

      self.vertexBuffer = null;
      self.indexBuffer = null;
      self.normalBuffer = null;
      self.uvBuffer = null;
      self.tangentBuffer = null;
    }

    const self: Geometry = {
      id,
      name,
      type,
      isIndexed,
      indexCount,
      indexFormat,
      topology,
      vertices,
      indices,
      normals,
      uvs,
      tangents,
      vertexBuffer,
      indexBuffer,
      normalBuffer,
      tangentBuffer,
      uvBuffer,
      destroy,
    };

    return self;
  }

  return {
    createGeometry,
  };
}

export { Geometry };
