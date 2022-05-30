import * as THREE from "three";

import { Octree } from "three/examples/jsm/math/Octree.js";
import { WorldModuleId } from "@newkrok/three-game/src/js/newkrok/three-game/modules/module-enums.js";
import { getUniqueId } from "@newkrok/three-utils/src/js/newkrok/three-utils/token.js";

const create = ({ config: { gravity = 40, mass = 1 } }) => {
  const worldOctree = new Octree();
  const normalVectorHelper = new THREE.Vector3();
  const velocity1Helper = new THREE.Vector3();
  const velocity2Helper = new THREE.Vector3();
  let spheres = [];

  const createSphere = ({ id, radius, position, mesh, material }) => {
    let sphereMesh = mesh;
    if (!sphereMesh) {
      const sphereGeometry = new THREE.IcosahedronGeometry(radius, 5);
      const sphereMaterial = material ?? new THREE.MeshPhongMaterial();
      sphereMesh = new THREE.Mesh(sphereGeometry, sphereMaterial);
      sphereMesh.castShadow = true;
      sphereMesh.receiveShadow = true;
    }
    sphereMesh.position.copy(position);

    const collisionListeners = [];
    const sphere = {
      id: id ?? getUniqueId(),
      mesh: sphereMesh,
      collider: new THREE.Sphere(
        sphereMesh.position.clone(position),
        radius ?? globalRadius
      ),
      velocity: new THREE.Vector3(),
      collisionListeners,
      isColliding: false,
      on: {
        collision: (callback) => collisionListeners.push(callback),
      },
    };

    spheres.push(sphere);

    return sphere;
  };

  const spheresCollisions = () => {
    for (let i = 0, length = spheres.length; i < length; i++) {
      const sphere1 = spheres[i];

      for (let j = i + 1; j < length; j++) {
        const sphere2 = spheres[j];

        const distance = sphere1.collider.center.distanceToSquared(
          sphere2.collider.center
        );
        const r = sphere1.collider.radius + sphere2.collider.radius;
        const r2 = r * r;

        if (distance < r2) {
          const normal = normalVectorHelper
            .subVectors(sphere1.collider.center, sphere2.collider.center)
            .normalize();
          const v1 = velocity1Helper
            .copy(normal)
            .multiplyScalar(normal.dot(sphere1.velocity));
          const v2 = velocity2Helper
            .copy(normal)
            .multiplyScalar(normal.dot(sphere2.velocity));

          sphere1.velocity.add(v2).sub(v1);
          sphere2.velocity.add(v1).sub(v2);

          const d = (r - Math.sqrt(distance)) / 2;

          sphere1.collider.center.addScaledVector(normal, d);
          sphere2.collider.center.addScaledVector(normal, -d);
        }
      }
    }
  };

  const update = ({ isPaused, delta }) => {
    if (isPaused) return;

    spheres.forEach((sphere) => {
      sphere.collider.center.addScaledVector(sphere.velocity, delta);

      const result = worldOctree.sphereIntersect(sphere.collider);

      if (result) {
        sphere.isColliding = true;
        sphere.velocity.addScaledVector(
          result.normal,
          -result.normal.dot(sphere.velocity) * 1.5
        );
        sphere.collider.center.add(result.normal.multiplyScalar(result.depth));
        sphere.collisionListeners.forEach((callback) => callback(result));
      }
      sphere.velocity.y -= gravity * mass * delta;

      const damping = Math.exp(-1.5 * delta) - 1;
      sphere.velocity.addScaledVector(sphere.velocity, damping);
    });

    spheresCollisions();

    spheres.forEach(({ mesh, collider }) =>
      mesh.position.copy(collider.center)
    );
  };

  const dispose = () => {
    spheres = [];
  };

  return { worldOctree, update, createSphere, dispose };
};

export const octreeModule = {
  id: WorldModuleId.OCTREE,
  create,
  config: {},
};
