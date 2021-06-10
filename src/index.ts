import {
	SolidConfig,
	CONFIG_DEFAULT,
} from './core/';
import {Builder} from './builder/';


/**
 * Compile Solid source code into a readable text format for development purposes.
 * Output text is in [WAT](https://webassembly.org/) format.
 * @param sourcecode - the Solid source text
 * @return the output text
 */
export function print(sourcecode: string, config: SolidConfig = CONFIG_DEFAULT): string {
	return new Builder(sourcecode, config).print();
}

/**
 * Compile Solid source code into an executable binary format.
 * Output text is in [WASM](https://webassembly.org/) format.
 * @param sourcecode - the Solid source text
 * @return the output as a binary format
 */
export function compile(sourcecode: string, config: SolidConfig = CONFIG_DEFAULT): Promise<Uint8Array> {
	return new Builder(sourcecode, config).compile();
}
