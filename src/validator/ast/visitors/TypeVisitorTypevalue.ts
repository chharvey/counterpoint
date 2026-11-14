import * as assert from 'node:assert';
import {
	TypeErrorInvalidOperation,
	TypeErrorNotCallable,
} from '../../../index.ts';
import {assert_instanceof} from '../../../lib/index.ts';
import {
	type EntryType,
	TYPE,
} from '../../../typer/index.ts';
import {CoreLibName} from '../../../parser/index.ts';
import {
	type SymbolSchema,
	SymbolSchemaType,
} from '../../index.ts';
import {Operator} from '../../Operator.ts';
import {
	type CallableInterfaceName,
	type ConstructorSchema,
	CLASS_API,
	get_entry_info,
} from '../utils-private.ts';
import * as AST_TYPE from '../type/index.ts';



export class TypeVisitorTypevalue extends AST_TYPE.TypeVisitor<TYPE.Type> {
	public override visitConstant(typenode: AST_TYPE.Constant): TYPE.Type {
		return typenode.typerTypevalue;
	}

	public override visitTypeAlias(typenode: AST_TYPE.TypeAlias): TYPE.Type {
		if (typenode.source === CoreLibName.OBJECT) {
			return TYPE.OBJ;
		}
		if (typenode.source === CoreLibName.EXCEPTION) {
			return TYPE.EXCP;
		}
		if (typenode.source === CoreLibName.CLASS) {
			return TYPE.CLASS;
		}
		assert.ok(typenode.validator.hasSymbol(typenode.id), `Expected ${typenode.source} (${typenode.id}) to be in the symbol table.`);
		const symbol: SymbolSchema = typenode.validator.getSymbol(typenode.id)!;
		assert_instanceof(symbol, SymbolSchemaType);
		return symbol.typevalue;
	}

	public override visitTuple(typenode: AST_TYPE.Tuple): TYPE.Type {
		return new TYPE.Tuple(typenode.children.map((c) => ({
			type:     this.visit(c.typevalue),
			optional: c.optional,
		})));
	}

	public override visitRecord(typenode: AST_TYPE.Record): TYPE.Type {
		return new TYPE.Record(new Map<bigint, EntryType>(typenode.children.map((c) => [
			c.key.id,
			{
				type:     this.visit(c.typevalue),
				optional: c.optional,
			},
		])));
	}

	public override visitList(typenode: AST_TYPE.List): TYPE.Type {
		return new TYPE.List(this.visit(typenode.type));
	}

	public override visitDict(typenode: AST_TYPE.Dict): TYPE.Type {
		return new TYPE.Dict(this.visit(typenode.type));
	}

	public override visitSet(typenode: AST_TYPE.Set): TYPE.Type {
		return new TYPE.Set(this.visit(typenode.type));
	}

	public override visitMap(typenode: AST_TYPE.Map): TYPE.Type {
		return new TYPE.Map(this.visit(typenode.antecedenttype), this.visit(typenode.consequenttype));
	}

	public override visitAccess(typenode: AST_TYPE.Access): TYPE.Type {
		const entry: EntryType = get_entry_info(this.visit(typenode.base), typenode);
		return entry.optional ? new TYPE.Maybe(entry.type) : entry.type;
	}

	public override visitCall(typenode: AST_TYPE.Call): TYPE.Type {
		if (!(typenode.base instanceof AST_TYPE.TypeAlias)) {
			throw new TypeErrorNotCallable(this.visit(typenode.base), typenode.base);
		}
		const constructor_schema: ConstructorSchema = CLASS_API.get(typenode.base.source as CallableInterfaceName)!;
		return constructor_schema.returnType(AST_TYPE.Call.checkGenericArgs(constructor_schema, typenode.args, typenode));
	}

	public override visitOperationUnary(typenode: AST_TYPE.OperationUnary): TYPE.Type {
		const t: TYPE.Type = this.visit(typenode.operand);
		return (
			typenode.operator === Operator.MAYBE   ? new TYPE.Maybe(t) :
			typenode.operator === Operator.RESULT  ? new TYPE.Result(t) :
			typenode.operator === Operator.MUTABLE ? t instanceof TYPE.ReferenceType ? t.mutableOf() : assert.fail(new TypeErrorInvalidOperation(typenode)) :
			assert.fail(`TypeOperationUnary#eval did not expect the operator \`${Operator[typenode.operator]}\`.`)
		);
	}

	public override visitOperationBinary(typenode: AST_TYPE.OperationBinary): TYPE.Type {
		const [t0, t1]: readonly TYPE.Type[] = typenode.children.map((operand) => this.visit(operand));
		return (
			typenode.operator === Operator.AND ? t0.intersect(t1) :
			typenode.operator === Operator.OR  ? t0.union    (t1) :
			assert.fail(`Did not expect the operator \`${Operator[typenode.operator]}\`.`)
		);
	}

	public override visitFunction(typenode: AST_TYPE.Function): TYPE.Type {
		return new TYPE.Function(
			this.visitTuple  ({children: typenode.paramPositTypes} as AST_TYPE.Tuple)  as TYPE.Tuple,
			this.visitRecord ({children: typenode.paramNamedTypes} as AST_TYPE.Record) as TYPE.Record,
			typenode.returnType ? this.visit(typenode.returnType) : undefined,
		);
	}

	public override defaultVisit(_typenode: AST_TYPE.Type): TYPE.Type {
		return TYPE.ANYTHING;
	}
}
