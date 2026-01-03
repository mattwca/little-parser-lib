import { Tokenizer, TokenStream } from "../tokenizer";
import { Token, TokenType } from "../tokenizer/types";
import { ParsingError } from "./ParsingError";
import { FailedParserResult, isFailedResult, isSuccessfulResult, ParseFn, ParserResult, SuccessfulParserResult } from "./types";

/**
 * Combines multiple parsers in sequence, returning an array of their results.
 * If one of the parsers fails, the entire sequence fails.
 */
export function and(...parsers: ParseFn<any>[]): ParseFn<any[]> {
  return (tokenStream: TokenStream) => {
    const results: any[] = [];

    for (const parser of parsers) {
      const parseResult = parser(tokenStream);

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

/**
 * Tries multiple parsers in order, returning the result of the first successful parse.
 * If all parsers fail, returns the error from the parser that got the furthest.
 */
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

/**
 * Applies a parser repeatedly until it fails, collecting all successful results into an array.
 * If the parser fails on the first attempt, returns a failure.
 */
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

/**
 * Labels a parser with a custom error message for better context if it fails.
 */
export function label<T>(label: string, parser: ParseFn<T>): ParseFn<T> {
  return (tokenStream: TokenStream) => {
    const result = parser(tokenStream);

    if (isSuccessfulResult(result)) {
      return result;
    }

    const errorMessage = `${label}: ${result.errorMessage}`;

    return {
      errorMessage,
      position: result.position,
    };
  }
}

/**
 * In-built utility parser that parses any token except those of the specified type(s).
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

/**
 * Transforms the result of a parser using a given mapping function.
 * @param parser The parser whose result is to be transformed.
 * @param mapFn A function that takes the parser's result and returns a new value.
 * @returns A new parser that applies the mapping function to the result of the original parser.
 */
export function map<T, U>(parser: ParseFn<T>, mapFn: (value: T) => U): ParseFn<U> {
  return (tokenStream: TokenStream) => {
    const result = parser(tokenStream);

    if (isSuccessfulResult(result)) {
      return { result: mapFn(result.result) };
    }

    return result;
  };
}

/**
 * Runs a parser on a given TokenStream, throwing an error if parsing fails.
 */
export function runParser<T>(parser: ParseFn<T>, tokenStream: TokenStream): ParserResult<T> {
  const test = parser(tokenStream);
  if (isFailedResult(test)) {
    throw new ParsingError(test.errorMessage, test.position);
  }

  return test;
}

/**
 * Runs a parser on a given input string, using the provided tokenizer to generate tokens.
 */
export function runParserOnString<T>(parser: ParseFn<T>, input: string, tokenizer: Tokenizer): ParserResult<T> {
  const tokens = tokenizer.tokenize(input);
  const stream = new TokenStream(tokens);

  return runParser<T>(parser, stream);
}