module.exports = {
  sourceMaps: true,
  retainLines: true,
  highlightCode: true,
  presets: [
    [
      '@babel/preset-env',
      {
        targets: {
          node: 6
        },
        useBuiltIns: 'usage', // or "entry"
        corejs: 3
      }
    ]
  ],
  plugins: [
    ['@babel/plugin-proposal-decorators', { legacy: true }],
    ['@babel/plugin-proposal-class-properties', { loose: true }]
  ]
};
