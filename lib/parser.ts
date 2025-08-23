import * as bnb from "bread-n-butter";

export interface ASTNode {
  type: string;
  start: number;
  end: number;
}

export interface PlainTextNode extends ASTNode {
  type: "PlainText";
  value: string;
}

export interface CurlyGroupNode extends ASTNode {
  type: "CurlyGroup";
  value: string;
}

export interface NullaryMacroNode extends ASTNode {
  type: "NullaryMacro";
  macro: string;
}

export interface UnaryMacroNode extends ASTNode {
  type: "UnaryMacro";
  macro: string;
  argument: ASTNode;
}

export interface SuperscriptNode extends ASTNode {
  type: "Superscript";
  content: string;
}

export interface SubscriptNode extends ASTNode {
  type: "Subscript";
  content: string;
}

export interface ProgramNode extends ASTNode {
  type: "Program";
  body: ASTNode[];
}

export type TexNode =
  | PlainTextNode
  | CurlyGroupNode
  | NullaryMacroNode
  | UnaryMacroNode
  | SuperscriptNode
  | SubscriptNode
  | ProgramNode;

function makeNode(type: string) {
  return function makeNodeWrapper(parser: any) {
    return bnb
      .all(bnb.location, parser, bnb.location)
      .map(function makeNode_([start, value, end]: [any, any, any]) {
        return {
          type,
          start: start.index,
          end: end.index,
          // @ts-ignore
          ...value,
        };
      });
  };
}

const Spaces = bnb.match(/\s*/);

const Superscript = bnb
  .all(bnb.match(/\^\s*/), bnb.choice(bnb.match(/{[a-zA-Z0-9+-]+}/), bnb.match(/[a-zA-Z0-9+-]/)))
  .map(([, b]: [any, string]) => ({
    content: b,
  }))
  .thru(makeNode("Superscript"));

const Subscript = bnb
  .all(bnb.match(/_\s*/), bnb.choice(bnb.match(/{[a-zA-Z0-9+-]+}/), bnb.match(/[a-zA-Z0-9+-]/)))
  .map(([_, b]: [any, string]) => {
    return {
      content: b,
    };
  })
  .thru(makeNode("Subscript"));

const NullaryMacro = bnb
  .choice(bnb.match(/\\[a-zA-Z]+/), bnb.match(/\\\|/))
  .map((x: string) => {
    return {
      macro: x,
    };
  })
  .thru(makeNode("NullaryMacro"));

const CurlyGroup = bnb
  .match(/\{.*?\}/)
  .map((x: string) => ({ value: x }))
  .thru(makeNode("CurlyGroup"));

const UnaryMacro = bnb
  .all(
    bnb.choice(
      bnb.match(/\\mathbb(?![a-zA-Z])/),
      bnb.match(/\\mathfrak(?![a-zA-Z])/),
      bnb.match(/\\mathcal(?![a-zA-Z])/),
      bnb.match(/\\not(?![a-zA-Z])/)
    ),
    Spaces,
    bnb.choice(
      CurlyGroup,
      NullaryMacro,
      bnb
        .match(/[a-zA-Z0-9]/)
        .map((x) => ({ value: x }))
        .thru(makeNode("PlainText"))
    )
  )
  .map(([a, _, c]: [string, any, ASTNode]) => ({
    macro: a,
    argument: c,
  }))
  .thru(makeNode("UnaryMacro"));

const Illegal = bnb
  .match(/[\^_\\]/)
  .map((r: string) => ({
    value: r,
  }))
  .thru(makeNode("PlainText"));

const PlainText = bnb
  .match(/[^_^\\]+/)
  .map((x: string) => ({ value: x }))
  .thru(makeNode("PlainText"));

const Program = bnb
  .choice(Superscript, Subscript, UnaryMacro, NullaryMacro, Illegal, PlainText)
  .repeat()
  .map((nodes: ASTNode[]) => {
    return {
      body: nodes,
    };
  })
  .thru(makeNode("Program"));

export default Program;
