fn acesToneMap(color: vec3f) -> vec3f {
  let a = 2.51;
  let b = 0.03;
  let c = 2.43;
  let d = 0.59;
  let e = 0.14;
  return clamp((color * (a * color + b)) / (color * (c * color + d) + e), vec3f(0.0), vec3f(1.0));
}

fn linearToSRGB(color: vec3f) -> vec3f {
  let cutoff = color < vec3f(0.0031308);
  let lower = color * vec3f(12.92);
  let higher = vec3f(1.055) * pow(color, vec3f(1.0 / 2.4)) - vec3f(0.055);
  return select(higher, lower, cutoff);
}