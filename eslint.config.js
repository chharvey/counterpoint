import eslint from '@eslint/js';
import stylistic from '@stylistic/eslint-plugin';
import globals from 'globals';
import tseslint from 'typescript-eslint';



export default [
	{
		ignores: [
			'**/build/',
			'tree-sitter-counterpoint/bindings/node/index.js',
			'tree-sitter-counterpoint/bindings/node/index.d.ts',
			'tree-sitter-counterpoint/grammar.js',
		],
	},

	eslint.configs.recommended,      // https://github.com/eslint/eslint/blob/v9.16.0/packages/js/src/configs/eslint-recommended.js
	...tseslint.configs.recommended, // https://github.com/typescript-eslint/typescript-eslint/blob/v8.18.0/packages/eslint-plugin/src/configs/recommended.ts
	...tseslint.configs.strict,      // https://github.com/typescript-eslint/typescript-eslint/blob/v8.18.0/packages/eslint-plugin/src/configs/strict.ts
	...tseslint.configs.stylistic,   // https://github.com/typescript-eslint/typescript-eslint/blob/v8.18.0/packages/eslint-plugin/src/configs/stylistic.ts
	{
		name:            'all',
		files:           ['**/*.{cjs,cts,js,mjs,mts,ts}'],
		languageOptions: {
			globals: {...globals.node},
			parser:  tseslint.parser,
		},
		linterOptions: {reportUnusedDisableDirectives: 'error'},
		plugins:       {
			'@stylistic':         stylistic,
			'@typescript-eslint': tseslint.plugin,
		},

		rules: {
			/* # Overrides */
			// Override any rules from imported configs here, organizing them by the config they were imported from.
			// Comment why the override is needed.

			/* ## Overrides of `eslint.configs.recommended` */
			'no-irregular-whitespace': ['error', {
				skipStrings:  false, // disallow in strings
				skipComments: true,  // allow in comments
			}],

			/* ## Overrides of `tseslint.configs.recommended` */
			'@typescript-eslint/no-explicit-any':       ['error', {fixToUnknown: true}], // quickfix `any` to `unknown`
			'@typescript-eslint/no-unused-expressions': 'off', // getter access and logical operations may have side-effects
			'@typescript-eslint/no-unused-vars':        ['error', { // override default opts
				argsIgnorePattern:              '^_',
				caughtErrors:                   'all',
				destructuredArrayIgnorePattern: '^_',
				ignoreRestSiblings:             true,
				reportUsedIgnorePattern:        true,
			}],

			/* ## Overrides of `tseslint.configs.strict` */
			'@typescript-eslint/no-non-null-assertion': 'off', // non-null assertions can be useful

			/* ## Overrides of `tseslint.configs.stylistic` */
			'@typescript-eslint/array-type': ['error', { // override default opts
				default:  'array-simple',
				readonly: 'array',
			}],
			'@typescript-eslint/consistent-type-definitions': 'off', // both object types and interfaces can be useful
			'@typescript-eslint/no-inferrable-types':         'off', // don’t rely on TypeScript inference

			/* # File Conventions (should be consistent with `/.editorconfig` file) */
			'@stylistic/eol-last':           'error',
			'@stylistic/linebreak-style':    'error',
			'@stylistic/no-trailing-spaces': 'error',

			/* # Layout & Formatting */
			/* ## Indentation, Spacing, and Alignment */
			'@stylistic/arrow-spacing':          'error',
			'@stylistic/comma-spacing':          'error',
			'@stylistic/dot-location':           ['error', 'property'],
			'@stylistic/func-call-spacing':      'warn',
			'@stylistic/generator-star-spacing': ['error', 'both'],
			'@stylistic/indent':                 ['error', 'tab', {
				SwitchCase:             1,
				flatTernaryExpressions: true,
			}],
			'@stylistic/key-spacing': ['error', {
				align:      {on:   'value'},
				singleLine: {mode: 'minimum'},
			}],
			'@stylistic/keyword-spacing':             'error',
			'@stylistic/no-mixed-spaces-and-tabs':    ['error', 'smart-tabs'],
			'@stylistic/rest-spread-spacing':         'error',
			'@stylistic/semi-spacing':                'error',
			'@stylistic/space-before-blocks':         'error',
			'@stylistic/space-before-function-paren': ['warn', {
				anonymous:  'always',
				asyncArrow: 'always',
				named:      'never',
			}],
			'@stylistic/space-infix-ops':         'error',
			'@stylistic/space-unary-ops':         'error',
			'@stylistic/switch-colon-spacing':    'error',
			'@stylistic/template-curly-spacing':  ['error', 'always'],
			'@stylistic/template-tag-spacing':    'error',
			'@stylistic/type-annotation-spacing': 'error',
			'@stylistic/yield-star-spacing':      ['error', 'both'],

			/* ## Grouping Structure Style */
			'@stylistic/array-bracket-newline':          ['error', 'consistent'],
			'@stylistic/array-bracket-spacing':          'warn',
			'@stylistic/array-element-newline':          ['error', 'consistent'],
			'arrow-body-style':                          'error',
			'@stylistic/brace-style':                    'error',
			'@stylistic/computed-property-spacing':      'warn',
			'curly':                                     'error',
			'@stylistic/function-call-argument-newline': ['error', 'consistent'],
			'@stylistic/function-paren-newline':         'error',
			'func-style':                                ['error', 'declaration', {allowArrowFunctions: true}],
			'@stylistic/lines-between-class-members':    ['error', 'always', {exceptAfterSingleLine: true}],
			'@stylistic/member-delimiter-style':         ['error', {
				overrides: {
					typeLiteral: {
						multiline:  {delimiter: 'comma'},
						singleline: {delimiter: 'comma'},
					},
				},
			}],
			'no-useless-computed-key':         'error',
			'@stylistic/object-curly-newline': ['error', {
				ObjectExpression:  {multiline: true},
				ObjectPattern:     {multiline: true},
				ImportDeclaration: {multiline: true, minProperties: 2},
				ExportDeclaration: {multiline: true, minProperties: 2},
			}],
			'@stylistic/object-curly-spacing':    'warn',
			'@stylistic/object-property-newline': ['error', {allowAllPropertiesOnSameLine: true}],
			'object-shorthand':                   ['error', 'properties', {avoidQuotes: true}],
			'@stylistic/padded-blocks':           ['error', 'never'],
			'@stylistic/quote-props':             ['error', 'consistent-as-needed'],
			'@stylistic/space-in-parens':         'warn',

			/* ## Operator Style */
			'@stylistic/arrow-parens':             'error',
			'@stylistic/comma-dangle':             ['error', 'always-multiline'],
			'@stylistic/comma-style':              'error',
			'dot-notation':                        'error',
			'@stylistic/implicit-arrow-linebreak': 'error',
			'@stylistic/new-parens':               'error',
			'@stylistic/operator-linebreak':       ['error', 'none', {
				overrides: {
					'+':  'after',
					'*':  'after',
					'&':  'after',
					'|':  'after',
					'&&': 'after',
					'||': 'after',
					'??': 'after',
					'?':  'before',
					':':  'ignore',
				},
			}],
			'@stylistic/quotes':     ['error', 'single'],
			'@stylistic/semi':       'error',
			'@stylistic/semi-style': 'error',
			'@stylistic/wrap-iife':  ['error', 'inside', {functionPrototypeMethods: true}],

			/* ## Type Annotations */
			'@typescript-eslint/consistent-type-imports':       'error',
			'@typescript-eslint/explicit-function-return-type': ['error', {
				allowExpressions:          true,
				allowHigherOrderFunctions: false,
			}],
			'@typescript-eslint/no-import-type-side-effects': 'error',

			/* # Best Practices */
			/* ## Preferred Operators */
			'eqeqeq':               'error',
			'no-useless-concat':    'error',
			'operator-assignment':  'error',
			'prefer-object-spread': 'error',
			'prefer-template':      'error',

			/* ## Variable Declarations */
			'init-declarations':                       'off',
			'@typescript-eslint/init-declarations':    'error',
			'no-shadow':                               'off',
			'@typescript-eslint/no-shadow':            'error',
			'no-use-before-define':                    'off',
			'@typescript-eslint/no-use-before-define': 'error',
			'one-var':                                 ['error', 'never'],

			/* ## Function Design */
			'default-param-last':                    'off',
			'@typescript-eslint/default-param-last': 'error',
			'func-names':                            ['error', 'never'],
			'no-return-await':                       'error',
			'prefer-arrow-callback':                 ['error', {allowUnboundThis: false}],

			/* ## Strictness */
			'@typescript-eslint/explicit-member-accessibility': 'error',
		},
	},

	// NOTE: The following configs are separated from 'all' due to some of their rules requiring “type information” to run.
	// See https://typescript-eslint.io/getting-started/typed-linting/ for more info.
	...[
		...tseslint.configs.recommendedTypeCheckedOnly, // https://github.com/typescript-eslint/typescript-eslint/blob/v8.18.0/packages/eslint-plugin/src/configs/recommended-type-checked-only.ts
		...tseslint.configs.stylisticTypeCheckedOnly,   // https://github.com/typescript-eslint/typescript-eslint/blob/v8.18.0/packages/eslint-plugin/src/configs/stylistic-type-checked-only.ts
		// excluding `tseslint.configs.strictTypeCheckedOnly` as it is too strict
	].map((conf) => ({
		...conf,
		files: ['**/*.{cts,mts,ts}'],
	})),
	{
		// NOTE: These rules need access to the `languageOptions.parserOptions` config (`tsconfig.json` files).
		// See https://typescript-eslint.io/getting-started/typed-linting/ for more info.
		name:            'typescript-with-tsconfig',
		files:           ['**/*.{cts,mts,ts}'],
		languageOptions: {
			globals:       {...globals.node},
			parser:        tseslint.parser,
			parserOptions: {
				project: [
					'./tsconfig.json',
					'./test/tsconfig.json',
					'./tree-sitter-counterpoint/tsconfig.json',
					'./tree-sitter-counterpoint/test/tsconfig.json',
				],
			},
		},
		linterOptions: {reportUnusedDisableDirectives: 'error'},
		plugins:       {'@typescript-eslint': tseslint.plugin},

		rules: {
			/* # Overrides */
			/* ## Overrides of `tseslint.configs.stylisticTypeCheckedOnly` */
			'@typescript-eslint/prefer-regexp-exec': 'off', // `String#match` is more ergonomic

			/* # Best Practices */
			/* ## Conciseness */
			'@typescript-eslint/no-unnecessary-condition':      'error',
			'@typescript-eslint/no-unnecessary-type-arguments': 'error',

			/* ## Function Design */
			'no-return-await':                 'off',
			'@typescript-eslint/return-await': 'error', // NOTE: overrides 'no-return-await' (despite different name)

			/* ## Strictness */
			'@typescript-eslint/prefer-readonly': 'error',
		},
	},
];
