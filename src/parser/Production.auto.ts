
			
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
			
				export class ProductionPrimitiveLiteral extends Production {
					static readonly instance: ProductionPrimitiveLiteral = new ProductionPrimitiveLiteral();
					get sequences(): NonemptyArray<NonemptyArray<GrammarSymbol>> {
						return [
							["null"],["false"],["true"],[TERMINAL.TerminalInteger.instance],[TERMINAL.TerminalFloat.instance],[TERMINAL.TerminalString.instance],
						];
					}
					random(): string[] {
						const random: number = Math.random();
						return (
							random < 1/6 ? ["null"] : random < 2/6 ? ["false"] : random < 3/6 ? ["true"] : random < 4/6 ? [TERMINAL.TerminalInteger.instance.random()] : random < 5/6 ? [TERMINAL.TerminalFloat.instance.random()] :
							[TERMINAL.TerminalString.instance.random()]
						);
					}
				}
			
				export class ProductionTypeKeyword extends Production {
					static readonly instance: ProductionTypeKeyword = new ProductionTypeKeyword();
					get sequences(): NonemptyArray<NonemptyArray<GrammarSymbol>> {
						return [
							["bool"],["int"],["float"],["obj"],
						];
					}
					random(): string[] {
						const random: number = Math.random();
						return (
							random < 1/4 ? ["bool"] : random < 2/4 ? ["int"] : random < 3/4 ? ["float"] :
							["obj"]
						);
					}
				}
			
				export class ProductionTypeUnit extends Production {
					static readonly instance: ProductionTypeUnit = new ProductionTypeUnit();
					get sequences(): NonemptyArray<NonemptyArray<GrammarSymbol>> {
						return [
							[ProductionPrimitiveLiteral.instance],[ProductionTypeKeyword.instance],["(",ProductionType.instance,")"],
						];
					}
					random(): string[] {
						const random: number = Math.random();
						return (
							random < 1/3 ? [...ProductionPrimitiveLiteral.instance.random()] : random < 2/3 ? [...ProductionTypeKeyword.instance.random()] :
							["(",...ProductionType.instance.random(),")"]
						);
					}
				}
			
				export class ProductionTypeUnarySymbol extends Production {
					static readonly instance: ProductionTypeUnarySymbol = new ProductionTypeUnarySymbol();
					get sequences(): NonemptyArray<NonemptyArray<GrammarSymbol>> {
						return [
							[ProductionTypeUnit.instance],[ProductionTypeUnarySymbol.instance,"!"],
						];
					}
					random(): string[] {
						const random: number = Math.random();
						return (
							random < 1/2 ? [...ProductionTypeUnit.instance.random()] :
							[...ProductionTypeUnarySymbol.instance.random(),"!"]
						);
					}
				}
			
				export class ProductionTypeIntersection extends Production {
					static readonly instance: ProductionTypeIntersection = new ProductionTypeIntersection();
					get sequences(): NonemptyArray<NonemptyArray<GrammarSymbol>> {
						return [
							[ProductionTypeUnarySymbol.instance],[ProductionTypeIntersection.instance,"&",ProductionTypeUnarySymbol.instance],
						];
					}
					random(): string[] {
						const random: number = Math.random();
						return (
							random < 1/2 ? [...ProductionTypeUnarySymbol.instance.random()] :
							[...ProductionTypeIntersection.instance.random(),"&",...ProductionTypeUnarySymbol.instance.random()]
						);
					}
				}
			
				export class ProductionTypeUnion extends Production {
					static readonly instance: ProductionTypeUnion = new ProductionTypeUnion();
					get sequences(): NonemptyArray<NonemptyArray<GrammarSymbol>> {
						return [
							[ProductionTypeIntersection.instance],[ProductionTypeUnion.instance,"|",ProductionTypeIntersection.instance],
						];
					}
					random(): string[] {
						const random: number = Math.random();
						return (
							random < 1/2 ? [...ProductionTypeIntersection.instance.random()] :
							[...ProductionTypeUnion.instance.random(),"|",...ProductionTypeIntersection.instance.random()]
						);
					}
				}
			
				export class ProductionType extends Production {
					static readonly instance: ProductionType = new ProductionType();
					get sequences(): NonemptyArray<NonemptyArray<GrammarSymbol>> {
						return [
							[ProductionTypeUnion.instance],
						];
					}
					random(): string[] {
						const random: number = Math.random();
						return (
							
							[...ProductionTypeUnion.instance.random()]
						);
					}
				}
			
				export class ProductionStringTemplate__1__List extends Production {
					static readonly instance: ProductionStringTemplate__1__List = new ProductionStringTemplate__1__List();
					get sequences(): NonemptyArray<NonemptyArray<GrammarSymbol>> {
						return [
							[TERMINAL.TerminalTemplateMiddle.instance],[ProductionStringTemplate__1__List.instance,TERMINAL.TerminalTemplateMiddle.instance],[TERMINAL.TerminalTemplateMiddle.instance,ProductionExpression.instance],[ProductionStringTemplate__1__List.instance,TERMINAL.TerminalTemplateMiddle.instance,ProductionExpression.instance],
						];
					}
					random(): string[] {
						const random: number = Math.random();
						return (
							random < 1/4 ? [TERMINAL.TerminalTemplateMiddle.instance.random()] : random < 2/4 ? [...ProductionStringTemplate__1__List.instance.random(),TERMINAL.TerminalTemplateMiddle.instance.random()] : random < 3/4 ? [TERMINAL.TerminalTemplateMiddle.instance.random(),...ProductionExpression.instance.random()] :
							[...ProductionStringTemplate__1__List.instance.random(),TERMINAL.TerminalTemplateMiddle.instance.random(),...ProductionExpression.instance.random()]
						);
					}
				}
			
				export class ProductionStringTemplate extends Production {
					static readonly instance: ProductionStringTemplate = new ProductionStringTemplate();
					get sequences(): NonemptyArray<NonemptyArray<GrammarSymbol>> {
						return [
							[TERMINAL.TerminalTemplateFull.instance],[TERMINAL.TerminalTemplateHead.instance,TERMINAL.TerminalTemplateTail.instance],[TERMINAL.TerminalTemplateHead.instance,ProductionStringTemplate__1__List.instance,TERMINAL.TerminalTemplateTail.instance],[TERMINAL.TerminalTemplateHead.instance,ProductionExpression.instance,TERMINAL.TerminalTemplateTail.instance],[TERMINAL.TerminalTemplateHead.instance,ProductionExpression.instance,ProductionStringTemplate__1__List.instance,TERMINAL.TerminalTemplateTail.instance],
						];
					}
					random(): string[] {
						const random: number = Math.random();
						return (
							random < 1/5 ? [TERMINAL.TerminalTemplateFull.instance.random()] : random < 2/5 ? [TERMINAL.TerminalTemplateHead.instance.random(),TERMINAL.TerminalTemplateTail.instance.random()] : random < 3/5 ? [TERMINAL.TerminalTemplateHead.instance.random(),...ProductionStringTemplate__1__List.instance.random(),TERMINAL.TerminalTemplateTail.instance.random()] : random < 4/5 ? [TERMINAL.TerminalTemplateHead.instance.random(),...ProductionExpression.instance.random(),TERMINAL.TerminalTemplateTail.instance.random()] :
							[TERMINAL.TerminalTemplateHead.instance.random(),...ProductionExpression.instance.random(),...ProductionStringTemplate__1__List.instance.random(),TERMINAL.TerminalTemplateTail.instance.random()]
						);
					}
				}
			
				export class ProductionExpressionUnit extends Production {
					static readonly instance: ProductionExpressionUnit = new ProductionExpressionUnit();
					get sequences(): NonemptyArray<NonemptyArray<GrammarSymbol>> {
						return [
							[TERMINAL.TerminalIdentifier.instance],[ProductionPrimitiveLiteral.instance],[ProductionStringTemplate.instance],["(",ProductionExpression.instance,")"],
						];
					}
					random(): string[] {
						const random: number = Math.random();
						return (
							random < 1/4 ? [TERMINAL.TerminalIdentifier.instance.random()] : random < 2/4 ? [...ProductionPrimitiveLiteral.instance.random()] : random < 3/4 ? [...ProductionStringTemplate.instance.random()] :
							["(",...ProductionExpression.instance.random(),")"]
						);
					}
				}
			
				export class ProductionExpressionUnarySymbol extends Production {
					static readonly instance: ProductionExpressionUnarySymbol = new ProductionExpressionUnarySymbol();
					get sequences(): NonemptyArray<NonemptyArray<GrammarSymbol>> {
						return [
							[ProductionExpressionUnit.instance],["!",ProductionExpressionUnarySymbol.instance],["?",ProductionExpressionUnarySymbol.instance],["+",ProductionExpressionUnarySymbol.instance],["-",ProductionExpressionUnarySymbol.instance],
						];
					}
					random(): string[] {
						const random: number = Math.random();
						return (
							random < 1/5 ? [...ProductionExpressionUnit.instance.random()] : random < 2/5 ? ["!",...ProductionExpressionUnarySymbol.instance.random()] : random < 3/5 ? ["?",...ProductionExpressionUnarySymbol.instance.random()] : random < 4/5 ? ["+",...ProductionExpressionUnarySymbol.instance.random()] :
							["-",...ProductionExpressionUnarySymbol.instance.random()]
						);
					}
				}
			
				export class ProductionExpressionExponential extends Production {
					static readonly instance: ProductionExpressionExponential = new ProductionExpressionExponential();
					get sequences(): NonemptyArray<NonemptyArray<GrammarSymbol>> {
						return [
							[ProductionExpressionUnarySymbol.instance],[ProductionExpressionUnarySymbol.instance,"^",ProductionExpressionExponential.instance],
						];
					}
					random(): string[] {
						const random: number = Math.random();
						return (
							random < 1/2 ? [...ProductionExpressionUnarySymbol.instance.random()] :
							[...ProductionExpressionUnarySymbol.instance.random(),"^",...ProductionExpressionExponential.instance.random()]
						);
					}
				}
			
				export class ProductionExpressionMultiplicative extends Production {
					static readonly instance: ProductionExpressionMultiplicative = new ProductionExpressionMultiplicative();
					get sequences(): NonemptyArray<NonemptyArray<GrammarSymbol>> {
						return [
							[ProductionExpressionExponential.instance],[ProductionExpressionMultiplicative.instance,"*",ProductionExpressionExponential.instance],[ProductionExpressionMultiplicative.instance,"/",ProductionExpressionExponential.instance],
						];
					}
					random(): string[] {
						const random: number = Math.random();
						return (
							random < 1/3 ? [...ProductionExpressionExponential.instance.random()] : random < 2/3 ? [...ProductionExpressionMultiplicative.instance.random(),"*",...ProductionExpressionExponential.instance.random()] :
							[...ProductionExpressionMultiplicative.instance.random(),"/",...ProductionExpressionExponential.instance.random()]
						);
					}
				}
			
				export class ProductionExpressionAdditive extends Production {
					static readonly instance: ProductionExpressionAdditive = new ProductionExpressionAdditive();
					get sequences(): NonemptyArray<NonemptyArray<GrammarSymbol>> {
						return [
							[ProductionExpressionMultiplicative.instance],[ProductionExpressionAdditive.instance,"+",ProductionExpressionMultiplicative.instance],[ProductionExpressionAdditive.instance,"-",ProductionExpressionMultiplicative.instance],
						];
					}
					random(): string[] {
						const random: number = Math.random();
						return (
							random < 1/3 ? [...ProductionExpressionMultiplicative.instance.random()] : random < 2/3 ? [...ProductionExpressionAdditive.instance.random(),"+",...ProductionExpressionMultiplicative.instance.random()] :
							[...ProductionExpressionAdditive.instance.random(),"-",...ProductionExpressionMultiplicative.instance.random()]
						);
					}
				}
			
				export class ProductionExpressionComparative extends Production {
					static readonly instance: ProductionExpressionComparative = new ProductionExpressionComparative();
					get sequences(): NonemptyArray<NonemptyArray<GrammarSymbol>> {
						return [
							[ProductionExpressionAdditive.instance],[ProductionExpressionComparative.instance,"<",ProductionExpressionAdditive.instance],[ProductionExpressionComparative.instance,">",ProductionExpressionAdditive.instance],[ProductionExpressionComparative.instance,"<=",ProductionExpressionAdditive.instance],[ProductionExpressionComparative.instance,">=",ProductionExpressionAdditive.instance],[ProductionExpressionComparative.instance,"!<",ProductionExpressionAdditive.instance],[ProductionExpressionComparative.instance,"!>",ProductionExpressionAdditive.instance],
						];
					}
					random(): string[] {
						const random: number = Math.random();
						return (
							random < 1/7 ? [...ProductionExpressionAdditive.instance.random()] : random < 2/7 ? [...ProductionExpressionComparative.instance.random(),"<",...ProductionExpressionAdditive.instance.random()] : random < 3/7 ? [...ProductionExpressionComparative.instance.random(),">",...ProductionExpressionAdditive.instance.random()] : random < 4/7 ? [...ProductionExpressionComparative.instance.random(),"<=",...ProductionExpressionAdditive.instance.random()] : random < 5/7 ? [...ProductionExpressionComparative.instance.random(),">=",...ProductionExpressionAdditive.instance.random()] : random < 6/7 ? [...ProductionExpressionComparative.instance.random(),"!<",...ProductionExpressionAdditive.instance.random()] :
							[...ProductionExpressionComparative.instance.random(),"!>",...ProductionExpressionAdditive.instance.random()]
						);
					}
				}
			
				export class ProductionExpressionEquality extends Production {
					static readonly instance: ProductionExpressionEquality = new ProductionExpressionEquality();
					get sequences(): NonemptyArray<NonemptyArray<GrammarSymbol>> {
						return [
							[ProductionExpressionComparative.instance],[ProductionExpressionEquality.instance,"is",ProductionExpressionComparative.instance],[ProductionExpressionEquality.instance,"isnt",ProductionExpressionComparative.instance],[ProductionExpressionEquality.instance,"==",ProductionExpressionComparative.instance],[ProductionExpressionEquality.instance,"!=",ProductionExpressionComparative.instance],
						];
					}
					random(): string[] {
						const random: number = Math.random();
						return (
							random < 1/5 ? [...ProductionExpressionComparative.instance.random()] : random < 2/5 ? [...ProductionExpressionEquality.instance.random(),"is",...ProductionExpressionComparative.instance.random()] : random < 3/5 ? [...ProductionExpressionEquality.instance.random(),"isnt",...ProductionExpressionComparative.instance.random()] : random < 4/5 ? [...ProductionExpressionEquality.instance.random(),"==",...ProductionExpressionComparative.instance.random()] :
							[...ProductionExpressionEquality.instance.random(),"!=",...ProductionExpressionComparative.instance.random()]
						);
					}
				}
			
				export class ProductionExpressionConjunctive extends Production {
					static readonly instance: ProductionExpressionConjunctive = new ProductionExpressionConjunctive();
					get sequences(): NonemptyArray<NonemptyArray<GrammarSymbol>> {
						return [
							[ProductionExpressionEquality.instance],[ProductionExpressionConjunctive.instance,"&&",ProductionExpressionEquality.instance],[ProductionExpressionConjunctive.instance,"!&",ProductionExpressionEquality.instance],
						];
					}
					random(): string[] {
						const random: number = Math.random();
						return (
							random < 1/3 ? [...ProductionExpressionEquality.instance.random()] : random < 2/3 ? [...ProductionExpressionConjunctive.instance.random(),"&&",...ProductionExpressionEquality.instance.random()] :
							[...ProductionExpressionConjunctive.instance.random(),"!&",...ProductionExpressionEquality.instance.random()]
						);
					}
				}
			
				export class ProductionExpressionDisjunctive extends Production {
					static readonly instance: ProductionExpressionDisjunctive = new ProductionExpressionDisjunctive();
					get sequences(): NonemptyArray<NonemptyArray<GrammarSymbol>> {
						return [
							[ProductionExpressionConjunctive.instance],[ProductionExpressionDisjunctive.instance,"||",ProductionExpressionConjunctive.instance],[ProductionExpressionDisjunctive.instance,"!|",ProductionExpressionConjunctive.instance],
						];
					}
					random(): string[] {
						const random: number = Math.random();
						return (
							random < 1/3 ? [...ProductionExpressionConjunctive.instance.random()] : random < 2/3 ? [...ProductionExpressionDisjunctive.instance.random(),"||",...ProductionExpressionConjunctive.instance.random()] :
							[...ProductionExpressionDisjunctive.instance.random(),"!|",...ProductionExpressionConjunctive.instance.random()]
						);
					}
				}
			
				export class ProductionExpressionConditional extends Production {
					static readonly instance: ProductionExpressionConditional = new ProductionExpressionConditional();
					get sequences(): NonemptyArray<NonemptyArray<GrammarSymbol>> {
						return [
							["if",ProductionExpression.instance,"then",ProductionExpression.instance,"else",ProductionExpression.instance],
						];
					}
					random(): string[] {
						const random: number = Math.random();
						return (
							
							["if",...ProductionExpression.instance.random(),"then",...ProductionExpression.instance.random(),"else",...ProductionExpression.instance.random()]
						);
					}
				}
			
				export class ProductionExpression extends Production {
					static readonly instance: ProductionExpression = new ProductionExpression();
					get sequences(): NonemptyArray<NonemptyArray<GrammarSymbol>> {
						return [
							[ProductionExpressionDisjunctive.instance],[ProductionExpressionConditional.instance],
						];
					}
					random(): string[] {
						const random: number = Math.random();
						return (
							random < 1/2 ? [...ProductionExpressionDisjunctive.instance.random()] :
							[...ProductionExpressionConditional.instance.random()]
						);
					}
				}
			
				export class ProductionDeclarationVariable extends Production {
					static readonly instance: ProductionDeclarationVariable = new ProductionDeclarationVariable();
					get sequences(): NonemptyArray<NonemptyArray<GrammarSymbol>> {
						return [
							["let",TERMINAL.TerminalIdentifier.instance,":",ProductionType.instance,"=",ProductionExpression.instance,";"],["let","unfixed",TERMINAL.TerminalIdentifier.instance,":",ProductionType.instance,"=",ProductionExpression.instance,";"],
						];
					}
					random(): string[] {
						const random: number = Math.random();
						return (
							random < 1/2 ? ["let",TERMINAL.TerminalIdentifier.instance.random(),":",...ProductionType.instance.random(),"=",...ProductionExpression.instance.random(),";"] :
							["let","unfixed",TERMINAL.TerminalIdentifier.instance.random(),":",...ProductionType.instance.random(),"=",...ProductionExpression.instance.random(),";"]
						);
					}
				}
			
				export class ProductionStatementAssignment extends Production {
					static readonly instance: ProductionStatementAssignment = new ProductionStatementAssignment();
					get sequences(): NonemptyArray<NonemptyArray<GrammarSymbol>> {
						return [
							[TERMINAL.TerminalIdentifier.instance,"=",ProductionExpression.instance,";"],
						];
					}
					random(): string[] {
						const random: number = Math.random();
						return (
							
							[TERMINAL.TerminalIdentifier.instance.random(),"=",...ProductionExpression.instance.random(),";"]
						);
					}
				}
			
				export class ProductionStatement extends Production {
					static readonly instance: ProductionStatement = new ProductionStatement();
					get sequences(): NonemptyArray<NonemptyArray<GrammarSymbol>> {
						return [
							[";"],[ProductionExpression.instance,";"],[ProductionDeclarationVariable.instance],[ProductionStatementAssignment.instance],
						];
					}
					random(): string[] {
						const random: number = Math.random();
						return (
							random < 1/4 ? [";"] : random < 2/4 ? [...ProductionExpression.instance.random(),";"] : random < 3/4 ? [...ProductionDeclarationVariable.instance.random()] :
							[...ProductionStatementAssignment.instance.random()]
						);
					}
				}
			
				export class ProductionGoal__0__List extends Production {
					static readonly instance: ProductionGoal__0__List = new ProductionGoal__0__List();
					get sequences(): NonemptyArray<NonemptyArray<GrammarSymbol>> {
						return [
							[ProductionStatement.instance],[ProductionGoal__0__List.instance,ProductionStatement.instance],
						];
					}
					random(): string[] {
						const random: number = Math.random();
						return (
							random < 1/2 ? [...ProductionStatement.instance.random()] :
							[...ProductionGoal__0__List.instance.random(),...ProductionStatement.instance.random()]
						);
					}
				}
			
				export class ProductionGoal extends Production {
					static readonly instance: ProductionGoal = new ProductionGoal();
					get sequences(): NonemptyArray<NonemptyArray<GrammarSymbol>> {
						return [
							['\u0002','\u0003'],['\u0002',ProductionGoal__0__List.instance,'\u0003'],
						];
					}
					random(): string[] {
						const random: number = Math.random();
						return (
							random < 1/2 ? ['\u0002','\u0003'] :
							['\u0002',...ProductionGoal__0__List.instance.random(),'\u0003']
						);
					}
				}
			
		
		