type DevToggleKey =
	// v0.5.0
		| 'stringConstant-build'
		| 'stringTemplate-build'
;
type DevToggleVal = [boolean, DevToggleKey[]?];



/**
 * Development utilities. Not for production.
 */
export class Dev {
	/**
	 * A map of development features to their version numbers.
	 *
	 * These are toggles for enabling development of certain features in pre-production;
	 * they are *not* {@link CPConfig|language feature options} for production
	 * (which are used by consumers).
	 * These development toggles are given here in the codebase, whereas
	 * language feature options are not given until a consumer provides them per each compile.
	 *
	 * Before each release, the development toggles for that release should be removed
	 * and those features should become fully enabled.
	 * Released features may have an optional language feature option defined in {@link CPConfig}.
	 */
	private static readonly TOGGLES: {[K in DevToggleKey]: DevToggleVal} = {
		'stringConstant-build': [false],
		'stringTemplate-build': [false],
	};

	/**
	 * Return `true` if this project supports the given feature.
	 * @param feature the feature to test
	 * @return is this project’s version number in the range of the feature?
	 */
	public static supports(feature: DevToggleKey): boolean {
		const toggle: DevToggleVal = Dev.TOGGLES[feature];
		return toggle[0] && Dev.supportsAll(...toggle[1] || []);
	}

	/**
	 * Returns `true` if this project supports at least one of the given features.
	 * @param features the features to test
	 * @see Dev.supports
	 * @return are any of the given features supported?
	 */
	public static supportsAny(...features: readonly DevToggleKey[]): boolean {
		return features.some((feature) => Dev.supports(feature));
	}

	/**
	 * Returns `true` if this project supports every one of the given features.
	 * @param features the features to test
	 * @see Dev.supports
	 * @return are all of the given features supported?
	 */
	public static supportsAll(...features: readonly DevToggleKey[]): boolean {
		return features.every((feature) => Dev.supports(feature));
	}
}
