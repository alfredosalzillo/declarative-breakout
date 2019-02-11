import PIXI from 'pixi.js';
import { Component, createContext, useMemo } from './main';
import { hasEnumerableProperties, identity, isObject } from './utils';

const deepAssign = (target, ...sources) => sources
  .map(Object.entries)
  .flat()
  .reduce((acc, [name, value]) => {
    if (isObject(value) && hasEnumerableProperties(value)) {
      deepAssign(acc[name], value);
    }
    if (acc[name] !== value) {
      Object.assign(acc, {
        [name]: value,
      });
    }
    return acc;
  }, target);

const updateProps = deepAssign;

const updateChildren = (component, children) => {
  if (!children) {
    component.removeChildren();
    return component;
  }
  if (component.children.length > children.length) {
    component.removeChildren(children.length - 1);
  }
  return children
    .filter(identity)
    .flat(Infinity)
    .reduce((target, child, position) => {
      const currentChild = target.children[position];
      if (!currentChild) {
        target.addChild(child);
      }
      if (currentChild !== child) {
        target.removeChild(currentChild);
        target.addChildAt(child, position);
      }
      return target;
    }, component);
};

const ApplicationContext = createContext();
const Application = Component(({
  children,
  ...props
}) => {
  const {
    autoStart,
    width,
    height,
    view,
    transparent,
    autoDensity,
    antialias,
    preserveDrawingBuffer,
    resolution,
    forceCanvas,
    backgroundColor,
    clearBeforeRender,
    forceFXAA,
    powerPreference,
    sharedTicker,
    sharedLoader,
    resizeTo,
  } = props;
  const application = useMemo(() => new PIXI.Application({
    autoStart,
    width,
    height,
    view,
    transparent,
    autoDensity,
    antialias,
    preserveDrawingBuffer,
    resolution,
    forceCanvas,
    backgroundColor,
    clearBeforeRender,
    forceFXAA,
    powerPreference,
    sharedTicker,
    sharedLoader,
    resizeTo,
  }), Object.values(props));
  updateChildren(application.stage, children);
  return ApplicationContext.Provider({
    value: { ...props },
    children: application,
  });
});
Application.Context = ApplicationContext;

export {
  Application,
};
export const Container = Component(({
  children,
  ...props
}) => {
  const component = useMemo(() => new PIXI.Container(), []);
  updateProps(component, props);
  updateChildren(component, children);
  return component;
});

export const Text = Component(({
  text,
  ...props
}) => {
  const component = useMemo(() => new PIXI.Text(text), [text]);
  updateProps(component, props);
  return Container({
    children: [component],
  });
});

export const Sprite = Component(({
  source,
  children,
  ...props
}) => {
  const component = useMemo(() => PIXI.Sprite.from(source), [source]);
  updateProps(component, props);
  updateChildren(component, children);
  return Container({
    children: [component],
  });
});
