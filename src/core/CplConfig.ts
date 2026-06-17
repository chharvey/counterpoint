export {default as CONFIG_DEFAULT} from './counterpoint-config.default.json' with {type: 'json'};



/**
 * Interface for compiler configurations.
 */
export type CplConfig = {
	/**
	 * Options for which language features to enable/disable.
	 * Disabling features can improve compiler speed.
	 */
	readonly languageFeatures: {}, // eslint-disable-line @typescript-eslint/no-empty-object-type

	/**
	 * Options for the compiler.
	 */
	readonly compilerOptions: {}, // eslint-disable-line @typescript-eslint/no-empty-object-type
};
