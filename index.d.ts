/**
 * Compile Solid source code into a readable text format for development purposes.
 * Output text is in [WAT](https://webassembly.org/) format.
 * @param sourcecode - the Solid source text
 * @return the output text
 */
export declare function print(sourcecode: string): string;

/**
 * Compile Solid source code into an executable binary format.
 * Output text is in [WASM](https://webassembly.org/) format.
 * @param sourcecode - the Solid source text
 * @return the output as a binary format
 */
export declare function compile(sourcecode: string): Uint8Array;
