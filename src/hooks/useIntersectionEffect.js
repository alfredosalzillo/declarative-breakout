import useIntersection from './useIntersection';
import { useEffect } from '../engine/main';

export default (callback, box1, ...boxes) => {
  const intersection = useIntersection(box1, ...boxes);
  useEffect(() => {
    if (intersection) {
      callback(intersection);
    }
  }, [intersection]);
};
