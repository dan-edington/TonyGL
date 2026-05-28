import '../style.css';

import { getAdapterInfo } from '../../src/TonyGL';

const container = document.getElementById('app');

if (container) {
  // Create and init the renderer
  const { limits, features, info } = await getAdapterInfo();

  const featuresList = document.getElementById('featuresList')!;
  const limitsList = document.getElementById('limitsList')!;
  const infoList = document.getElementById('infoList')!;

  features.forEach((feature) => {
    const element = document.createElement('li');
    element.innerText = feature;
    featuresList.appendChild(element);
  });

  for (let key in info) {
    const element = document.createElement('li');
    element.innerText = `${key}: ${info[key as keyof typeof info]}`;
    infoList.appendChild(element);
  }

  for (let key in limits) {
    const element = document.createElement('li');
    element.innerText = `${key}: ${limits[key as keyof typeof limits]}`;
    limitsList.appendChild(element);
  }
}
