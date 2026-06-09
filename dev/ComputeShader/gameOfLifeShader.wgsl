struct Grid {
  gridSize: u32,
  grid: array<u32>,
}

@group(2) @binding(0) var<storage, read> grid: Grid;

struct VertexOutput {
  @builtin(position) position: vec4f,
  @location(0) uv: vec2f,
};

@vertex
fn vertex_shader(
  @builtin(vertex_index) vertexIndex: u32,
  @builtin(instance_index) instanceIndex: u32,
  @location(0) position: vec3f,
  @location(2) uv: vec2f,
) -> VertexOutput {

  var out: VertexOutput;

  out.position = cameraUniforms.viewProjectionMatrix * entityUniforms[instanceIndex].modelMatrix * vec4f(position, 1.0);
  out.uv = uv;

  return out;
}

@fragment
fn fragment_shader(
  in: VertexOutput
) -> @location(0) vec4f {
  
  let flippedUv: vec2f = vec2f(in.uv.x, 1 - in.uv.y);
  let gridSquare: vec2f = floor(flippedUv * f32(grid.gridSize)); 
  let index = i32((gridSquare.y * f32(grid.gridSize)) + gridSquare.x);

  if (grid.grid[index] == 1) {
    return vec4f(0, 0, 0, 1);
  }

  return vec4f(1, 0, 0, 1);
}