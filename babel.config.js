function config(api) {
  const BABEL_ENV = api.env()

  const presets = [
    '@babel/preset-react',
    [
      '@babel/preset-env',
      {
        modules: BABEL_ENV === 'es' ? false : 'commonjs',
      },
    ],
  ]

  const plugins = [
    '@babel/plugin-transform-runtime',
    '@babel/plugin-proposal-class-properties',
  ]

  return {
    presets,
    plugins,
  }
}

module.exports = config
