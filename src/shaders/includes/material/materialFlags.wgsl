let hasAlphaMap = (materialUniforms.materialFlag & (1u << 0u)) != 0u;
let hasNormalMap = (materialUniforms.materialFlag & (1u << 1u)) != 0u;
let hasAlbedoMap = (materialUniforms.materialFlag & (1u << 2u)) != 0u;