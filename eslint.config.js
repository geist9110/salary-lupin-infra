import prettier from "eslint-plugin-prettier/recommended";
import tseslint from "typescript-eslint";

export default tseslint.config({
  files: ["**/*.ts"],
  languageOptions: {
    parser: tseslint.parser,
    parserOptions: {
      sourceType: "module",
    },
  },
  plugins: {
    prettier: prettier.plugins.prettier,
  },
  rules: {
    ...prettier.rules,
  },
});
