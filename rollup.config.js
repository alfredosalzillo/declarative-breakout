import resolve from 'rollup-plugin-node-resolve';
import babel from 'rollup-plugin-babel';
import commonjs from 'rollup-plugin-commonjs';
import copy from 'rollup-plugin-copy';
import serve from 'rollup-plugin-serve';
import builtins from 'rollup-plugin-node-builtins';
import globals from 'rollup-plugin-node-globals';

const babelConf = {
  exclude: [
    'node_modules/**',
  ],
  presets: [
    [
      '@babel/preset-env',
    ],
  ],
  plugins: [
    ['@babel/plugin-proposal-export-default-from'],
    ['@babel/plugin-proposal-decorators', {
      legacy: true,
    }],
    ['@babel/plugin-proposal-class-properties', { loose: true }],
    ['@babel/plugin-transform-arrow-functions', { spec: true }],
  ],
};

export default {
  input: './src/main.js',
  output: {
    format: 'esm',
    dir: 'dist',
    sourcemap: 'eval',
  },
  plugins: [
    globals(),
    builtins(),
    babel(babelConf),
    resolve({
      module: false,
      preferBuiltins: true,
    }),
    commonjs({
      namedExports: {
        'node_modules/resource-loader/lib/index.js': ['Resource'],
      },
    }),
    copy({
      'src/index.html': 'dist/index.html',
      verbose: true,
    }),
    serve('dist'),
  ],
};
