var out: VertexOutput;

let modelMatrix = entityUniforms.modelMatrix;

let t = normalize((modelMatrix * vec4f(tangent.xyz, 0.0)).xyz);
let n = normalize((modelMatrix * vec4f(normal, 0.0)).xyz);
let b = normalize(cross(n, t) * tangent.w);

out.position = cameraUniforms.viewProjectionMatrix * modelMatrix * vec4f(pos, 1.0);
out.worldPosition = (modelMatrix * vec4f(pos, 1.0)).xyz;
out.normal = n;
out.tangent = t;
out.bitangent = b;
out.uvs = uvs;