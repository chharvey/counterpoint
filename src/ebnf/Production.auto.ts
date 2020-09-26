
			
		/*-------------------------------------------------------/
		| WARNING: Do not manually update this file!             |
		| It is auto-generated via                               |
		| </src/parser/Production.class.ts#Production#fromJSON>. |
		| If you need to make updates, make them there.          |
		/-------------------------------------------------------*/
	
			
			import type {
				KleenePlus,
			} from '../types.d';
			import type {
				GrammarSymbol,
			} from '../parser/Grammar.class';
			import Production from '../parser/Production.class';
			import * as TERMINAL from './Terminal.class';
			
				export class ProductionNonterminalDefinition extends Production {
					static readonly instance: ProductionNonterminalDefinition = new ProductionNonterminalDefinition();
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
			
				export class ProductionNonterminalReference extends Production {
					static readonly instance: ProductionNonterminalReference = new ProductionNonterminalReference();
					get sequences(): KleenePlus<KleenePlus<GrammarSymbol>> {
						return [
							[TERMINAL.TerminalIdentifier.instance],[TERMINAL.TerminalIdentifier.instance,'<',ProductionNonterminalReference__0__CSL.instance,'>'],
						];
					}
					random(): string[] {
						const random: number = Math.random();
						return (
							random < 1/2 ? [TERMINAL.TerminalIdentifier.instance.random()] :
							[TERMINAL.TerminalIdentifier.instance.random(),'<',...ProductionNonterminalReference__0__CSL.instance.random(),'>']
						);
					}
				}
			
				export class ProductionNonterminalReference__0__CSL extends Production {
					static readonly instance: ProductionNonterminalReference__0__CSL = new ProductionNonterminalReference__0__CSL();
					get sequences(): KleenePlus<KleenePlus<GrammarSymbol>> {
						return [
							['+',TERMINAL.TerminalIdentifier.instance],['-',TERMINAL.TerminalIdentifier.instance],['?',TERMINAL.TerminalIdentifier.instance],[ProductionNonterminalReference__0__CSL.instance,',','+',TERMINAL.TerminalIdentifier.instance],[ProductionNonterminalReference__0__CSL.instance,',','-',TERMINAL.TerminalIdentifier.instance],[ProductionNonterminalReference__0__CSL.instance,',','?',TERMINAL.TerminalIdentifier.instance],
						];
					}
					random(): string[] {
						const random: number = Math.random();
						return (
							random < 1/6 ? ['+',TERMINAL.TerminalIdentifier.instance.random()] : random < 2/6 ? ['-',TERMINAL.TerminalIdentifier.instance.random()] : random < 3/6 ? ['?',TERMINAL.TerminalIdentifier.instance.random()] : random < 4/6 ? [...ProductionNonterminalReference__0__CSL.instance.random(),',','+',TERMINAL.TerminalIdentifier.instance.random()] : random < 5/6 ? [...ProductionNonterminalReference__0__CSL.instance.random(),',','-',TERMINAL.TerminalIdentifier.instance.random()] :
							[...ProductionNonterminalReference__0__CSL.instance.random(),',','?',TERMINAL.TerminalIdentifier.instance.random()]
						);
					}
				}
			
				export class ProductionCondition extends Production {
					static readonly instance: ProductionCondition = new ProductionCondition();
					get sequences(): KleenePlus<KleenePlus<GrammarSymbol>> {
						return [
							['<',ProductionCondition__0__CSL.instance,'>'],
						];
					}
					random(): string[] {
						const random: number = Math.random();
						return (
							
							['<',...ProductionCondition__0__CSL.instance.random(),'>']
						);
					}
				}
			
				export class ProductionCondition__0__CSL extends Production {
					static readonly instance: ProductionCondition__0__CSL = new ProductionCondition__0__CSL();
					get sequences(): KleenePlus<KleenePlus<GrammarSymbol>> {
						return [
							[TERMINAL.TerminalIdentifier.instance,'+'],[TERMINAL.TerminalIdentifier.instance,'-'],[ProductionCondition__0__CSL.instance,',',TERMINAL.TerminalIdentifier.instance,'+'],[ProductionCondition__0__CSL.instance,',',TERMINAL.TerminalIdentifier.instance,'-'],
						];
					}
					random(): string[] {
						const random: number = Math.random();
						return (
							random < 1/4 ? [TERMINAL.TerminalIdentifier.instance.random(),'+'] : random < 2/4 ? [TERMINAL.TerminalIdentifier.instance.random(),'-'] : random < 3/4 ? [...ProductionCondition__0__CSL.instance.random(),',',TERMINAL.TerminalIdentifier.instance.random(),'+'] :
							[...ProductionCondition__0__CSL.instance.random(),',',TERMINAL.TerminalIdentifier.instance.random(),'-']
						);
					}
				}
			
				export class ProductionUnit extends Production {
					static readonly instance: ProductionUnit = new ProductionUnit();
					get sequences(): KleenePlus<KleenePlus<GrammarSymbol>> {
						return [
							[TERMINAL.TerminalCharCode.instance],[TERMINAL.TerminalString.instance],[TERMINAL.TerminalCharClass.instance],[ProductionNonterminalReference.instance],['(',ProductionChoice.instance,')'],
						];
					}
					random(): string[] {
						const random: number = Math.random();
						return (
							random < 1/5 ? [TERMINAL.TerminalCharCode.instance.random()] : random < 2/5 ? [TERMINAL.TerminalString.instance.random()] : random < 3/5 ? [TERMINAL.TerminalCharClass.instance.random()] : random < 4/5 ? [...ProductionNonterminalReference.instance.random()] :
							['(',...ProductionChoice.instance.random(),')']
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
							[ProductionUnary.instance],[ProductionCondition.instance,ProductionItem.instance],
						];
					}
					random(): string[] {
						const random: number = Math.random();
						return (
							random < 1/2 ? [...ProductionUnary.instance.random()] :
							[...ProductionCondition.instance.random(),...ProductionItem.instance.random()]
						);
					}
				}
			
				export class ProductionItem__List extends Production {
					static readonly instance: ProductionItem__List = new ProductionItem__List();
					get sequences(): KleenePlus<KleenePlus<GrammarSymbol>> {
						return [
							[ProductionItem.instance],[ProductionItem__List.instance,ProductionItem.instance],
						];
					}
					random(): string[] {
						const random: number = Math.random();
						return (
							random < 1/2 ? [...ProductionItem.instance.random()] :
							[...ProductionItem__List.instance.random(),...ProductionItem.instance.random()]
						);
					}
				}
			
				export class ProductionSequence extends Production {
					static readonly instance: ProductionSequence = new ProductionSequence();
					get sequences(): KleenePlus<KleenePlus<GrammarSymbol>> {
						return [
							[ProductionItem__List.instance],[ProductionSequence.instance,'&',ProductionItem__List.instance],
						];
					}
					random(): string[] {
						const random: number = Math.random();
						return (
							random < 1/2 ? [...ProductionItem__List.instance.random()] :
							[...ProductionSequence.instance.random(),'&',...ProductionItem__List.instance.random()]
						);
					}
				}
			
				export class ProductionChoice extends Production {
					static readonly instance: ProductionChoice = new ProductionChoice();
					get sequences(): KleenePlus<KleenePlus<GrammarSymbol>> {
						return [
							[ProductionSequence.instance],[ProductionChoice.instance,'|',ProductionSequence.instance],
						];
					}
					random(): string[] {
						const random: number = Math.random();
						return (
							random < 1/2 ? [...ProductionSequence.instance.random()] :
							[...ProductionChoice.instance.random(),'|',...ProductionSequence.instance.random()]
						);
					}
				}
			
				export class ProductionProduction extends Production {
					static readonly instance: ProductionProduction = new ProductionProduction();
					get sequences(): KleenePlus<KleenePlus<GrammarSymbol>> {
						return [
							[ProductionNonterminalDefinition.instance,':::=',ProductionChoice.instance,';'],[ProductionNonterminalDefinition.instance,'::=',ProductionChoice.instance,';'],[ProductionNonterminalDefinition.instance,':::=','|',ProductionChoice.instance,';'],[ProductionNonterminalDefinition.instance,'::=','|',ProductionChoice.instance,';'],
						];
					}
					random(): string[] {
						const random: number = Math.random();
						return (
							random < 1/4 ? [...ProductionNonterminalDefinition.instance.random(),':::=',...ProductionChoice.instance.random(),';'] : random < 2/4 ? [...ProductionNonterminalDefinition.instance.random(),'::=',...ProductionChoice.instance.random(),';'] : random < 3/4 ? [...ProductionNonterminalDefinition.instance.random(),':::=','|',...ProductionChoice.instance.random(),';'] :
							[...ProductionNonterminalDefinition.instance.random(),'::=','|',...ProductionChoice.instance.random(),';']
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
			
		
		