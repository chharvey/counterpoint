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



function memoizeTypeTypevalue<Param extends AST_TYPE.Type>(
	method:   (this: TypeVisitorTypevalue, arg: Param) => TYPE.Type,
	_context: ClassMethodDecoratorContext<TypeVisitorTypevalue, typeof method>,
): typeof method {
	return function (arg) {
		arg.typevalue = method.bind(this, arg);
		return arg.typevalue;
	};
}



export class TypeVisitorTypevalue extends AST_TYPE.TypeVisitor<TYPE.Type> {
	@memoizeTypeTypevalue
	public override visitConstant(typenode: AST_TYPE.Constant): TYPE.Type {
		return typenode.typerTypevalue;
	}

	@memoizeTypeTypevalue
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

	@memoizeTypeTypevalue
	public override visitTuple(typenode: AST_TYPE.Tuple): TYPE.Type {
		return new TYPE.Tuple(typenode.children.map((c) => ({
			type:     this.visit(c.typevalue),
			optional: c.optional,
		})));
	}

	@memoizeTypeTypevalue
	public override visitRecord(typenode: AST_TYPE.Record): TYPE.Type {
		return new TYPE.Record(new Map<bigint, EntryType>(typenode.children.map((c) => [
			c.key.id,
			{
				type:     this.visit(c.typevalue),
				optional: c.optional,
			},
		])));
	}

	@memoizeTypeTypevalue
	public override visitList(typenode: AST_TYPE.List): TYPE.Type {
		return new TYPE.List(this.visit(typenode.type));
	}

	@memoizeTypeTypevalue
	public override visitDict(typenode: AST_TYPE.Dict): TYPE.Type {
		return new TYPE.Dict(this.visit(typenode.type));
	}

	@memoizeTypeTypevalue
	public override visitSet(typenode: AST_TYPE.Set): TYPE.Type {
		return new TYPE.Set(this.visit(typenode.type));
	}

	@memoizeTypeTypevalue
	public override visitMap(typenode: AST_TYPE.Map): TYPE.Type {
		return new TYPE.Map(this.visit(typenode.antecedenttype), this.visit(typenode.consequenttype));
	}

	@memoizeTypeTypevalue
	public override visitAccess(typenode: AST_TYPE.Access): TYPE.Type {
		const entry: EntryType = get_entry_info(this.visit(typenode.base), typenode);
		return entry.optional ? new TYPE.Maybe(entry.type) : entry.type;
	}

	@memoizeTypeTypevalue
	public override visitCall(typenode: AST_TYPE.Call): TYPE.Type {
		if (!(typenode.base instanceof AST_TYPE.TypeAlias)) {
			throw new TypeErrorNotCallable(this.visit(typenode.base), typenode.base);
		}
		const constructor_schema: ConstructorSchema = CLASS_API.get(typenode.base.source as CallableInterfaceName)!;
		return constructor_schema.returnType(AST_TYPE.Call.checkGenericArgs(constructor_schema, typenode.args, typenode));
	}

	@memoizeTypeTypevalue
	public override visitOperationUnary(typenode: AST_TYPE.OperationUnary): TYPE.Type {
		const t: TYPE.Type = this.visit(typenode.operand);
		return (
			typenode.operator === Operator.MAYBE   ? new TYPE.Maybe(t) :
			typenode.operator === Operator.RESULT  ? new TYPE.Result(t) :
			typenode.operator === Operator.MUTABLE ? t instanceof TYPE.ReferenceType ? t.mutableOf() : assert.fail(new TypeErrorInvalidOperation(typenode)) :
			assert.fail(`TypeOperationUnary#eval did not expect the operator \`${Operator[typenode.operator]}\`.`)
		);
	}

	@memoizeTypeTypevalue
	public override visitOperationBinary(typenode: AST_TYPE.OperationBinary): TYPE.Type {
		const [t0, t1]: readonly TYPE.Type[] = typenode.children.map((operand) => this.visit(operand));
		return (
			typenode.operator === Operator.AND ? t0.intersect(t1) :
			typenode.operator === Operator.OR  ? t0.union    (t1) :
			assert.fail(`Did not expect the operator \`${Operator[typenode.operator]}\`.`)
		);
	}

	@memoizeTypeTypevalue
	public override visitFunction(typenode: AST_TYPE.Function): TYPE.Type {
		return new TYPE.Function(
			new TYPE.Tuple(typenode.paramPositTypes.map((c) => ({
				type:     this.visit(c.typevalue),
				optional: c.optional,
			}))),
			new TYPE.Record(new Map<bigint, EntryType>(typenode.paramNamedTypes.map((c) => [
				c.key.id,
				{
					type:     this.visit(c.typevalue),
					optional: c.optional,
				},
			]))),
			typenode.returnType ? this.visit(typenode.returnType) : undefined,
		);
	}

	public override defaultVisit(_typenode: AST_TYPE.Type): TYPE.Type {
		return TYPE.ANYTHING;
	}
}
