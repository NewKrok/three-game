export type AssetConfig = {
  id: string;
  url: string;
};

export type MaterialConfig = {
  materialType: THREE.Material;
  texture: {id: string};
};

export type CycleData = {
  isPaused: boolean,
  now: number,
  delta: number,
  elapsed:  number,
  startTime: number,
};

export type ModelConfig = AssetConfig & {material?:MaterialConfig};

export type AssetsConfig = {
  textures: Array<AssetConfig>;
  fbxModels: Array<ModelConfig>;
  gltfModels: Array<ModelConfig>;
  fbxSkeletonAnimations: Array<AssetConfig>;
  audio: Array<AssetConfig>;
};

export type SceneConfig = {
  background: number;
};

export type SkyboxConfig = {
  size?: number;
  textures: Array<string>;
  fog?: boolean;
};

export type WorldConfig = {
  assetsConfig?: AssetsConfig;
  scene?: SceneConfig;
  fog?: any;
  skybox?: SkyboxConfig;
  onLoaded?: (world: World) => void;
};

export type World = {
  scene: THREE.Scene;
  renderer: THREE.WebGLRenderer;
  effectComposer?: {
    passes: Array<({scene:THREE.Scene, camera: THREE.PerspectiveCamera }) => any> | Array<any>,
  }
  camera: THREE.PerspectiveCamera;
  setCamera: (camera: THREE.PerspectiveCamera) => void;
  skybox?: THREE.Mesh;
  resume: () => void;
  pause: () => void;
};

export const createWorld: ({
  target,
  worldConfig,
  verbose = false,
}: {
  target: string;
  worldConfig: WorldConfig;
  verbose: boolean;
}) => Promise<World>;

export const getDefaultWorldConfig: () => WorldConfig;
