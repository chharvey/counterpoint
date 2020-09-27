
			
			/*----------------------------------------------------------------/
			| WARNING: Do not manually update this file!
			| It is auto-generated via
			| </src/parser/Production.class.ts#Production#fromJSON>.
			| If you need to make updates, make them there.
			/----------------------------------------------------------------*/
		
			
			import type {
				KleenePlus,
			} from '../types.d';
			import type {
				GrammarSymbol,
			} from '../parser/Grammar.class';
			import Production from '../parser/Production.class';
			import * as TERMINAL from './Terminal.class';
			
				export class ProductionNonterminalName extends Production {
					static readonly instance: ProductionNonterminalName = new ProductionNonterminalName();
					get sequences(): KleenePlus<KleenePlus<GrammarSymbol>> {
						return [
							[TERMINAL.TerminalIdentifier.instance],[TERMINAL.TerminalIdentifier.instance,'<',ProductionIdentifier__CSL.instance,'>'],
						];
					}
					random(): string[] {
						const random: number = Math.random();
						return (
							random < 1/2 ? [TERMINAL.TerminalIdentifier.instance.random()] :
							[TERMINAL.TerminalIdentifier.instance.random(),'<',...ProductionIdentifier__CSL.instance.random(),'>']
						);
					}
				}
			
				export class ProductionIdentifier__CSL extends Production {
					static readonly instance: ProductionIdentifier__CSL = new ProductionIdentifier__CSL();
					get sequences(): KleenePlus<KleenePlus<GrammarSymbol>> {
						return [
							[TERMINAL.TerminalIdentifier.instance],[ProductionIdentifier__CSL.instance,',',TERMINAL.TerminalIdentifier.instance],
						];
					}
					random(): string[] {
						const random: number = Math.random();
						return (
							random < 1/2 ? [TERMINAL.TerminalIdentifier.instance.random()] :
							[...ProductionIdentifier__CSL.instance.random(),',',TERMINAL.TerminalIdentifier.instance.random()]
						);
					}
				}
			
				export class ProductionArgumentSet extends Production {
					static readonly instance: ProductionArgumentSet = new ProductionArgumentSet();
					get sequences(): KleenePlus<KleenePlus<GrammarSymbol>> {
						return [
							['<',ProductionArgumentSet__0__CSL.instance,'>'],
						];
					}
					random(): string[] {
						const random: number = Math.random();
						return (
							
							['<',...ProductionArgumentSet__0__CSL.instance.random(),'>']
						);
					}
				}
			
				export class ProductionArgumentSet__0__CSL extends Production {
					static readonly instance: ProductionArgumentSet__0__CSL = new ProductionArgumentSet__0__CSL();
					get sequences(): KleenePlus<KleenePlus<GrammarSymbol>> {
						return [
							['+',TERMINAL.TerminalIdentifier.instance],['-',TERMINAL.TerminalIdentifier.instance],['?',TERMINAL.TerminalIdentifier.instance],[ProductionArgumentSet__0__CSL.instance,',','+',TERMINAL.TerminalIdentifier.instance],[ProductionArgumentSet__0__CSL.instance,',','-',TERMINAL.TerminalIdentifier.instance],[ProductionArgumentSet__0__CSL.instance,',','?',TERMINAL.TerminalIdentifier.instance],
						];
					}
					random(): string[] {
						const random: number = Math.random();
						return (
							random < 1/6 ? ['+',TERMINAL.TerminalIdentifier.instance.random()] : random < 2/6 ? ['-',TERMINAL.TerminalIdentifier.instance.random()] : random < 3/6 ? ['?',TERMINAL.TerminalIdentifier.instance.random()] : random < 4/6 ? [...ProductionArgumentSet__0__CSL.instance.random(),',','+',TERMINAL.TerminalIdentifier.instance.random()] : random < 5/6 ? [...ProductionArgumentSet__0__CSL.instance.random(),',','-',TERMINAL.TerminalIdentifier.instance.random()] :
							[...ProductionArgumentSet__0__CSL.instance.random(),',','?',TERMINAL.TerminalIdentifier.instance.random()]
						);
					}
				}
			
				export class ProductionConditionSet extends Production {
					static readonly instance: ProductionConditionSet = new ProductionConditionSet();
					get sequences(): KleenePlus<KleenePlus<GrammarSymbol>> {
						return [
							['<',ProductionConditionSet__0__CSL.instance,'>'],
						];
					}
					random(): string[] {
						const random: number = Math.random();
						return (
							
							['<',...ProductionConditionSet__0__CSL.instance.random(),'>']
						);
					}
				}
			
				export class ProductionConditionSet__0__CSL extends Production {
					static readonly instance: ProductionConditionSet__0__CSL = new ProductionConditionSet__0__CSL();
					get sequences(): KleenePlus<KleenePlus<GrammarSymbol>> {
						return [
							[TERMINAL.TerminalIdentifier.instance,'+'],[TERMINAL.TerminalIdentifier.instance,'-'],[ProductionConditionSet__0__CSL.instance,',',TERMINAL.TerminalIdentifier.instance,'+'],[ProductionConditionSet__0__CSL.instance,',',TERMINAL.TerminalIdentifier.instance,'-'],
						];
					}
					random(): string[] {
						const random: number = Math.random();
						return (
							random < 1/4 ? [TERMINAL.TerminalIdentifier.instance.random(),'+'] : random < 2/4 ? [TERMINAL.TerminalIdentifier.instance.random(),'-'] : random < 3/4 ? [...ProductionConditionSet__0__CSL.instance.random(),',',TERMINAL.TerminalIdentifier.instance.random(),'+'] :
							[...ProductionConditionSet__0__CSL.instance.random(),',',TERMINAL.TerminalIdentifier.instance.random(),'-']
						);
					}
				}
			
				export class ProductionNonterminalRef extends Production {
					static readonly instance: ProductionNonterminalRef = new ProductionNonterminalRef();
					get sequences(): KleenePlus<KleenePlus<GrammarSymbol>> {
						return [
							[TERMINAL.TerminalIdentifier.instance],[ProductionNonterminalRef.instance,ProductionArgumentSet.instance],
						];
					}
					random(): string[] {
						const random: number = Math.random();
						return (
							random < 1/2 ? [TERMINAL.TerminalIdentifier.instance.random()] :
							[...ProductionNonterminalRef.instance.random(),...ProductionArgumentSet.instance.random()]
						);
					}
				}
			
				export class ProductionUnit extends Production {
					static readonly instance: ProductionUnit = new ProductionUnit();
					get sequences(): KleenePlus<KleenePlus<GrammarSymbol>> {
						return [
							[TERMINAL.TerminalCharCode.instance],[TERMINAL.TerminalString.instance],[TERMINAL.TerminalCharClass.instance],[ProductionNonterminalRef.instance],['(',ProductionDefinition.instance,')'],
						];
					}
					random(): string[] {
						const random: number = Math.random();
						return (
							random < 1/5 ? [TERMINAL.TerminalCharCode.instance.random()] : random < 2/5 ? [TERMINAL.TerminalString.instance.random()] : random < 3/5 ? [TERMINAL.TerminalCharClass.instance.random()] : random < 4/5 ? [...ProductionNonterminalRef.instance.random()] :
							['(',...ProductionDefinition.instance.random(),')']
						);
					}
				}
			
				export class ProductionUnary extends Production {
					static readonly instance: ProductionUnary = new ProductionUnary();
					get sequences(): KleenePlus<KleenePlus<GrammarSymbol>> {
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
					get sequences(): KleenePlus<KleenePlus<GrammarSymbol>> {
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
					get sequences(): KleenePlus<KleenePlus<GrammarSymbol>> {
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
					get sequences(): KleenePlus<KleenePlus<GrammarSymbol>> {
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
					get sequences(): KleenePlus<KleenePlus<GrammarSymbol>> {
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
					get sequences(): KleenePlus<KleenePlus<GrammarSymbol>> {
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
			
				export class ProductionProduction extends Production {
					static readonly instance: ProductionProduction = new ProductionProduction();
					get sequences(): KleenePlus<KleenePlus<GrammarSymbol>> {
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
			
				export class ProductionGrammar extends Production {
					static readonly instance: ProductionGrammar = new ProductionGrammar();
					get sequences(): KleenePlus<KleenePlus<GrammarSymbol>> {
						return [
							['\u0002','\u0003'],['\u0002',ProductionProduction__List.instance,'\u0003'],
						];
					}
					random(): string[] {
						const random: number = Math.random();
						return (
							random < 1/2 ? ['\u0002','\u0003'] :
							['\u0002',...ProductionProduction__List.instance.random(),'\u0003']
						);
					}
				}
			
				export class ProductionProduction__List extends Production {
					static readonly instance: ProductionProduction__List = new ProductionProduction__List();
					get sequences(): KleenePlus<KleenePlus<GrammarSymbol>> {
						return [
							[ProductionProduction.instance],[ProductionProduction__List.instance,ProductionProduction.instance],
						];
					}
					random(): string[] {
						const random: number = Math.random();
						return (
							random < 1/2 ? [...ProductionProduction.instance.random()] :
							[...ProductionProduction__List.instance.random(),...ProductionProduction.instance.random()]
						);
					}
				}
			
		
		