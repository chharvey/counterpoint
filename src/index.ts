export * from './lib/index.ts';
export * from './core/index.ts';
export * from './parser/index.ts';
export * from './validator/index.ts';
export * from './typer/index.ts';
export * from './optimizer/index.ts';
export * from './code-generator/index.ts';
export * from './builder/index.ts';
export {
	Stack,
	type Instruction as VMInstruction,
	InstructionTable,
	Builder as VMBuilder,
	Machine,
} from './vm/index.js';
export * from './error/index.ts';
