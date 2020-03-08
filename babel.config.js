module.exports = api => {
  // https://babeljs.io/docs/en/config-files
  api.cache(false);

  return {
    presets: [
      [
        "@babel/preset-env",
        {
          targets: { "firefox": "45" },
          useBuiltIns: false
        }
      ]
    ],
    plugins: [
      ["@babel/plugin-transform-runtime"]
    ]
  };
};
