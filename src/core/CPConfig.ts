import {requireJSONSync} from '@chharvey/requirejson';
import * as path from 'path';



const DIRNAME = path.dirname(new URL(import.meta.url).pathname);

/**
 * Interface for compiler configurations.
 */
export type CPConfig = {
	/**
	 * Options for which language features to enable/disable.
	 * Disabling features can improve compiler speed.
	 */
	readonly languageFeatures: {
		/**
		 * Counterpoint code comments.
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
		 * Compute constant expressions at compile-time.
		 * @version v0.1.0
		 * @default true
		 */
		readonly constantFolding: boolean,
		/**
		 * Coerce integers into floats if mixed with floats in arithmetic expressions.
		 * @version v0.2.0
		 * @default true
		 */
		readonly intCoercion: boolean,
	},
};

export const CONFIG_DEFAULT: CPConfig = requireJSONSync(path.join(DIRNAME, '../../src/core/counterpoint-config.default.json')) as CPConfig;
