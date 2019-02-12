import { Component, useDeltaOne, useState } from '../engine/main';
import { Text } from '../engine/components';

export default Component(({ text, active = false, ...props }) => {
  const [time, setTime] = useState(0);
  useDeltaOne(delta => active && setTime(old => old + delta / 1000));
  return Text({
    ...props,
    text: text(time),
  });
});
