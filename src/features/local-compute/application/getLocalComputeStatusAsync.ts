import type {
  InfraExecutionContext,
  InfraResourceStatus,
  InfraResult,
} from '@ankhorage/contracts/infra';

import type { LocalHostProbe } from '../../../types/localCompute.js';
import { inspectLocalComputeAsync } from './inspectLocalComputeAsync.js';

/*** Return current local host availability through the canonical compute status contract. */
export async function getLocalComputeStatusAsync(
  probe: LocalHostProbe,
  context: InfraExecutionContext,
): Promise<InfraResult<readonly InfraResourceStatus[]>> {
  const { compute } = context.desired.deployment;
  if (compute.provider !== 'local') return invalidStatusSelection();
  const inspected = await inspectLocalComputeAsync(probe, context, compute);
  if (!inspected.ok) return inspected;
  return {
    ok: true,
    value: [
      {
        owner: inspected.value.owner.identity,
        state: 'ready',
        ...(inspected.value.observation.detail === undefined
          ? {}
          : { detail: inspected.value.observation.detail }),
      },
    ],
    diagnostics: [],
  };
}

/*** Reject status requests for a different compute provider. */
function invalidStatusSelection(): InfraResult<never> {
  return {
    ok: false,
    diagnostics: [
      {
        severity: 'error',
        code: 'local-selection-invalid',
        message: 'Local compute status requires the canonical local selection.',
      },
    ],
  };
}
