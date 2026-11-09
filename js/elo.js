/** Pure Elo helpers. */
export function eloExpected(ra, rb) {
  return 1 / (1 + Math.pow(10, (rb - ra) / 400));
}
export function applyEloVote(eloMap, modelA, modelB, vote, K = 32) {
  const ensure = (m) => {
    const key = m || "?";
    if (!eloMap[key]) eloMap[key] = { rating: 1000, w: 0, l: 0, t: 0, games: 0 };
    return eloMap[key];
  };
  const a = ensure(modelA);
  const b = ensure(modelB);
  const ea = eloExpected(a.rating, b.rating);
  const eb = 1 - ea;
  let sa = 0.5, sb = 0.5;
  if (vote === "A") { sa = 1; sb = 0; a.w++; b.l++; }
  else if (vote === "B") { sa = 0; sb = 1; a.l++; b.w++; }
  else { sa = 0.5; sb = 0.5; a.t++; b.t++; }
  a.rating = Math.round(a.rating + K * (sa - ea));
  b.rating = Math.round(b.rating + K * (sb - eb));
  a.games++; b.games++;
  return eloMap;
}
