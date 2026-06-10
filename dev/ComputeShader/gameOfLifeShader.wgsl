struct Grid {
  gridSize: u32,
  grid: array<u32>,
}

struct GridStyle {
  gridColor: vec4f,
  cellColor: vec4f,
  cellRadius: f32,
}

@group(2) @binding(0) var<storage, read> grid: Grid;
@group(2) @binding(1) var<uniform> gridStyle: GridStyle;

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
  let scaledUv: vec2f = flippedUv * f32(grid.gridSize);
  let gridSquare: vec2f = floor(scaledUv);
  let index: i32 = i32((gridSquare.y * f32(grid.gridSize)) + gridSquare.x);

  let cellUv = abs(fract(scaledUv) - 0.5);
  let dist = length(cellUv);

  var color = gridStyle.gridColor;

  if (grid.grid[index] == 1 && dist <= gridStyle.cellRadius) {
    color = gridStyle.cellColor;
  }

  return color;
}