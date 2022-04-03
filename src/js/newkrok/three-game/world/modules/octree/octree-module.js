import { Octree } from "three/examples/jsm/math/Octree.js";
import { WorldModuleId } from "@newkrok/three-game/src/js/newkrok/three-game/modules/module-enums.js";

const create = () => {
  const worldOctree = new Octree();
  return { worldOctree };
};

export const octreeModule = {
  id: WorldModuleId.OCTREE,
  create,
  config: {},
};
