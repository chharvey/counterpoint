type DevToggle = [boolean, (keyof typeof Dev['TOGGLES'])[]?];



/**
 * Development utilities. Not for production.
 */
export class Dev {
	/**
	 * A map of development features to their version numbers.
	 *
	 * These are toggles for enabling development of certain features in pre-production;
	 * they are *not* {@link SolidConfig|language feature options} for production
	 * (which are used by consumers).
	 * These development toggles are given here in the codebase, whereas
	 * language feature options are not given until a consumer provides them per each compile.
	 *
	 * Before each release, the development toggles for that release should be removed
	 * and those features should become fully enabled.
	 * Released features may have an optional language feature option defined in {@link SolidConfig}.
	 */
	private static readonly TOGGLES: {
		// v0.4.0
		readonly literalCollection:         DevToggle,
		readonly 'literalString-lex':       DevToggle,
		readonly 'literalTemplate-lex':     DevToggle,
		readonly 'literalString-cook':      DevToggle,
		readonly 'literalTemplate-cook':    DevToggle,
		readonly 'stringConstant-assess':   DevToggle,
		readonly 'stringTemplate-parse':    DevToggle,
		readonly 'stringTemplate-decorate': DevToggle,
		readonly 'stringTemplate-assess':   DevToggle,
	} = {
		// v0.4.0
		literalCollection:         [false],
		'literalString-lex':       [true],
		'literalString-cook':      [true, ['literalString-lex']],
		'stringConstant-assess':   [true, ['literalString-cook']],
		'literalTemplate-lex':     [true],
		'literalTemplate-cook':    [true, ['literalTemplate-lex']],
		'stringTemplate-parse':    [true, ['literalTemplate-cook']],
		'stringTemplate-decorate': [true, ['stringTemplate-parse']],
		'stringTemplate-assess':   [true, ['stringTemplate-decorate']],
	}

	/**
	 * Return `true` if this project supports the given feature.
	 * @param feature the feature to test
	 * @return is this project’s version number in the range of the feature?
	 */
	static supports(feature: keyof typeof Dev.TOGGLES): boolean {
		const toggle: DevToggle = Dev.TOGGLES[feature];
		return toggle[0] && Dev.supportsAll(...toggle[1] || []);
	}
	/**
	 * Returns `true` if this project supports at least one of the given features.
	 * @param features the features to test
	 * @see Dev.supports
	 * @return are any of the given features supported?
	 */
	static supportsAny(...features: (keyof typeof Dev.TOGGLES)[]): boolean {
		return features.some((feature) => Dev.supports(feature))
	}
	/**
	 * Returns `true` if this project supports every one of the given features.
	 * @param features the features to test
	 * @see Dev.supports
	 * @return are all of the given features supported?
	 */
	static supportsAll(...features: (keyof typeof Dev.TOGGLES)[]): boolean {
		return features.every((feature) => Dev.supports(feature))
	}
}
