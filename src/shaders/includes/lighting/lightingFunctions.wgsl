fn calculateAmbientLight(ambientColor: vec3f, ambientIntensity: f32, albedo: vec3f) -> vec3f {
    return ambientColor * ambientIntensity * albedo;
}

fn calculateDistanceAttenuation(currentAttenuation: f32, distance: f32) -> f32 {
    let distSq = distance * distance;
    return currentAttenuation / max(distSq, 0.01);
}

fn calculateLighting(material: Material, worldPosition: vec3f, N: vec3f, V: vec3f) -> vec3f {
    var result = vec3f(0.0);

    result += calculateAmbientLight(lightUniforms.ambientLightColor.xyz, lightUniforms.ambientLightIntensity, material.albedo);

    for (var i = 0u; i < lightUniforms.count; i = i + 1) {
        // #include "./lightFlags"
        
        if (!isVisibleLight) {
            continue;
        }

        // Light properties
        let lightPos = lightUniforms.positions[i].xyz;
        let lightColor = lightUniforms.colors[i].xyz;
        let lightIntensity = lightUniforms.params[i].x;
        let lightRange = lightUniforms.params[i].y;
        let lightDirection = lightUniforms.directions[i].xyz;
        let spotAngle = lightUniforms.spotlightAngles[i].x;
        let spotPenumbra = lightUniforms.spotlightAngles[i].y;

        // Calculate light direction and distance
        let lightVector = lightPos - worldPosition;
        let distance = length(lightVector);
        
        // Skip this light if beyond range
        if (distance > lightRange) {
            continue;
        }

        var L: vec3f;
        var attenuation: f32 = 1.0;

        if (isDirectionalLight) {
            L = normalize(lightDirection);
        } else if (isSpotLight) {
            L = normalize(lightDirection);
            let D = normalize(lightVector);
            let LdotD = dot(L, D);
            let cosOuter = cos(spotAngle);
            let cosInner = cos(spotAngle * (1.0 - spotPenumbra));
            let cone = clamp((LdotD - cosOuter) / (cosInner - cosOuter), 0, 1);
            attenuation = calculateDistanceAttenuation(cone, distance);
        } else {
            L = normalize(lightVector);
            attenuation = calculateDistanceAttenuation(attenuation, distance);
        }

        let lightRadiance = lightColor * lightIntensity * attenuation;

        let NdotL = max(dot(N, L), 0.0);

        let brdf = calculateBRDF(material, N, L, V);

        result += lightRadiance * brdf * NdotL;
    }

    return result;
}

