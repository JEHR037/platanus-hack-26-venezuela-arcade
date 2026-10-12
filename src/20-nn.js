// Qawakun neural 4x upscaler v3 ("depixelize"). A tiny CNN on RGBA (four 3x3 conv layers of 9 channels + ReLU, then a
// 1x1 to 48; 3,027 weights) looks at each low-res pixel's 9x9 neighbourhood and, for each of its 4x4 output sub-pixels,
// predicts softmax blend weights over the 4 low-res pixels of that sub-pixel's quadrant (centre, horizontal, vertical
// and diagonal neighbour). v3 learned from a large super-resolution model (used only while training) and was then
// specialised on this game's own images, so stair-steps become the clean lines and curves of a hand-drawn version.
// The output is a premultiplied convex blend of input colours: edges stay crisp, with no ringing or halos, and alpha
// gets the same smooth contours.
function nnCore(src, w, h) {
  const F = Float32Array, S = [.0964,.0602,.172,.0589,.0759,.0982,.0894,.0668,.28,.143], n = w * h, W = w * 4, d = new Uint8ClampedArray(n * 64),
    C = (v, m) => v < 0 ? 0 : v < m ? v : m - 1,
    // next bit of the weight stream (6 bits per char, '0'..'p' minus backslash)
    B = () => (z || (v = '1B9A081A;210908:1T01490502TD4DZ@R?j<ikU080;@80IOZ0R2RQ2J0[eQ25a21R0cP2R@D4:1iD?cN?dh1n@3YopZ?A];^n348mAnpdoT`SaRIbmXpQD7?JE4P>a`PibDWNU^0]4;83aT180@D;Y:P9dgc269oIB5cO_@00cpWT:pK22GAZ2PUm<UB4]0P9ISi7jUIVTmLIp[25@8<Y9Q1T9@ABQ6I1oiH2B=A03bU85P4PaR20W2540a8@0HGj<=Xdl9P<Q4R2Ap;_;@E2<jT@Xd?348TUHP1T220^HTeQ8;@3AO4<[6;03:281@:H@54a<2FP19@1008@08:PVX;1DTie@@V2Bb0QX^6L4iD:]11BDNmOV2ZIQ8ATT?AJRoF1:C0DbGcPomG>H_<4;5I=N]8PoaE]TaF<D:ffGCPkX]61hXIE1NRj<@X>6BPP05^HV:f@2R2CI3;@Q25f4FZ54eci@DTeDPF2TFF0Pc2TB40H2A1R>bJ8R4hP8A2<4XAc6TQ8aBBa1KD70e802:<D4JA0L<aRChKGP^Z21TQ?^YJ=e@2<^9i92BhGS1]ZigD@0322@0:::QR59R7H4@P0TaaC29TU0@0DPV@500B:U0UU>?k7in:YkaNGcdQ>XN0V338BD?<i2eiL8_Jd0X95PaUA1PYl0Y0WZ4Z_QSZN^_?5B;P:N2>8[PVdBf@A^;OBVmp:Q<:0@672@2baS3Jf_9ThAIgL:3lXf2V<6iblV6YlAETV24851cT2D1<Y0Z2i@XXi^CG1Q54Pa[YbNf<@:a3ZcJPpN5bdJC68IXeRH<61MDR^6Qp;OCTZcSh2Xd4<Ib4Np>:OioGDJi8WIf>GfSbf?VSWNBZ[M?e5c3j<kSScHoN]F_mP;Y5J[T[]ADhT;FDD<mJkH37Y?m`@TES3Z83Lo=G0:P;aZ:6[O:iD3CO_0P;QE4PX8e:1XcjDUP1K0E050@V0@g[1BK8m1^JeiajEWH92fDaKA0KbQW0f5NbI3b14B`=f3TD1D?kiiS6b7FcmIbf<P:Q0AY<X]1YDVBU<cDI<DcD8<L9A0CB40Yb<[gNKiTM@eT:::0D8e51RU[lp?mb[P6:E24GPbCHXaDaA558;58Q0eUF168Q8FG450UK5V8b2A<59DhaKI5E@RZ1Y3<@4VhYBEYENkDA3b[R>UH;G@IW6X5ZUJQ65B@Q0445ABZ]891@U61X@]:YdUTiD@100B<800XP0Y1A18=0C1P^ADB9aQXaLAYHS4<bI5aC1Y00W6XRZRC?1TY08@2G<JV]19;aBbk>:i_8SMLW75:5p53O2WlU]]@]lOJgHn7Q>N1I`5oRdRNV>X3i58=DA8N[C5;@Ri[1YSEE@RX=DjBTd]QP::I=4QSYX:40UB26RV2B@44@DT[Be8U:Q2E@52Z8ABB@<0X9@Q2B00180QX9<PBAC2@@QDXR<2[P28>RN:Y@89X<:0Q2H;W5I50HA80R5@E@eBU2;Q:52A0B102PTTZdE9U80X14P0V0X2Q08018157P3D@Xp[NbVE0omEMl4d1?lQIIcdVFaa19=cI96ZSD8af1e1XPRa9bS5ERLH=HbF:RYS1F6]c>D0RY6m`d4V96@_HR8DE797]:8EE0d:cd^`M[96gNFn^80<P4682A839aQP6cFC0>0K19Bnb6kMpT7]mXGBOd0j5BidDE2Pb<bVU486KMl[:GI<jLlRe<T@S4:<2:48A2S2R55YG@_5LJ4H4HLHK2T3I6cG4BQ^;:1;KWKNBcFC>Fm_@:HD2:52<>8QHQH@13XAAY00C@RQFA>HON?<nIdnpKjddOmhOlhjmW^oop`OWlhKh:ohlgN@'.charCodeAt(o++) - 48, v -= v > 44, z = 6), v >> --z & 1);
  let o = 0, z = 0, v, ci = 4, pw = w + 8, ph = h + 8, a;
  // layers 3x9, 3x9, 3x9, 3x9, 1x48: weights [ky][kx][in][out] then biases, each tensor with its own scale;
  // every value is a zigzag integer in a Rice code (unary high part, then 2 low bits)
  const P = [3,3,3,3,1].map((k, l) => [k, ...[k * k * ci * (ci = l > 3 ? 48 : 9), ci].map((m, b) => new F(m).map(c => {
    for (c = 0; B();) c++;
    return ((c = c * 4 + B() * 2 + B()) >> 1 ^ -(c & 1)) * S[l * 2 + b];
  }))]);
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
