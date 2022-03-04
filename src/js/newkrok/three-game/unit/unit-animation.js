import * as THREE from "three";

export const updateCharacterAnimation = ({ delta, character }) => {
  if (character.mixer) {
    const flatVelocity = character.velocity.clone();
    flatVelocity.y = 0;
    const currentUnitState = {
      ...character,
      horizontalVelocity: flatVelocity.length(),
    };
    const animation = character.config.animationConfig.find(({ condition }) =>
      condition(currentUnitState)
    );
    setAnimationAction({ ...animation, character });
    character.mixer.update(delta);
  }
};

const setAnimationAction = ({
  character,
  animation,
  transitionTime = 0.2,
  loop = true,
}) => {
  if (animation !== character.activeAnimation) {
    character.activeAnimation = animation;
    character.lastAction = character.activeAction;
    character.activeAction = character.animations[animation];
    if (character.lastAction) character.lastAction.fadeOut(transitionTime);
    character.activeAction.reset();
    character.activeAction.fadeIn(transitionTime);
    if (!loop) {
      character.activeAction.setLoop(THREE.LoopOnce);
      character.activeAction.clampWhenFinished = true;
    }
    character.activeAction.play();
  }
};
