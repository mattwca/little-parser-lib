import { Token, TokenType } from "./types";

export const LetterRegex = /[a-zA-Z]/;
export const DigitRegex = /[0-9]/;
export const WhitespaceRegex = /\s+/;
export const NewLineRegex = /\n/;

export class Tokenizer {
  constructor(
    private tokenTypeMatchers: { matcher: string | RegExp, type: TokenType }[] = [],
    private newLineTokenType: TokenType | null = null
  ) {}

  public withTokenType(type: TokenType, matcher: string | RegExp): Tokenizer {
    this.tokenTypeMatchers.push({ matcher, type });
    return this;
  }

  public tokenize(input: string): Token[] {
    const position = {
      line: 1,
      column: 0,
    }

    return input.split('').reduce<Token[]>((tokens, char) => {
      position.column += 1;

      let matched = false;
      for (const { matcher, type } of this.tokenTypeMatchers.values()) {
        if (typeof matcher === 'string' && char === matcher) {
          tokens.push({ type, value: char, position: { ...position }});
          matched = true;
          break;
        }

        if (matcher instanceof RegExp && matcher.test(char)) {
          tokens.push({ type, value: char, position: { ...position }});
          matched = true;
          break;
        }

        if (matched && type === this.newLineTokenType) {
          position.line += 1;
        }
      }

      if (!matched) {
        throw new Error(`No token type matched for character: ${char}`);
      }

      return tokens;
    }, []);
  }
}