import { Component, useEffect, useState } from '../engine/main';
import { Text } from '../engine/components';

export default Component(({ text, interval = 1000, ...props }) => {
  const [count, setCount] = useState(0);
  useEffect(() => setTimeout(() => setCount(count + 1), interval), [count]);
  return Text({
    ...props,
    text: text(count),
  });
});
