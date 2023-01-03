const WaterVertexShader = `
  #include <fog_pars_vertex>

  varying vec2 vUv;
  uniform float time;
  uniform sampler2D noise;

  void main() {
    vUv = uv;

    #include <begin_vertex>
    #include <project_vertex>
    #include <fog_vertex>

    vUv.x += sin(vUv.y * 30.0 + time) / 500.0;
    vUv.y += sin(vUv.x * 30.0 + time) / 500.0;

    vec3 newPosition = position + normal * sin(time) * texture2D(noise, vUv).r * 0.05;
    
    gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
    gl_Position.y += 0.5 * sin(position.x + position.y + time + texture2D(noise, vUv).r);
  }
`;

export default WaterVertexShader;
