import * as THREE from "three";

import { CallLimits } from "@newkrok/three-utils/src/js/newkrok/three-utils/callback-utils.js";
import { Capsule } from "three/examples/jsm/math/capsule.js";
import { Octree } from "three/examples/jsm/math/Octree.js";
import { WorldModuleId } from "@newkrok/three-game/src/js/newkrok/three-game/modules/module-enums.js";
import { getUniqueId } from "@newkrok/three-utils/src/js/newkrok/three-utils/token.js";

const create = ({ config: { gravity = 40 } }) => {
  const worldOctree = new Octree();
  const normalVectorHelper = new THREE.Vector3();
  const velocity1Helper = new THREE.Vector3();
  const velocity2Helper = new THREE.Vector3();
  let spheres = [];
  let capsules = [];

  const createSphere = ({ id, radius, position, mesh, material, mass = 1 }) => {
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
      mass,
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

  const createCapsule = ({
    id,
    radius,
    height,
    position,
    mesh,
    material,
    mass = 1,
  }) => {
    let capsuleMesh = mesh;
    if (!capsuleMesh) {
      const capsuleGeometry = new THREE.CapsuleGeometry(
        radius,
        height - radius * 2,
        5,
        5
      );
      const capsuleMaterial = material ?? new THREE.MeshPhongMaterial();
      capsuleMesh = new THREE.Mesh(capsuleGeometry, capsuleMaterial);
      capsuleMesh.castShadow = true;
      capsuleMesh.receiveShadow = true;
    }
    capsuleMesh.position.copy(position);

    const collisionListeners = [];
    const capsule = {
      id: id ?? getUniqueId(),
      mass,
      mesh: capsuleMesh,
      collider: new Capsule(
        new THREE.Vector3(0, radius, 0),
        new THREE.Vector3(0, height, 0),
        radius
      ),
      radius,
      height,
      velocity: new THREE.Vector3(),
      collisionListeners,
      isColliding: false,
      onGround: false,
      on: {
        collision: (callback) => collisionListeners.push(callback),
      },
    };

    capsules.push(capsule);

    return capsule;
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

  const updateSpheres = (delta) => {
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
      sphere.velocity.y -= gravity * sphere.mass * delta;

      const damping = Math.exp(-1.5 * delta) - 1;
      sphere.velocity.addScaledVector(sphere.velocity, damping);
    });

    spheresCollisions();

    spheres.forEach(({ mesh, collider }) =>
      mesh.position.copy(collider.center)
    );
  };

  const capsuleCollisions = (capsule) => {
    const result = worldOctree.capsuleIntersect(capsule.collider);
    capsule.onGround = false;

    if (result) {
      capsule.isColliding = true;
      capsule.onGround = result.normal.y > 0;
      if (!capsule.onGround) {
        capsule.velocity.addScaledVector(
          result.normal,
          -result.normal.dot(capsule.velocity)
        );
      }

      capsule.collider.translate(result.normal.multiplyScalar(result.depth));
    }
  };

  const updateCapsules = (delta) => {
    capsules.forEach((capsule) => {
      let damping = Math.exp(-8 * delta) - 1;
      if (!capsule.onGround) {
        capsule.velocity.y -= gravity * capsule.mass * delta;
        damping *= 0.1;
      }

      /**
       * Solve total collision in multiple steps to avoid wall collision issues
       */
      const stepCount = 3;
      capsule.velocity.addScaledVector(capsule.velocity.clone(), damping);
      const deltaPosition = capsule.velocity.clone().multiplyScalar(delta);
      const velocityStep = deltaPosition.clone().divideScalar(stepCount);
      for (let i = 0; i < stepCount; i++) {
        capsule.collider.translate(velocityStep);
        capsuleCollisions(capsule);
      }
    });

    capsules.forEach(({ mesh, collider, radius }) => {
      collider.getCenter(mesh.position);
      mesh.position.y -= radius / 2;
    });
  };

  const update = ({ isPaused, delta }) => {
    if (isPaused) return;

    updateSpheres(delta);
    updateCapsules(delta);
  };

  const dispose = () => {
    spheres = [];
  };

  return { worldOctree, update, createSphere, createCapsule, dispose };
};

export const octreeModule = {
  id: WorldModuleId.OCTREE,
  create,
  config: { callLimit: CallLimits.CALL_30_PER_SECONDS, forceCallCount: true },
};
