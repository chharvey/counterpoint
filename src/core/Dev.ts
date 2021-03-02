import * as semver from 'semver'

/**
 * Development utilities. Not for production.
 */
export class Dev {
	/** The current version of this project (as defined in `package.json`). */
	static readonly VERSION: string = require('../../package.json').version

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
		readonly variables       : string,
		// v0.4.0
		readonly literalCollection: string,
		readonly 'literalString-lex':       string,
		readonly 'literalTemplate-lex':     string,
		readonly 'literalString-cook':      string,
		readonly 'literalTemplate-cook':    string,
		readonly 'string-assess':           string,
		readonly 'stringTemplate-parse':    string,
		readonly 'stringTemplate-decorate': string,
		readonly 'stringTemplate-assess':   string,
	} = {
		// v0.3.0
		variables:       '>=0.3.*',
		// v0.4.0
		literalCollection: '>=0.4.0-alpha.0',
		'literalString-lex':       '>=0.4.0-alpha.1.0',
		'literalTemplate-lex':     '>=0.4.0-alpha.1.0',
		'literalString-cook':      '>=0.4.0-alpha.1.1',
		'literalTemplate-cook':    '>=0.4.0-alpha.1.1',
		'string-assess':           '>=0.4.0-alpha.1.2',
		'stringTemplate-parse':    '>=0.4.0-alpha.1.3',
		'stringTemplate-decorate': '>=0.4.0-alpha.1.4',
		'stringTemplate-assess':   '>=0.4.0-alpha.1.5',
	}

	/**
	 * Return `true` if this project supports the given feature.
	 * @param feature the feature to test
	 * @return is this project’s version number in the range of the feature?
	 */
	static supports(feature: keyof typeof Dev.FEATURES): boolean {
		return semver.satisfies(Dev.VERSION, Dev.FEATURES[feature], {includePrerelease: true})
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
