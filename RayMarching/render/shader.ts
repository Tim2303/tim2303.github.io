/* Shader manager implementation */
export class _shader {
  progID: WebGLProgram = 0;
  name: string = "NONE";
  constructor(str: string, id: WebGLProgram) {
    this.name = str;
    this.progID = id;
  }
}

export class _shaderManager {
  shaders: _shader[] = [];
  shadersNum: number = 0;

  private async Load(fileName: string, gl: WebGL2RenderingContext) {
    const shdsName = ["vert", "frag"];
    const shdsType = [gl.VERTEX_SHADER, gl.FRAGMENT_SHADER];
    let shdsID: WebGLShader[] = [];

    for (let i = 0; i < shdsName.length; i++) {
      const buf = "./binary/shaders/" + fileName + "/" + shdsName[i] + ".glsl";

      const data = await (await fetch(buf)).text();
      let res = gl.createShader(shdsType[i]);
      if (!res) return;

      shdsID[i] = res;

      gl.shaderSource(shdsID[i], data);
      gl.compileShader(shdsID[i]);

      if (!gl.getShaderParameter(shdsID[i], gl.COMPILE_STATUS)) {
        console.log(buf + ":" + "\n" + gl.getShaderInfoLog(shdsID[i]));
      }
    }

    const program = gl.createProgram();
    if (!program) return;

    for (let i = 0; i < shdsName.length; i++)
      gl.attachShader(program, shdsID[i]);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.log(gl.getProgramInfoLog(program));
    }
    this.shaders[this.shadersNum] = new _shader(fileName, program);
  }

  async add(fileName: string, gl: WebGL2RenderingContext) {
    for (let i = 0; i < this.shadersNum; i++)
      if (this.shaders[i].name == fileName) return await i;

    await this.Load(fileName, gl);
    return await this.shadersNum++;
  }

  get(index: number) {
    if (index < 0 || index >= this.shadersNum) {
      return this.shaders[0];
    } else {
      return this.shaders[index];
    }
  }
}
