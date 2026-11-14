import {assert_instanceof} from '../../../lib/index.ts';
import {
	type CplConfig,
	CONFIG_DEFAULT,
} from '../../../core/index.ts';
import type {SyntaxNodeType} from '../../utils-private.ts';
import {Validator} from '../../Validator.ts';
import {Type} from './Type.ts';



export class TypeAlias extends Type {
	public static override fromSource(src: string, config: CplConfig = CONFIG_DEFAULT): TypeAlias {
		const typ: Type = Type.fromSource(src, config);
		assert_instanceof(typ, TypeAlias);
		return typ;
	}


	public readonly id: bigint = Validator.cookTokenIdentifier(this.start_node.text);


	public constructor(start_node: SyntaxNodeType<'identifier'>) {
		super(start_node);
	}
}
