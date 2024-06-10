/* Timer implementation */
export class _timer {
  // Private
  startTime: number = 0;
  oldTime: number = 0;
  oldTimeFPS: number = 0;
  pauseTime: number = 0;
  frameCounter: number = 0;
  // Public
  isPause: boolean = false;
  FPS: number = 60;
  globalTime: number = 0;
  globalDeltaTime: number = 0;
  deltaTime: number = 0;
  averageDeltaTime: number = 0;
  time: number = 0;
  // Special
  tmpAvTime: number = 0;
  cnt: number = 0;

  Init() {
    this.startTime = this.oldTime = this.oldTimeFPS = new Date().getTime();
  }

  response() {
    const now = new Date().getTime();

    this.globalTime = (now - this.startTime) / 1000.0;
    this.globalDeltaTime = (now - this.oldTime) / 1000.0;

    if (this.isPause) {
      this.deltaTime = 0;
      this.pauseTime += (now - this.oldTime) / 1000.0;
    } else {
      this.deltaTime = this.globalDeltaTime;
      this.time = (now - this.pauseTime - this.startTime) / 1000.0;
    }

    this.frameCounter++;
    if (now - this.oldTimeFPS > 1000.0) {
      this.FPS = (this.frameCounter * 1000.0) / (now - this.oldTimeFPS);
      this.oldTimeFPS = now;
      this.frameCounter = 0;
    }
    this.oldTime = now;

    (this.tmpAvTime += this.globalDeltaTime), this.cnt++;
    if (this.cnt > 100) {
      this.averageDeltaTime = this.tmpAvTime / this.cnt;
      this.tmpAvTime = this.cnt = 0;
    }
  }
}

/* END OF 'timer.ts' FILE */
