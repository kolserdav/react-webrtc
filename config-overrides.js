/* eslint-disable no-param-reassign */
/* eslint-disable @typescript-eslint/no-var-requires */
// eslint-disable-next-line import/no-extraneous-dependencies
const webpack = require('webpack');

module.exports = function override(config) {
  const fallback = config.resolve.fallback || {};
  Object.assign(fallback, {
    crypto: require.resolve('crypto-browserify'),
    assert: require.resolve('assert'),
    http: require.resolve('stream-http'),
    https: require.resolve('https-browserify'),
    os: require.resolve('os-browserify'),
    stream: require.resolve('stream-browserify'),
    buffer: require.resolve('buffer'),
    zlib: require.resolve('browserify-zlib'),
    net: require.resolve('net-websocket-polyfill'),
    url: require.resolve('url/'),
    path: false,
    fs: false,
    tls: false,
  });
  config.resolve.fallback = fallback;
  config.plugins = (config.plugins || []).concat([
    new webpack.ProvidePlugin({
      process: 'process/browser',
      Buffer: ['buffer', 'Buffer'],
    }),
    new webpack.NormalModuleReplacementPlugin(/node:/, (resource) => {
      const mod = resource.request.replace(/^node:/, '');
      switch (mod) {
        case 'url':
          resource.request = 'url';
          break;
        default:
          throw new Error(`Not found ${mod}`);
      }
    }),
  ]);
  config.target = 'web';
  return config;
};
