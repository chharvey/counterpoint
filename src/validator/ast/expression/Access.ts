import {TypeErrorInvalidOperation} from '../../../index.ts';
import {
	assert_instanceof,
	memoizeMethod,
} from '../../../lib/index.ts';
import {
	type CplConfig,
	CONFIG_DEFAULT,
} from '../../../core/index.ts';
import {
	type EntryType,
	TYPE,
} from '../../../typer/index.ts';
import type {
	SyntaxNodeType,
	SyntaxNodeFamily,
} from '../../utils-private.ts';
import {
	Operator,
	type ValidAccessOperator,
} from '../../Operator.ts';
import {get_entry_info} from '../utils-private.ts';
import type {Index} from '../Index-.ts';
import type {Key} from '../Key.ts';
import {Expression} from './Expression.ts';
import type {Reassignable} from './Reassignable.ts';



export class Access extends Expression implements Reassignable {
	public static override fromSource(src: string, config: CplConfig = CONFIG_DEFAULT): Access {
		const expression: Expression = Expression.fromSource(src, config);
		assert_instanceof(expression, Access);
		return expression;
	}

	public constructor(
		start_node:
			| SyntaxNodeType<'expression_compound'>
			| SyntaxNodeFamily<'assignee', ['break', 'return']>,

		public readonly kind:     ValidAccessOperator,
		public readonly base:     Expression,
		public readonly accessor: Index | Key | Expression,
	) {
		super(start_node, {kind}, [base, accessor]);
		if (this.kind === Operator.DOT_RESULT) {
			throw new TypeError(`Operator ${this.kind} not yet supported.`);
		}
	}

	@memoizeMethod
	public override type(): TYPE.Type {
		const base_type: TYPE.Type = this.base.type();
		if (base_type.isBottomType) {
			return TYPE.NOTHING;
		}
		if (this.kind === Operator.DOT_MAYBE && !(base_type instanceof TYPE.Maybe)) {
			if (!(this.accessor instanceof Expression)) { // TODO: remove expression access
				throw new TypeErrorInvalidOperation(this);
			}
		}
		if (this.kind === Operator.DOT_RESULT) {
			throw new SyntaxError('Operator `!.` not yet supported.');
		}
		const entry: EntryType = get_entry_info(base_type, this);
		return entry.optional ? new TYPE.Maybe(entry.type) : entry.type;
	}

	/**
	 * @inheritdoc
	 * @implements Reassignable
	 */
	@memoizeMethod
	public writeType(): TYPE.Type {
		this.type(); // re-assert any assumptions and re-throw any errors
		return get_entry_info(this.base.type(), this, true).type;
	}
}
