import Parser from 'tree-sitter';
import Counterpoint from 'tree-sitter-counterpoint';



export const TS_PARSER = new Parser();
TS_PARSER.setLanguage(Counterpoint);
