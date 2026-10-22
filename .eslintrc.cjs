module.exports = {
  root: true,
  env: { es2022: true, node: true },
  parser: "@typescript-eslint/parser",
  parserOptions: { ecmaVersion: "latest", sourceType: "module" },
  plugins: ["@typescript-eslint"],
  extends: ["eslint:recommended", "plugin:@typescript-eslint/recommended", "prettier"],
  ignorePatterns: ["dist", "build", "node_modules", "*.cjs"],
  overrides: [
    {
      files: ["apps/web/**/*.{ts,tsx}"],
      env: { browser: true },
      extends: [
        "plugin:react/recommended",
        "plugin:react-hooks/recommended",
        "plugin:@typescript-eslint/recommended",
        "prettier",
      ],
      plugins: ["react", "react-hooks"],
      settings: { react: { version: "detect" } },
      rules: {
        "react/react-in-jsx-scope": "off",
      },
    },
  ],
  rules: {
    "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
  },
};
