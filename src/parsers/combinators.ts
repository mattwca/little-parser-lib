import { TokenStream } from "../tokenizer";
import { FailedParserResult, isFailedResult, isSuccessfulResult, ParseFn, SuccessfulParserResult } from "./types";

/**
 * A combinator which runs a sequence of parsers, returning a tuple of their results. If one of the parsers fail, the
 * entire sequence fails (in which case the first failure encountered is returned).
 * @typeParam Parsers A tuple of the ParseFn types to be combined. Used to infer the result tuple type. 
 * @param parsers The parsers to run.
 */
export function and<Parsers extends ParseFn<any>[]>(
  ...parsers: Parsers
): ParseFn<{ [K in keyof Parsers]: Parsers[K] extends ParseFn<infer R> ? R : never }> {
  return (tokenStream: TokenStream) => {
    const results: any[] = [];

    for (const parser of parsers) {
      const parseResult = parser(tokenStream);

      if (isFailedResult(parseResult)) {
        return parseResult;
      }

      results.push(parseResult.result);
    }

    return { result: results } as any;
  };
}

/**
 * A combinator which attempts to run a given parser, restoring the token position (backtracking) if it fails. The
 * result of the parser (successful or failed) will be returned.
 * @typeParam T The type of the parse result.
 * @param parser The parser to attempt.
 * @returns A new parser that attempts to run the given parser, backtracking on failure.
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
 * A combinator which makes a given parser optional. If the parser fails, it will still return a successful result,
 * with a `null` value. By default, the parser will also backtrack on failure.
 * @typeParam T The type of the parse result.
 * @param parser The parser to make optional.
 * @param shouldBacktrack Whether to backtrack the token stream position if the parser fails. Defaults to `true`.
 * @returns A new parser that returns either the result of the given parser, or `null` if it fails.
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
 * A combinator which tries multiple parsers, returning the result of the first one that succeeds. If all parsers fail
 * returns the error from the parser that got the furthest.
 * @typeParam T The type of the parse result.
 * @param parsers The parsers to try.
 * @returns A new parser that tries each of the given parsers in sequence.
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
 * A combinator which applies a parser repeatedly until it fails or doesn't make progress (move the position), collecting
 * all successful results into an array. If the parser fails on the first attempt, it returns a failure.
 * @typeParam T The type of the parse result.
 * @param parser The parser to apply repeatedly.
 * @returns A new parser that applies the given parser repeatedly, collecting results into an array.
 */
export function many<T>(parser: ParseFn<T>): ParseFn<T[]> {
  return (tokenStream: TokenStream) => {
    const results: T[] = [];

    let parseFailure = null;

    while (true) {
      const positionBefore = tokenStream.position;
      tokenStream.storePosition();

      const result = parser(tokenStream);

      if (isSuccessfulResult(result)) {
        const positionAfter = tokenStream.position;

        // Check if the parser made any progress - if it didn't, we break out to avoid infinite loops.
        if (positionAfter === positionBefore) {
          tokenStream.restorePosition();
          break;
        }

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
 * A combinator which maps the successful result of a given parser using a mapping function. Failures are passed through unchanged.
 * @typeParam T The type of the original parser's result.
 * @typeParam U The type of the mapped result.
 * @param parser The parser whose result to be mapped.
 * @param mapFn A function that takes the parser's result and returns a new value.
 * @returns A new parser that applies the mapping function to the result of the original parser.
 */
export function map<T, U>(parser: ParseFn<T>, mapper: (value: T) => U): ParseFn<U> {
  return (tokenStream: TokenStream) => {
    const result = parser(tokenStream);

    if (isSuccessfulResult(result)) {
      return { result: mapper(result.result) };
    }

    return result;
  };
}

/**
 * A combinator which prepends a given label to any error message(s) produced by a given parser.
 * @typeParam T The type of the parse result.
 * @param label The label to prefix the error message with.
 * @param parser The parser to label.
 * @returns A new parser that adds the label to any error messages from the original parser.
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