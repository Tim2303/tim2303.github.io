// rollup.config.js
import nodeResolve from '@rollup/plugin-node-resolve';
import typescript from '@rollup/plugin-typescript';
import commonjs from '@rollup/plugin-commonjs';
import replace from '@rollup/plugin-replace';

export default {
  input: './main.tsx',
  output: {
    dir: 'output',
    format: 'iife',
    name: 'XXX',
    sourcemap: 'inline'
  },
  plugins: [
    typescript(),
    commonjs(),
    nodeResolve(),
    replace({
      'process.env.NODE_ENV': '"development"'
    })
  ]
};
