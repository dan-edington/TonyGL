@group(0) @binding(0) var<storage, read_write> particlePositions: array<vec3f>;

// Cheap deterministic hash/noise helpers.
fn hash31(p: vec3f) -> f32 {
  let h = dot(p, vec3f(127.1, 311.7, 74.7));
  return fract(sin(h) * 43758.5453123);
}

fn noise3(p: vec3f) -> f32 {
  let i = floor(p);
  let f = fract(p);
  let u = f * f * (3.0 - 2.0 * f);

  let n000 = hash31(i + vec3f(0.0, 0.0, 0.0));
  let n100 = hash31(i + vec3f(1.0, 0.0, 0.0));
  let n010 = hash31(i + vec3f(0.0, 1.0, 0.0));
  let n110 = hash31(i + vec3f(1.0, 1.0, 0.0));
  let n001 = hash31(i + vec3f(0.0, 0.0, 1.0));
  let n101 = hash31(i + vec3f(1.0, 0.0, 1.0));
  let n011 = hash31(i + vec3f(0.0, 1.0, 1.0));
  let n111 = hash31(i + vec3f(1.0, 1.0, 1.0));

  let nx00 = mix(n000, n100, u.x);
  let nx10 = mix(n010, n110, u.x);
  let nx01 = mix(n001, n101, u.x);
  let nx11 = mix(n011, n111, u.x);
  let nxy0 = mix(nx00, nx10, u.y);
  let nxy1 = mix(nx01, nx11, u.y);

  return mix(nxy0, nxy1, u.z);
}

@compute @workgroup_size(64, 1, 1)
fn main(@builtin(global_invocation_id) gid: vec3u) {
  let i = gid.x;
  if (i >= arrayLength(&particlePositions)) {
    return;
  }

  var p = particlePositions[i];

  // Derive a stable anchor from the initial sphere radius so particles orbit around start positions.
  let anchorDir = normalize(select(vec3f(0.0, 1.0, 0.0), p, length(p) > 1e-5));
  let anchor = anchorDir;

  // Pseudo-time from frame index encoded through tiny drift. For now this advances continuously each dispatch.
  let t = f32(i) * 0.013 + noise3(anchor * 3.1) * 10.0;

  let n1 = noise3(p * 1.7 + vec3f(0.11, 0.29, t * 0.015));
  let n2 = noise3(p * 2.3 + vec3f(7.3, 3.1, t * 0.019));
  let n3 = noise3(p * 1.9 + vec3f(2.7, 5.9, t * 0.017));

  // Curl-like offset direction from three correlated noise samples.
  let driftDir = normalize(vec3f(n1 - 0.5, n2 - 0.5, n3 - 0.5));

  // Keep motion subtle and pull back toward the anchor so particles stay near their starting shell.
  let towardAnchor = (anchor - p) * 0.025;
  let drift = driftDir * 0.006;

  p = p + towardAnchor + drift;
  particlePositions[i] = p;
}
