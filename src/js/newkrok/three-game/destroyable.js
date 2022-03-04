export const createDestroyable = ({ collider, body, destroy }) => {
  const props = {
    life: 10,
  };

  return {
    props,
    collider,
    body,
    damage: (amount) => {
      props.life -= amount;
      if (props.life <= 0) destroy();
    },
  };
};
