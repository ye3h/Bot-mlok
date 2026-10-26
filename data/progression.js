// data/progression.js
const XP_THRESH = [0, 0];
for (let L = 2; L <= 500; L++) {
  XP_THRESH[L] = XP_THRESH[L - 1] + Math.round(11.6 * Math.pow(L - 1, 1.6));
}
