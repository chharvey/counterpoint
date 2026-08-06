import * as assert from 'node:assert';
import type * as binaryen from 'binaryen.ts';
import type {CodeGenerator} from '../../index.ts';
import {
	memoizeMethod,
	runOnceMethod,
} from '../../lib/index.ts';
import {SymbolSchemaVar} from '../../validator/index.ts';
import type {TYPE} from '../../typer/index.ts';
import type {
	Temp,
	Builder,
} from '../Builder.ts';
import type {Interpreter} from '../Interpreter.ts';
import {ast_type_name} from './utils-public.ts';
import {stringify_type_name} from './utils-private.ts';
import {OpCode} from './Opcode.ts';
import {Instruction} from './Instruction.ts';
import type {Value} from './Value.ts';



/** Declare a variable/local without initializing it. */
export class Decl extends Instruction {
	private readonly targetType: TYPE.Type;
	private readonly value?:     Value;

	public constructor(target: SymbolSchemaVar, typ: TYPE.Type, value: Value);
	public constructor(target: Temp);
	public constructor(
		private readonly target: SymbolSchemaVar | Temp,
		typ?:   TYPE.Type,
		value?: Value,
	) {
		super(OpCode.DECL);
		this.targetType = this.target instanceof SymbolSchemaVar ? typ! : this.target.type;
		if (this.target instanceof SymbolSchemaVar) {
			this.value = value!;
		} else if (this.target.value) {
			this.value = this.target.value;
		}
	}

	public override toString(): string {
		return super.toString(
			`<${ stringify_type_name(ast_type_name(this.targetType)) }>`,
			this.target instanceof SymbolSchemaVar ? this.target.source : this.target.name,
			...(this.value ? [this.value] : []),
		);
	}

	@runOnceMethod
	public override validate(builder: Builder): void {
		// Use 'declared' only for declared, unset temps. Enforces setting before getting.
		// Uninitialized variables can use 'set' becuase they always have a `Maybe` value.
		builder.setLocalStatus(this.target, (this.target instanceof SymbolSchemaVar || this.value) ? 'set' : 'declared');
		this.value?.validate(builder);
		return this.value && assert.ok(this.value.type.isSubtypeOf(this.targetType), `${ this.value.type } must be a subtype of ${ this.targetType }.`);
	}

	public override interpret(interp: Interpreter): void {
		if (this.target instanceof SymbolSchemaVar) {
			interp.setLocalValue(this.target, this.value!.interpret(interp));
		} else if (this.target.value) {
			interp.setLocalValue(this.target, this.target.value.interpret(interp));
		}
	}

	@memoizeMethod
	public override codegen(cg: CodeGenerator): binaryen.ExpressionRef {
		return cg.teeLocal(this.target, this.value?.codegen(cg) ?? cg.vm.Value.newDefault()).set();
	}

	/* eslint-disable */
	#optimizationStrategy(this: any, cg: CodeGenerator): number {
		let VALUE: any;
		/**
		 * Foldable cases:
		 * - `val _:        T = assigned_foldable;`
		 * - `val assignee: T = assigned_foldable;`
		 *
		 * Non-Foldable cases:
		 * - `val mut assignee?: T;`
		 * - `val mut assignee:  T = assigned_foldable;`
		 * - `val     _:         T = assigned_non_foldable;`
		 * - `val     assignee:  T = assigned_non_foldable;`
		 * - `val mut assignee:  T = assigned_non_foldable;`
		 *
		 * Syntactically impossible cases (for completion):
		 * - `val _?:        T;`
		 * - `val assignee?: T;`
		 * - `val mut _?:    T;`
		 * - `val mut _:     T = assigned_foldable;`
		 * - `val mut _:     T = assigned_non_foldable;`
		 */
		if (!!this.assigned?.fold() && (!this.assignee || !this.writable)) return cg.mod.wasm.nop();
		const value: binaryen.ExpressionRef = this.assigned?.build() ?? VALUE.NULL.build(cg);
		return this.assignee
			? cg.teeLocal(this.validator.getSymbol(this.assignee.id) as SymbolSchemaVar, value).set()
			: cg.mod.wasm.drop(value);
	}
	/* eslint-enable */
}
