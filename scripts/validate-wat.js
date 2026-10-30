import * as fs from 'node:fs';
import * as path from 'node:path';
import {wasmOpt} from 'wasm-opt';



function rel_path(arg) {
	return path.join(import.meta.dirname, arg);
}

const inputs = Promise.all([
	'types.wat',
	'utils/mod.wat',
	'utils/capacity-needed.wat',
	'utils/compare-numbers.wat',
	'utils/stringify.wat',
	'utils/hash.wat',
	'ops.wat',
	'classes/Vect.wat',
	'classes/Value.wat',
	'classes/Property.wat',
	'classes/Case.wat',
	'classes/Record.wat',
	'classes/Object.wat',
	'classes/List.wat',
	'classes/Dict.wat',
	'classes/Map.wat',
].map((filename) => fs.promises.readFile(rel_path(`../src/vm/wat/${filename}`), 'utf8')));

const concatpath = rel_path('../dist/vm/module.wat');
await fs.promises.mkdir(rel_path('../dist/vm/'), {recursive: true});
await fs.promises.writeFile(concatpath, `
	(module $wat
		${(await inputs).join('')}
	)
`);

const {status, stderr} = await wasmOpt([
	concatpath,
	'-Os',
	'--enable-nontrapping-float-to-int',
	'--enable-simd',
	'--enable-tail-call',
	'--enable-reference-types',
	'--enable-multivalue',
	'--enable-gc',
]);
if (stderr) {
	if (stderr.startsWith('warning')) {
		console.warn(stderr);
	} else {
		console.error(new Error(stderr));
	}
}
process.exit(status);
