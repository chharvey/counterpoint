import * as assert from 'node:assert';
import {TypeErrorAmbiguousOverload} from '../../../index.ts';
import {assert_instanceof} from '../../../lib/index.ts';
import {
	type CplConfig,
	CONFIG_DEFAULT,
} from '../../../core/index.ts';
import {TYPE} from '../../../typer/index.ts';
import type {Serializable} from '../../../parser/index.ts';
import {SymbolSchemaFunc} from '../../index.ts';
import type {SyntaxNodeType} from '../../utils-private.ts';
import {Validator} from '../../Validator.ts';
import {
	type Functionlike,
	Functionlike_varCheck,
} from '../Functionlike.ts';
import type {ParameterFunction} from '../ParameterFunction.ts';
import type {Capture} from '../Capture.ts';
import type {Block} from '../Block.ts';
import type * as AST_TYPE from '../type/index.ts';
import * as EXPR from '../expression/index.ts';
import {Statement} from './Statement.ts';



export class DeclarationFunction extends Statement implements Functionlike {
	public static override fromSource(src: string, config: CplConfig = CONFIG_DEFAULT): DeclarationFunction {
		const statement: Statement = Statement.fromSource(src, config);
		assert_instanceof(statement, DeclarationFunction);
		return statement;
	}


	private readonly id?: bigint;


	public constructor(
		start_node: SyntaxNodeType<'declaration_function'>,
		public readonly identifier: Serializable | null,
		public readonly parameters: readonly ParameterFunction[],
		public readonly captures:   readonly Capture[],
		public readonly returnType: AST_TYPE.Type | null,
		public readonly block:      Block,
	) {
		super(start_node, {}, [...parameters, ...captures, ...(returnType ? [returnType] : []), block]);
		if (this.identifier) {
			this.id = Validator.cookTokenIdentifier(this.identifier.source);
		}
	}


	public hoist(): void {
		if (this.identifier) {
			if (this.validator.hasSymbol(this.id!)) {
				return assert.ok(this.validator.getSymbol(this.id!) instanceof SymbolSchemaFunc, 'Only function names should be hoisted.');
			}
			this.validator.addSymbol(new SymbolSchemaFunc(this.id!, this.identifier));
		}
	}

	public override varCheck(): void {
		this.hoist();
		return Functionlike_varCheck.call(this);
	}

	public override typeCheck(): void {
		super.typeCheck();
		const fn_type: TYPE.Type = EXPR.Function.prototype.type.call(this);
		assert_instanceof(fn_type, TYPE.Function);
		if (this.identifier) {
			assert.ok(this.validator.hasSymbol(this.id!), `The validator symbol table should include ${this.id}.`);
			const schema = this.validator.getSymbol(this.id!) as SymbolSchemaFunc;
			if (schema.types.includes(fn_type) || schema.types.find((t) => t instanceof TYPE.Function && t.isMoreSpecificThan(fn_type) && fn_type.isMoreSpecificThan(t))) {
				// if there exists an identically-typed overload, as static dispatch won’t know which one to choose
				throw new TypeErrorAmbiguousOverload(this);
			} else {
				schema.types.push(fn_type);
			}
		}
	}
}
