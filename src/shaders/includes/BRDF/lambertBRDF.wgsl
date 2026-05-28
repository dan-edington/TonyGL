fn calculateBRDF(material: Material, N: vec3f, L: vec3f, V: vec3f) -> vec3f {
  return material.albedo / PI;
}