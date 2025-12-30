export type TokenType = string | 'end_of_input';

export type TokenPosition = {
  line: number;
  column: number;
}

export type Token = {
  value: string;
  type: TokenType;
  position: TokenPosition;
}