let stack = [];
let currentEnvironment = null;

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

const setState = (environment, callback, Component = () => null) => {
  const { props } = environment;
  const updateState = () => executeInEnvironment(environment, callback);
  const rerender = () => executeInEnvironment(environment, () => Component(props, environment));
  stack.push([environment, updateState, rerender]);
};

const distinctRerenderByEnviroment = (acc = [], [currEnvironment,, rerender]) => [...acc
  .filter(([environment]) => environment !== currEnvironment), [currEnvironment, rerender]];

export const start = () => window.requestAnimationFrame((time) => {
  stack.forEach(([, updateState]) => updateState());
  stack.reduce(distinctRerenderByEnviroment, [])
    .map(([, rerender]) => rerender)
    .forEach(rerender => rerender(time));
  stack = [];
  start();
});

const propsEquals = (props1, props2) => {
  if (props1 === props2) {
    return true;
  }
  if (!props1 || !props2) {
    return false;
  }
  return Object.entries(props1)
    .every(([name, value]) => value === props2[name]);
};

const createEnvironment = componentType => ({
  hookIndex: 0,
  hooks: [],
  children: [],
  childIndex: 0,
  rendering: false,
  props: null,
  component: null,
  componentType,
});
const derivedChildEnvironment = (componentType) => {
  const environment = currentEnvironment;
  if (!environment) {
    return createEnvironment(componentType);
  }
  const { childIndex } = environment;
  const child = environment.children[childIndex] || createEnvironment(componentType);
  environment.children[childIndex] = child;
  environment.childIndex = childIndex + 1;
  return child;
};
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

const storeEquals = (store1, store2) => {
  if (store1 === store2) {
    return true;
  }
  if (!store1 || !store2) {
    return false;
  }
  return store1.every((value, i) => value === store2[i]);
};

export const useMemo = (fn, store = []) => use(
  (hook = {}) => {
    if (storeEquals(store, hook.store)) {
      return hook;
    }
    return {
      value: fn(),
      store,
    };
  },
  ({ value }) => value,
);

export const useCallback = (callback, store) => useMemo(() => callback, store);

export const useEffect = (effect, store) => use(
  (hook = {}) => {
    if (storeEquals(store, hook.store)) {
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
    const set = newValue => setState(environment, () => {
      value = newValue;
    }, Component(environment.componentType));
    return [get, set];
  }, [init]);
  return [getValue(), setValue];
};

export const render = (target, Root) => {
  setState(createEnvironment(), () => {
    const root = Root();
    if (!root.view) {
      throw new Error('Root component should return an Application.');
    }
    target.appendChild(root.view);
    root.start();
  });
  start();
};
