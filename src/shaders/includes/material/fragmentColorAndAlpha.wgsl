var albedoColor = materialUniforms.color.rgb;
var fragmentAlpha = materialUniforms.color.a;

if (hasAlbedoMap) {
  albedoColor = textureSample(albedoTexture, materialSampler, in.uvs.xy * materialUniforms.textureRepeatAlbedo).rgb;
  fragmentAlpha = 1.0;
}

if (hasAlphaMap) {
  fragmentAlpha = textureSample(alphaTexture, materialSampler, in.uvs.xy * materialUniforms.textureRepeatAlpha).r;
}