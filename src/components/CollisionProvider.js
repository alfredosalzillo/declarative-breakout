import {
  Component, createContext, useContext, useMemo,
} from '../engine/main';
import { Application } from '../engine/components';

const Context = createContext();

export default Component(({
  children,
}) => {
  const bounds = useContext(Application.Context);
  const value = useMemo(() => {});
  return Context.Provider({
    value,
    children,
  });
});
