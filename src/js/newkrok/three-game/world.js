import * as THREE from "three";

import {
  getGLTFModel,
  getTexture,
  loadAssets,
} from "@newkrok/three-utils/src/js/newkrok/three-utils/assets/assets.js";

import { createCharacter } from "./unit/unit";
import { createParticleSystem } from "@newkrok/three-particles/src/js/effects/three-particles";
import { detect } from "detect-browser";
import { patchObject } from "@newkrok/three-particles/src/js/effects/three-particles/three-particles-utils";
import { updateBullets } from "./bullet-manager";
import { updateCharacterAnimation } from "./unit/unit-animation";

export const getDefaultWorldConfig = () =>
  JSON.parse(JSON.stringify(DEFAULT_WORLD_CONFIG));

const DEFAULT_WORLD_CONFIG = {
  scene: {
    background: 0x000000,
  },
  fog: null,
  skybox: {
    size: 200,
    textures: [],
  },
  renderer: {
    antialias: true,
    pixelRatio: 1,
    clearColor: 0x000000,
    clearColorOpacity: 1,
    outputEncoding: THREE.sRGBEncoding,
    physicallyCorrectLights: false,
    toneMapping: THREE.ACESFilmicToneMapping,
    toneMappingExposure: 1,
    shadowMap: {
      enabled: true,
      type: THREE.VSMShadowMap,
    },
  },
  entities: [],
  modules: [],
  characters: [],
  staticModels: [],
  onLoaded: null,
};

export const createWorld = ({
  target,
  camera,
  assetsConfig,
  worldConfig,
  characterConfig,
  characterTickRoutine,
}) => {
  const normalizedWorldConfig = patchObject(DEFAULT_WORLD_CONFIG, worldConfig);

  let _onUpdate;

  const modules = [];
  const staticModels = [];
  const characters = [];
  const destroyables = [];

  const cycleData = {
    now: 0,
    delta: 0,
    elapsed: 0,
    pauseStartTime: 0,
    totalPauseTime: 0,
  };
  const clock = new THREE.Clock();
  const browserInfo = detect();

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(scene.background);

  normalizedWorldConfig.modules.forEach(({ id, create, config }) => {
    modules.push({ id, ...create({ scene, config }) });
  });

  const renderer = new THREE.WebGLRenderer({
    antialias: normalizedWorldConfig.renderer.antialias,
  });
  renderer.setPixelRatio(normalizedWorldConfig.renderer.pixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(
    normalizedWorldConfig.renderer.clearColor,
    normalizedWorldConfig.renderer.clearColorOpacity
  );
  renderer.outputEncoding = normalizedWorldConfig.renderer.outputEncoding;
  renderer.physicallyCorrectLights =
    normalizedWorldConfig.renderer.physicallyCorrectLights;
  renderer.toneMapping = normalizedWorldConfig.renderer.toneMapping;
  renderer.toneMappingExposure =
    normalizedWorldConfig.renderer.toneMappingExposure;
  renderer.shadowMap.enabled = normalizedWorldConfig.renderer.shadowMap.enabled;
  renderer.shadowMap.type = normalizedWorldConfig.renderer.shadowMap.type;
  target.appendChild(renderer.domElement);

  scene.fog = normalizedWorldConfig.fog;

  const entities =
    typeof normalizedWorldConfig.entities === "function"
      ? normalizedWorldConfig.entities()
      : normalizedWorldConfig.entities;
  entities.forEach((entity) => scene.add(entity));

  const update = () => {
    const rawDelta = clock.getDelta();
    cycleData.now = Date.now() - cycleData.totalPauseTime;
    cycleData.delta = rawDelta > 0.1 ? 0.1 : rawDelta;
    cycleData.elapsed = clock.getElapsedTime();

    modules.forEach((module) => module.onUpdate?.(cycleData));

    characters.forEach((character) => {
      character.update(cycleData);
      updateCharacterAnimation({ ...cycleData, character });
      characterTickRoutine && characterTickRoutine(character);
    });
    //updateBullets({ scene, colliders, destroyables });

    _onUpdate && _onUpdate(cycleData);

    renderer.render(scene, camera);
  };

  const animate = () => {
    update();
    requestAnimationFrame(animate);
  };

  const onWindowResize = () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  };
  window.addEventListener("resize", onWindowResize);

  const onVisibilityChange = () => {
    if (document.hidden) {
      cycleData.pauseStartTime = Date.now();
    } else {
      cycleData.totalPauseTime += Date.now() - cycleData.pauseStartTime;
    }
  };
  document.addEventListener("visibilitychange", onVisibilityChange);

  const promise = new Promise((resolve, reject) => {
    try {
      const normalizedAssetsConfig = Object.keys(assetsConfig).reduce(
        (prev, key) => {
          prev[key] = [
            ...((browserInfo.name === "safari" ||
              browserInfo.os.toLowerCase().includes("ios")) &&
            key === "audio"
              ? assetsConfig[key].map((entry) => ({
                  ...entry,
                  url: entry.url.replace(".ogg", ".aac"),
                }))
              : assetsConfig[key]),
          ];
          return prev;
        },
        {}
      );

      loadAssets(normalizedAssetsConfig).then(() => {
        const world = {
          renderer,
          scene,
          modules,
          dispose: () => {
            window.removeEventListener("resize", onWindowResize);
            window.removeEventListener("visibilitychange", onVisibilityChange);
          },
          onUpdate: (onUpdate) => (_onUpdate = onUpdate),
          getCharacter: (selector) => characters.find(selector),
          getStaticModel: (idOrSelector) =>
            (typeof idOrSelector === "function"
              ? staticModels.find(idOrSelector)
              : staticModels.find((model) => model.id === idOrSelector)
            ).model,
          getModule: (idOrSelector) =>
            typeof idOrSelector === "function"
              ? modules.find(idOrSelector)
              : modules.find((module) => module.id === idOrSelector),
        };

        applyConfigToWorld({
          world,
          staticModels,
          characters,
          /* removeCollider: (collider) => {
            colliders = colliders.filter((entry) => entry !== collider);
          }, */
          destroyables,
          worldConfig,
          characterConfig,
        });

        normalizedWorldConfig.onLoaded && normalizedWorldConfig.onLoaded(world);

        resolve(world);
        animate();
      });
    } catch (e) {
      Error(`Something wrong happened: ${e}`);
    }
  });

  return promise;
};

const applyConfigToWorld = ({
  world,
  staticModels,
  characters,
  worldConfig,
  characterConfig,
}) => {
  const { scene, modules } = world;
  if (worldConfig.skybox.textures.length > 0) {
    const materialArray = worldConfig.skybox.textures.map(
      (textureId) =>
        new THREE.MeshBasicMaterial({
          map: getTexture(textureId),
          side: THREE.BackSide,
        })
    );

    const skyboxGeo = new THREE.BoxGeometry(
      worldConfig.skybox.size,
      worldConfig.skybox.size,
      worldConfig.skybox.size
    );
    const skybox = new THREE.Mesh(skyboxGeo, materialArray);
    scene.add(skybox);
  }

  worldConfig.staticModels.forEach(({ id, modelId, position, rotation }) => {
    const model = getGLTFModel(modelId);
    model.scene.traverse((child) => {
      if (child && child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;

        //modules.forEach((module) => module?.onStaticModelMeshInited(child));

        if (child.name.includes("Invisible")) {
          child.visible = false;
        }

        /*if (child.name.includes("Smoke")) {
          setTimeout(() => {
            const smokeEffect = createParticleSystem(
              effectsConfig[EffectId.SMOKE]
            );
            child.add(smokeEffect);
          }, 100);
        }*/

        /*if (child.name.includes("Crate")) {
          const destroyable = createDestroyable({
            collider,
            body: child,
            destroy: () => {
              const childPosition = child.getWorldPosition(new THREE.Vector3());
              removeCollider(child);
              destroyables = destroyables.filter(
                (entry) => entry.collider !== collider
              );
              physicsWorld.removeBody(collider);
              child.removeFromParent();

              const crateExplosionEffect = createParticleSystem(
                effectsConfig[EffectId.CRATE_EXPLOSION]
              );
              crateExplosionEffect.position.copy(childPosition);
              scene.add(crateExplosionEffect);
              const crateExplosionSmokeEffect = createParticleSystem(
                effectsConfig[EffectId.CRATE_EXPLOSION_SMOKE]
              );
              crateExplosionSmokeEffect.position.copy(childPosition);
              scene.add(crateExplosionSmokeEffect);
              const crateExplosionFireEffect = createParticleSystem(
                effectsConfig[EffectId.CRATE_EXPLOSION_FIRE]
              );
              crateExplosionFireEffect.position.copy(childPosition);
              scene.add(crateExplosionFireEffect);
              setTimeout(() => {
                destroyParticleSystem(crateExplosionEffect);
                destroyParticleSystem(crateExplosionSmokeEffect);
                destroyParticleSystem(crateExplosionFireEffect);
              }, 5000);
            },
          });
          destroyables.push(destroyable);
        }*/
      }
    });
    model.scene.position.copy(position);
    model.scene.rotation.set(rotation.x, rotation.y, rotation.z);
    scene.add(model.scene);
    staticModels.push({ id, model });
  });

  worldConfig.characters.forEach(({ id, characterId, position, rotation }) => {
    createCharacter({
      gravity: worldConfig.gravity,
      id,
      position: typeof position === "function" ? position(world) : position,
      rotation: typeof rotation === "function" ? rotation(world) : rotation,
      config: characterConfig[characterId],
      modules,
      onComplete: (character) => {
        scene.add(character.model);
        characters.push(character);
      },
    });
  });
};
