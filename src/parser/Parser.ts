import { Tokenizer, TokenStream } from "../tokenizer";
import { Token, TokenType } from "../tokenizer/types";
import { ParsingError } from "./ParsingError";
import { FailedParserResult, isFailedResult, isSuccessfulResult, ParseFn, ParserResult, SuccessfulParserResult } from "./types";

export function and(...parsers: ParseFn<any>[]): ParseFn<any[]> {
  return (tokenStream: TokenStream) => {
    const results: any[] = [];

    for (const parser of parsers) {
      const parseResult = parser(tokenStream);
      console.log('and parseResult:', parseResult);

      if (isFailedResult(parseResult)) {
        return parseResult;
      }

      results.push(parseResult.result);
    }

    return { result: results };
  };
}

/**
 * Attempts to run a parser, restoring the token position (backtracking) if it fails.
 */
export function attempt<T>(parser: ParseFn<T>): ParseFn<T> {
  return (tokenStream: TokenStream) => {
    tokenStream.storePosition();

    const result = parser(tokenStream);

    if (isSuccessfulResult(result)) {
      tokenStream.clearPosition();
    } else {
      tokenStream.restorePosition();
    }

    return result;
  };
}

/**
 * Makes a given parser optional, returns `null` if it fails.
 */
export function optional<T>(parser: ParseFn<T>, shouldBacktrack: boolean = true): ParseFn<T | null> {
  return (tokenStream: TokenStream) => {
    const parseFn = shouldBacktrack ? attempt(parser) : parser;
    const result = parseFn(tokenStream);

    if (isSuccessfulResult(result)) {
      return result;
    }

    return { result: null };
  };
}

export function or<T>(...parsers: ParseFn<T>[]): ParseFn<T> {
  return (tokenStream: TokenStream) => {
    let deepestError = null;
    let deepestErrorPosition = -1;

    for (const parser of parsers) {
      const tryParse = attempt(parser);
      const result = tryParse(tokenStream);

      if (isSuccessfulResult(result)) {
        return result as SuccessfulParserResult<T>;
      }

      if (isFailedResult(result)) {
        const { position } = result;

        if (position.position > deepestErrorPosition) {
          deepestError = result;
          deepestErrorPosition = position.position;
        }
      }
    }

    return deepestError as FailedParserResult;
  };
}

export function many(parser: ParseFn<any>): ParseFn<any> {
  return (tokenStream: TokenStream) => {
    const results: any[] = [];

    let parseFailure = null;

    while (true) {
      tokenStream.storePosition();

      const result = parser(tokenStream);
      if (isSuccessfulResult(result)) {
        results.push(result.result);
        tokenStream.clearPosition();
      } else {
        parseFailure = result;
        tokenStream.restorePosition();
        break;
      }
    }

    if (parseFailure && results.length === 0) {
      return parseFailure;
    }

    return { result: results };
  };
}

export function label<T>(label: string, parser: ParseFn<T>): ParseFn<T> {
  return (tokenStream: TokenStream) => {
    const result = parser(tokenStream);

    console.log('label parse result:', result);

    if (isSuccessfulResult(result)) {
      return result;
    }

    const errorMessage = `${label}: ${result.errorMessage}`;

    console.log('labeled error message:', errorMessage);

    return {
      errorMessage,
      position: result.position,
    };
  }
}

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

export function parseName(): ParseFn<any> {
  return (tokenStream: TokenStream) => {
    const validTokenTypes: TokenType[] = ['letter', 'digit', 'minus', 'underscore'];
    const parseValidToken = anyOf(...validTokenTypes);

    const parser = and(anyOf('letter'), many(parseValidToken));
    const result = parser(tokenStream);

    if (isSuccessfulResult(result)) {
      console.log(result);
    }

    return result;
  }
}

export class Parser {
  public static runParserOnString<T>(parser: ParseFn<T>, input: string, tokenizer: Tokenizer): ParserResult<T> {
    const tokens = tokenizer.tokenize(input);
    const stream = new TokenStream(tokens);

    return this.runParser<T>(parser, stream);
  }

  public static runParser<T>(parser: ParseFn<T>, tokenStream: TokenStream): ParserResult<T> {
    const test = parser(tokenStream);
    if (isFailedResult(test)) {
      throw new ParsingError(test.errorMessage, test.position);
    }

    return test;
  }
}