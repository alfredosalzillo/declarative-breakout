import { arrayEquals, identity } from './utils';

let actions = [];
let rerenders = new Map();
let currentEnvironment = null;

const createEnvironment = (componentType, parent) => ({
  hookIndex: 0,
  hooks: [],
  children: [],
  childIndex: 0,
  rendering: false,
  props: null,
  component: null,
  contexts: new Map(),
  componentType,
  parent,
});

const derivedChildEnvironment = (componentType) => {
  const environment = currentEnvironment;
  if (!environment) {
    return createEnvironment(componentType);
  }
  const { childIndex } = environment;
  const child = environment.children[childIndex] || createEnvironment(componentType, environment);
  environment.children[childIndex] = child;
  environment.childIndex = childIndex + 1;
  return child;
};

const resetEnviromentIndexes = context => Object.assign(context, {
  hookIndex: 0,
  childIndex: 0,
});

const executeInEnvironment = (context, callback) => {
  resetEnviromentIndexes(context);
  const current = currentEnvironment;
  currentEnvironment = context;
  const result = callback(context);
  currentEnvironment = current;
  return result;
};

const requestRerender = (environment, Component) => {
  const { props } = environment;
  const rerender = () => executeInEnvironment(environment, () => Component(props, environment));
  rerenders.set(environment, rerender);
};

const requestAction = (environment, action, Component = () => null) => {
  actions.push([environment, () => executeInEnvironment(environment, action)]);
  requestRerender(environment, Component);
};

const performActions = () => {
  actions.forEach(([, updateState]) => updateState());
  actions = [];
};

const performRerenders = () => {
  rerenders.forEach(rerender => rerender());
  rerenders = [];
};

export const start = () => window
  .requestAnimationFrame(() => {
    performActions();
    performRerenders();
    start();
  });
const disposeHooks = ({
  hooks,
}) => {
  hooks.forEach(hook => typeof hook.dispose === 'function' && hook.dispose());
  Object.assign(hooks, {
    length: 0,
  });
};
export const Component = componentFn => (props, inEnvironment) => {
  const environment = inEnvironment
    ? currentEnvironment
    : derivedChildEnvironment(componentFn);
  return executeInEnvironment(environment, () => {
    const {
      componentType,
      rendering,
    } = environment;
    if (rendering) {
      throw new Error('Cannot rerender during a render');
    }
    if (componentFn !== componentType) {
      disposeHooks(environment);
    }
    environment.rendering = true;
    environment.props = props;
    environment.componentType = componentFn;
    const component = componentFn(props, environment.component);
    environment.component = component;
    environment.rendering = false;
    return component;
  });
};

const use = (hookFn, map) => {
  const {
    rendering,
    hooks = [],
    hookIndex = 0,
  } = currentEnvironment;
  if (!rendering) {
    throw new Error('Cannot use hooks outside a rendering');
  }
  const hook = hookFn(hooks[hookIndex]);
  hooks[hookIndex] = hook;
  currentEnvironment.hookIndex = hookIndex + 1;
  return map(hook);
};

export const useMemo = (fn, store = []) => use(
  (hook = {}) => {
    if (arrayEquals(store, hook.store)) {
      return hook;
    }
    return {
      value: fn(),
      store,
    };
  },
  identity,
);

export const useCallback = (callback, store) => useMemo(() => callback, store);

export const useEffect = (effect, store) => use(
  (hook = {}) => {
    if (arrayEquals(store, hook.store)) {
      return hook;
    }
    if (typeof hook.dispose === 'function') {
      hook.dispose();
    }
    return {
      dispose: effect(),
      store,
    };
  },
  () => undefined,
);

export const useState = (init) => {
  const [getValue, setValue] = useMemo(() => {
    const environment = currentEnvironment;
    let value = init;
    const get = () => value;
    const set = newValue => requestAction(environment, () => {
      value = newValue;
    }, Component(environment.componentType));
    return [get, set];
  }, [init]);
  return [getValue(), setValue];
};

export const render = (target, Root) => {
  requestAction(createEnvironment(), () => {
    const root = Root();
    if (!root.view) {
      throw new Error('Root component should return an Application.');
    }
    target.appendChild(root.view);
    root.start();
  });
  start();
};
