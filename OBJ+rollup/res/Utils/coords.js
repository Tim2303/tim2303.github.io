// Load object function
export function createObject(txtObj) {
  let fileStr = txtObj.split('\n');
  let V = [], Ind = [];

  /* Load primitive data */
  fileStr.forEach((item, index, array) => {
    let arr = item.split(' ');

    if (item[0] == 'v' && item[1] == ' ') {
      V.push(+arr[1]);
      V.push(+arr[2]);
      V.push(+arr[3]);
    } else if (item[0] == 'f' && item[1] == ' ') {
      let c0 = 0, c1 = 0, c;

      for (let cnt = 1; cnt <= 3; cnt++) {
        c = parseInt(arr[cnt]) - 1;
        if (cnt == 1) {
          c0 = c;
        } else if (cnt == 2) {
          c1 = c;
        } else { /* Triangle completed */
          Ind.push(c0);
          Ind.push(c1);
          Ind.push(c);
          c1 = c;
        }
      }
    }
  });

  return [new Float32Array(V), new Uint16Array(Ind)];
}

  // /* Create primitive */
  // for (i = 0; i < nf; i += 3)
  // {
  //   tm2VERTEX
  //     *p0 = &V[Ind[i]],
  //     *p1 = &V[Ind[i + 1]],
  //     *p2 = &V[Ind[i + 2]];
  //   vec3 N = VecNormalize(VecCrossVec(VecSubVec(p1->P, p0->P), VecSubVec(p2->P, p0->P)));

  //   p0->N = VecAddVec(p0->N, N);
  //   p1->N = VecAddVec(p1->N, N);
  //   p2->N = VecAddVec(p2->N, N);
  // }
