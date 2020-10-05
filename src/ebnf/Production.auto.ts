
			
			/*----------------------------------------------------------------/
			| WARNING: Do not manually update this file!
			| It is auto-generated via
			| </src/parser/Production.class.ts#Production#fromJSON>.
			| If you need to make updates, make them there.
			/----------------------------------------------------------------*/
		
			
			import type {
				NonemptyArray,
			} from '../types.d';
			import type {
				GrammarSymbol,
			} from '../parser/Grammar.class';
			import Production from '../parser/Production.class';
			import * as TERMINAL from './Terminal.class';
			
				export class ProductionParameterSet__0__List extends Production {
					static readonly instance: ProductionParameterSet__0__List = new ProductionParameterSet__0__List();
					get sequences(): NonemptyArray<NonemptyArray<GrammarSymbol>> {
						return [
							[TERMINAL.TerminalIdentifier.instance],[ProductionParameterSet__0__List.instance,',',TERMINAL.TerminalIdentifier.instance],
						];
					}
					random(): string[] {
						const random: number = Math.random();
						return (
							random < 1/2 ? [TERMINAL.TerminalIdentifier.instance.random()] :
							[...ProductionParameterSet__0__List.instance.random(),',',TERMINAL.TerminalIdentifier.instance.random()]
						);
					}
				}
			
				export class ProductionParameterSet extends Production {
					static readonly instance: ProductionParameterSet = new ProductionParameterSet();
					get sequences(): NonemptyArray<NonemptyArray<GrammarSymbol>> {
						return [
							['<',ProductionParameterSet__0__List.instance,'>'],
						];
					}
					random(): string[] {
						const random: number = Math.random();
						return (
							
							['<',...ProductionParameterSet__0__List.instance.random(),'>']
						);
					}
				}
			
				export class ProductionArgumentSet__0__List extends Production {
					static readonly instance: ProductionArgumentSet__0__List = new ProductionArgumentSet__0__List();
					get sequences(): NonemptyArray<NonemptyArray<GrammarSymbol>> {
						return [
							['+',TERMINAL.TerminalIdentifier.instance],['-',TERMINAL.TerminalIdentifier.instance],['?',TERMINAL.TerminalIdentifier.instance],[ProductionArgumentSet__0__List.instance,',','+',TERMINAL.TerminalIdentifier.instance],[ProductionArgumentSet__0__List.instance,',','-',TERMINAL.TerminalIdentifier.instance],[ProductionArgumentSet__0__List.instance,',','?',TERMINAL.TerminalIdentifier.instance],
						];
					}
					random(): string[] {
						const random: number = Math.random();
						return (
							random < 1/6 ? ['+',TERMINAL.TerminalIdentifier.instance.random()] : random < 2/6 ? ['-',TERMINAL.TerminalIdentifier.instance.random()] : random < 3/6 ? ['?',TERMINAL.TerminalIdentifier.instance.random()] : random < 4/6 ? [...ProductionArgumentSet__0__List.instance.random(),',','+',TERMINAL.TerminalIdentifier.instance.random()] : random < 5/6 ? [...ProductionArgumentSet__0__List.instance.random(),',','-',TERMINAL.TerminalIdentifier.instance.random()] :
							[...ProductionArgumentSet__0__List.instance.random(),',','?',TERMINAL.TerminalIdentifier.instance.random()]
						);
					}
				}
			
				export class ProductionArgumentSet extends Production {
					static readonly instance: ProductionArgumentSet = new ProductionArgumentSet();
					get sequences(): NonemptyArray<NonemptyArray<GrammarSymbol>> {
						return [
							['<',ProductionArgumentSet__0__List.instance,'>'],
						];
					}
					random(): string[] {
						const random: number = Math.random();
						return (
							
							['<',...ProductionArgumentSet__0__List.instance.random(),'>']
						);
					}
				}
			
				export class ProductionConditionSet__0__List extends Production {
					static readonly instance: ProductionConditionSet__0__List = new ProductionConditionSet__0__List();
					get sequences(): NonemptyArray<NonemptyArray<GrammarSymbol>> {
						return [
							[TERMINAL.TerminalIdentifier.instance,'+'],[TERMINAL.TerminalIdentifier.instance,'-'],[ProductionConditionSet__0__List.instance,',',TERMINAL.TerminalIdentifier.instance,'+'],[ProductionConditionSet__0__List.instance,',',TERMINAL.TerminalIdentifier.instance,'-'],
						];
					}
					random(): string[] {
						const random: number = Math.random();
						return (
							random < 1/4 ? [TERMINAL.TerminalIdentifier.instance.random(),'+'] : random < 2/4 ? [TERMINAL.TerminalIdentifier.instance.random(),'-'] : random < 3/4 ? [...ProductionConditionSet__0__List.instance.random(),',',TERMINAL.TerminalIdentifier.instance.random(),'+'] :
							[...ProductionConditionSet__0__List.instance.random(),',',TERMINAL.TerminalIdentifier.instance.random(),'-']
						);
					}
				}
			
				export class ProductionConditionSet extends Production {
					static readonly instance: ProductionConditionSet = new ProductionConditionSet();
					get sequences(): NonemptyArray<NonemptyArray<GrammarSymbol>> {
						return [
							['<',ProductionConditionSet__0__List.instance,'>'],
						];
					}
					random(): string[] {
						const random: number = Math.random();
						return (
							
							['<',...ProductionConditionSet__0__List.instance.random(),'>']
						);
					}
				}
			
				export class ProductionReference extends Production {
					static readonly instance: ProductionReference = new ProductionReference();
					get sequences(): NonemptyArray<NonemptyArray<GrammarSymbol>> {
						return [
							[TERMINAL.TerminalIdentifier.instance],[ProductionReference.instance,ProductionArgumentSet.instance],
						];
					}
					random(): string[] {
						const random: number = Math.random();
						return (
							random < 1/2 ? [TERMINAL.TerminalIdentifier.instance.random()] :
							[...ProductionReference.instance.random(),...ProductionArgumentSet.instance.random()]
						);
					}
				}
			
				export class ProductionUnit extends Production {
					static readonly instance: ProductionUnit = new ProductionUnit();
					get sequences(): NonemptyArray<NonemptyArray<GrammarSymbol>> {
						return [
							[TERMINAL.TerminalCharCode.instance],[TERMINAL.TerminalString.instance],[TERMINAL.TerminalCharClass.instance],[ProductionReference.instance],['(',ProductionDefinition.instance,')'],
						];
					}
					random(): string[] {
						const random: number = Math.random();
						return (
							random < 1/5 ? [TERMINAL.TerminalCharCode.instance.random()] : random < 2/5 ? [TERMINAL.TerminalString.instance.random()] : random < 3/5 ? [TERMINAL.TerminalCharClass.instance.random()] : random < 4/5 ? [...ProductionReference.instance.random()] :
							['(',...ProductionDefinition.instance.random(),')']
						);
					}
				}
			
				export class ProductionUnary extends Production {
					static readonly instance: ProductionUnary = new ProductionUnary();
					get sequences(): NonemptyArray<NonemptyArray<GrammarSymbol>> {
						return [
							[ProductionUnit.instance],[ProductionUnit.instance,'+'],[ProductionUnit.instance,'*'],[ProductionUnit.instance,'#'],[ProductionUnit.instance,'?'],[ProductionUnit.instance,'+','?'],[ProductionUnit.instance,'*','?'],[ProductionUnit.instance,'#','?'],
						];
					}
					random(): string[] {
						const random: number = Math.random();
						return (
							random < 1/8 ? [...ProductionUnit.instance.random()] : random < 2/8 ? [...ProductionUnit.instance.random(),'+'] : random < 3/8 ? [...ProductionUnit.instance.random(),'*'] : random < 4/8 ? [...ProductionUnit.instance.random(),'#'] : random < 5/8 ? [...ProductionUnit.instance.random(),'?'] : random < 6/8 ? [...ProductionUnit.instance.random(),'+','?'] : random < 7/8 ? [...ProductionUnit.instance.random(),'*','?'] :
							[...ProductionUnit.instance.random(),'#','?']
						);
					}
				}
			
				export class ProductionItem extends Production {
					static readonly instance: ProductionItem = new ProductionItem();
					get sequences(): NonemptyArray<NonemptyArray<GrammarSymbol>> {
						return [
							[ProductionUnary.instance],[ProductionConditionSet.instance,ProductionItem.instance],
						];
					}
					random(): string[] {
						const random: number = Math.random();
						return (
							random < 1/2 ? [...ProductionUnary.instance.random()] :
							[...ProductionConditionSet.instance.random(),...ProductionItem.instance.random()]
						);
					}
				}
			
				export class ProductionOrder extends Production {
					static readonly instance: ProductionOrder = new ProductionOrder();
					get sequences(): NonemptyArray<NonemptyArray<GrammarSymbol>> {
						return [
							[ProductionItem.instance],[ProductionOrder.instance,ProductionItem.instance],[ProductionOrder.instance,'.',ProductionItem.instance],
						];
					}
					random(): string[] {
						const random: number = Math.random();
						return (
							random < 1/3 ? [...ProductionItem.instance.random()] : random < 2/3 ? [...ProductionOrder.instance.random(),...ProductionItem.instance.random()] :
							[...ProductionOrder.instance.random(),'.',...ProductionItem.instance.random()]
						);
					}
				}
			
				export class ProductionConcat extends Production {
					static readonly instance: ProductionConcat = new ProductionConcat();
					get sequences(): NonemptyArray<NonemptyArray<GrammarSymbol>> {
						return [
							[ProductionOrder.instance],[ProductionConcat.instance,'&',ProductionOrder.instance],
						];
					}
					random(): string[] {
						const random: number = Math.random();
						return (
							random < 1/2 ? [...ProductionOrder.instance.random()] :
							[...ProductionConcat.instance.random(),'&',...ProductionOrder.instance.random()]
						);
					}
				}
			
				export class ProductionAltern extends Production {
					static readonly instance: ProductionAltern = new ProductionAltern();
					get sequences(): NonemptyArray<NonemptyArray<GrammarSymbol>> {
						return [
							[ProductionConcat.instance],[ProductionAltern.instance,'|',ProductionConcat.instance],
						];
					}
					random(): string[] {
						const random: number = Math.random();
						return (
							random < 1/2 ? [...ProductionConcat.instance.random()] :
							[...ProductionAltern.instance.random(),'|',...ProductionConcat.instance.random()]
						);
					}
				}
			
				export class ProductionDefinition extends Production {
					static readonly instance: ProductionDefinition = new ProductionDefinition();
					get sequences(): NonemptyArray<NonemptyArray<GrammarSymbol>> {
						return [
							[ProductionAltern.instance],
						];
					}
					random(): string[] {
						const random: number = Math.random();
						return (
							
							[...ProductionAltern.instance.random()]
						);
					}
				}
			
				export class ProductionNonterminalName extends Production {
					static readonly instance: ProductionNonterminalName = new ProductionNonterminalName();
					get sequences(): NonemptyArray<NonemptyArray<GrammarSymbol>> {
						return [
							[TERMINAL.TerminalIdentifier.instance],[ProductionNonterminalName.instance,ProductionParameterSet.instance],
						];
					}
					random(): string[] {
						const random: number = Math.random();
						return (
							random < 1/2 ? [TERMINAL.TerminalIdentifier.instance.random()] :
							[...ProductionNonterminalName.instance.random(),...ProductionParameterSet.instance.random()]
						);
					}
				}
			
				export class ProductionProduction extends Production {
					static readonly instance: ProductionProduction = new ProductionProduction();
					get sequences(): NonemptyArray<NonemptyArray<GrammarSymbol>> {
						return [
							[ProductionNonterminalName.instance,':::=',ProductionDefinition.instance,';'],[ProductionNonterminalName.instance,'::=',ProductionDefinition.instance,';'],[ProductionNonterminalName.instance,':::=','|',ProductionDefinition.instance,';'],[ProductionNonterminalName.instance,'::=','|',ProductionDefinition.instance,';'],
						];
					}
					random(): string[] {
						const random: number = Math.random();
						return (
							random < 1/4 ? [...ProductionNonterminalName.instance.random(),':::=',...ProductionDefinition.instance.random(),';'] : random < 2/4 ? [...ProductionNonterminalName.instance.random(),'::=',...ProductionDefinition.instance.random(),';'] : random < 3/4 ? [...ProductionNonterminalName.instance.random(),':::=','|',...ProductionDefinition.instance.random(),';'] :
							[...ProductionNonterminalName.instance.random(),'::=','|',...ProductionDefinition.instance.random(),';']
						);
					}
				}
			
				export class ProductionGrammar__0__List extends Production {
					static readonly instance: ProductionGrammar__0__List = new ProductionGrammar__0__List();
					get sequences(): NonemptyArray<NonemptyArray<GrammarSymbol>> {
						return [
							[ProductionProduction.instance],[ProductionGrammar__0__List.instance,ProductionProduction.instance],
						];
					}
					random(): string[] {
						const random: number = Math.random();
						return (
							random < 1/2 ? [...ProductionProduction.instance.random()] :
							[...ProductionGrammar__0__List.instance.random(),...ProductionProduction.instance.random()]
						);
					}
				}
			
				export class ProductionGrammar extends Production {
					static readonly instance: ProductionGrammar = new ProductionGrammar();
					get sequences(): NonemptyArray<NonemptyArray<GrammarSymbol>> {
						return [
							['\u0002','\u0003'],['\u0002',ProductionGrammar__0__List.instance,'\u0003'],
						];
					}
					random(): string[] {
						const random: number = Math.random();
						return (
							random < 1/2 ? ['\u0002','\u0003'] :
							['\u0002',...ProductionGrammar__0__List.instance.random(),'\u0003']
						);
					}
				}
			
		
		