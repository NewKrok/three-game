import * as THREE from "three";

import { MeshSurfaceSampler } from "three/addons/math/MeshSurfaceSampler.js"
import { ObjectUtils } from "@newkrok/three-utils";
import { WorldModuleId } from "@newkrok/three-game/src/js/newkrok/three-game/modules/module-enums.js";

const defaultFoliageObject = {
    sampler: null,
    count: 100,
    sample: {
      object: null,
      size: 1,
      rotation: { x: 0, y: 0, z: 0 },
    },
    samplerCondition: null,
    randomize: {
      rotation: {
        minX: 0,
        maxX: 0,
        minY: 0,
        maxY: 0,
        minZ: 0,
        maxZ: 0,
      },
      size: {
        min: 1,
        max: 1,
      },
      colorPalette: null
    },
    on: {create:null}
}

const create = () => {
  const position = new THREE.Vector3()
  const normal = new THREE.Vector3()
  const dummy = new THREE.Object3D()
  const _color = new THREE.Color()
    
  let foliages = [];

  const createFoliage = (config) => {
    const {
      sampler,
      sample,
      randomize,
      samplerCondition,
      count = 100,
      on = null
    } = ObjectUtils.patchObject(defaultFoliageObject, config);
    const group = new THREE.Group()
    const meshSurfaceSampler = new MeshSurfaceSampler(sampler).build()

    let samples = []
    if (sample instanceof Array) samples = sample
    else samples.push(sample)
  
    const sampleMeshes = samples.map(
      ({ object, rotation = { x: 0, y: 0, z: 0 }, size = 1 }) => {
        const foliageGeometry = object.geometry.clone()
        const defaultTransform = new THREE.Matrix4()
          .makeRotationFromEuler(
            new THREE.Euler(rotation.x, rotation.y, rotation.z)
          )
          .multiply(new THREE.Matrix4().makeScale(size, size, size))
        foliageGeometry.applyMatrix4(defaultTransform)
  
        const foliageMaterial = object.material.clone()
  
        const sampleMesh = new THREE.InstancedMesh(
          foliageGeometry,
          foliageMaterial,
          count
        )
  
        group.add(sampleMesh)
  
        return sampleMesh
      }
    )
  
    const getRandomizedEulerRotation = () =>
      new THREE.Euler(
        Math.random() * (randomize.rotation.maxX - randomize.rotation.minX) +
          randomize.rotation.minX,
        Math.random() * (randomize.rotation.maxY - randomize.rotation.minY) +
          randomize.rotation.minX,
        Math.random() * (randomize.rotation.maxZ - randomize.rotation.minZ) +
          randomize.rotation.minX
      )
  
    const getRandomizedSize = () =>
      Math.random() * (randomize.size.max - randomize.size.min) +
      randomize.size.min
  
    for (let i = 0; i < count; i++) {
      let samplerCounter = 0
      do {
        meshSurfaceSampler.sample(position, normal)
        samplerCounter++
      } while (
        samplerCounter < 1000 &&
        samplerCondition &&
        !samplerCondition(position)
      )
      normal.add(position)
  
      dummy.position.copy(position)
      dummy.lookAt(normal)
  
      if (randomize?.rotation)
        dummy.setRotationFromEuler(getRandomizedEulerRotation())
  
      if (randomize?.size) {
        const newSize = getRandomizedSize()
        dummy.scale.set(newSize, newSize, newSize)
      }
  
      if (randomize.colorPalette) {
        _color.setHex(
          randomize.colorPalette[
            Math.floor(Math.random() * randomize.colorPalette.length)
          ]
        )
        sampleMeshes.forEach((entry) => entry.setColorAt(i, _color))
      }
  
      dummy.updateMatrix()
  
      sampleMeshes.forEach((entry) => entry.setMatrixAt(i, dummy.matrix))

      on?.create?.(dummy);
    }
    sampleMeshes.forEach((entry) => (entry.instanceMatrix.needsUpdate = true))
  
    foliages.push(group);
    return group;
  }

  const dispose = () => {
    foliages = null
  };

  return { dispose, createFoliage };
};

export const foliageModule = {
  id: WorldModuleId.FOLIAGE,
  create,
  config: {},
};
