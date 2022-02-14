import Parser from 'tree-sitter';
import Counterpoint from 'tree-sitter-counterpoint';



export const TS_PARSER: Parser = new Parser();
TS_PARSER.setLanguage(Counterpoint);
