const WaveFragmentShader = `
  #include <common>
  #include <packing>
  #include <fog_pars_fragment>

  varying vec2 vUv;

  uniform sampler2D map;

  void main() {
    vec3 wColor = texture2D(map, vUv * 30.0).rgb;

    gl_FragColor.rgb = wColor;
    gl_FragColor.a = 0.6;

    #include <tonemapping_fragment>
    #include <encodings_fragment>
    #include <fog_fragment>
  }
`;

export default WaveFragmentShader;
