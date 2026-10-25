/** Public local-host compute adapter package boundary. */
export { infraAdapterDescriptor } from './constants/infra.js';
export { createNodeLocalHostProbe } from './features/local-compute/adapters/outbound/createNodeLocalHostProbe.js';
export { createInfraAdapter } from './features/local-compute/composition/createInfraAdapter.js';
export type {
  LocalComputeAdapterOptions,
  LocalHostObservation,
  LocalHostProbe,
} from './types/localCompute.js';
