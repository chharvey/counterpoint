import * as assert from 'assert';
import type {SyntaxNode} from 'tree-sitter';
import {
	type NonemptyArray,
	throw_expression,
} from '../lib/index.js';
import {
	type CPConfig,
	CONFIG_DEFAULT,
} from '../core/index.js';
import {
	Punctuator,
	Keyword,
} from '../parser/index.js';
import {
	Validator,
	AST,
} from './index.js';
import {
	type SyntaxNodeType,
	isSyntaxNodeType,
	type SyntaxNodeFamily,
	isSyntaxNodeFamily,
	type SyntaxNodeSupertype,
	isSyntaxNodeSupertype,
} from './utils-private.js';
import {
	Operator,
	type ValidAccessOperator,
	type ValidTypeOperator,
	type ValidOperatorUnary,
	type ValidOperatorArithmetic,
	type ValidOperatorComparative,
	type ValidOperatorEquality,
	type ValidOperatorLogical,
} from './Operator.js';



class Decorator {
	private static readonly ACCESSORS: ReadonlyMap<Punctuator, ValidAccessOperator> = new Map<Punctuator, ValidAccessOperator>([
		[Punctuator.DOT,      Operator.DOT],
		[Punctuator.OPTDOT,   Operator.OPTDOT],
		[Punctuator.CLAIMDOT, Operator.CLAIMDOT],
	]);

	private static readonly TYPEOPERATORS_UNARY: ReadonlyMap<Punctuator | Keyword, ValidTypeOperator> = new Map<Punctuator | Keyword, ValidTypeOperator>([
		[Punctuator.ORNULL,  Operator.ORNULL],
		[Punctuator.OREXCP,  Operator.OREXCP],
		[Keyword   .MUTABLE, Operator.MUTABLE],
	]);

	private static readonly TYPEOPERATORS_BINARY: ReadonlyMap<Punctuator, ValidTypeOperator> = new Map<Punctuator, ValidTypeOperator>([
		[Punctuator.INTER, Operator.AND],
		[Punctuator.UNION, Operator.OR],
	]);

	private static readonly OPERATORS_UNARY: ReadonlyMap<Punctuator, Operator> = new Map<Punctuator, Operator>([
		[Punctuator.NOT, Operator.NOT],
		[Punctuator.EMP, Operator.EMP],
		[Punctuator.AFF, Operator.AFF],
		[Punctuator.NEG, Operator.NEG],
	]);

	private static readonly OPERATORS_BINARY: ReadonlyMap<Punctuator | Keyword, Operator> = new Map<Punctuator | Keyword, Operator>([
		[Punctuator.EXP,  Operator.EXP],
		[Punctuator.MUL,  Operator.MUL],
		[Punctuator.DIV,  Operator.DIV],
		[Punctuator.ADD,  Operator.ADD],
		[Punctuator.SUB,  Operator.SUB],
		[Punctuator.LT,   Operator.LT],
		[Punctuator.GT,   Operator.GT],
		[Punctuator.LE,   Operator.LE],
		[Punctuator.GE,   Operator.GE],
		[Punctuator.NLT,  Operator.NLT],
		[Punctuator.NGT,  Operator.NGT],
		[Keyword   .IS,   Operator.IS],
		[Keyword   .ISNT, Operator.ISNT],
		[Punctuator.ID,   Operator.ID],
		[Punctuator.NID,  Operator.NID],
		[Punctuator.EQ,   Operator.EQ],
		[Punctuator.NEQ,  Operator.NEQ],
		[Punctuator.AND,  Operator.AND],
		[Punctuator.NAND, Operator.NAND],
		[Punctuator.OR,   Operator.OR],
		[Punctuator.NOR,  Operator.NOR],
	]);


	public decorateTS(syntaxnode: SyntaxNodeType<'keyword_type'>):                      AST.ASTNodeTypeConstant;
	public decorateTS(syntaxnode: SyntaxNodeType<'identifier'>):                        AST.ASTNodeTypeAlias | AST.ASTNodeVariable;
	public decorateTS(syntaxnode: SyntaxNodeType<'word'>):                              AST.ASTNodeKey;
	public decorateTS(syntaxnode: SyntaxNodeType<'primitive_literal'>):                 AST.ASTNodeTypeConstant | AST.ASTNodeConstant;
	public decorateTS(syntaxnode: SyntaxNodeFamily<'entry_type',        ['optional']>): AST.ASTNodeItemType;
	public decorateTS(syntaxnode: SyntaxNodeFamily<'entry_type__named', ['optional']>): AST.ASTNodePropertyType;
	public decorateTS(syntaxnode: SyntaxNodeType<'type_grouped'>):                      AST.ASTNodeType;
	public decorateTS(syntaxnode: SyntaxNodeType<'type_tuple_literal'>):                AST.ASTNodeTypeTuple;
	public decorateTS(syntaxnode: SyntaxNodeType<'type_record_literal'>):               AST.ASTNodeTypeRecord;
	public decorateTS(syntaxnode: SyntaxNodeType<'type_dict_literal'>):                 AST.ASTNodeTypeDict;
	public decorateTS(syntaxnode: SyntaxNodeType<'type_map_literal'>):                  AST.ASTNodeTypeMap;
	public decorateTS(syntaxnode: SyntaxNodeType<'property_access_type'>):              AST.ASTNodeIndexType | AST.ASTNodeKey;
	public decorateTS(syntaxnode: SyntaxNodeType<'type_compound'>):                     AST.ASTNodeTypeAccess | AST.ASTNodeTypeCall;
	public decorateTS(syntaxnode: SyntaxNodeType<'type_unary_symbol'>):                 AST.ASTNodeTypeOperationUnary | AST.ASTNodeTypeList | AST.ASTNodeTypeSet;
	public decorateTS(syntaxnode: SyntaxNodeType<'type_unary_keyword'>):                AST.ASTNodeTypeOperationUnary;
	public decorateTS(syntaxnode: SyntaxNodeType<'type_intersection'>):                 AST.ASTNodeTypeOperationBinary;
	public decorateTS(syntaxnode: SyntaxNodeType<'type_union'>):                        AST.ASTNodeTypeOperationBinary;
	public decorateTS(syntaxnode: SyntaxNodeSupertype<'type'>):                         AST.ASTNodeType;
	public decorateTS(syntaxnode: SyntaxNodeType<'string_template'>):                   AST.ASTNodeTemplate;
	public decorateTS(syntaxnode: SyntaxNodeType<'property'>):                          AST.ASTNodeProperty;
	public decorateTS(syntaxnode: SyntaxNodeType<'case'>):                              AST.ASTNodeCase;
	public decorateTS(syntaxnode: SyntaxNodeType<'expression_grouped'>):                AST.ASTNodeExpression;
	public decorateTS(syntaxnode: SyntaxNodeType<'tuple_literal'>):                     AST.ASTNodeTuple;
	public decorateTS(syntaxnode: SyntaxNodeType<'record_literal'>):                    AST.ASTNodeRecord;
	public decorateTS(syntaxnode: SyntaxNodeType<'set_literal'>):                       AST.ASTNodeSet;
	public decorateTS(syntaxnode: SyntaxNodeType<'map_literal'>):                       AST.ASTNodeMap;
	public decorateTS(syntaxnode: SyntaxNodeType<'property_access'>):                   AST.ASTNodeIndex | AST.ASTNodeKey | AST.ASTNodeExpression;
	public decorateTS(syntaxnode: SyntaxNodeType<'property_assign'>):                   AST.ASTNodeIndex | AST.ASTNodeKey | AST.ASTNodeExpression;
	public decorateTS(syntaxnode: SyntaxNodeType<'expression_compound'>):               AST.ASTNodeAccess | AST.ASTNodeCall;
	public decorateTS(syntaxnode: SyntaxNodeType<'assignee'>):                          AST.ASTNodeVariable | AST.ASTNodeAccess;
	public decorateTS(syntaxnode: SyntaxNodeType<'expression_unary_symbol'>):           AST.ASTNodeExpression | AST.ASTNodeOperationUnary;
	public decorateTS(syntaxnode: SyntaxNodeType<'expression_claim'>):                  AST.ASTNodeClaim;
	public decorateTS(syntaxnode: SyntaxNodeType<'expression_exponential'>):            AST.ASTNodeOperationBinaryArithmetic;
	public decorateTS(syntaxnode: SyntaxNodeType<'expression_multiplicative'>):         AST.ASTNodeOperationBinaryArithmetic;
	public decorateTS(syntaxnode: SyntaxNodeType<'expression_additive'>):               AST.ASTNodeOperationBinaryArithmetic;
	public decorateTS(syntaxnode: SyntaxNodeType<'expression_comparative'>):            AST.ASTNodeOperationUnary | AST.ASTNodeOperationBinaryComparative;
	public decorateTS(syntaxnode: SyntaxNodeType<'expression_equality'>):               AST.ASTNodeOperationUnary | AST.ASTNodeOperationBinaryEquality;
	public decorateTS(syntaxnode: SyntaxNodeType<'expression_conjunctive'>):            AST.ASTNodeOperationUnary | AST.ASTNodeOperationBinaryLogical;
	public decorateTS(syntaxnode: SyntaxNodeType<'expression_disjunctive'>):            AST.ASTNodeOperationUnary | AST.ASTNodeOperationBinaryLogical;
	public decorateTS(syntaxnode: SyntaxNodeType<'expression_conditional'>):            AST.ASTNodeOperationTernary;
	public decorateTS(syntaxnode: SyntaxNodeSupertype<'expression'>):                   AST.ASTNodeExpression;
	public decorateTS(syntaxnode: SyntaxNodeType<'statement_expression'>):              AST.ASTNodeStatementExpression;
	public decorateTS(syntaxnode: SyntaxNodeSupertype<'statement'>):                    AST.ASTNodeStatement;
	public decorateTS(syntaxnode: SyntaxNodeType<'block'>):                             AST.ASTNodeBlock;
	public decorateTS(syntaxnode: SyntaxNodeType<'declaration_type'>):                  AST.ASTNodeDeclarationType;
	public decorateTS(syntaxnode: SyntaxNodeType<'declaration_variable'>):              AST.ASTNodeDeclarationVariable;
	public decorateTS(syntaxnode: SyntaxNodeType<'declaration_claim'>):                 AST.ASTNodeDeclarationClaim;
	public decorateTS(syntaxnode: SyntaxNodeType<'declaration_reassignment'>):          AST.ASTNodeDeclarationReassignment;
	public decorateTS(syntaxnode: SyntaxNodeSupertype<'declaration'>):                  AST.ASTNodeDeclaration;
	public decorateTS(syntaxnode: SyntaxNodeType<'source_file'>, config?: CPConfig):    AST.ASTNodeGoal;
	public decorateTS(syntaxnode: SyntaxNode): AST.ASTNodeCP;
	public decorateTS(syntaxnode: SyntaxNode, config: CPConfig = CONFIG_DEFAULT): AST.ASTNodeCP {
		const decorators = new Map<string | RegExp, (node: SyntaxNode) => AST.ASTNodeCP>([
			['source_file', (node) => new AST.ASTNodeGoal(
				node as SyntaxNodeType<'source_file'>,
				(node.children.length) ? this.decorateTS(node.children[0] as SyntaxNodeType<'block'>) : null,
				config,
			)],

			/* # TERMINALS */
			['keyword_type', (node) => new AST.ASTNodeTypeConstant(node as SyntaxNodeType<'keyword_type'>)],

			['identifier', (node) => (
				(isSyntaxNodeSupertype(node.parent!, 'type')       || isSyntaxNodeType(node.parent!, /^(entry_type(__named)?(__optional)?|generic_arguments|declaration_(type|claim))$/))                                                ? new AST.ASTNodeTypeAlias(node as SyntaxNodeType<'identifier'>) :
				(isSyntaxNodeSupertype(node.parent!, 'expression') || isSyntaxNodeType(node.parent!, /^(property|case|function_arguments|property_(access|assign)|assignee|declaration_(variable|reassignment)|statement_expression)$/)) ? new AST.ASTNodeVariable (node as SyntaxNodeType<'identifier'>) :
				throw_expression(new TypeError(`Expected ${ node.parent } to be a node that contains an identifier.`))
			)],

			/* # PRODUCTIONS */
			['word', (node) => new AST.ASTNodeKey(node as SyntaxNodeType<'word'>)],

			['primitive_literal', (node) => (
				(isSyntaxNodeSupertype(node.parent!, 'type')       || isSyntaxNodeType(node.parent!, /^(entry_type(__named)?(__optional)?|generic_arguments|declaration_(type|claim))$/))                                                ? new AST.ASTNodeTypeConstant(node as SyntaxNodeType<'primitive_literal'>) :
				(isSyntaxNodeSupertype(node.parent!, 'expression') || isSyntaxNodeType(node.parent!, /^(property|case|function_arguments|property_(access|assign)|assignee|declaration_(variable|reassignment)|statement_expression)$/)) ? new AST.ASTNodeConstant    (node as SyntaxNodeType<'primitive_literal'>) :
				throw_expression(new TypeError(`Expected ${ node.parent } to be a node that contains a primitive literal.`))
			)],

			/* ## Types */
			['entry_type', (node) => new AST.ASTNodeItemType(
				node as SyntaxNodeType<'entry_type'>,
				false,
				this.decorateTS(node.children[0] as SyntaxNodeSupertype<'type'>),
			)],

			['entry_type__optional', (node) => new AST.ASTNodeItemType(
				node as SyntaxNodeType<'entry_type__optional'>,
				true,
				this.decorateTS(node.children[1] as SyntaxNodeSupertype<'type'>),
			)],

			['entry_type__named', (node) => new AST.ASTNodePropertyType(
				node as SyntaxNodeType<'entry_type__named'>,
				false,
				this.decorateTS(node.children[0] as SyntaxNodeType<'word'>),
				this.decorateTS(node.children[2] as SyntaxNodeSupertype<'type'>),
			)],

			['entry_type__named__optional', (node) => new AST.ASTNodePropertyType(
				node as SyntaxNodeType<'entry_type__named__optional'>,
				true,
				this.decorateTS(node.children[0] as SyntaxNodeType<'word'>),
				this.decorateTS(node.children[2] as SyntaxNodeSupertype<'type'>),
			)],

			['type_grouped', (node) => this.decorateTS(node.children[1] as SyntaxNodeSupertype<'type'>)],

			['type_tuple_literal', (node) => new AST.ASTNodeTypeTuple(
				node as SyntaxNodeType<'type_tuple_literal'>,
				node.children
					.filter((c): c is SyntaxNodeFamily<'entry_type', ['optional']> => isSyntaxNodeFamily(c, 'entry_type', ['optional']))
					.map((c) => this.decorateTS(c)),
			)],

			['type_record_literal', (node) => new AST.ASTNodeTypeRecord(
				node as SyntaxNodeType<'type_record_literal'>,
				node.children
					.filter((c): c is SyntaxNodeFamily<'entry_type__named', ['optional']> => isSyntaxNodeFamily(c, 'entry_type__named', ['optional']))
					.map((c) => this.decorateTS(c)) as NonemptyArray<AST.ASTNodePropertyType>,
			)],

			['type_dict_literal', (node) => new AST.ASTNodeTypeDict(
				node as SyntaxNodeType<'type_dict_literal'>,
				this.decorateTS(node.children[2] as SyntaxNodeSupertype<'type'>),
			)],

			['type_map_literal', (node) => new AST.ASTNodeTypeMap(
				node as SyntaxNodeType<'type_map_literal'>,
				this.decorateTS(node.children[1] as SyntaxNodeSupertype<'type'>),
				this.decorateTS(node.children[3] as SyntaxNodeSupertype<'type'>),
			)],

			['property_access_type', (node) => (
				(isSyntaxNodeType(node.children[1], 'integer')) ? new AST.ASTNodeIndexType(
					node as SyntaxNodeType<'property_access_type'>,
					new AST.ASTNodeTypeConstant(node.children[1]),
				) :
				(assert.ok(
					isSyntaxNodeType(node.children[1], 'word'),
					`Expected ${ node.children[1] } to be a \`SyntaxNodeType<'word'>\`.`,
				), this.decorateTS(node.children[1]))
			)],

			['type_compound', (node) => (
				(isSyntaxNodeType(node.children[1], 'property_access_type')) ? new AST.ASTNodeTypeAccess(
					node as SyntaxNodeType<'type_compound'>,
					this.decorateTS(node.children[0] as SyntaxNodeSupertype<'type'>),
					this.decorateTS(node.children[1]),
				) :
				(assert.ok(
					isSyntaxNodeType(node.children[1], 'generic_call'),
					`Expected ${ node.children[1] } to be a \`SyntaxNodeType<'generic_call'>\`.`,
				), new AST.ASTNodeTypeCall(
					node as SyntaxNodeType<'type_compound'>,
					this.decorateTS(node.children[0] as SyntaxNodeSupertype<'type'>),
					(node.children[1].children[1] as SyntaxNodeType<'generic_arguments'>).children
						.filter((c): c is SyntaxNodeSupertype<'type'> => isSyntaxNodeSupertype(c, 'type'))
						.map((c) => this.decorateTS(c)) as NonemptyArray<AST.ASTNodeType>,
				))
			)],

			['type_unary_symbol', (node) => {
				const basetype: AST.ASTNodeType = this.decorateTS(node.children[0] as SyntaxNodeSupertype<'type'>);
				const punc = node.children[1].text as Punctuator;
				if (node.children.length === 2) {
					return new AST.ASTNodeTypeOperationUnary(
						node as SyntaxNodeType<'type_unary_symbol'>,
						Decorator.TYPEOPERATORS_UNARY.get(punc)!,
						basetype,
					);
				} else {
					if (node.children.length === 3) { // we have either `T[]` or `T{}`
						if (punc === Punctuator.BRAK_OPN) {
							return new AST.ASTNodeTypeList(
								node as SyntaxNodeType<'type_unary_symbol'>,
								basetype,
								null,
							);
						} else {
							assert.strictEqual(punc, Punctuator.BRAC_OPN);
							return new AST.ASTNodeTypeSet(
								node as SyntaxNodeType<'type_unary_symbol'>,
								basetype,
							);
						}
					} else { // we have `T[n]`
						assert.strictEqual(node.children.length, 4);
						assert.strictEqual(punc, Punctuator.BRAK_OPN);
						const count: bigint = BigInt(Validator.cookTokenNumber(node.children[2].text, { // TODO: add field `Decorator#config`
							...CONFIG_DEFAULT,
							languageFeatures: {
								...CONFIG_DEFAULT.languageFeatures,
								integerRadices:    true,
								numericSeparators: true,
							},
						})[0]);
						return new AST.ASTNodeTypeList(
							node as SyntaxNodeType<'type_unary_symbol'>,
							basetype,
							count,
						);
					}
				}
			}],

			['type_unary_keyword', (node) => new AST.ASTNodeTypeOperationUnary(
				node as SyntaxNodeType<'type_unary_keyword'>,
				Decorator.TYPEOPERATORS_UNARY.get(node.children[0].text as Keyword)!,
				this.decorateTS(node.children[1] as SyntaxNodeSupertype<'type'>),
			)],

			['type_intersection', (node) => new AST.ASTNodeTypeOperationBinary(
				node as SyntaxNodeType<'type_intersection'>,
				Decorator.TYPEOPERATORS_BINARY.get(node.children[1].text as Punctuator)!,
				this.decorateTS(node.children[0] as SyntaxNodeSupertype<'type'>),
				this.decorateTS(node.children[2] as SyntaxNodeSupertype<'type'>),
			)],

			['type_union', (node) => new AST.ASTNodeTypeOperationBinary(
				node as SyntaxNodeType<'type_union'>,
				Decorator.TYPEOPERATORS_BINARY.get(node.children[1].text as Punctuator)!,
				this.decorateTS(node.children[0] as SyntaxNodeSupertype<'type'>),
				this.decorateTS(node.children[2] as SyntaxNodeSupertype<'type'>),
			)],

			/* ## Expressions */
			['string_template', (node) => new AST.ASTNodeTemplate(
				node as SyntaxNodeType<'string_template'>,
				node.children.map((c) => ((isSyntaxNodeType(c, /^template_(full|head|middle|tail)$/))
					? new AST.ASTNodeConstant(c as SyntaxNodeType<`template_${ 'full' | 'head' | 'middle' | 'tail' }`>)
					: this.decorateTS(c as SyntaxNodeSupertype<'expression'>)
				)),
			)],

			['property', (node) => new AST.ASTNodeProperty(
				node as SyntaxNodeType<'property'>,
				this.decorateTS(node.children[0] as SyntaxNodeType<'word'>),
				this.decorateTS(node.children[2] as SyntaxNodeSupertype<'expression'>),
			)],

			['case', (node) => new AST.ASTNodeCase(
				node as SyntaxNodeType<'case'>,
				this.decorateTS(node.children[0] as SyntaxNodeSupertype<'expression'>),
				this.decorateTS(node.children[2] as SyntaxNodeSupertype<'expression'>),
			)],

			['expression_grouped', (node) => this.decorateTS(node.children[1] as SyntaxNodeSupertype<'expression'>)],

			['tuple_literal', (node) => new AST.ASTNodeTuple(
				node as SyntaxNodeType<'tuple_literal'>,
				node.children
					.filter((c): c is SyntaxNodeSupertype<'expression'> => isSyntaxNodeSupertype(c, 'expression'))
					.map((c) => this.decorateTS(c)),
			)],

			['record_literal', (node) => new AST.ASTNodeRecord(
				node as SyntaxNodeType<'record_literal'>,
				node.children
					.filter((c): c is SyntaxNodeType<'property'> => isSyntaxNodeType(c, 'property'))
					.map((c) => this.decorateTS(c)) as NonemptyArray<AST.ASTNodeProperty>,
			)],

			['set_literal', (node) => new AST.ASTNodeSet(
				node as SyntaxNodeType<'set_literal'>,
				node.children
					.filter((c): c is SyntaxNodeSupertype<'expression'> => isSyntaxNodeSupertype(c, 'expression'))
					.map((c) => this.decorateTS(c)),
			)],

			['map_literal', (node) => new AST.ASTNodeMap(
				node as SyntaxNodeType<'map_literal'>,
				node.children
					.filter((c): c is SyntaxNodeType<'case'> => isSyntaxNodeType(c, 'case'))
					.map((c) => this.decorateTS(c)) as NonemptyArray<AST.ASTNodeCase>,
			)],

			['property_access', (node) => (
				(isSyntaxNodeType(node.children[1], 'integer')) ? new AST.ASTNodeIndex(
					node as SyntaxNodeType<'property_access'>,
					new AST.ASTNodeConstant(node.children[1]),
				) :
				          (isSyntaxNodeType     (node.children[1], 'word')) ?                                                                  this.decorateTS(node.children[1]) :
				(assert.ok(isSyntaxNodeSupertype(node.children[2], 'expression'), `Expected ${ node.children[2] } to be an expression node.`), this.decorateTS(node.children[2]))
			)],

			['property_assign', (node) => (
				(isSyntaxNodeType(node.children[1], 'integer')) ? new AST.ASTNodeIndex(
					node as SyntaxNodeType<'property_assign'>,
					new AST.ASTNodeConstant(node.children[1]),
				) :
				          (isSyntaxNodeType     (node.children[1], 'word')) ?                                                                  this.decorateTS(node.children[1]) :
				(assert.ok(isSyntaxNodeSupertype(node.children[2], 'expression'), `Expected ${ node.children[2] } to be an expression node.`), this.decorateTS(node.children[2]))
			)],

			['expression_compound', (node) => (
				(isSyntaxNodeType(node.children[1], 'property_access')) ? new AST.ASTNodeAccess(
					node as SyntaxNodeType<'expression_compound'>,
					Decorator.ACCESSORS.get(node.children[1].children[0].text as Punctuator)!,
					this.decorateTS(node.children[0] as SyntaxNodeSupertype<'expression'>),
					this.decorateTS(node.children[1]),
				)
				: (assert.ok(isSyntaxNodeType(node.children[1], 'function_call'), `Expected ${ node.children[1] } to be a \`SyntaxNodeType<'function_call'>\`.`), ((
					n:                      SyntaxNodeType<'expression_compound'>,
					function_call_children: SyntaxNode[],
				) => new AST.ASTNodeCall(
					n,
					this.decorateTS(n.children[0] as SyntaxNodeSupertype<'expression'>),
					function_call_children
						.find((c): c is SyntaxNodeType<'generic_arguments'> => isSyntaxNodeType(c, 'generic_arguments'))?.children
						.filter((c): c is SyntaxNodeSupertype<'type'> => isSyntaxNodeSupertype(c, 'type'))
						.map((c) => this.decorateTS(c)) || [],
					function_call_children
						.find((c): c is SyntaxNodeType<'function_arguments'> => isSyntaxNodeType(c, 'function_arguments'))!.children
						.filter((c): c is SyntaxNodeSupertype<'expression'> => isSyntaxNodeSupertype(c, 'expression'))
						.map((c) => this.decorateTS(c)),
				))(
					node as SyntaxNodeType<'expression_compound'>,
					node.children[1].children,
				))
			)],

			['assignee', (node) => (node.children.length === 1)
				? new AST.ASTNodeVariable(node.children[0] as SyntaxNodeType<'identifier'>)
				: new AST.ASTNodeAccess(
					node as SyntaxNodeType<'assignee'>,
					Operator.DOT,
					this.decorateTS(node.children[0] as SyntaxNodeSupertype<'expression'>),
					this.decorateTS(node.children[1] as SyntaxNodeType<'property_assign'>),
				)],

			['expression_unary_symbol', (node) => (node.children[0].text === Punctuator.AFF) // `+a` is a no-op
				? this.decorateTS(node.children[1] as SyntaxNodeSupertype<'expression'>)
				: new AST.ASTNodeOperationUnary(
					node as SyntaxNodeType<'expression_unary_symbol'>,
					Decorator.OPERATORS_UNARY.get(node.children[0].text as Punctuator) as ValidOperatorUnary,
					this.decorateTS(node.children[1] as SyntaxNodeSupertype<'expression'>),
				)],

			['expression_claim', (node) => new AST.ASTNodeClaim(
				node as SyntaxNodeType<'expression_claim'>,
				this.decorateTypeNode(node.children[1] as SyntaxNodeSupertype<'type'>),
				this.decorateTS      (node.children[3] as SyntaxNodeSupertype<'expression'>),
			)],

			['expression_exponential', (node) => new AST.ASTNodeOperationBinaryArithmetic(
				node as SyntaxNodeType<'expression_exponential'>,
				Decorator.OPERATORS_BINARY.get(node.children[1].text as Punctuator | Keyword)! as ValidOperatorArithmetic,
				this.decorateTS(node.children[0] as SyntaxNodeSupertype<'expression'>),
				this.decorateTS(node.children[2] as SyntaxNodeSupertype<'expression'>),
			)],

			['expression_multiplicative', (node) => new AST.ASTNodeOperationBinaryArithmetic(
				node as SyntaxNodeType<'expression_multiplicative'>,
				Decorator.OPERATORS_BINARY.get(node.children[1].text as Punctuator | Keyword)! as ValidOperatorArithmetic,
				this.decorateTS(node.children[0] as SyntaxNodeSupertype<'expression'>),
				this.decorateTS(node.children[2] as SyntaxNodeSupertype<'expression'>),
			)],

			['expression_additive', (node) => ((
				n:        SyntaxNodeType<'expression_additive'>,
				operator: Operator,
				operands: readonly [AST.ASTNodeExpression, AST.ASTNodeExpression],
			) => (
				// `a - b` is syntax sugar for `a + -(b)`
				(operator === Operator.SUB) ? new AST.ASTNodeOperationBinaryArithmetic(
					n,
					Operator.ADD,
					operands[0],
					new AST.ASTNodeOperationUnary(
						n.children[2] as SyntaxNodeSupertype<'expression'>,
						Operator.NEG,
						operands[1],
					),
				) :
				new AST.ASTNodeOperationBinaryArithmetic(
					n,
					operator as ValidOperatorArithmetic,
					...operands,
				)
			))(
				node as SyntaxNodeType<'expression_additive'>,
				Decorator.OPERATORS_BINARY.get(node.children[1].text as Punctuator | Keyword)!,
				[
					this.decorateTS(node.children[0] as SyntaxNodeSupertype<'expression'>),
					this.decorateTS(node.children[2] as SyntaxNodeSupertype<'expression'>),
				],
			)],

			['expression_comparative', (node) => ((
				n:        SyntaxNodeType<'expression_comparative'>,
				operator: Operator,
				operands: readonly [AST.ASTNodeExpression, AST.ASTNodeExpression],
			) => (
				// `a !< b` is syntax sugar for `!(a < b)`
				(operator === Operator.NLT) ? new AST.ASTNodeOperationUnary(
					n,
					Operator.NOT,
					new AST.ASTNodeOperationBinaryComparative(
						n.children[0] as SyntaxNodeSupertype<'expression'>,
						Operator.LT,
						...operands,
					),
				) :
				// `a !> b` is syntax sugar for `!(a > b)`
				(operator === Operator.NGT) ? new AST.ASTNodeOperationUnary(
					n,
					Operator.NOT,
					new AST.ASTNodeOperationBinaryComparative(
						n.children[0] as SyntaxNodeSupertype<'expression'>,
						Operator.GT,
						...operands,
					),
				) :
				// `a isnt b` is syntax sugar for `!(a is b)`
				(operator === Operator.ISNT) ? new AST.ASTNodeOperationUnary(
					n,
					Operator.NOT,
					new AST.ASTNodeOperationBinaryComparative(
						n.children[0] as SyntaxNodeSupertype<'expression'>,
						Operator.IS,
						...operands,
					),
				) :
				new AST.ASTNodeOperationBinaryComparative(
					n,
					operator as ValidOperatorComparative,
					...operands,
				)
			))(
				node as SyntaxNodeType<'expression_comparative'>,
				Decorator.OPERATORS_BINARY.get(node.children[1].text as Punctuator | Keyword)!,
				[
					this.decorateTS(node.children[0] as SyntaxNodeSupertype<'expression'>),
					this.decorateTS(node.children[2] as SyntaxNodeSupertype<'expression'>),
				],
			)],

			['expression_equality', (node) => ((
				n:        SyntaxNodeType<'expression_equality'>,
				operator: Operator,
				operands: readonly [AST.ASTNodeExpression, AST.ASTNodeExpression],
			) => (
				// `a !== b` is syntax sugar for `!(a === b)`
				(operator === Operator.NID) ? new AST.ASTNodeOperationUnary(
					n,
					Operator.NOT,
					new AST.ASTNodeOperationBinaryEquality(
						n.children[0] as SyntaxNodeSupertype<'expression'>,
						Operator.ID,
						...operands,
					),
				) :
				// `a != b` is syntax sugar for `!(a == b)`
				(operator === Operator.NEQ) ? new AST.ASTNodeOperationUnary(
					n,
					Operator.NOT,
					new AST.ASTNodeOperationBinaryEquality(
						n.children[0] as SyntaxNodeSupertype<'expression'>,
						Operator.EQ,
						...operands,
					),
				) :
				new AST.ASTNodeOperationBinaryEquality(
					n,
					operator as ValidOperatorEquality,
					...operands,
				)
			))(
				node as SyntaxNodeType<'expression_equality'>,
				Decorator.OPERATORS_BINARY.get(node.children[1].text as Punctuator | Keyword)!,
				[
					this.decorateTS(node.children[0] as SyntaxNodeSupertype<'expression'>),
					this.decorateTS(node.children[2] as SyntaxNodeSupertype<'expression'>),
				],
			)],

			['expression_conjunctive', (node) => ((
				n:        SyntaxNodeType<'expression_conjunctive'>,
				operator: Operator,
				operands: readonly [AST.ASTNodeExpression, AST.ASTNodeExpression],
			) => (
				// `a !& b` is syntax sugar for `!(a && b)`
				(operator === Operator.NAND) ? new AST.ASTNodeOperationUnary(
					n,
					Operator.NOT,
					new AST.ASTNodeOperationBinaryLogical(
						n.children[0] as SyntaxNodeSupertype<'expression'>,
						Operator.AND,
						...operands,
					),
				) :
				new AST.ASTNodeOperationBinaryLogical(
					n,
					operator as ValidOperatorLogical,
					...operands,
				)
			))(
				node as SyntaxNodeType<'expression_conjunctive'>,
				Decorator.OPERATORS_BINARY.get(node.children[1].text as Punctuator | Keyword)!,
				[
					this.decorateTS(node.children[0] as SyntaxNodeSupertype<'expression'>),
					this.decorateTS(node.children[2] as SyntaxNodeSupertype<'expression'>),
				],
			)],

			['expression_disjunctive', (node) => ((
				n:        SyntaxNodeType<'expression_disjunctive'>,
				operator: Operator,
				operands: readonly [AST.ASTNodeExpression, AST.ASTNodeExpression],
			) => (
				// `a !| b` is syntax sugar for `!(a || b)`
				(operator === Operator.NOR) ? new AST.ASTNodeOperationUnary(
					n,
					Operator.NOT,
					new AST.ASTNodeOperationBinaryLogical(
						n.children[0] as SyntaxNodeSupertype<'expression'>,
						Operator.OR,
						...operands,
					),
				) :
				new AST.ASTNodeOperationBinaryLogical(
					n,
					operator as ValidOperatorLogical,
					...operands,
				)
			))(
				node as SyntaxNodeType<'expression_disjunctive'>,
				Decorator.OPERATORS_BINARY.get(node.children[1].text as Punctuator | Keyword)!,
				[
					this.decorateTS(node.children[0] as SyntaxNodeSupertype<'expression'>),
					this.decorateTS(node.children[2] as SyntaxNodeSupertype<'expression'>),
				],
			)],

			['expression_conditional', (node) => new AST.ASTNodeOperationTernary(
				node as SyntaxNodeType<'expression_conditional'>,
				Operator.COND,
				this.decorateTS(node.children[1] as SyntaxNodeSupertype<'expression'>),
				this.decorateTS(node.children[3] as SyntaxNodeSupertype<'expression'>),
				this.decorateTS(node.children[5] as SyntaxNodeSupertype<'expression'>),
			)],

			/* ## Statements */
			['statement_expression', (node) => new AST.ASTNodeStatementExpression(
				node as SyntaxNodeType<'statement_expression'>,
				(node.children.length === 2) ? this.decorateTS(node.children[0] as SyntaxNodeSupertype<'expression'>) : void 0,
			)],

			['block', (node) => new AST.ASTNodeBlock(
				node as SyntaxNodeType<'block'>,
				node.children
					.filter((c): c is SyntaxNodeSupertype<'statement'> => isSyntaxNodeSupertype(c, 'statement'))
					.map((c) => this.decorateTS(c)) as NonemptyArray<AST.ASTNodeStatement>,
			)],

			['declaration_type', (node) => new AST.ASTNodeDeclarationType(
				node as SyntaxNodeType<'declaration_type'>,
				new AST.ASTNodeTypeAlias(node.children[1] as SyntaxNodeType<'identifier'>),
				this.decorateTS(node.children[3] as SyntaxNodeSupertype<'type'>),
			)],

			['declaration_variable', (node) => new AST.ASTNodeDeclarationVariable(
				node as SyntaxNodeType<'declaration_variable'>,
				node.children.length === 8,
				new AST.ASTNodeVariable(((node.children.length === 7) ? node.children[1] : node.children[2]) as SyntaxNodeType<'identifier'>),
				this.decorateTypeNode  (((node.children.length === 7) ? node.children[3] : node.children[4]) as SyntaxNodeSupertype<'type'>),
				this.decorateTS        (((node.children.length === 7) ? node.children[5] : node.children[6]) as SyntaxNodeSupertype<'expression'>),
			)],

			['declaration_claim', (node) => new AST.ASTNodeDeclarationClaim(
				node as SyntaxNodeType<'declaration_claim'>,
				this.decorateTS(node.children[1] as SyntaxNodeType<'assignee'>),
				this.decorateTS(node.children[3] as SyntaxNodeSupertype<'type'>),
			)],

			['declaration_reassignment', (node) => new AST.ASTNodeDeclarationReassignment(
				node as SyntaxNodeType<'declaration_reassignment'>,
				this.decorateTS(node.children[1] as SyntaxNodeType<'assignee'>),
				this.decorateTS(node.children[3] as SyntaxNodeSupertype<'expression'>),
			)],
		]);
		return (
			   decorators.get(syntaxnode.type)
			?? [...decorators].find(([key]) => key instanceof RegExp && isSyntaxNodeType(syntaxnode, key))?.[1]
			?? ((node) => {
				throw new TypeError(`Could not find type of parse node \`${ node.type }\`.`);
			})
		)(syntaxnode);
	}

	private decorateTypeNode(typenode: SyntaxNodeSupertype<'type'>): AST.ASTNodeType {
		return (
			(isSyntaxNodeType(typenode, 'identifier'))        ? new AST.ASTNodeTypeAlias   (typenode) :
			(isSyntaxNodeType(typenode, 'primitive_literal')) ? new AST.ASTNodeTypeConstant(typenode) :
			this.decorateTS(typenode)
		);
	}
}



export const DECORATOR = new Decorator();
