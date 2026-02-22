import {
	type Instruction,
	Trap,
	Get,
	Const,
} from './index.ts';



export function is_unit(instruction: Instruction): boolean {
	return (
		instruction instanceof Trap ||
		instruction instanceof Get ||
		instruction instanceof Const
	);
}
