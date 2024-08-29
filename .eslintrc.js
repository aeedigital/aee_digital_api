module.exports = {
  // Outras configurações...
  rules: {
    'prettier/prettier': [
      'error',
      {
        endOfLine: 'lf',
        trailingComma: 'all',
        singleQuote: true,
        printWidth: 120,
        bracketSpacing: true,
        tabWidth: 2,
        semi: true,
        arrowParens: 'always',
      },
    ],
    'array-element-newline': ['error', 'consistent'],
    'array-bracket-newline': ['error', 'consistent'],
  },
};
