import {TYPE} from '../../typer/index.ts';
import {Value} from './Value.ts';



/** Immediately halt the runtime program. */
export class Trap extends Value {
	public override get type(): TYPE.Type {
		return TYPE.NOTHING;
	};

	public override toString(): string {
		return '(TRAP)';
	}
}
