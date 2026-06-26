import * as assert from 'node:assert';
import * as xjs from 'extrajs';
import {
	type Builder,
	AssignmentErrorDuplicateDeclaration,
	AssignmentErrorDuplicateKey,
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
import {SymbolSchemaVar} from '../../index.ts';
import type {SyntaxNodeType} from '../../utils-private.ts';
import type {ParameterFunction} from '../ParameterFunction.ts';
import type {Block} from '../Block.ts';
import * as EXPR from '../expression/index.ts';
import {Statement} from './Statement.ts';



export class DeclarationFunction extends Statement {
	public static override fromSource(src: string, config: CplConfig = CONFIG_DEFAULT): DeclarationFunction {
		const statement: Statement = Statement.fromSource(src, config);
		assert_instanceof(statement, DeclarationFunction);
		return statement;
	}


	private id?: bigint;


	public constructor(
		start_node: SyntaxNodeType<'declaration_function'>,
		private readonly identifier: Serializable | null,
		public  readonly parameters: readonly ParameterFunction[],
		public  readonly block:      Block,
	) {
		super(start_node, {}, [...parameters, block]);
	}

	@memoizeGetter
	public override get hasBottomType(): boolean {
		throw new Error('`DeclarationFunction#hasBottomType` not yet supported.');
	}

	public override varCheck(): void {
		if (this.identifier) {
			this.id = this.validator.cookTokenIdentifier(this.identifier.source);
			if (this.validator.hasSymbol(this.id)) {
				throw new AssignmentErrorDuplicateDeclaration(this.identifier);
			}
			this.validator.addSymbol(new SymbolSchemaVar(
				this.id,
				this.identifier,
				false, // because it should not be manually reassigned
				false, // because it won’t ever be nullish upon accessing
			));
		}
		xjs.Array.forEachAggregated(this.parameters, (param) => param.varCheck());
		const key_ids: readonly bigint[] = this.parameters.filter((param) => param.named).map((param) => param.labelId!);
		xjs.Array.forEachAggregated(key_ids, (key_id, i) => {
			if (key_ids.slice(0, i).includes(key_id)) {
				throw new AssignmentErrorDuplicateKey(this.parameters[i].key ?? this.parameters[i].identifier!);
			}
		});
		return this.block.varCheck();
	}

	public override typeCheck(): void {
		super.typeCheck();
		const fn_type: TYPE.Type = EXPR.Function.prototype.type.call(this);
		if (this.identifier) {
			assert.ok(this.validator.hasSymbol(this.id!), `The validator symbol table should include ${ this.id }.`);
			(this.validator.getSymbol(this.id!) as SymbolSchemaVar).type = fn_type;
		}
	}

	@runOnceMethod
	public override build(_builder: Builder): void {
		throw new Error('`DeclarationFunction#build` not yet supported.');
	}
}
