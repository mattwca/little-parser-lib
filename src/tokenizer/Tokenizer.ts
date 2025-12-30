import { Token, TokenType } from "./types";

export const LetterRegex = /[a-zA-Z]/;
export const DigitRegex = /[0-9]/;
export const WhitespaceRegex = /\s+/;
export const NewLineRegex = /\n/;

export class Tokenizer {
  constructor(
    private tokenTypeMatchers: Map<string | RegExp, TokenType> = new Map(),
    private newLineTokenType: TokenType | null = null
  ) { }

  public withTokenType(matcher: string | RegExp, type: TokenType): Tokenizer {
    this.tokenTypeMatchers.set(matcher, type);
    return this;
  }

  public tokenize(input: string): Token[] {
    const position = {
      line: 1,
      column: 1,
    }

    return input.split('').reduce<Token[]>((tokens, char) => {
      position.column += 1;

      for (const [matcher, type] of this.tokenTypeMatchers) {
        if (typeof matcher === 'string' && char === matcher) {
          tokens.push({ type, value: char, position: { ...position }});
          break;
        }

        if (matcher instanceof RegExp && matcher.test(char)) {
          tokens.push({ type, value: char, position: { ...position }});
          break;
        }

        throw new Error(`No token type matched for character: ${char}`);
      }

      return tokens;
    }, []);
  }
}