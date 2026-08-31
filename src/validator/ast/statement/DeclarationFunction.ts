import * as assert from 'node:assert';
import * as xjs from 'extrajs';
import {
	type Builder,
	OP,
	AssignmentErrorDuplicateDeclaration,
} from '../../../index.ts';
import {
	assert_instanceof,
	runOnceMethod,
	memoizeGetter,
} from '../../../lib/index.ts';
import {
	type CplConfig,
	CONFIG_DEFAULT,
} from '../../../core/index.ts';
import type {TYPE} from '../../../typer/index.ts';
import type {Serializable} from '../../../parser/index.ts';
import {SymbolSchemaFunc} from '../../index.ts';
import type {SyntaxNodeType} from '../../utils-private.ts';
import {Validator} from '../../Validator.ts';
import {check_unique_param_keys} from '../utils-private.ts';
import type {Functionlike} from '../Functionlike.ts';
import type {ParameterFunction} from '../ParameterFunction.ts';
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
		private readonly identifier: Serializable | null,
		public  readonly parameters: readonly ParameterFunction[],
		public  readonly returnType: AST_TYPE.Type | null,
		public  readonly block:      Block,
	) {
		super(start_node, {}, [...parameters, ...(returnType ? [returnType] : []), block]);
		if (this.identifier) {
			this.id = Validator.cookTokenIdentifier(this.identifier.source);
		}
	}


	@memoizeGetter
	public override get hasBottomType(): boolean {
		throw new Error('`DeclarationFunction#hasBottomType` not yet supported.');
	}

	public hoist(): void {
		if (this.identifier) {
			if (this.validator.hasSymbol(this.id!)) {
				throw new AssignmentErrorDuplicateDeclaration(this.identifier);
			}
			this.validator.addSymbol(new SymbolSchemaFunc(this.id!, this.identifier));
		}
	}

	public override varCheck(): void {
		xjs.Array.forEachAggregated(this.parameters, (param) => param.varCheck());
		check_unique_param_keys(this.parameters);
		return this.block.varCheck();
	}

	public override typeCheck(): void {
		super.typeCheck();
		const fn_type: TYPE.Type = EXPR.Function.prototype.type.call(this);
		if (this.identifier) {
			assert.ok(this.validator.hasSymbol(this.id!), `The validator symbol table should include ${ this.id }.`);
			(this.validator.getSymbol(this.id!) as SymbolSchemaFunc).type = fn_type;
		}
	}

	@runOnceMethod
	public override build(builder: Builder): void {
		if (this.identifier) {
			const label_func:    string = builder.newLabel();
			const label_endfunc: string = builder.newLabel();

			builder.terminateBlock(new OP.Goto(label_endfunc));
			builder.initiateBlock(label_func);
			this.parameters.forEach((param) => param.build(builder));
			this.block.build(builder);
			builder.pushInstruction(new OP.Drop(new OP.Trap())); // traps because this part should be unreachable (a return/throw statement should have been encountered in the function body by now)
			builder.terminateBlock(new OP.EndProgram());
			builder.initiateBlock(label_endfunc);
		}
	}
}
