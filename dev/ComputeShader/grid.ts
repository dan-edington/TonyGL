function createGrid(width: number, height: number, fillWith: number = 0) {
  const size = width * height;
  const gridArray = new Float32Array(size).fill(fillWith);

  function setGridPosition(x: number, y: number, value: number) {
    const index = y * width + x;
    gridArray[index] = value;
    return gridArray;
  }

  return {
    gridArray,
    setGridPosition,
  };
}

export { createGrid };
