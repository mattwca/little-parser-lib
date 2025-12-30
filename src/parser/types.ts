import { TokenStream } from "../tokenizer";

export type ParsingErrorPosition = {
  line: number;
  column: number;
  position: number;
}

export type SuccessfulParserResult<T> = {
  result: T;
}

export type FailedParserResult = {
  errorMessage: string;
  position: ParsingErrorPosition;
}

export type ParserResult<T> = SuccessfulParserResult<T> | FailedParserResult;

export type ParseFn<T = null> = (tokenStream: TokenStream) => ParserResult<T>;

export const isSuccessfulResult = <T>(result: ParserResult<T>): result is SuccessfulParserResult<T> => {
  return (result as SuccessfulParserResult<T>).result !== undefined;
}

export const isFailedResult = <T>(result: ParserResult<T>): result is FailedParserResult => {
  return (result as FailedParserResult).errorMessage !== undefined;
}