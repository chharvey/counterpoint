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
		/**
		 * Compute operations on literals at compile-time if possible.
		 * @version v0.1.0
		 * @default true
		 */
		readonly constantFolding: boolean,
	},
}
export default SolidConfig // NB https://github.com/microsoft/TypeScript/issues/3792#issuecomment-303526468
