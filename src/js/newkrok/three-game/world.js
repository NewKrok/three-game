import * as THREE from "three";

import { AssetsUtils } from "@newkrok/three-utils/assets";
import { DisposeUtils } from "@newkrok/three-utils";
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { ObjectUtils } from "@newkrok/three-utils";
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { createModuleHandler } from "./modules/module-handler.js";
import { detect } from "detect-browser";

export const getDefaultWorldConfig = () =>
  JSON.parse(JSON.stringify(DEFAULT_WORLD_CONFIG));

const DEFAULT_WORLD_CONFIG = {
  assetsConfig: {
    textures: [],
    fbxModels: [],
    fbxSkeletonAnimations: [],
    gltfModels: [],
    audio: [],
  },
  scene: {
    background: 0x000000,
  },
  fog: null,
  skybox: {
    size: 200,
    textures: [],
    fog: false,
  },
  renderer: {
    antialias: true,
    pixelRatio: 1,
    clearColor: 0x000000,
    clearColorOpacity: 1,
    outputColorSpace: THREE.SRGBColorSpace,
    toneMapping: THREE.ACESFilmicToneMapping,
    toneMappingExposure: 1,
    shadowMap: {
      enabled: true,
      type: THREE.VSMShadowMap,
    },
  },
  effectComposer: {
    passes: [],
  },
  entities: [],
  modules: [],
  staticModels: [],
  onProgress: null,
  onLoaded: null,
};

export const createWorld = ({ target, worldConfig, verbose = false }) => {
  const normalizedWorldConfig = ObjectUtils.patchObject(
    DEFAULT_WORLD_CONFIG,
    worldConfig
  );

  const clock = new THREE.Clock();

  let onUpdateCallbacks = [];

  const staticModels = [];
  const destroyables = [];
  let pauseCallbacks = [];
  let resumeCallbacks = [];
  let disposeCallbacks = [];

  let requestAnimationFrameId;
  let _camera = new THREE.PerspectiveCamera();

  const cycleData = {
    isPaused: false,
    now: Date.now(),
    delta: 0,
    elapsed: 0,
    startTime: 0,
  };
  const browserInfo = detect();

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(scene.background);

  const moduleHandler = createModuleHandler(normalizedWorldConfig.modules);

  const renderer = new THREE.WebGLRenderer({
    antialias: normalizedWorldConfig.renderer.antialias,
  });
  renderer.setPixelRatio(normalizedWorldConfig.renderer.pixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(
    normalizedWorldConfig.renderer.clearColor,
    normalizedWorldConfig.renderer.clearColorOpacity
  );
  renderer.outputColorSpace = normalizedWorldConfig.renderer.outputColorSpace;
  renderer.toneMapping = normalizedWorldConfig.renderer.toneMapping;
  renderer.toneMappingExposure =
    normalizedWorldConfig.renderer.toneMappingExposure;
  renderer.shadowMap.enabled = normalizedWorldConfig.renderer.shadowMap.enabled;
  renderer.shadowMap.type = normalizedWorldConfig.renderer.shadowMap.type;
  target.appendChild(renderer.domElement);

  let effectComposer;
  if (normalizedWorldConfig.effectComposer?.passes.length) {
    effectComposer = new EffectComposer(renderer);
    const renderScene = new RenderPass( scene, _camera );
    effectComposer.addPass( renderScene );

    normalizedWorldConfig.effectComposer.passes.forEach((pass) => {
      effectComposer.addPass(typeof pass === "function" ? pass({scene, camera: _camera}) : pass);
    });
  }

  scene.fog = normalizedWorldConfig.fog;

  const entities =
    typeof normalizedWorldConfig.entities === "function"
      ? normalizedWorldConfig.entities()
      : normalizedWorldConfig.entities;
  entities.forEach((entity) => scene.add(entity));

  const update = () => {
    if (!cycleData.isPaused) {
      if (!cycleData.startTime)
        cycleData.now = cycleData.startTime = Date.now();
      cycleData.delta = Math.min(0.05, clock.getDelta());
      cycleData.elapsed += cycleData.delta * 1000;
      cycleData.now = cycleData.startTime + cycleData.elapsed;
      moduleHandler.update(cycleData);
    }

    onUpdateCallbacks.forEach((callback) => callback(cycleData));
    
    if (effectComposer)
      effectComposer.render();
    else
      renderer.render(scene, _camera);
  };

  const animate = () => {
    update();
    requestAnimationFrameId = requestAnimationFrame(animate);
  };

  const onWindowResize = () => {
    _camera.aspect = window.innerWidth / window.innerHeight;
    _camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    if (effectComposer) effectComposer.setSize( window.innerWidth, window.innerHeight );
  };
  window.addEventListener("resize", onWindowResize);

  const pause = () => {
    if (cycleData.isPaused) return;
    cycleData.isPaused = true;
    cycleData.pauseStartTime = Date.now();
    pauseCallbacks.forEach((callback) => callback());
  };

  const resume = () => {
    if (!cycleData.isPaused) return;
    cycleData.isPaused = false;
    resumeCallbacks.forEach((callback) => callback());
  };

  const onVisibilityChange = () => {
    if (document.hidden) pause();
  };
  document.addEventListener("visibilitychange", onVisibilityChange);

  const promise = new Promise((resolve, reject) => {
    try {
      const { assetsConfig } = normalizedWorldConfig;
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

      AssetsUtils.loadAssets({
        ...normalizedAssetsConfig,
        onProgress: normalizedWorldConfig.onProgress,
        verbose,
      }).then(() => {
        const world = {
          skybox: null,
          renderer,
          camera: _camera,
          scene,
          cycleData,
          pause,
          resume,
          setCamera: (camera) => {
            _camera = camera
            if (effectComposer) effectComposer.passes.forEach(pass => pass.camera = _camera)
          },
          getModule: moduleHandler.getModule,
          addModule: moduleHandler.addModule,
          dispose: () => {
            cancelAnimationFrame(requestAnimationFrameId);
            window.removeEventListener("resize", onWindowResize);
            window.removeEventListener("visibilitychange", onVisibilityChange);
            AssetsUtils.disposeAssets();
            DisposeUtils.deepDispose(scene);
            moduleHandler.dispose();
            if (
              renderer.info.memory.geometries ||
              renderer.info.memory.textures
            ) {
              console.warn(
                `There is a memory leak in the app! Details: ${JSON.stringify(
                  renderer.info
                )}`
              );
            }
            renderer.dispose();
            disposeCallbacks.forEach((callback) => callback());
          },
          getStaticModel: (idOrSelector) =>
            (typeof idOrSelector === "function"
              ? staticModels.find(idOrSelector)
              : staticModels.find((model) => model.id === idOrSelector)
            ).model,
          on: {
            update: (callback) => onUpdateCallbacks.push(callback),
            pause: (callback) => pauseCallbacks.push(callback),
            resume: (callback) => resumeCallbacks.push(callback),
            dispose: (callback) => disposeCallbacks.push(callback),
          },
          off: {
            update: (callback) =>
              onUpdateCallbacks.filter(
                (onUpdateCallbacks) => onUpdateCallbacks !== callback
              ),
            pause: (callback) =>
              (pauseCallbacks = pauseCallbacks.filter(
                (pauseCallback) => pauseCallback !== callback
              )),
            resume: (callback) =>
              (resumeCallbacks = resumeCallbacks.filter(
                (resumeCallback) => resumeCallback !== callback
              )),
            dispose: (callback) =>
              (disposeCallbacks = disposeCallbacks.filter(
                (disposeCallback) => disposeCallback !== callback
              )),
          },
          userData: {},
        };

        moduleHandler.init({ world });

        applyConfigToWorld({
          world,
          staticModels,
          destroyables,
          worldConfig,
        });

        normalizedWorldConfig.onLoaded && normalizedWorldConfig.onLoaded(world);

        resolve(world);
        setTimeout(animate, 1);
      });
    } catch (e) {
      Error(`Something wrong happened: ${e}`);
    }
  });

  return promise;
};

const applyConfigToWorld = ({ world, staticModels, worldConfig }) => {
  const { scene } = world;
  if (worldConfig.skybox.textures.length > 0) {
    const materialArray = worldConfig.skybox.textures.map(
      (textureId) =>
        new THREE.MeshBasicMaterial({
          map: AssetsUtils.getTexture(textureId),
          side: THREE.BackSide,
          fog: worldConfig.skybox.fog,
        })
    );

    const skyboxGeo = new THREE.BoxGeometry(
      worldConfig.skybox.size,
      worldConfig.skybox.size,
      worldConfig.skybox.size
    );
    const skybox = new THREE.Mesh(skyboxGeo, materialArray);
    scene.add(skybox);
    world.skybox = skybox;
  }

  worldConfig.staticModels.forEach(({ id, modelId, position, rotation }) => {
    const model = AssetsUtils.getGLTFModel(modelId);
    if (position) model.scene.position.copy(position);
    if (rotation) model.scene.rotation.set(rotation.x, rotation.y, rotation.z);
    scene.add(model.scene);
    staticModels.push({ id, model });
  });
};
