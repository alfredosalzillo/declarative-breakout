import { Component, useCallback } from '../engine/main';
import Counter from './Counter';

export default Component(props => Counter({
  ...props,
  text: useCallback(count => `${count}s`),
}));
