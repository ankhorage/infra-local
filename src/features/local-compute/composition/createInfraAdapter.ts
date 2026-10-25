import type { InfraComputeAdapter } from '@ankhorage/contracts/infra';

import { infraAdapterDescriptor } from '../../../constants/infra.js';
import type { LocalComputeAdapterOptions } from '../../../types/localCompute.js';
import { createNodeLocalHostProbe } from '../adapters/outbound/createNodeLocalHostProbe.js';
import { destroyLocalComputeAsync } from '../application/destroyLocalComputeAsync.js';
import { ensureLocalComputeAsync } from '../application/ensureLocalComputeAsync.js';
import { getLocalComputeStatusAsync } from '../application/getLocalComputeStatusAsync.js';
import { inspectLocalComputeSnapshotAsync } from '../application/inspectLocalComputeSnapshotAsync.js';
import { planLocalComputeAsync } from '../application/planLocalComputeAsync.js';
import { validateLocalComputeAsync } from '../application/validateLocalComputeAsync.js';

/***
 * Create the canonical local-host compute adapter entrypoint.
 *
 * The default adapter inspects the current Node host and never provisions, suspends or deletes the
 * user's machine. A probe can be injected for deterministic tests or another host environment.
 *
 * @readme
 */
export function createInfraAdapter(
  options: LocalComputeAdapterOptions = {},
): InfraComputeAdapter<'local'> {
  const probe = options.probe ?? createNodeLocalHostProbe();
  return {
    descriptor: infraAdapterDescriptor,
    validateAsync: (context, selection) => validateLocalComputeAsync(probe, context, selection),
    inspectAsync: (context, selection) =>
      inspectLocalComputeSnapshotAsync(probe, context, selection),
    planAsync: (context, selection) => planLocalComputeAsync(probe, context, selection),
    ensureAsync: (context, selection) => ensureLocalComputeAsync(probe, context, selection),
    statusAsync: (context) => getLocalComputeStatusAsync(probe, context),
    destroyAsync: (context, request) => destroyLocalComputeAsync(context, request),
  };
}
