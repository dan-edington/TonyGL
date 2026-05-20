fn calculateBRDF(material: Material, N: vec3f, L: vec3f, V: vec3f) -> vec3f {
  let diffuseColor = material.albedo / PI;

  let H = normalize(L + V);
  let NdotH = max(dot(N, H), 0.0);
  
  let specular = pow(NdotH, material.shininess) * material.specularStrength;
  let specularColor = material.specularColor * specular;

  return diffuseColor + specularColor;
}