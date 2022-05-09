import * as THREE from "three";

import {
  getFBXModel,
  getGLTFModel,
} from "@newkrok/three-utils/src/js/newkrok/three-utils/assets/assets.js";

export const getModel = ({
  gltf = null,
  fbx = null,
  scale = new THREE.Vector3(1, 1, 1),
}) => {
  if (fbx) {
    const fbxModel = getFBXModel(fbx.id);
    fbxModel.scale.copy(scale);

    return fbxModel;
  }
  if (gltf) {
    const gltfModel = getGLTFModel(gltf.id).scene.clone();
    gltfModel.children.forEach((element) => element.scale.copy(scale));

    return gltfModel;
  }
};
