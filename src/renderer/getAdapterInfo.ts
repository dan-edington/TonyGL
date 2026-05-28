import { errorMessages } from '../constants/errorMessages';

async function getAdapterInfo() {
  const adapter = await navigator.gpu.requestAdapter();
  if (!adapter) throw new Error(errorMessages.adapterRequest);

  const limits = adapter.limits;
  const features = Array.from(adapter.features);
  const info = adapter.info;

  return {
    limits,
    features,
    info,
  };
}

export { getAdapterInfo };
