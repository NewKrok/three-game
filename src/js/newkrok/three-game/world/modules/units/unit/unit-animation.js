import * as THREE from "three";

export const updateUnitAnimation = ({ delta, unit }) => {
  if (unit.mixer) {
    const currentUnitState = {
      ...unit,
      cache: unit.config.animationConfig.createCache?.(unit) || {},
    };

    const animation = unit.config.animationConfig.rules.find(({ condition }) =>
      condition(currentUnitState)
    );
    setAnimation({ ...animation, unit });
    unit.mixer.update(delta);
  }
};

const setAnimation = ({
  unit,
  animation,
  transitionTime = 0.2,
  loop = true,
}) => {
  if (animation !== unit.activeAnimation) {
    unit.activeAnimation = animation;
    unit.lastAction = unit.activeAction;
    unit.activeAction = unit.animations[animation];
    if (unit.lastAction) unit.lastAction.fadeOut(transitionTime);
    unit.activeAction.reset();
    unit.activeAction.fadeIn(transitionTime);
    if (!loop) {
      unit.activeAction.setLoop(THREE.LoopOnce);
      unit.activeAction.clampWhenFinished = true;
    }
    unit.activeAction.play();
  }
};
