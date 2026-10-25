import type {
  InfraComputeSelection,
  InfraComputeSnapshot,
  InfraExecutionContext,
  InfraResult,
} from '@ankhorage/contracts/infra';

import type { LocalHostProbe } from '../../../types/localCompute.js';
import { inspectLocalComputeAsync } from './inspectLocalComputeAsync.js';

/*** Return the existing local host as a read-only portable compute snapshot. */
export async function inspectLocalComputeSnapshotAsync(
  probe: LocalHostProbe,
  context: InfraExecutionContext,
  selection: InfraComputeSelection<'local'>,
): Promise<InfraResult<InfraComputeSnapshot>> {
  const inspected = await inspectLocalComputeAsync(probe, context, selection);
  if (!inspected.ok) return inspected;
  return {
    ok: true,
    value: {
      resources: [inspected.value.owner],
      outputs: [],
      targets: [inspected.value.observation.target],
    },
    diagnostics: [],
  };
}
