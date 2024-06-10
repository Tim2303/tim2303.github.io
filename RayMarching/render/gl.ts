export let gl: WebGL2RenderingContext;
export let canvas: HTMLCanvasElement;

export function setGL(document: Document) {
  canvas = document.querySelector("#glcanvas") as HTMLCanvasElement;
  if (!canvas) return;
  gl = canvas.getContext("webgl2") as WebGL2RenderingContext;
  return gl;
}
