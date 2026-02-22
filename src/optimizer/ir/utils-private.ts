import {
	type Value,
	Trap,
	Get,
	Const,
} from './index.ts';



export function is_unit(value: Value): boolean {
	return (
		value instanceof Trap ||
		value instanceof Get ||
		value instanceof Const
	);
}
