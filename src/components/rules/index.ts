import { golangCodingContractRule } from "./golang-coding-contract/index";
import { javaCodingContractRule } from "./java-coding-contract/index";
import { javascriptCodingContractRule } from "./javascript-coding-contract/index";
import { phpCodingContractRule } from "./php-coding-contract/index";
import { rustCodingContractRule } from "./rust-coding-contract/index";
import { typescriptCodingContractRule } from "./typescript-coding-contract/index";

export const componentRules = [
  phpCodingContractRule,
  javaCodingContractRule,
  javascriptCodingContractRule,
  typescriptCodingContractRule,
  golangCodingContractRule,
  rustCodingContractRule,
];
