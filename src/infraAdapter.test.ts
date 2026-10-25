import type { InfraComputeTarget, InfraResult } from '@ankhorage/contracts/infra';
import { INFRA_ADAPTER_CATALOG, isInfraAdapterDescriptor } from '@ankhorage/contracts/infra';
import { describe, expect, it } from 'bun:test';

import { createInfraAdapter, infraAdapterDescriptor } from './index.js';
import type { LocalHostObservation, LocalHostProbe } from './types/localCompute.js';

describe('local-host compute adapter', () => {
  it('exports the exact Contracts catalog descriptor', () => {
    expect(infraAdapterDescriptor).toEqual(INFRA_ADAPTER_CATALOG.local);
    expect(isInfraAdapterDescriptor(infraAdapterDescriptor)).toBe(true);
  });

  it('rejects descriptor identity drift', () => {
    expect(
      isInfraAdapterDescriptor({
        ...infraAdapterDescriptor,
        package: '@ankhorage/not-local',
      }),
    ).toBe(false);
  });

  it('exposes the canonical implementation entrypoint', () => {
    expect(createInfraAdapter().descriptor).toBe(infraAdapterDescriptor);
  });

  it('returns the existing host as a portable target without provisioning it', async () => {
    const target: Extract<InfraComputeTarget, { kind: 'local-host' }> = {
      id: 'local',
      kind: 'local-host',
      os: 'linux',
      architecture: 'amd64',
    };
    const adapter = createInfraAdapter({ probe: new FakeLocalHostProbe(target) });
    const context = createContext();
    const inspected = await adapter.inspectAsync(context, {
      provider: 'local',
      workingDirectory: '/work',
    });
    expect(inspected.ok && inspected.value.targets).toEqual([target]);
    const plan = await adapter.planAsync(context, { provider: 'local', workingDirectory: '/work' });
    expect(plan.ok && plan.value[0]?.operation).toBe('noop');
    const ensured = await adapter.ensureAsync(context, {
      provider: 'local',
      workingDirectory: '/work',
    });
    expect(ensured.ok && ensured.value.targets).toEqual([target]);
    expect((await adapter.statusAsync(context)).ok).toBe(true);
    expect((await adapter.destroyAsync(context, createDestroyRequest())).ok).toBe(true);
  });

  it('rejects an unavailable working directory', async () => {
    const adapter = createInfraAdapter({ probe: new FakeLocalHostProbe(undefined) });
    const result = await adapter.validateAsync(createContext(), {
      provider: 'local',
      workingDirectory: '/missing',
    });
    expect(result.ok).toBe(false);
  });
});

class FakeLocalHostProbe implements LocalHostProbe {
  constructor(
    private readonly target: Extract<InfraComputeTarget, { kind: 'local-host' }> | undefined,
  ) {}

  inspectAsync(workingDirectory: string): Promise<InfraResult<LocalHostObservation>> {
    const target = this.target ?? {
      id: 'local',
      kind: 'local-host' as const,
      os: 'linux' as const,
      architecture: 'amd64' as const,
    };
    return Promise.resolve({
      ok: true,
      value: {
        target,
        workingDirectory,
        exists: this.target !== undefined,
        readable: this.target !== undefined,
        writable: this.target !== undefined,
      },
      diagnostics: [],
    });
  }
}

function createContext() {
  return {
    projectId: 'sample',
    environment: 'local' as const,
    desired: {
      deployment: {
        compute: { provider: 'local' as const, workingDirectory: '/work' },
        runtime: { provider: 'minikube' as const },
      },
    },
    credentials: {
      findAsync: () => Promise.resolve({ ok: true as const, value: null, diagnostics: [] }),
      resolveAsync: () => Promise.resolve({ ok: true as const, value: {}, diagnostics: [] }),
      persistAsync: () => Promise.resolve({ ok: true as const, value: null, diagnostics: [] }),
    },
    secrets: {
      resolveAsync: () => Promise.resolve({ ok: true as const, value: 'secret', diagnostics: [] }),
    },
  };
}

function createDestroyRequest() {
  return {
    projectId: 'sample',
    environment: 'local' as const,
    confirmation: { projectId: 'sample', environment: 'local' as const },
    persistence: { policy: 'retain' as const },
  };
}
