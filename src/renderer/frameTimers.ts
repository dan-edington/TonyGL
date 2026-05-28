function initialiseFrameTimers() {
  let currentTime: number = 0;
  let currentFrame: number = 0;
  let elapsedTime: number = 0;
  let previousTime: number = 0;
  let deltaTime: number = 0;

  function updateFrameTimers() {
    currentFrame++;
    currentTime = performance.now();

    if (!previousTime) {
      previousTime = currentTime;
    }

    deltaTime = currentTime - previousTime;
    elapsedTime += deltaTime;
    previousTime = currentTime;

    return {
      currentTime,
      currentFrame,
      elapsedTime,
      deltaTime,
    };
  }

  return {
    updateFrameTimers,
    currentTime,
    currentFrame,
    elapsedTime,
    deltaTime,
  } as const;
}

export { initialiseFrameTimers };
