import type {
  InfraComputeSelection,
  InfraExecutionContext,
  InfraPlanAction,
  InfraResult,
} from '@ankhorage/contracts/infra';

import type { LocalHostProbe } from '../../../types/localCompute.js';
import { inspectLocalComputeAsync } from './inspectLocalComputeAsync.js';

/*** Report the existing local host as a no-op compute target. */
export async function planLocalComputeAsync(
  probe: LocalHostProbe,
  context: InfraExecutionContext,
  selection: InfraComputeSelection<'local'>,
): Promise<InfraResult<readonly InfraPlanAction[]>> {
  const inspected = await inspectLocalComputeAsync(probe, context, selection);
  if (!inspected.ok) return inspected;
  return {
    ok: true,
    value: [
      {
        owner: inspected.value.owner.identity,
        operation: 'noop',
        impact: 'none',
        detail: `Use local host at ${inspected.value.observation.workingDirectory}.`,
        dependsOn: [],
      },
    ],
    diagnostics: [],
  };
}
