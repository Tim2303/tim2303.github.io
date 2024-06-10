/* Input module implementation */
export enum VK {
  LBUTTON = 0x0,
  MBUTTON = 0x1,
  RBUTTON = 0x2,
  SHIFT = 0x10,
  CONTROL = 0x11,
  MENU = 0x12,
  ESCAPE = 0x1b,
  LEFT = 0x25,
  UP = 0x26,
  RIGHT = 0x27,
  DOWN = 0x28,
  W = 0x57,
  A = 0x41,
  S = 0x53,
  D = 0x44,
  SPACE = 0x20,
}

export class _input {
  mX: number = 0;
  mY: number = 0;
  mdX: number = 0;
  mdY: number = 0;
  mdZ: number = 0;

  keysOld: boolean[] = [];
  keys: boolean[] = [];
  keysClick: boolean[] = [];

  keysEvent: boolean[] = [];
  mXEvent: number = 0;
  mYEvent: number = 0;
  mdXEvent: number = 0;
  mdYEvent: number = 0;
  mdZEvent: number = 0;

  constructor() {
    this.mXEvent =
      this.mYEvent =
      this.mdXEvent =
      this.mdYEvent =
      this.mdZEvent =
        0;
    this.mX = this.mY = this.mdX = this.mdY = this.mdZ = 0;

    for (let i = 0; i < 256; i++)
      this.keysEvent[i] =
        this.keysOld[i] =
        this.keys[i] =
        this.keysClick[i] =
          false;
  }

  response() {
    this.mX = this.mXEvent;
    this.mY = this.mYEvent;
    this.mdX = this.mdXEvent;
    this.mdY = this.mdYEvent;
    this.mdZ = this.mdZEvent;

    for (let i = 0; i < 256; i++) this.keys[i] = this.keysEvent[i];
    for (let i = 0; i < 256; i++)
      this.keysClick[i] = this.keys[i] && !this.keysOld[i];
    for (let i = 0; i < 256; i++) this.keysOld[i] = this.keys[i];

    this.mdXEvent = this.mdYEvent = this.mdZEvent = 0;
  }

  onKeyDown = (e: KeyboardEvent) => {
    this.keysEvent[e.keyCode] = true;
  };
  onKeyUp = (e: KeyboardEvent) => {
    this.keysEvent[e.keyCode] = false;
  };
  onMouseDown = (e: MouseEvent) => {
    this.keysEvent[e.button] = true;
  };
  onMouseUp = (e: MouseEvent) => {
    this.keysEvent[e.button] = false;
  };
  onMouseMove = (e: MouseEvent) => {
    this.mXEvent = e.x;
    this.mdXEvent += e.movementX;
    this.mYEvent = e.y;
    this.mdYEvent += e.movementY;
  };
  onMouseWheel = (e: WheelEvent) => {
    this.mdZEvent -= e.deltaY;
  };
}
