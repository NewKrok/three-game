import * as THREE from "three";

import WaterFragmentShader from "./shaders/water-fragment-shader.glsl";
import WaterVertexShader from "./shaders/water-vertex-shader.glsl";
import { WorldModuleId } from "@newkrok/three-game/src/js/newkrok/three-game/modules/module-enums.js";

const create = () => {
  let waters = [];

  const createWater = ({ texture, geometry, noise }) => {
    const waterUniforms = {
      time: {
        value: 0,
      },
      map: {
        value: texture,
      },
      noise: {
        value: noise,
      },
    };

    const waterMaterial = new THREE.ShaderMaterial({
      uniforms: THREE.UniformsUtils.merge([
        THREE.UniformsLib["fog"],
        waterUniforms,
      ]),
      vertexShader: WaterVertexShader,
      fragmentShader: WaterFragmentShader,
      fog: true,
      transparent: true,
    });

    const water = new THREE.Mesh(geometry, waterMaterial);

    waters.push(water);
    return water;
  };

  const update = ({ elapsed }) => {
    waters.forEach(
      (water) => (water.material.uniforms.time.value = elapsed / 1000)
    );
  };

  const dispose = () => {
    waters = null;
  };

  return { dispose, createWater, update };
};

export const waterModule = {
  id: WorldModuleId.WATER,
  create,
  config: {},
};
