import type * as binaryen from 'binaryen.ts';



export type FuncImportData = {
	readonly name:   string,
	readonly param:  binaryen.Type,
	readonly result: binaryen.Type,
};



export interface HasFuncData {
	get funcImportDataMap(): ReadonlyMap<string, FuncImportData>;
}
