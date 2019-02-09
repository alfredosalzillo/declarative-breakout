import PIXI from 'pixi.js';
import { Component } from './main';
import { hasEnumerableProperties, isObject } from './utils';

export const Application = Component(({
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
  children,
}, currApplication) => {
  const application = currApplication || new PIXI.Application({
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
  });
  application.stage.removeChildren();
  if (children) {
    application.stage.addChild(...children);
  }
  return application;
});

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

const updateChildren = (component, children) => children
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

export const PIXIComponent = (PIXIType, update) => Component((props, current) => {
  const component = current || new PIXIType();
  return update(component, props);
});

export const Text = PIXIComponent(PIXI.Text, (component, props) => {
  updateProps(component, props);
  return component;
});

export const Container = PIXIComponent(PIXI.Container, (component, {
  children,
  ...props
}) => {
  updateProps(component, props);
  updateChildren(component, children);
  return component;
});
