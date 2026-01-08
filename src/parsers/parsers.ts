import { TokenStream } from "../tokenizer";
import { Token, TokenType } from "../tokenizer/types";
import { ParseFn } from "./types";

/**
 * In-built utility parser that parses any token except those of the specified type(s).
 * @param types The token types to exclude.
 */
export function anyExcept(...types: TokenType[]): ParseFn<Token> {
  return (tokenStream: TokenStream) => {
    const token = tokenStream.consume();

    if (!token || types.includes(token.type)) {
      return {
        errorMessage: `Expected any token not of type ${types.join(', ')}, but got ${token?.type || 'end of input'}`,
        position: tokenStream.getPositionForError(),
      };
    }

    return { result: token };
  };
}

/**
 * In-built utility parser that parses any token of the specified type(s).
 * @param types The token types to match.
 */
export function anyOf(...types: TokenType[]): ParseFn<Token> {
  return (tokenStream: TokenStream) => {
    const token = tokenStream.consume();

    if (!token || !types.includes(token.type)) {
      return {
        errorMessage: `Expected token of type ${types.join(', ')}, but got ${token?.type || 'end of input'}`,
        position: tokenStream.getPositionForError(),
      };
    }

    return { result: token }
  }
}

/**
 * In-built utility parser that ensures the end of input has been reached.
 * Returns a failed result if there are remaining tokens.
 */
export function endOfInput(): ParseFn {
  return (tokenStream: TokenStream) => {
    const token = tokenStream.consume();

    if (token && token.type !== 'end_of_input') {
      return {
        errorMessage: `Expected end of input, but got token of type ${token.type}`,
        position: tokenStream.getPositionForError(),
      };
    }

    return { result: null };
  };
}