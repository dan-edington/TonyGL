let isVisibleLight = (lightUniforms.lightFlags[i] & (1u << 0u)) != 0u;
let isPointLight = (lightUniforms.lightFlags[i] & (1u << 1u)) != 0u;
let isDirectionalLight = (lightUniforms.lightFlags[i] & (1u << 2u)) != 0u;
let isSpotLight = (lightUniforms.lightFlags[i] & (1u << 3u)) != 0u;