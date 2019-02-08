import { Application, Text, Container } from './engine/components';
import {
  Component, render, useEffect, useState,
} from './engine/main';

const Counter = Component(({ text }) => {
  const [count, setCount] = useState(0);
  useEffect(() => setTimeout(() => setCount(count + 1), 1000), [count]);
  return Text({
    position: {
      x: 10,
      y: 20,
    },
    text: `${text} (${count})`,
  });
});

render(document.body, Component(() => Application({
  width: 500,
  height: 600,
  backgroundColor: 0x1099bb,
  children: [
    Container({
      width: 300,
      height: 400,
      children: [
        Counter({
          text: 'COUNTER 1',
        }),
        Counter({
          text: 'COUNTER 2',
        }),
      ],
    }),
  ],
})));
