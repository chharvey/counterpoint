import {
	SolidConfig,
	CONFIG_DEFAULT,
} from './index.js';
import {Program} from './Program.js';


/**
 * Compile Solid source code into a readable text format for development purposes.
 * Output text is in [WAT](https://webassembly.org/) format.
 * @param sourcecode - the Solid source text
 * @return the output text
 */
export function print(sourcecode: string, config: SolidConfig = CONFIG_DEFAULT): string {
	return new Program(sourcecode, config).print();
}

/**
 * Compile Solid source code into an executable binary format.
 * Output text is in [WASM](https://webassembly.org/) format.
 * @param sourcecode - the Solid source text
 * @return the output as a binary format
 */
export function compile(sourcecode: string, config: SolidConfig = CONFIG_DEFAULT): Uint8Array {
	return new Program(sourcecode, config).compile();
}
