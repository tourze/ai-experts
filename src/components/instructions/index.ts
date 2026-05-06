import { communicationStyleInstruction } from "./communication-style/index";
import { coreInstruction } from "./core/index";
import { globalPrinciplesInstruction } from "./global-principles/index";
import { qualityGatesInstruction } from "./quality-gates/index";
import { reportingFormatsInstruction } from "./reporting-formats/index";
import { taskExecutionInstruction } from "./task-execution/index";

export {
  communicationStyleInstruction,
  coreInstruction,
  globalPrinciplesInstruction,
  qualityGatesInstruction,
  reportingFormatsInstruction,
  taskExecutionInstruction,
};

export const componentInstructions = [
  coreInstruction,
  globalPrinciplesInstruction,
  taskExecutionInstruction,
  qualityGatesInstruction,
  communicationStyleInstruction,
  reportingFormatsInstruction,
];
