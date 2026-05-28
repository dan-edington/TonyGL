var N = normalize(in.normal);

if (hasNormalMap) {
  let T = normalize(in.tangent);
  let B = normalize(in.bitangent);
  let TBN = mat3x3f(T, B, N);
  let normalMapSample = textureSample(normalTexture, materialSampler, in.uvs * materialUniforms.textureRepeatNormal).rgb;
  let normalMapNormal = normalMapSample * 2.0 - 1.0;
  N = normalize(TBN * normalMapNormal);
}