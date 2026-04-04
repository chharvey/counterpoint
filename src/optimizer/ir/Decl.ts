import * as assert from 'node:assert';
import type binaryen from 'binaryen';
import type {Builder} from '../../index.ts';
import {
	memoizeMethod,
	runOnceMethod,
} from '../../lib/index.ts';
import {SymbolSchemaVar} from '../../validator/index.ts';
import type {TYPE} from '../../typer/index.ts';
import type {Temp} from '../Optimizer.ts';
import type {Instruction} from './Instruction.ts';
import {
	OpCode,
	Opcode,
} from './Opcode.ts';
import {
	ast_type_name,
	stringify_type_name,
} from './TypeName.ts';
import type {Value} from './Value.ts';



/** Declare a variable/local without initializing it. */
export class Decl extends Opcode implements Instruction {
	private readonly targetType: TYPE.Type;

	public constructor(
		private readonly target: SymbolSchemaVar | Temp,
		private readonly value:  Value,
	) {
		super(OpCode.DECL);
		this.targetType = this.target instanceof SymbolSchemaVar ? this.target.irType : this.target.type;
	}

	public override toString(): string {
		return super.toString(
			`<${ stringify_type_name(ast_type_name(this.targetType)) }>`,
			this.target instanceof SymbolSchemaVar ? this.target.source : this.target.name,
			this.value,
		);
	}

	@runOnceMethod
	public override validate(): void {
		this.value.validate();
		return assert.ok(this.value.type.isSubtypeOf(this.targetType));
	}

	@memoizeMethod
	public override codegen(cg: Builder): binaryen.ExpressionRef {
		return cg.teeLocal(this.target, this.value.codegen(cg)).set();
	}

	/* eslint-disable */
	#optimizationStrategy(this: any, cg: Builder): number {
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
		if (!!this.assigned?.fold() && (!this.assignee || !this.writable)) return cg.module.nop();
		const value: binaryen.ExpressionRef = this.assigned?.build() ?? VALUE.NULL.build(cg);
		return this.assignee
			? cg.teeLocal(this.validator.getSymbol(this.assignee.id) as SymbolSchemaVar, value).set()
			: cg.module.drop(value);
	}
	/* eslint-enable */
}
