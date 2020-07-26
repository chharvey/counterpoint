/**
 * Interface for Solid configurations.
 */
type SolidConfig = {
	/**
	 * Toggles for which features to enable/disable.
	 * Disabling features can improve compiler speed.
	 */
	readonly features: {
		/**
		 * Solid code comments.
		 * @version v0.2.0
		 * @default true
		 */
		readonly comments: boolean,
		/**
		 * Integer literals with a specified radix or “base.”
		 * @version v0.2.0
		 * @default false
		 */
		readonly integerRadices: boolean,
		/**
		 * Separators in numeric tokens.
		 * @version v0.2.0
		 * @default false
		 */
		readonly numericSeparators: boolean,
	},
	/**
	 * Options for the compiler.
	 */
	readonly compilerOptions: {
	},
}
export default SolidConfig // NB https://github.com/microsoft/TypeScript/issues/3792#issuecomment-303526468

export const CONFIG_DEFAULT: SolidConfig = require('../src/solid-config.default.json')
