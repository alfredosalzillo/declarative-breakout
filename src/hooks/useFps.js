import { useDeltaOne, useState } from '../engine/main';

export default () => {
  const [fps, setFps] = useState(0);
  useDeltaOne(delta => setFps(1000 / delta));
  return fps;
};
