import * as THREE from "three";

import { isPointInATriangle, yFromTriangle } from "@newkrok/three-utils/src/js/newkrok/three-utils/geom-utils.js";

import { CallLimits } from "@newkrok/three-utils/src/js/newkrok/three-utils/callback-utils.js";
import { ImprovedNoise } from "three/addons/math/improvednoise.js";
import { WorldModuleId } from "@newkrok/three-game/src/js/newkrok/three-game/modules/module-enums.js";

const create = () => {
  let heightmap, geometry, heightmapConfig, resolutionRatio;
  let objects = [];

  const generate = () => {
    const {width, depth, resolution, elevationRatio} = heightmapConfig;
    resolutionRatio = {width: width / (resolution.width -1), depth: depth / (resolution.depth-1)};

    geometry = new THREE.PlaneGeometry(
      width,
      depth,
      resolution.width - 1,
      resolution.depth - 1,
    );
    
    const vertices = geometry.attributes.position.array;
    for (let i = 0, j = 0, l = vertices.length; i < l; i++, j += 3) {
      vertices[j + 2] = heightmap[i] * elevationRatio;
    }
    geometry.attributes.position.needsUpdate = true;
    geometry.computeVertexNormals();
  }

   const createFromNoise = ({width, depth, resolution, elevationRatio, seed}) => {
    heightmapConfig = {width, depth, resolution, elevationRatio}
     const size = resolution.width * resolution.depth;
    heightmap = new Uint8Array(size);
    const perlin = new ImprovedNoise();
    const z = seed ?? Math.random() * 100;

    let quality = 1;

    for (let j = 0; j < 4; j++) {
      for (let i = 0; i < size; i++) {
        const x = i % resolution.width,
          y = ~~(i / resolution.width);
          heightmap[i] += Math.abs(
          perlin.noise(x / quality, y / quality, z) * quality * 1.75
        );
      }
      quality *= 5;
    } 

    generate();
  }

  const addObject = (object) => objects.push(object);
  const removeObject = (object) => objects = objects.filter(entry => entry != object);

  const roundPosition = ({ x, z }) => ({
    x: Math.floor(x / resolutionRatio.width),
    z: Math.floor(z / resolutionRatio.depth),
  });
  
  const positionToHeightMapIndex = (x, z) => x + z * heightmapConfig.resolution.width;

  const getHeightFromPosition = (position) => {
    const roundedPosition = roundPosition(position);
    const convertedPosition = {x:roundedPosition.x * resolutionRatio.width, z:roundedPosition.z * resolutionRatio.depth};

    const pLT = {
      x: convertedPosition.x,
      z: convertedPosition.z,
      y:
        heightmap[
          positionToHeightMapIndex(roundedPosition.x, roundedPosition.z)
        ] || position.y,
    };
    const pRT = {
      x: convertedPosition.x + resolutionRatio.width,
      z: convertedPosition.z,
      y:
        heightmap[
          positionToHeightMapIndex(roundedPosition.x + 1, roundedPosition.z)
        ] || position.y,
    };
    const pLB = {
      x: convertedPosition.x,
      z: convertedPosition.z + resolutionRatio.depth,
      y:
        heightmap[
          positionToHeightMapIndex(roundedPosition.x, roundedPosition.z + 1)
        ] || position.y,
    };
    const pRB = {
      x: convertedPosition.x + resolutionRatio.width,
      z: convertedPosition.z + resolutionRatio.depth,
      y:
        heightmap[
          positionToHeightMapIndex(
            roundedPosition.x + 1,
            roundedPosition.z + 1
          )
        ] || position.y,
    };

    var triangleCheckA = isPointInATriangle(position, pLT, pRT, pLB);
    var triangleCheckB = isPointInATriangle(position, pRT, pRB, pLB);
    const {elevationRatio} = heightmapConfig;
    if (triangleCheckA) {
      return yFromTriangle(position, pLT, pRT, pLB) * elevationRatio;
    } else if (triangleCheckB) {
      return yFromTriangle(position, pRT, pRB, pLB) * elevationRatio;
    }
    return 0;
  };

  const update = ({ isPaused }) => {
    if (isPaused) return;

    objects.forEach(object => object.position.y = getHeightFromPosition(object.position));
  };

  const dispose = () => {
    objects = null
  };

  return { update, createFromNoise, getGeometry:()=>geometry, addObject, removeObject, getHeightFromPosition, dispose };
};

export const heightmapModule = {
  id: WorldModuleId.HEIGHTMAP,
  create,
  config: { callLimit: CallLimits.NO_LIMIT, forceCallCount: true },
};
