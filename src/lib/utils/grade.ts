// Climbing grade ranking — French sport, Font bouldering, V-scale, YDS.
// Returns a numeric score, higher = harder. Returns -1 for unparseable.

export function gradeRank(g: string): number {
  const s = g.trim().toLowerCase();

  // V-scale: V0 .. V17
  const v = s.match(/^v(\d+)/);
  if (v) return 1000 + Number(v[1]) * 5;

  // YDS sport: 5.10a..5.15d (simplified)
  const yds = s.match(/^5\.(\d+)([a-d])?(\+|-)?/);
  if (yds) {
    const num = Number(yds[1]);
    const letter = yds[2] ? yds[2].charCodeAt(0) - 'a'.charCodeAt(0) : 0;
    return 500 + num * 10 + letter;
  }

  // French / Font: 6a, 6a+, 7c+, 8a, 9a
  // Capture: digit, optional letter, optional plus
  const f = s.match(/^(\d)([a-d])(\+)?/);
  if (f) {
    const num = Number(f[1]);
    const letter = f[2].charCodeAt(0) - 'a'.charCodeAt(0); // a=0,b=1,c=2,d=3
    const plus = f[3] ? 1 : 0;
    // Each whole grade = 10 units, each letter = 2 units, + = 1 unit
    return num * 10 + letter * 2 + plus;
  }

  return -1;
}

// Pretty label for a numeric rank (for chart axes).
export function rankLabel(rank: number): string {
  if (rank >= 1000) {
    const v = Math.floor((rank - 1000) / 5);
    return `V${v}`;
  }
  if (rank >= 500) {
    const yds = Math.floor((rank - 500) / 10);
    const letter = ['a', 'b', 'c', 'd'][(rank - 500) % 10];
    return `5.${yds}${letter}`;
  }
  const num = Math.floor(rank / 10);
  const remainder = rank % 10;
  const letter = ['a', 'b', 'c', 'd'][Math.floor(remainder / 2)];
  const plus = remainder % 2 === 1 ? '+' : '';
  return `${num}${letter}${plus}`;
}
