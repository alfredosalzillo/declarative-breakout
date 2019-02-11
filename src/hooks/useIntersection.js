import { useMemo } from '../engine/main';

const boxesIntersect = (box1, box2) => (
  box1.x + box1.width > box2.x
    && box1.x < box2.x + box2.width
    && box1.y + box1.height > box2.y
    && box1.y < box2.y + box2.height
);

export default (box1, ...boxes) => useMemo(() => boxes
  .find(box2 => boxesIntersect(box1, box2)), [
  box1.x,
  box1.y,
  box1.width,
  box1.height,
  ...boxes.map(box2 => [
    box2.x,
    box2.y,
    box2.width,
    box2.height,
  ]).flat(Infinity),
]);
