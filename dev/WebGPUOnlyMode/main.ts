import '../style.css';

import { TonyGL } from '../../src/TonyGL';

const container = document.getElementById('app');

if (container) {
  // Create and init the renderer
  const webGPUBase = await TonyGL({
    webGPUSetupOnly: true,
    containerElement: container,
    alpha: true,
  });

  console.log(webGPUBase);
}
