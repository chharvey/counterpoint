import * as assert from 'node:assert';
import {assert_instanceof} from '../../../lib/index.ts';
import {
	type CplConfig,
	CONFIG_DEFAULT,
} from '../../../core/index.ts';
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
import {Statement} from './Statement.ts';



export class DeclarationFunction extends Statement implements Functionlike {
	public static override fromSource(src: string, config: CplConfig = CONFIG_DEFAULT): DeclarationFunction {
		const statement: Statement = Statement.fromSource(src, config);
		assert_instanceof(statement, DeclarationFunction);
		return statement;
	}


	public readonly id?: bigint;


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
}
