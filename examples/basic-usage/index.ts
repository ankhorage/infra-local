import { createInfraAdapter, infraAdapterDescriptor } from '@ankhorage/infra-local';

const adapter = createInfraAdapter();

console.log(infraAdapterDescriptor.id, adapter.descriptor.package);
