import type {Builder} from '../../../index.ts';
import {
	assert_instanceof,
	runOnceMethod,
	memoizeGetter,
} from '../../../lib/index.ts';
import {
	type CplConfig,
	CONFIG_DEFAULT,
} from '../../../core/index.ts';
import type {Serializable} from '../../../parser/index.ts';
import type {SyntaxNodeType} from '../../utils-private.ts';
import type {ParameterFunction} from '../ParameterFunction.ts';
import type {Block} from '../Block.ts';
import {Statement} from './Statement.ts';



export class DeclarationFunction extends Statement {
	public static override fromSource(src: string, config: CplConfig = CONFIG_DEFAULT): DeclarationFunction {
		const statement: Statement = Statement.fromSource(src, config);
		assert_instanceof(statement, DeclarationFunction);
		return statement;
	}


	public constructor(
		start_node: SyntaxNodeType<'declaration_function'>,
		identifier: Serializable | null,
		parameters: ParameterFunction[],
		block:      Block,
	) {
		super(start_node, {}, [...parameters, block]);
	}

	@memoizeGetter
	public override get hasBottomType(): boolean {
		throw new Error('`DeclarationFunction#hasBottomType` not yet supported.');
	}

	@runOnceMethod
	public override build(_builder: Builder): void {
		throw new Error('`DeclarationFunction#build` not yet supported.');
	}
}
