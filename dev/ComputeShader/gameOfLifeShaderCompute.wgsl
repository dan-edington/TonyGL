struct Grid {
  gridSize: u32,
  grid: array<u32>,
}

@group(0) @binding(0) var<storage, read> currentGrid: Grid;
@group(0) @binding(1) var<storage, read_write> nextGrid: Grid;

fn getCell(x: i32, y: i32) -> u32 {
  let size = i32(currentGrid.gridSize);

  if (x < 0 || y < 0 || x >= size || y >= size) {
    return 0u;
  }

  let index = u32(y) * currentGrid.gridSize + u32(x);
  return currentGrid.grid[index];
}

@compute @workgroup_size(8, 8, 1)
fn main(@builtin(global_invocation_id) gid: vec3u) {

  let size = currentGrid.gridSize;

  if (gid.x >= size || gid.y >= size) {
    return;
  }

  let x = i32(gid.x);
  let y = i32(gid.y);

  let cellIndex = gid.y * size + gid.x;
  let cell = currentGrid.grid[cellIndex];

  let neighbourCount =
    getCell(x - 1, y - 1) +
    getCell(x, y - 1) +
    getCell(x + 1, y - 1) +
    getCell(x - 1, y) +
    getCell(x + 1, y) +
    getCell(x - 1, y + 1) +
    getCell(x, y + 1) +
    getCell(x + 1, y + 1);

  var nextCell = 0u;

  if (cell == 1u && (neighbourCount == 2u || neighbourCount == 3u)) {
    nextCell = 1u;
  }

  if (cell == 0u && neighbourCount == 3u) {
    nextCell = 1u;
  }

  nextGrid.grid[cellIndex] = nextCell;
}
