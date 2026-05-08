import {
  defineProcedureUse,
  type ProcedureArgs,
  type ProcedureDefinition,
  type ProcedureResult,
  type ProcedureUseDefinition,
} from "../sdk";
import { componentProcedures } from "./registry";

const componentProcedureIds = new Set(componentProcedures.map((procedure) => procedure.id));

export type ProcedureUseOptions<
  TArgs extends object = object,
  TResult extends object = object,
> = Omit<ProcedureUseDefinition<TArgs, TResult>, "id">;

export function procedureUse<const TProcedure extends ProcedureDefinition<object, object>>(
  procedure: TProcedure,
  options?: ProcedureUseOptions<ProcedureArgs<TProcedure>, ProcedureResult<TProcedure>>,
): ProcedureUseDefinition<ProcedureArgs<TProcedure>, ProcedureResult<TProcedure>>;
export function procedureUse(
  procedure: ProcedureDefinition<object, object>,
  options?: ProcedureUseOptions<object, object>,
): ProcedureUseDefinition {
  const id = procedure.id;
  if (!componentProcedureIds.has(id)) {
    throw new Error(`Unknown component procedure id: ${id}`);
  }
  return defineProcedureUse({ id, ...(options ?? {}) });
}

export { componentProcedures };
export * from "./registry";
