import { MODULE_ID } from "../modules";
import { Octree } from "three/examples/jsm/math/Octree.js";

const create = ({ config, scene }) => {
  const worldOctree = new Octree();
  return { worldOctree };
};

export const octreeModule = {
  id: MODULE_ID.OCTREE,
  create,
  config: {},
};
