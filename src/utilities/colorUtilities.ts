function srgbToLinear(value: number): number {
  return value <= 0.04045 ? value / 12.92 : Math.pow((value + 0.055) / 1.055, 2.4);
}

function colorToLinear(color: ArrayLike<number>): Float32Array {
  if (color.length < 4) {
    return new Float32Array([srgbToLinear(color[0]), srgbToLinear(color[1]), srgbToLinear(color[2])]);
  } else {
    return new Float32Array([srgbToLinear(color[0]), srgbToLinear(color[1]), srgbToLinear(color[2]), color[3]]);
  }
}

export { srgbToLinear, colorToLinear };
