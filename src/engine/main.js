import { arrayEquals, fnOrValue, identity } from './utils';

let performingAction = false;
let delta = 0;
const actions = [];
const rerenders = new Map();
let renderer;
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

const resetEnvironmentIndexes = environment => Object.assign(environment, {
  hookIndex: 0,
  childIndex: 0,
});

const executeInEnvironment = (environment, callback) => {
  resetEnvironmentIndexes(environment);
  const previous = currentEnvironment;
  currentEnvironment = environment;
  const result = callback(environment);
  currentEnvironment = previous;
  return result;
};

const requestRerender = (environment, Component) => {
  const { props } = environment;
  const rerender = () => executeInEnvironment(environment, () => Component(props, environment));
  rerenders.set(environment, rerender);
};

const requestAction = (environment, action) => {
  if (performingAction) return action(delta);
  return actions
    .push([environment, () => executeInEnvironment(environment, () => action(delta))]);
};

const performActions = () => {
  performingAction = true;
  actions
    .splice(0)
    .forEach(([, action]) => action(delta));
  performingAction = false;
};

const removeChildren = (env) => {
  env.children.forEach((child) => {
    rerenders.delete(child);
    removeChildren(child);
  });
};
const performRerenders = () => {
  rerenders.forEach((rerender, env) => {
    removeChildren(env);
  });
  rerenders.forEach((rerender) => {
    rerender();
  });
  rerenders.clear();
};

export const start = (previous = 0) => window
  .requestAnimationFrame((timestamp) => {
    delta = previous && timestamp - previous;
    performActions(delta);
    performRerenders(delta);
    if (renderer) renderer.render();
    start(timestamp);
  });
const disposeHooks = ({
  hooks,
}) => {
  hooks.forEach(hook => typeof hook.dispose === 'function' && hook.dispose());
  Object.assign(hooks, {
    length: 0,
  });
};
const SymbolComponent = Symbol('component');
const executeComponent = (component) => {
  if (component && component[SymbolComponent]) {
    return component();
  }
  return component;
};
export const Component = componentFn => (props = {}, inEnvironment) => {
  const comp = () => {
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
      const component = componentFn({
        ...props,
        children: [props.children].flat()
          .map(executeComponent)
          .filter(identity),
      }, environment.component);
      environment.component = component;
      environment.rendering = false;
      return executeComponent(component);
    });
  };
  comp[SymbolComponent] = true;
  return comp;
};

export const createContext = (defaultValue) => {
  const Context = {
    Provider: Component(({
      value = defaultValue,
      children,
    } = {}) => {
      currentEnvironment.contexts.set(Context, value);
      return children;
    }),
  };
  return Context;
};

const contextOf = (environment, Type) => {
  if (!environment || !environment.contexts) {
    return undefined;
  }
  if (environment.contexts.has(Type)) {
    return environment.contexts.get(Type);
  }
  return contextOf(environment.parent, Type);
};

const use = (hookFn, map = identity) => {
  const {
    rendering,
    hooks = [],
    hookIndex = 0,
  } = currentEnvironment;
  if (!rendering) {
    throw new Error('Cannot use hooks outside a rendering');
  }
  const hook = hookFn(hooks[hookIndex], Object.freeze({
    ...currentEnvironment,
  }));
  hooks[hookIndex] = hook;
  currentEnvironment.hookIndex = hookIndex + 1;
  return map(hook);
};

export const useContext = Type => use((_, environment) => contextOf(environment, Type));

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
  ({ value }) => value,
);

export const useCallback = (callback, store) => useMemo(() => callback, store);

export const useEffect = (effect, store = []) => use(
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

export const useState = (init, store = []) => {
  const [getValue, setValue] = useMemo(() => {
    const environment = currentEnvironment;
    let value = init;
    const get = () => value;
    const set = (update) => {
      requestAction(environment, () => {
        value = fnOrValue(update, value);
        requestRerender(environment, (...args) => executeComponent(
          Component(environment.componentType)(...args),
        ));
      });
    };
    return [get, set];
  }, store);
  return [getValue(), setValue];
};

export const useDelta = (fn, store) => {
  const environment = currentEnvironment;
  useMemo(() => {
    const action = () => {
      fn(delta);
      requestAction(environment, action);
    };
    requestAction(environment, action);
  }, store);
};

export const useDeltaOne = (fn) => {
  requestAction(currentEnvironment, fn);
};

export const render = (target, Root) => {
  requestAction(createEnvironment(), () => {
    const [root] = executeComponent(Root());
    if (!root.view) {
      throw new Error('Root component should return an Application.');
    }
    target.appendChild(root.view);
    renderer = root;
    // root.start();
    // root.ticker.stop();
  });
  start();
};
