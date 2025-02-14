import globals from "globals"

export default [
  {
    languageOptions: {
      ecmaVersion: 2016,
      sourceType: "module",
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    //env: {
    //  amd: true,
    //  webextensions: true,
    //  es6: true,
    //  mocha: true,
    //},
    extends: [
      "eslint:recommended",
      "plugin:@typescript-eslint/eslint-recommended",
      "plugin:@typescript-eslint/recommended",
      "prettier/@typescript-eslint",
      "plugin:prettier/recommended",
    ],
   // FIXME:
    parser: "@typescript-eslint/parser",
    // FIXME:
    plugins: ["@typescript-eslint"],
    globals: {
      expect: true,
      global: true,
    },
    rules: {
      camelcase: [
        "warn",
        {
          allow: [
            "item_id",
            "resolved_title",
            "resolved_url",
            "given_title",
            "given_url",
            "created_at",
            "access_token",
            "consumer_key",
            "last_retrieve",
          ],
        },
      ],
      complexity: ["error", { max: 15 }],
      indent: ["warn", 2, { SwitchCase: 1 }],
      "linebreak-style": ["error", "unix"],
      "max-depth": "error",
      "max-len": ["warn", { code: 120 }],
      "max-lines": ["warn", { max: 200 }],
      "max-lines-per-function": [
        "warn",
        { max: 40, skipBlankLines: true, skipComments: true },
      ],
      "max-params": "warn",
      "no-trailing-spaces": "error",
      "no-prototype-builtins": "off",
      "no-var": "error",
      "prefer-const": "error",
      quotes: ["off", "double"],
    },
    overrides: [
      {
        files: ["*.test.js"],
        rules: {
          "max-lines-per-function": "off",
          "max-lines": "off",
        },
      },
    ],
  },
]
