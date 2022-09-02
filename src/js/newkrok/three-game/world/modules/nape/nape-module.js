import { CallLimits } from "@newkrok/three-utils/src/js/newkrok/three-utils/callback-utils.js";
import { WorldModuleId } from "@newkrok/three-game/src/js/newkrok/three-game/modules/module-enums.js";
import initNape from "@newkrok/nape-js";

const create = ({ config: { wind, gravity, pixelRatio } }) => {
  if (!window.nape) initNape();

  const space = new nape.space.Space(new nape.geom.Vec2(wind, gravity));
  let interactionFilter;

  const createStaticBodiesFromModel = ({
    model,
    filter = { group: 1, mask: 2 },
  }) => {
    if (!interactionFilter) {
      interactionFilter = new nape.dynamics.InteractionFilter();
      interactionFilter.set_collisionGroup(filter.group);
      interactionFilter.set_collisionMask(filter.mask);
    }

    model.traverse((child) => {
      if (child.isMesh) {
        const width =
          (child.geometry.boundingBox.max.x -
            child.geometry.boundingBox.min.x) *
          pixelRatio *
          child.scale.x;
        const height =
          (child.geometry.boundingBox.max.y -
            child.geometry.boundingBox.min.y) *
          pixelRatio *
          child.scale.y;
        var body = new nape.phys.Body(nape.phys.BodyType.get_STATIC());
        body
          .get_shapes()
          .add(new nape.shape.Polygon(nape.shape.Polygon.box(width, height)));
        body.setShapeMaterials(nape.phys.Material.wood());
        body.setShapeFilters(interactionFilter);
        body.get_position().set_x(child.position.x * pixelRatio);
        body.get_position().set_y(child.position.y * -pixelRatio);
        body.set_rotation(Math.PI * 2 - child.rotation.z);

        body.set_space(space);
      }
    });
  };

  const update = ({ isPaused, delta }) => {
    if (isPaused) return;

    space.step(delta);
  };

  const dispose = () => {
    space.get_bodies().empty();
    space.clear();
  };

  return { space, createStaticBodiesFromModel, update, dispose };
};

export const napeModule = {
  id: WorldModuleId.NAPE,
  create,
  config: {
    wind: 0,
    gravity: 350,
    pixelRatio: 17,
    debug: false,
    callLimit: CallLimits.CALL_60_PER_SECONDS,
    forceCallCount: true,
  },
};
