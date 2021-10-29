export enum Op {
	PLUS,
	HASH,
	OPT,
	ORDER,
	CONCAT,
	ALTERN,
}



export type Unop =
	| Op.PLUS
	| Op.HASH
	| Op.OPT
;



export type Binop =
	| Op.ORDER
	| Op.CONCAT
	| Op.ALTERN
;
