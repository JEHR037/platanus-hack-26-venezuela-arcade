// Qawakun neural 4x upscaler v2 ("depixelize"). A tiny CNN on RGBA (four 3x3 conv layers of 8 channels + ReLU, then a
// 1x1 to 48; 2,480 weights at 5 bits) looks at each low-res pixel's 9x9 neighbourhood and, for each of its 4x4 output
// sub-pixels, predicts softmax blend weights over the 4 low-res pixels of that sub-pixel's quadrant (centre, horizontal,
// vertical and diagonal neighbour). Trained on vector scenes rendered both as pixel art and as antialiased HD (plus the
// author's art), it turns stair-steps into straight diagonals and smooth curves. The output is a premultiplied convex
// blend of input colours, so edges stay crisp with no ringing or halos, and alpha gets the same smooth contours.
function nnCore(src, w, h) {
  const F = Float32Array, S = [.0692,.0217,.161,.0407,.105,.0826,.0682,.0443,.392,.186], n = w * h, W = w * 4, d = new Uint8ClampedArray(n * 64),
    C = (v, m) => v < 0 ? 0 : v < m ? v : m - 1;
  let o = 0, z = 0, v = 0, ci = 4, pw = w + 8, ph = h + 8, a;
  // layers 3x8, 3x8, 3x8, 3x8, 1x48: 5-bit codes packed 6 bits per char ('0'..'p' minus backslash), weights [ky][kx][in][out]
  // then biases, each with its own scale (v only needs its low 11 bits, so int32 overflow in << is harmless)
  const P = [3,3,3,3,1].map((k, l) => [k, ...[k * k * ci * (ci = l > 3 ? 48 : 8), ci].map((m, b) => new F(m).map(c => (
    z < 5 && (c = 'M23f`O1m8?Hje7`Rn[h`O1;i=8^lH?K3Bh^NnL<ZNkKg?ac2ab=C=WaNo47iO1SX@MYlh?Q1nX`Jg3jjO=li>Njmi?Pnl7dK1lW`Lk3iCNbeSRb2TWD:6n:dM51;aY9gH65ZeNcRn[B<n:Ch_:[LX?Lid^Z[:B6VPQdXENfk7>MEl88Nk57_QJ3m@Na:k@JQ;0;Y1jT[6cKhYDiYG_:JChaMbe8>O1pF=Nfm7JK5lh>[Uie]Ck2?J?J3XaG9Zh?Hg4W>Q247`Tj[79R6;h>Pfdh^Fo39XU5lG`Nn[h^Po;iaLo3Xa2g<7^HNKi>Jnl7cRYX6^VcCI^VZ2X^]QU5^Nj[i=O1m7`K1mW_I6;5_MF;FbU9]8?Q6;g_K1m7>Jn]gAM5dVaLnm7aM23h^No;h^Nk3Z>S=eh`C1dW_Q>DI>Q>57]Pj]i>Rnm6BE8TG<Lf]H^T_3Ff>k<7_K:@WbC1JFA@o3GcNYRkaQ237aPM]8@HnJI@Y:Ch=Rg;V@PUdGBS:dVbTk3X_TYnF_O5Sh?Ln<G_O1dW_U24W>C6DIaZk37?NU]9@No36`U6;4=Q1m6@Tk<6`Q1CfeOB;f>PjdX^HneXaC5L7`Jk;U@L^mU>O9eHbU6<9?K247>Tjl6^O6e7;Nk4F`Q4ki;U1chAI1lI?VfDWbFFLh>No3i`PjlW>Hj[i?Q9Li^RbZX_Nne8>S1lX^LfdiaO64I<Jk3H<Nfe6aLpSmeY_?X_Nf;j`Y9SgaDnl5CFo4V^RbmI`H^d5aJo2WAM1m7>To49`Q=lj@Fnl:AHkKi?P^cj^Y:D6BG62J=U1dE=Pj[6>P_3GaJne6eM=LK?LnSVaTblX>PbdHDK2<:DDjcf@Rc39?Hn[V`Jbd8?NgDH?O6CGbS23WeQ645`H_SF^VjL2@NnmgaG5mGPW>[9aDk4H?XnmWdHkD6`To[I;Vnd8@I=dX;PkK2YK:4S=WFSY?C5[U@QFTH[J^4F?W1f7?PjSHCOAe4HY217ALk3X^HoDh`Q2Bi@O9CgdNE3H=?6K8BS:;jb?9kUcM:SF]M1ljbPoT6AJj[i`Lne7@T^cW`M64H@U1m6?O63WAO62XBNj]6=M>KX`^6KYBI1dW^PflfdNn]GBP>CF`I2D<GNY^F:K2;G?WFJ7BA5E4bK>YE`O2[iAI>3i?M6:G^Nb[j]M5l7_Fg<8bO:;H@O2;U`Rbm6fM:4HCPfTIAG2<700NdVAQB47<Q2KYFS2EY_X_2gcRoD7CU:47?W2<G@Q6<HaNkDF`S2RZ>Hneh_EAkJDRk]VaTkSXZL^]H^S:47ZC=RYfPk47GW6DEbSFK6]Vnl7e<N47aM9mW^_Q]8_Pk3JBPnm7dTbch=Jfn9eO6;XAS5]GbP^mIeTg3idM247?U1liiK2[7gHgJfBM1[IDLc4F_PblVbVo5WbC6e5AO1mG`Hg;ggHYK<=OAlI`DnficRjFWXQEKXAHYm7;9F:gfV_dFbXV:k_M=DDaHndh@I=LW_L_45GUBCIYI^mXALfkG]Tk2hXPo48gO5dh[NRL7@Q5e6cRblXAQ1]G:Ng2X^W>46_RfBYcG:4H@Nk;h^S2DhCPg<9eK24GbO1m8]M24g?NX38aO><:>RfTGCC1dZbO>DG>Vo3X_PgT8YJcLE@M2;haRg;GAS=[i>8c=XAQ248<K1e7aM6LhaS9lX]Pk3idM5lW?S1eH@Q248@_<]iW0IJGUHo<3BTbQiZFnlgATfle_LMdWaK6;f`LQ[V`Jo<8?R_46@PgD8@Q1ld@PNDiARndh_K2DhbTQ3h;K1eE=PJ3haO1]3;N63iAO1KGXLo<7bVf;GTLo<FATnl6>Fjch?FbkW?Ffc6>Bbdh?LndW>Jo47?NnlX?LkLFbPb;W=I2<E?PYSH?G628`FnlbaPEcX=Jk;dBRUeFaU2<XbU1m6=Pc45aPMcf^F1bh_:j[F=JQ[7<FjSg_NjT7[Nndh=Njdh_Lo3caO23i@NN4WbU6<XbTndi?LjKV]Lbdi>LjKU;Lfdh>LbBf;HflW?JjK6]J^SgWNPld=PYYc9@920;@9ZAWB0QQ::E]4XLDK4:He'.charCodeAt(o++), v = v << 6 | c - 48 - (c > 92), z += 6),
    ((v >> (z -= 5) & 31) - 15) * S[l * 2 + b])))]);
  // input RGBA / 255 - .5, padded once by the receptive radius (clamp), then valid convs; ReLU is applied when reading
  a = new F(pw * ph * 4).map((_, i) => src[(C((i >> 2) / pw - 4 | 0, h) * w + C((i >> 2) % pw - 4, w)) * 4 + i % 4] / 255 - .5);
  P.map(([k, wt, b], l) => {
    const co = b.length, ci = a.length / pw / ph, ow = pw - k + 1, r = new F(ow * (ph -= k - 1) * co);
    for (let p = ow * ph; p--;) {
      const x = p % ow, q = p * co;
      r.set(b, q);
      for (let t = 0; t < k * k; t++) for (let i = 0, f = ((p - x) / ow * pw + x + (t / k | 0) * pw + t % k) * ci; i < ci; i++) {
        const v = a[f + i];
        if (v > 0 | !l) for (let j = co, u = (t * ci + i) * co; j--;) r[q + j] += wt[u + j] * v;
      }
    }
    a = r, pw = ow;
  });
  // output: sub-pixel (i, j) of LR pixel (x, y) = softmax-weighted premultiplied blend of C, H, V, D
  for (let p = n * 16; p--;) {
    const x = p % W >> 2, y = p / W >> 2, i = p % W & 3, j = p / W & 3, q = (y * w + x) * 48 + (j * 4 + i) * 3,
      X = C(x + (i > 1) * 2 - 1, w), Y = C(y + (j > 1) * 2 - 1, h) * w, t = [0, 0, 0, 0];
    let E = 0;
    [y * w + x, y * w + X, Y + x, Y + X].map((s, m) => {
      const g = m ? Math.exp(a[q + m - 1]) : 1, f = g * src[s *= 4, s + 3];
      E += g, t[3] += f;
      for (let c = 3; c--;) t[c] += f * src[s + c];
    });
    for (let c = 4; c--;) d[p * 4 + c] = c < 3 ? t[c] / t[3] : t[3] / E;
  }
  return { data: d, w: W, h: h * 4 };
}

function nnUp(img) {
  const c = document.createElement('canvas'), x = c.getContext('2d', { willReadFrequently: !0 }), w = c.width = img.width, h = c.height = img.height;
  x.drawImage(img, 0, 0);
  // the width argument resizes the canvas to 4x after the pixels were read
  x.putImageData(new ImageData(nnCore(x.getImageData(0, 0, w, h).data, w, h).data, (c.height *= 4, c.width *= 4)), 0, 0);
  return c;
}
