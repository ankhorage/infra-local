import type {
  InfraComputeSelection,
  InfraExecutionContext,
  InfraOwnedResource,
  InfraResult,
} from '@ankhorage/contracts/infra';

import type { LocalHostObservation, LocalHostProbe } from '../../../types/localCompute.js';

export interface InspectedLocalCompute {
  readonly observation: LocalHostObservation;
  readonly owner: InfraOwnedResource;
}

/*** Validate local selection and host capabilities, returning canonical ownership. */
export async function inspectLocalComputeAsync(
  probe: LocalHostProbe,
  context: InfraExecutionContext,
  selection: InfraComputeSelection<'local'>,
): Promise<InfraResult<InspectedLocalCompute>> {
  if (context.desired.deployment.compute.provider !== 'local') {
    return invalidSelection();
  }
  const workingDirectory = selection.workingDirectory ?? process.cwd();
  const observed = await probe.inspectAsync(workingDirectory, context.signal);
  if (!observed.ok) return observed;
  if (!observed.value.exists || !observed.value.readable || !observed.value.writable) {
    return {
      ok: false,
      diagnostics: [
        {
          severity: 'error',
          code: 'local-working-directory-unavailable',
          message: 'The selected local working directory must exist and be readable and writable.',
        },
      ],
    };
  }
  return {
    ok: true,
    value: {
      observation: observed.value,
      owner: {
        identity: {
          projectId: context.projectId,
          environment: context.environment,
          adapter: 'local',
          resourceId: 'host',
        },
        externalId: observed.value.workingDirectory,
        persistent: false,
        retention: 'retain',
        dependsOn: [],
      },
    },
    diagnostics: [],
  };
}

/*** Reject a local adapter invoked for a different compute selection. */
function invalidSelection(): InfraResult<never> {
  return {
    ok: false,
    diagnostics: [
      {
        severity: 'error',
        code: 'local-selection-invalid',
        message: 'Local compute requires the canonical local selection.',
      },
    ],
  };
}
