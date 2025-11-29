import { Language } from '@app/common';

export class CredentialsResponse {
  readonly name: string;
  readonly language: Language;
  readonly token: string;
  constructor(name: string, language: Language, token: string) {
    this.name = name;
    this.language = language;
    this.token = token;
  }
}
