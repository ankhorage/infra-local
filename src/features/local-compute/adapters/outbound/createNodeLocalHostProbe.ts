import { constants } from 'node:fs';
import { access, stat } from 'node:fs/promises';
import { arch, platform } from 'node:os';

import type { InfraComputeTarget, InfraResult } from '@ankhorage/contracts/infra';

import type { LocalHostObservation, LocalHostProbe } from '../../../../types/localCompute.js';

/*** Create the concrete Node host probe used by the default local compute adapter. */
export function createNodeLocalHostProbe(): LocalHostProbe {
  return {
    inspectAsync: async (workingDirectory) => inspectLocalHostAsync(workingDirectory),
  };
}

/*** Inspect the current process host and requested working directory. */
async function inspectLocalHostAsync(
  workingDirectory: string,
): Promise<InfraResult<LocalHostObservation>> {
  const target = getLocalTarget();
  if (!target.ok) return target;
  const exists = await stat(workingDirectory)
    .then((value) => value.isDirectory())
    .catch(() => false);
  const readable = exists && (await canAccessAsync(workingDirectory, constants.R_OK));
  const writable = exists && (await canAccessAsync(workingDirectory, constants.W_OK));
  return {
    ok: true,
    value: { target: target.value, workingDirectory, exists, readable, writable },
    diagnostics: [],
  };
}

/*** Map Node platform and architecture values to the portable Contracts target. */
function getLocalTarget(): InfraResult<LocalHostObservation['target']> {
  const os = platform();
  const architecture = arch();
  if (
    (os !== 'linux' && os !== 'darwin' && os !== 'win32') ||
    (architecture !== 'x64' && architecture !== 'arm64')
  ) {
    return {
      ok: false,
      diagnostics: [
        {
          severity: 'error',
          code: 'local-host-unsupported',
          message: 'The local OS or CPU architecture is not supported.',
        },
      ],
    };
  }
  const portableOs: InfraComputeTarget['os'] = os === 'win32' ? 'windows' : os;
  return {
    ok: true,
    value: {
      id: 'local',
      kind: 'local-host',
      os: portableOs,
      architecture: architecture === 'x64' ? 'amd64' : 'arm64',
    },
    diagnostics: [],
  };
}

/*** Check one filesystem access mode without throwing host exceptions. */
async function canAccessAsync(path: string, mode: number): Promise<boolean> {
  return access(path, mode)
    .then(() => true)
    .catch(() => false);
}
