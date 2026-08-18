import eslint from '@eslint/js';
import stylistic from '@stylistic/eslint-plugin';
import import_plugin from 'eslint-plugin-import-x';
import globals from 'globals';
import tseslint from 'typescript-eslint';



// eslint-disable-next-line @import/no-default-export --- eslint expects a default export
export default [
	{
		ignores: [
			'**/dist/',
			'tree-sitter-counterpoint/bindings/node/*.{js,ts}',
			'tree-sitter-counterpoint/grammar.js',
		],
	},

	eslint.configs.recommended, // https://github.com/eslint/eslint/blob/v9.39.4/packages/js/src/configs/eslint-recommended.js
	{
		name:            'All',
		files:           ['**/*.{cjs,cts,js,mjs,mts,ts}'],
		languageOptions: {globals: {...globals.node}},
		linterOptions:   {reportUnusedDisableDirectives: 'error'},
		plugins:         {
			'@stylistic': stylistic,
			'@import':    import_plugin,
		},

		rules: {
			/* # Overrides */
			// Override any rules from imported configs here, organizing them by the config they were imported from.
			// Comment why the override is needed.

			/* ## Overrides of `eslint.configs.recommended` */
			'no-irregular-whitespace': ['error', {
				skipStrings:  false, // disallow irregular whitespace in strings
				skipComments: true,  // allow    irregular whitespace in comments
			}],

			/* # File Conventions (should be consistent with `/.editorconfig` file) */
			'@stylistic/eol-last':           'error',
			'@stylistic/linebreak-style':    'error',
			'@stylistic/no-trailing-spaces': 'error',

			/* # Layout & Formatting */
			/* ## Indentation, Spacing, and Alignment */
			'@stylistic/arrow-spacing':          'error',
			'@stylistic/block-spacing':          'error',
			'@stylistic/comma-spacing':          'error',
			'@stylistic/dot-location':           ['error', 'property'],
			'@stylistic/function-call-spacing':  'warn',
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
			'@stylistic/space-before-function-paren': ['error', {named: 'never'}],
			'@stylistic/space-infix-ops':             'error',
			'@stylistic/space-unary-ops':             'error',
			'@stylistic/spaced-comment':              'error',
			'@stylistic/switch-colon-spacing':        'error',
			'@stylistic/template-curly-spacing':      ['error', 'always'],
			'@stylistic/template-tag-spacing':        'error',
			'@stylistic/type-annotation-spacing':     'error',
			'@stylistic/yield-star-spacing':          ['error', 'both'],

			/* ## Grouping Structure Style */
			'@stylistic/array-bracket-newline':          ['error', 'consistent'],
			'@stylistic/array-bracket-spacing':          'warn',
			'@stylistic/array-element-newline':          ['error', 'consistent'],
			'arrow-body-style':                          'error',
			'@stylistic/brace-style':                    ['error', '1tbs', {allowSingleLine: true}],
			'@stylistic/computed-property-spacing':      'warn',
			'curly':                                     'error',
			'@stylistic/function-call-argument-newline': ['error', 'consistent'],
			'@stylistic/function-paren-newline':         'error',
			'func-style':                                ['error', 'declaration', {allowArrowFunctions: true}],
			'@stylistic/lines-between-class-members':    ['error', 'always', {exceptAfterSingleLine: true}],
			'@stylistic/member-delimiter-style':         ['error', {
				overrides: {
					interface:   {singleline: {requireLast: true}},
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
				TSTypeLiteral:     {multiline: true},
				TSInterfaceBody:   'always',
				TSEnumBody:        'always',
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
					'&':  'before',
					'|':  'before',
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

			/* # Best Practices */
			/* ## Preferred Operators & Methods */
			'eqeqeq':               'error',
			'no-eval':              'error',
			'no-implied-eval':      'error',
			'no-lonely-if':         'error',
			'no-unneeded-ternary':  ['error', {defaultAssignment: false}],
			'no-useless-concat':    'error',
			'operator-assignment':  'error',
			'prefer-object-spread': 'error',
			'prefer-template':      'error',

			/* ## Variable Declarations */
			'no-shadow':            'error',
			'no-use-before-define': 'error',
			'one-var':              ['error', 'never'],

			/* ## Function & Module Design */
			'default-param-last':    'error',
			'func-names':            ['error', 'never'],
			'prefer-arrow-callback': ['error', {allowUnboundThis: false}],
			'require-await':         'error',

			/* ### eslint-plugin-import-x: Helpful Warnings */
			'@import/no-empty-named-blocks': 'error',
			'@import/no-mutable-exports':    'error',

			/* ### eslint-plugin-import-x: Style Guide */
			'@import/first':                'error',
			'@import/newline-after-import': ['error', {count: 3}],
			'@import/no-default-export':    'error',
			'@import/no-duplicates':        'error',
		},
	},
	...[
		...tseslint.configs.recommended, // https://github.com/typescript-eslint/typescript-eslint/blob/v8.58.2/packages/eslint-plugin/src/configs/flat/recommended.ts
		...tseslint.configs.strict,      // https://github.com/typescript-eslint/typescript-eslint/blob/v8.58.2/packages/eslint-plugin/src/configs/flat/strict.ts
		...tseslint.configs.stylistic,   // https://github.com/typescript-eslint/typescript-eslint/blob/v8.58.2/packages/eslint-plugin/src/configs/flat/stylistic.ts
	].map((conf) => ({
		...conf,
		files: ['**/*.{cts,mts,ts}'],
	})),
	{
		name:            'Plain TypeScript',
		files:           ['**/*.{cts,mts,ts}'],
		languageOptions: {
			globals: {...globals.node},
			parser:  tseslint.parser,
		},
		plugins: {'@typescript-eslint': tseslint.plugin},

		rules: {
			/* # Overrides */
			// Override any rules from imported configs here, organizing them by the config they were imported from.
			// Comment why the override is needed.

			/* ## Overrides of `tseslint.configs.recommended` */
			'@typescript-eslint/no-explicit-any':       ['error', {fixToUnknown: true}], // quickfix `any` to `unknown`
			'@typescript-eslint/no-unused-expressions': 'off',                           // getter access and logical operations may have side-effects
			'@typescript-eslint/no-unused-vars':        ['error', {                      // override default options
				argsIgnorePattern:              '^_',
				destructuredArrayIgnorePattern: '^_',
				ignoreRestSiblings:             true,
				reportUsedIgnorePattern:        true,
			}],

			/* ## Overrides of `tseslint.configs.strict` */
			'@typescript-eslint/no-non-null-assertion': 'off',                                               // non-null assertions can be useful
			'@typescript-eslint/unified-signatures':    ['error', {ignoreDifferentlyNamedParameters: true}], // overloads may have differing documentation

			/* ## Overrides of `tseslint.configs.stylistic` */
			'@typescript-eslint/array-type': ['error', { // override default options
				default:  'array-simple',
				readonly: 'array',
			}],
			'@typescript-eslint/consistent-type-definitions': 'off', // both object types and interfaces can be useful
			'@typescript-eslint/no-inferrable-types':         'off', // don’t rely on TypeScript inference

			/* # Layout & Formatting */
			/* ## Type Annotations */
			'@typescript-eslint/explicit-function-return-type': ['error', {
				allowExpressions:          true,
				allowHigherOrderFunctions: false,
			}],

			/* # Best Practices */
			/* ## Variable Declarations */
			'no-shadow':                               'off',
			'@typescript-eslint/no-shadow':            'error',
			'no-use-before-define':                    'off',
			'@typescript-eslint/no-use-before-define': 'error',

			/* ## Function & Module Design */
			'@typescript-eslint/consistent-type-imports':     'error',
			'default-param-last':                             'off',
			'@typescript-eslint/default-param-last':          'error',
			'@typescript-eslint/no-import-type-side-effects': 'error',

			/* ## Strictness */
			'@typescript-eslint/explicit-member-accessibility': 'error',
		},
	},

	// NOTE: The following configs are separated from 'All' due to some of their rules requiring “type information” to run.
	// See https://typescript-eslint.io/getting-started/typed-linting/ for more info.
	...[
		...tseslint.configs.recommendedTypeCheckedOnly, // https://github.com/typescript-eslint/typescript-eslint/blob/v8.58.2/packages/eslint-plugin/src/configs/flat/recommended-type-checked-only.ts
		...tseslint.configs.stylisticTypeCheckedOnly,   // https://github.com/typescript-eslint/typescript-eslint/blob/v8.58.2/packages/eslint-plugin/src/configs/flat/stylistic-type-checked-only.ts
		// excluding `tseslint.configs.strictTypeCheckedOnly` as it is too strict
	].map((conf) => ({
		...conf,
		files: ['**/*.{cts,mts,ts}'],
	})),
	{
		// NOTE: These rules need access to the `languageOptions.parserOptions` config (`tsconfig.json` files).
		// See https://typescript-eslint.io/getting-started/typed-linting/ for more info.
		name:            'TypeScript with TSConfig',
		files:           ['**/*.{cts,mts,ts}'],
		languageOptions: {
			globals:       {...globals.node},
			parser:        tseslint.parser,
			parserOptions: {
				projectService:  true,
				tsconfigRootDir: import.meta.dirname,
			},
		},
		plugins: {'@typescript-eslint': tseslint.plugin},

		rules: {
			/* # Overrides */
			// Override any rules from imported configs here, organizing them by the config they were imported from.
			// Comment why the override is needed.

			/* ## Overrides of `tseslint.configs.recommendedTypeCheckedOnly` */
			'@typescript-eslint/no-floating-promises': ['error', {
				allowForKnownSafeCalls: [
					{from: 'package', name: ['suite', 'test', 'skip', 'todo', 'only'], package: 'node:test'}, // `suite()` and `test()` calls are normally automatically awaited
				],
			}],
			'@typescript-eslint/no-unsafe-enum-comparison':     'off',   // some enums have transparent values
			'@typescript-eslint/restrict-template-expressions': 'off',   // template interpolation is designed for this
			'@typescript-eslint/require-await':                 'off',   // disallow functions to be `async` without containing an `await`, even if they are promise-returning
			'require-await':                                    'error', // turn eslint’s version back on

			/* ### Disable unsafe checks. These problems are usually already raised as TS errors. */
			'@typescript-eslint/no-unsafe-argument':      'off',
			'@typescript-eslint/no-unsafe-assignment':    'off',
			'@typescript-eslint/no-unsafe-call':          'off',
			'@typescript-eslint/no-unsafe-member-access': 'off',
			'@typescript-eslint/no-unsafe-return':        'off',

			/* ## Overrides of `tseslint.configs.stylisticTypeCheckedOnly` */
			'@typescript-eslint/prefer-regexp-exec': 'off', // `String#match` is more ergonomic

			/* # Layout & Formatting */
			/* ## Operator Style */
			'dot-notation':                    'off',
			'@typescript-eslint/dot-notation': 'error',

			/* # Best Practices */
			/* ## Conciseness */
			'@typescript-eslint/no-unnecessary-condition':           'error',
			'@typescript-eslint/no-unnecessary-template-expression': 'error',
			'@typescript-eslint/no-unnecessary-type-arguments':      'error',

			/* ## Function Design */
			'@typescript-eslint/return-await': 'error',

			/* ## Strictness */
			'@typescript-eslint/no-deprecated':   'warn',
			'@typescript-eslint/prefer-readonly': 'error',
		},
	},
];
