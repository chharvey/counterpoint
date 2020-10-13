
			
			/*----------------------------------------------------------------/
			| WARNING: Do not manually update this file!
			| It is auto-generated via
			| </src/parser/Production.class.ts#Production#fromJSON>.
			| If you need to make updates, make them there.
			/----------------------------------------------------------------*/
		
			import {
				GrammarSymbol,
				Production,
			} from '@chharvey/parser';
			import type {
				NonemptyArray,
			} from '../types.d';
			import * as TERMINAL from './Terminal.class';
			
			export class ProductionParameterSet__0__List extends Production {
				static readonly instance: ProductionParameterSet__0__List = new ProductionParameterSet__0__List();
				/** @implements Production */
				get sequences(): NonemptyArray<NonemptyArray<GrammarSymbol>> {
					return [
						[TERMINAL.TerminalIdentifier.instance],[ProductionParameterSet__0__List.instance,',',TERMINAL.TerminalIdentifier.instance],
					];
				}
			}
		
			export class ProductionParameterSet extends Production {
				static readonly instance: ProductionParameterSet = new ProductionParameterSet();
				/** @implements Production */
				get sequences(): NonemptyArray<NonemptyArray<GrammarSymbol>> {
					return [
						["<",ProductionParameterSet__0__List.instance,">"],
					];
				}
			}
		
			export class ProductionArgumentSet__0__List extends Production {
				static readonly instance: ProductionArgumentSet__0__List = new ProductionArgumentSet__0__List();
				/** @implements Production */
				get sequences(): NonemptyArray<NonemptyArray<GrammarSymbol>> {
					return [
						["+",TERMINAL.TerminalIdentifier.instance],[ProductionArgumentSet__0__List.instance,',',"+",TERMINAL.TerminalIdentifier.instance],["-",TERMINAL.TerminalIdentifier.instance],[ProductionArgumentSet__0__List.instance,',',"-",TERMINAL.TerminalIdentifier.instance],["?",TERMINAL.TerminalIdentifier.instance],[ProductionArgumentSet__0__List.instance,',',"?",TERMINAL.TerminalIdentifier.instance],
					];
				}
			}
		
			export class ProductionArgumentSet extends Production {
				static readonly instance: ProductionArgumentSet = new ProductionArgumentSet();
				/** @implements Production */
				get sequences(): NonemptyArray<NonemptyArray<GrammarSymbol>> {
					return [
						["<",ProductionArgumentSet__0__List.instance,">"],
					];
				}
			}
		
			export class ProductionConditionSet__0__List extends Production {
				static readonly instance: ProductionConditionSet__0__List = new ProductionConditionSet__0__List();
				/** @implements Production */
				get sequences(): NonemptyArray<NonemptyArray<GrammarSymbol>> {
					return [
						[TERMINAL.TerminalIdentifier.instance,"+"],[ProductionConditionSet__0__List.instance,',',TERMINAL.TerminalIdentifier.instance,"+"],[TERMINAL.TerminalIdentifier.instance,"-"],[ProductionConditionSet__0__List.instance,',',TERMINAL.TerminalIdentifier.instance,"-"],
					];
				}
			}
		
			export class ProductionConditionSet extends Production {
				static readonly instance: ProductionConditionSet = new ProductionConditionSet();
				/** @implements Production */
				get sequences(): NonemptyArray<NonemptyArray<GrammarSymbol>> {
					return [
						["<",ProductionConditionSet__0__List.instance,">"],
					];
				}
			}
		
			export class ProductionReference extends Production {
				static readonly instance: ProductionReference = new ProductionReference();
				/** @implements Production */
				get sequences(): NonemptyArray<NonemptyArray<GrammarSymbol>> {
					return [
						[TERMINAL.TerminalIdentifier.instance],[ProductionReference.instance,ProductionArgumentSet.instance],
					];
				}
			}
		
			export class ProductionUnit extends Production {
				static readonly instance: ProductionUnit = new ProductionUnit();
				/** @implements Production */
				get sequences(): NonemptyArray<NonemptyArray<GrammarSymbol>> {
					return [
						[TERMINAL.TerminalCharCode.instance],[TERMINAL.TerminalString.instance],[TERMINAL.TerminalCharClass.instance],[ProductionReference.instance],["(",ProductionDefinition.instance,")"],
					];
				}
			}
		
			export class ProductionUnary extends Production {
				static readonly instance: ProductionUnary = new ProductionUnary();
				/** @implements Production */
				get sequences(): NonemptyArray<NonemptyArray<GrammarSymbol>> {
					return [
						[ProductionUnit.instance],[ProductionUnit.instance,"?"],[ProductionUnit.instance,"+"],[ProductionUnit.instance,"+","?"],[ProductionUnit.instance,"*"],[ProductionUnit.instance,"*","?"],[ProductionUnit.instance,"#"],[ProductionUnit.instance,"#","?"],
					];
				}
			}
		
			export class ProductionItem extends Production {
				static readonly instance: ProductionItem = new ProductionItem();
				/** @implements Production */
				get sequences(): NonemptyArray<NonemptyArray<GrammarSymbol>> {
					return [
						[ProductionUnary.instance],[ProductionConditionSet.instance,ProductionItem.instance],
					];
				}
			}
		
			export class ProductionOrder extends Production {
				static readonly instance: ProductionOrder = new ProductionOrder();
				/** @implements Production */
				get sequences(): NonemptyArray<NonemptyArray<GrammarSymbol>> {
					return [
						[ProductionItem.instance],[ProductionOrder.instance,ProductionItem.instance],[ProductionOrder.instance,".",ProductionItem.instance],
					];
				}
			}
		
			export class ProductionConcat extends Production {
				static readonly instance: ProductionConcat = new ProductionConcat();
				/** @implements Production */
				get sequences(): NonemptyArray<NonemptyArray<GrammarSymbol>> {
					return [
						[ProductionOrder.instance],[ProductionConcat.instance,"&",ProductionOrder.instance],
					];
				}
			}
		
			export class ProductionAltern extends Production {
				static readonly instance: ProductionAltern = new ProductionAltern();
				/** @implements Production */
				get sequences(): NonemptyArray<NonemptyArray<GrammarSymbol>> {
					return [
						[ProductionConcat.instance],[ProductionAltern.instance,"|",ProductionConcat.instance],
					];
				}
			}
		
			export class ProductionDefinition extends Production {
				static readonly instance: ProductionDefinition = new ProductionDefinition();
				/** @implements Production */
				get sequences(): NonemptyArray<NonemptyArray<GrammarSymbol>> {
					return [
						[ProductionAltern.instance],
					];
				}
			}
		
			export class ProductionNonterminalName extends Production {
				static readonly instance: ProductionNonterminalName = new ProductionNonterminalName();
				/** @implements Production */
				get sequences(): NonemptyArray<NonemptyArray<GrammarSymbol>> {
					return [
						[TERMINAL.TerminalIdentifier.instance],[ProductionNonterminalName.instance,ProductionParameterSet.instance],
					];
				}
			}
		
			export class ProductionProduction extends Production {
				static readonly instance: ProductionProduction = new ProductionProduction();
				/** @implements Production */
				get sequences(): NonemptyArray<NonemptyArray<GrammarSymbol>> {
					return [
						[ProductionNonterminalName.instance,":::=",ProductionDefinition.instance,";"],[ProductionNonterminalName.instance,":::=","|",ProductionDefinition.instance,";"],[ProductionNonterminalName.instance,"::=",ProductionDefinition.instance,";"],[ProductionNonterminalName.instance,"::=","|",ProductionDefinition.instance,";"],
					];
				}
			}
		
			export class ProductionGrammar__0__List extends Production {
				static readonly instance: ProductionGrammar__0__List = new ProductionGrammar__0__List();
				/** @implements Production */
				get sequences(): NonemptyArray<NonemptyArray<GrammarSymbol>> {
					return [
						[ProductionProduction.instance],[ProductionGrammar__0__List.instance,ProductionProduction.instance],
					];
				}
			}
		
			export class ProductionGrammar extends Production {
				static readonly instance: ProductionGrammar = new ProductionGrammar();
				/** @implements Production */
				get sequences(): NonemptyArray<NonemptyArray<GrammarSymbol>> {
					return [
						['\u0002','\u0003'],['\u0002',ProductionGrammar__0__List.instance,'\u0003'],
					];
				}
			}
		
		