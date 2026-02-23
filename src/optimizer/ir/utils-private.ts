import {
	type Value,
	Trap,
	Const,
	Get,
} from './index.ts';



export function is_unit(value: Value): boolean {
	return (
		value instanceof Trap ||
		value instanceof Const ||
		value instanceof Get
	);
}
