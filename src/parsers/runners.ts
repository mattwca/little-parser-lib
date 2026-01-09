import { Tokenizer, TokenStream } from "../tokenizer";
import { ParserError } from "./ParserError";
import { isFailedResult, ParseFn, ParserResult } from "./types";

/**
 * Runs a parser on a given TokenStream, throwing an error if parsing fails.
 * @param parser The parse function to be run.
 * @param tokenStream The TokenStream to parse.
 * @returns The successful ParserResult.
 * @throws {ParserError} If the parser fails. Includes error and position information.
 */
export function runParser<T>(parser: ParseFn<T>, tokenStream: TokenStream): ParserResult<T> {
  const test = parser(tokenStream);
  if (isFailedResult(test)) {
    throw new ParserError(test.errorMessage, test.position);
  }

  return test;
}

/**
 * Runs a parser on a given input string, using the provided tokenizer to generate tokens.
 * @param parser The parse function to be run.
 * @param input The input string to parse.
 * @param tokenizer The tokenizer to use for tokenizing the input string.
 * @returns The ParserResult of the parsing operation.
 * @throws {ParserError} If the parser fails. Includes error and position information.
 */
export function runParserOnString<T>(parser: ParseFn<T>, input: string, tokenizer: Tokenizer): ParserResult<T> {
  const tokens = tokenizer.tokenize(input);
  const stream = new TokenStream(tokens);

  return runParser<T>(parser, stream);
}