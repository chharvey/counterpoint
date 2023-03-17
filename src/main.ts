import {
	type CPConfig,
	CONFIG_DEFAULT,
	Builder,
} from './index.js';


/**
 * Compile Counterpoint source code into a readable text format for development purposes.
 * Output text is in [WAT](https://webassembly.org/) format.
 * @param sourcecode - the Counterpoint source text
 * @return the output text
 */
export function print(sourcecode: string, config: CPConfig = CONFIG_DEFAULT): string {
	return new Builder(sourcecode, config).print();
}

/**
 * Compile Counterpoint source code into an executable binary format.
 * Output text is in [WASM](https://webassembly.org/) format.
 * @param sourcecode - the Counterpoint source text
 * @return the output as a binary format
 */
export function compile(sourcecode: string, config: CPConfig = CONFIG_DEFAULT): Uint8Array {
	return new Builder(sourcecode, config).compile();
}
