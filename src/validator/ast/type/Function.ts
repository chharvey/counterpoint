import * as xjs from 'extrajs';
import {AssignmentErrorDuplicateKey} from '../../../index.ts';
import {
	assert_instanceof,
	memoizeMethod,
} from '../../../lib/index.ts';
import {
	type CplConfig,
	CONFIG_DEFAULT,
} from '../../../core/index.ts';
import {TYPE} from '../../../typer/index.ts';
import type {SyntaxNodeType} from '../../utils-private.ts';
import type {Key} from '../Key.ts';
import type {ItemType} from '../ItemType.ts';
import type {PropertyType} from '../PropertyType.ts';
import {Type} from './Type.ts';
import {Tuple} from './Tuple.ts';
import {Record} from './Record.ts';



class TypeFunction extends Type {
	public static override fromSource(src: string, config: CplConfig = CONFIG_DEFAULT): TypeFunction {
		const typ: Type = Type.fromSource(src, config);
		assert_instanceof(typ, TypeFunction);
		return typ;
	}


	public constructor(
		start_node: SyntaxNodeType<'type_function'>,
		private readonly paramPositTypes: readonly ItemType[],
		private readonly paramNamedTypes: readonly PropertyType[],
	) {
		super(start_node, {}, [...paramPositTypes, ...paramNamedTypes]);
	}


	public override varCheck(): void {
		const keys: Key[] = this.paramNamedTypes.map((prop) => prop.key);
		xjs.Array.forEachAggregated(keys, (key, i) => {
			key.varCheck();
			if (keys.slice(0, i).find((k) => k.id === key.id)) {
				throw new AssignmentErrorDuplicateKey(key);
			}
		});
		return xjs.Array.forEachAggregated([...this.paramPositTypes, ...this.paramNamedTypes], (prop) => prop.typevalue.varCheck());
	}

	@memoizeMethod
	public override eval(): TYPE.Function {
		return new TYPE.Function(
			Tuple .prototype.eval.call({children: this.paramPositTypes}) as TYPE.Tuple,
			Record.prototype.eval.call({children: this.paramNamedTypes}) as TYPE.Record,
		);
	}
}
export {TypeFunction as Function};
