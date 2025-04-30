import prettier from 'eslint-plugin-prettier/recommended';
import tseslint from 'typescript-eslint';

export default tseslint.config(
    {
      files: ['**/*.ts'],
      languageOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module'
      },
      plugins: {
        prettier: prettier.plugins.prettier
      },
      rules: {
        ...prettier.rules
      }
    }
);