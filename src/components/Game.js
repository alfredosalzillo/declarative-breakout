import { Component, createContext } from '../engine/main';

export const Context = createContext();

export default Component(({
  status,
  children,
}) => Context.Provider({
  value: {
    status,
  },
  children,
}));
