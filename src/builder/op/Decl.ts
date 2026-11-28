import type * as binaryen from 'binaryen.ts';
import type {CodeGenerator} from '../../index.ts';
import {SymbolSchemaVar} from '../../validator/index.ts';
import type {TYPE} from '../../typer/index.ts';
import type {Temp} from '../Builder.ts';
import {
	TypeName,
	ast_type_name,
} from './utils-public.ts';
import {OpCode} from './Opcode.ts';
import {Instruction} from './Instruction.ts';



function stringify_type_name(typename: TypeName): string | undefined {
	return new Map<TypeName, string>([
		[TypeName.NOTHING,   'nothing'],
		[TypeName.NULL,      'null'],
		[TypeName.BOOL,      'bool'],
		[TypeName.SYM,       'sym'],
		[TypeName.INT,       'int'],
		[TypeName.NAT,       'nat'],
		[TypeName.FLOAT,     'float'],
		[TypeName.STR,       'str'],
		[TypeName.TUPLE,     'tuple'],
		[TypeName.RECORD,    'record'],
		[TypeName.LIST,      'List'],
		[TypeName.DICT,      'Dict'],
		[TypeName.SET,       'Set'],
		[TypeName.MAP,       'Map'],
		[TypeName.OBJECT,    'Object'],
		[TypeName.EXCEPTION, 'Exception'],
		[TypeName.MAYBE,     'Maybe'],
		[TypeName.RESULT,    'Result'],
		[TypeName.FUNCTION,  'Function'],
		[TypeName.CLASS,     'Class'],
		[TypeName.ANYTHING,  'anything'],
	]).get(typename);
}



/** Declare a variable/local without initializing it. */
export class Decl extends Instruction {
	private readonly targetName: string;
	public  readonly targetType: TYPE.Type;

	public constructor(public readonly target: SymbolSchemaVar | Temp) {
		super(OpCode.DECL);
		if (this.target instanceof SymbolSchemaVar) {
			this.targetName = this.target.source;
			this.targetType = this.target.irType;
		} else {
			this.targetName = this.target.name;
			this.targetType = this.target.type;
		}
	}

	public override toString(): string {
		return super.toString(`<${stringify_type_name(ast_type_name(this.targetType))}>`, this.targetName);
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
