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
	...tseslint.configs.stylistic,   // https://github.com/typescript-eslint/typescript-eslint/blob/v8.18.0/packages/eslint-plugin/src/configs/stylistic.ts
	{
		name:            'all',
		files:           ['**/*.{cjs,cts,js,mjs,mts,ts}'],
		languageOptions: {
			globals: {...globals.node},
			parser:  tseslint.parser,
		},
		linterOptions: {reportUnusedDisableDirectives: 'warn'},
		plugins:       {
			'@stylistic':         stylistic,
			'@typescript-eslint': tseslint.plugin,
		},

		rules: {
			/* # Overrides of Recommended Rules */
			'no-irregular-whitespace': ['error', {
				skipStrings:  false, // disallow in strings
				skipComments: true,  // allow in comments
			}],
			'@stylistic/no-mixed-spaces-and-tabs':          ['error', 'smart-tabs'], // allow smart-tabs
			'@typescript-eslint/no-unused-vars': ['error', { // override default opts
				argsIgnorePattern:              '^_',
				caughtErrors:                   'all',
				destructuredArrayIgnorePattern: '^_',
				ignoreRestSiblings:             true,
				// reportUsedIgnorePattern:        true, // not until eslint v9.5.0
			}],

			/* # File Conventions (should be consistent with `/.editorconfig` file) */
			'@stylistic/eol-last':           'error',
			'@stylistic/linebreak-style':    'error',
			'@stylistic/no-trailing-spaces': 'error',

			/* # Layout & Formatting */
			/* ## Indentation, Spacing, and Alignment */
			'@stylistic/arrow-spacing':                        'error',
			'@stylistic/comma-spacing':                        'error',
			'@stylistic/dot-location':                         ['error', 'property'],
			'@stylistic/func-call-spacing': 'warn',
			'@stylistic/generator-star-spacing':               ['error', 'both'],
			'@stylistic/indent':                               ['error', 'tab', {
				SwitchCase:             1,
				flatTernaryExpressions: true,
			}],
			'@stylistic/key-spacing': ['error', {
				align: 'value',
				mode:  'minimum',
			}],
			'@stylistic/keyword-spacing':             'error',
			'@stylistic/rest-spread-spacing':                            'error',
			'@stylistic/semi-spacing':                                   'error',
			'@stylistic/space-before-blocks':         'error',
			'@stylistic/space-before-function-paren': ['warn', {
				anonymous:  'always',
				asyncArrow: 'always',
				named:      'never',
			}],
			'@stylistic/space-infix-ops': 'error',
			'@stylistic/space-unary-ops':                    'error',
			'@stylistic/switch-colon-spacing':               'error',
			'@stylistic/template-curly-spacing':             ['error', 'always'],
			'@stylistic/template-tag-spacing':               'error',
			'@stylistic/yield-star-spacing':                 ['error', 'both'],

			/* ## Grouping Structure Style */
			'@stylistic/array-bracket-newline':                          ['error', 'consistent'],
			'@stylistic/array-bracket-spacing':                          'warn',
			'@stylistic/array-element-newline':                          ['error', 'consistent'],
			'arrow-body-style':                               'error',
			'@stylistic/brace-style':                 'error',
			'@stylistic/computed-property-spacing':                      'warn',
			'curly':                                          'error',
			'@stylistic/function-call-argument-newline':                 ['error', 'consistent'],
			'@stylistic/function-paren-newline':                         'error',
			'func-style':                                     ['error', 'declaration', {allowArrowFunctions: true}],
			'@stylistic/lines-between-class-members': ['error', 'always', {exceptAfterSingleLine: true}],
			'no-useless-computed-key':                        ['error', {enforceForClassMembers: true}],
			'@stylistic/object-curly-newline':                           ['error', {
				ObjectExpression:  {multiline: true},
				ObjectPattern:     {multiline: true},
				ImportDeclaration: {multiline: true, minProperties: 2},
				ExportDeclaration: {multiline: true, minProperties: 2},
			}],
			'@stylistic/object-curly-spacing': 'warn',
			'@stylistic/object-property-newline':                 ['error', {allowAllPropertiesOnSameLine: true}],
			'object-shorthand':                        ['error', 'properties', {avoidQuotes: true}],
			'@stylistic/padded-blocks':                           ['error', 'never'],
			'@stylistic/quote-props':                             ['error', 'consistent-as-needed'],
			'@stylistic/space-in-parens':                         'warn',

			/* ## Operator Style */
			'@stylistic/arrow-parens':                    'error',
			'@stylistic/comma-dangle': ['error', 'always-multiline'],
			'@stylistic/comma-style':                     'error',
			'dot-notation':                    'error',
			'@stylistic/implicit-arrow-linebreak':        'error',
			'@stylistic/new-parens':                      'error',
			'@stylistic/operator-linebreak':              ['error', 'before', {
				overrides: {
					'=':    'none',
					'*=':   'none',
					'/=':   'none',
					'%=':   'none',
					'+=':   'none',
					'-=':   'none',
					'<<=':  'none',
					'>>=':  'none',
					'>>>=': 'none',
					'&=':   'none',
					'^=':   'none',
					'|=':   'none',
					'**=':  'none',
					'&&=':  'none',
					'||=':  'none',
					'??=':  'none',
					':':    'ignore',
				},
			}],
			'@stylistic/quotes':                  ['error', 'single'],
			'@stylistic/semi': 'error',
			'@stylistic/semi-style':              'error',
			'@stylistic/wrap-iife':               ['error', 'inside', {functionPrototypeMethods: true}],

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
			'@typescript-eslint/no-use-before-define': ['error', {ignoreTypeReferences: false}],
			'one-var':                                 ['error', 'never'],

			/* ## Function Design */
			'default-param-last':                        'off',
			'@typescript-eslint/default-param-last':     'error',
			'func-names':                                ['error', 'never'],
			'no-return-await':                           'error',
			'no-useless-constructor':                    'off',
			'@typescript-eslint/no-useless-constructor': 'error',
			'prefer-arrow-callback':                     ['error', {allowUnboundThis: false}],
		},
	},
	...tseslint.configs.stylisticTypeCheckedOnly.map((conf) => ({ // https://github.com/typescript-eslint/typescript-eslint/blob/v8.18.0/packages/eslint-plugin/src/configs/stylistic-type-checked-only.ts
		...conf,
		files: ['**/*.{cts,mts,ts}'],
	})),
	{
		name:            'typescript-only', // separate from 'all' due to needing access to tsconfig files
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
		linterOptions: {reportUnusedDisableDirectives: 'warn'},
		plugins:       {'@typescript-eslint': tseslint.plugin},

		rules: {
			/* # Overrides of Recommended Rules */
			'@typescript-eslint/no-explicit-any':       ['error', {fixToUnknown: true}], // report as errors & quickfix `any` to `unknown`
			'@typescript-eslint/no-inferrable-types':   'off',                           // don’t rely on TypeScript inference
			'@typescript-eslint/no-non-null-assertion': 'off',                           // non-null assertions can be useful

			/* # Layout & Formatting */
			/* ## Indentation, Spacing, and Alignment */
			'@stylistic/type-annotation-spacing': 'error',

			/* ## Grouping Structure Style */
			'@typescript-eslint/adjacent-overload-signatures': 'error',
			'@stylistic/member-delimiter-style':       ['error', {
				overrides: {
					typeLiteral: {
						multiline:  {delimiter: 'comma'},
						singleline: {delimiter: 'comma'},
					},
				},
			}],

			/* ## Operator Style */
			'dot-notation':                    'off',
			'@typescript-eslint/dot-notation': 'error', // needed here instead of in config 'all' due to `languageOptions.parserOptions.project`

			/* ## Type Annotations */
			'@typescript-eslint/array-type': ['error', {
				default:  'array-simple',
				readonly: 'array',
			}],
			'@typescript-eslint/consistent-generic-constructors': 'error',
			'@typescript-eslint/consistent-indexed-object-style': 'error',
			'@typescript-eslint/consistent-type-assertions':      'error',
			'@typescript-eslint/consistent-type-imports':         'error',
			'@typescript-eslint/explicit-function-return-type':   ['error', {
				allowExpressions:          true,
				allowHigherOrderFunctions: false,
			}],
			'@typescript-eslint/no-import-type-side-effects': 'error',

			/* # Best Practices */
			/* ## Conciseness */
			'@typescript-eslint/no-unnecessary-condition':          'error',
			'@typescript-eslint/no-unnecessary-type-arguments':     'error',
			'@typescript-eslint/no-unnecessary-type-assertion':     'error',
			'@typescript-eslint/non-nullable-type-assertion-style': 'error',

			/* ## Function Design */
			'no-return-await':                 'off',
			'@typescript-eslint/return-await': 'error', // needed here due to `languageOptions.parserOptions.project` // NOTE: overrides 'no-return-await' (despite different name)

			/* ## Strictness */
			'@typescript-eslint/explicit-member-accessibility':           'error',
			'@typescript-eslint/no-non-null-asserted-nullish-coalescing': 'error',
			'@typescript-eslint/prefer-readonly':                         'error',
		},
	},
];
