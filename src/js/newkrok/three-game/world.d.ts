export type AssetConfig = {
  id: string;
  url: string;
};

export type ModelConfig = AssetConfig & {};

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
  size: number;
  textures: Array<string>;
  fog: boolean;
};

export type WorldConfig = {
  assetsConfig: AssetConfig;
  scene: SceneConfig;
  fog: any;
  skybox: SkyboxConfig;
  onLoaded: (world: World) => void;
};

export type World = {
  scene: THREE.Scene;
  renderer: THREE.WebGLRenderer;
  camera: THREE.PerspectiveCamera;
  skybox?: THREE.Mesh;
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
