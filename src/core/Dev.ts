type FeatureFlag = boolean | [boolean, (keyof typeof Dev['FEATURES'])[]];



/**
 * Development utilities. Not for production.
 */
export class Dev {
	/**
	 * A map of development features to their version numbers.
	 *
	 * These are flags for enabling development of certain features in pre-production;
	 * they are *not* {@link SolidConfig|language feature toggles} for production
	 * (which are used by consumers).
	 * These feature flags are given here in the codebase, whereas
	 * language feature toggles are not given until a consumer provides them per each compile.
	 *
	 * Before each release, the feature flags for that release should be removed
	 * and those features should become fully enabled.
	 * Released features may have an optional language feature toggle defined in {@link SolidConfig}.
	 */
	private static readonly FEATURES: {
		// v0.3.0
		readonly 'variables-build': FeatureFlag,
		// v0.4.0
		readonly literalCollection:         FeatureFlag,
		readonly 'literalString-lex':       FeatureFlag,
		readonly 'literalTemplate-lex':     FeatureFlag,
		readonly 'literalString-cook':      FeatureFlag,
		readonly 'literalTemplate-cook':    FeatureFlag,
		readonly 'stringConstant-assess':   FeatureFlag,
		readonly 'stringTemplate-parse':    FeatureFlag,
		readonly 'stringTemplate-decorate': FeatureFlag,
		readonly 'stringTemplate-assess':   FeatureFlag,
	} = {
		// v0.3.0
		'variables-build': false,
		// v0.4.0
		literalCollection:         false,
		'literalString-lex':       false,
		'literalString-cook':      [false, ['literalString-lex']],
		'stringConstant-assess':   [false, ['literalString-cook']],
		'literalTemplate-lex':     false,
		'literalTemplate-cook':    [false, ['literalTemplate-lex']],
		'stringTemplate-parse':    [false, ['literalTemplate-cook']],
		'stringTemplate-decorate': [false, ['stringTemplate-parse']],
		'stringTemplate-assess':   [false, ['stringTemplate-decorate']],
	}

	/**
	 * Return `true` if this project supports the given feature.
	 * @param feature the feature to test
	 * @return is this project’s version number in the range of the feature?
	 */
	static supports(feature: keyof typeof Dev.FEATURES): boolean {
		const flag: FeatureFlag = Dev.FEATURES[feature];
		return (typeof flag === 'boolean')
			? flag
			: flag[0] && Dev.supportsAll(...flag[1])
		;
	}
	/**
	 * Returns `true` if this project supports at least one of the given features.
	 * @param features the features to test
	 * @see Dev.supports
	 * @return are any of the given features supported?
	 */
	static supportsAny(...features: (keyof typeof Dev.FEATURES)[]): boolean {
		return features.some((feature) => Dev.supports(feature))
	}
	/**
	 * Returns `true` if this project supports every one of the given features.
	 * @param features the features to test
	 * @see Dev.supports
	 * @return are all of the given features supported?
	 */
	static supportsAll(...features: (keyof typeof Dev.FEATURES)[]): boolean {
		return features.every((feature) => Dev.supports(feature))
	}
}
