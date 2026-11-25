/**
 * ClayScene — soft "clay" isometric startup kiosk, drawn in pure SVG.
 * Idea boxes ride a conveyor into the kiosk, a ৳ coin rolls in, sunlight drifts across the floor.
 * The shop sign shows whatever startup name the visitor is typing (prop `name`).
 */
const K = 0.866;
const CX = 640;
const CY = 250;
const iso = (x, y, z = 0) => [CX + (x - y) * K, CY + (x + y) * 0.5 - z];
const pts = (...ps) => ps.map((p) => iso(...p).map((n) => n.toFixed(1)).join(",")).join(" ");
const MAT = {
  top: [K, 0.5, -K, 0.5], // z = const   · u:+x  v:+y
  yf: [K, 0.5, 0, 1], //     y = const   · u:+x  v:-z   (left, sunlit face)
  xf: [K, -0.5, 0, 1], //    x = const   · u:-y  v:-z   (right, shaded face)
  awn: [K, -0.5, 0.48, 1.1], // awning: tilts out of the x-face and down
};

function Face({ p, at, children, className }) {
  const [e, f] = iso(...at);
  const [a, b, c, d] = MAT[p];
  return <g className={className} transform={`matrix(${a} ${b} ${c} ${d} ${e.toFixed(1)} ${f.toFixed(1)})`}>{children}</g>;
}

/* Polygon "inflated" with a round-joined stroke of the same paint → soft clay edges. */
const Puff = ({ points, fill, r = 18, ...rest }) => (
  <polygon points={points} fill={fill} stroke={fill} strokeWidth={r} strokeLinejoin="round" {...rest} />
);

function Crate({ label, delay }) {
  const x = -60, y = -138, z = 40, s = 62, h = 50;
  return (
    <g className="sc-crate" style={{ animationDelay: `${delay}s` }}>
      <Face p="top" at={[x + 8, y + 10, z + 1]}><rect width={s} height={s} rx="10" fill="#5B567E" opacity=".16" filter="url(#scBlur6)" /></Face>
      <Puff points={pts([x, y + s, z + h], [x + s, y + s, z + h], [x + s, y + s, z], [x, y + s, z])} fill="#DDB273" r={7} />
      <Puff points={pts([x + s, y + s, z + h], [x + s, y, z + h], [x + s, y, z], [x + s, y + s, z])} fill="#C6985B" r={7} />
      <Puff points={pts([x, y, z + h], [x + s, y, z + h], [x + s, y + s, z + h], [x, y + s, z + h])} fill="#EDCF97" r={7} />
      <polygon points={pts([x, y + s / 2 - 6, z + h], [x + s, y + s / 2 - 6, z + h], [x + s, y + s / 2 + 6, z + h], [x, y + s / 2 + 6, z + h])} fill="#F6E3BE" />
      <polyline points={pts([x, y + s / 2, z + h], [x + s, y + s / 2, z + h])} stroke="#C9A066" strokeWidth="1.2" fill="none" />
      <Face p="yf" at={[x, y + s, z + h]}>
        <text x={s / 2} y={h / 2 + 6} textAnchor="middle" fontSize="15" fontWeight="800" fill="#8A6430" opacity=".72" fontFamily="Inter, 'Hind Siliguri', sans-serif">{label}</text>
      </Face>
    </g>
  );
}

const TILE = 180;

export default function ClayScene({ name = "", bn = false, launch = 0 }) {
  const sign = (name || "").trim() || (bn ? "সোনারহরিণ" : "sonarhorin");
  const long = sign.length > 11;
  const tiles = [];
  for (let i = -6; i <= 5; i++) for (let j = -5; j <= 6; j++) tiles.push([i, j]);
  const crates = bn ? ["আইডিয়া", "পিচ", "MVP", "ডেক"] : ["idea", "pitch", "MVP", "deck"];

  return (
    <svg className={`sc-scene ${launch > 0 ? "is-launch" : ""}`} viewBox="-300 -150 1340 780" preserveAspectRatio="xMaxYMid slice" aria-hidden="true">
      <defs>
        <filter id="scBlur6" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="6" /></filter>
        <filter id="scBlur18" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="18" /></filter>
        <filter id="scBlur30" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="30" /></filter>
        <linearGradient id="scLeft" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#FFFFFF" /><stop offset="1" stopColor="#ECEAF4" /></linearGradient>
        <linearGradient id="scRight" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#E7E4F0" /><stop offset="1" stopColor="#D2CEE0" /></linearGradient>
        <radialGradient id="scLid" cx=".45" cy=".4" r=".7"><stop offset="0" stopColor="#FFFFFF" /><stop offset="1" stopColor="#E6E3EF" /></radialGradient>
        <linearGradient id="scGlass" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#F58BF0" /><stop offset=".55" stopColor="#D24BD9" /><stop offset="1" stopColor="#A834C9" /></linearGradient>
        <linearGradient id="scSign" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#F05BD0" /><stop offset="1" stopColor="#B532C4" /></linearGradient>
        <linearGradient id="scDoor" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#C7C2DA" /><stop offset="1" stopColor="#A49EC0" /></linearGradient>
        <radialGradient id="scCoin" cx=".38" cy=".32" r=".8"><stop offset="0" stopColor="#FFF0B8" /><stop offset=".5" stopColor="#F2C14E" /><stop offset="1" stopColor="#C98D16" /></radialGradient>
        <linearGradient id="scTile" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#F4F3F9" /><stop offset="1" stopColor="#EBE9F2" /></linearGradient>
      </defs>

      <rect x="-1500" y="-1000" width="4000" height="3000" fill="#E8E6F0" />

      {/* floor */}
      <g className="sc-l0">
        <Face p="top" at={[0, 0, 0]}>
          {tiles.map(([i, j]) => <rect key={`${i}.${j}`} x={i * TILE + 5} y={j * TILE + 5} width={TILE - 10} height={TILE - 10} rx="26" fill="url(#scTile)" stroke="#FAFAFD" strokeWidth="2" />)}
        </Face>
        {/* drifting sunlight streaks */}
        <g className="sc-sun" filter="url(#scBlur30)">
          <polygon points="0,700 200,700 820,-160 640,-160" fill="#FFFFFF" opacity=".55" />
          <polygon points="420,700 520,700 1100,40 1100,-80" fill="#FFFFFF" opacity=".45" />
          <polygon points="-300,520 -200,580 420,-160 320,-160" fill="#FFFFFF" opacity=".4" />
        </g>
      </g>

      {/* conveyor: boxes of ideas slide into the back of the kiosk */}
      <g className="sc-l1">
        <Face p="top" at={[0, 0, 0]}><rect x="-1100" y="-150" width="1130" height="100" rx="18" fill="#5B567E" opacity=".1" filter="url(#scBlur18)" transform="translate(20 30)" /></Face>
        <Puff points={pts([-1100, -60, 36], [30, -60, 36], [30, -60, 0], [-1100, -60, 0])} fill="#DAD7E6" r={10} />
        <Puff points={pts([-1100, -152, 36], [30, -152, 36], [30, -58, 36], [-1100, -58, 36])} fill="#F8F7FC" r={10} />
        <g className="sc-belt">
          {Array.from({ length: 30 }, (_, i) => {
            const x = -1100 + i * 40;
            return <polyline key={i} points={pts([x, -146, 37], [x, -64, 37])} stroke="#E4E2EE" strokeWidth="2" fill="none" />;
          })}
        </g>
        <Puff points={pts([-1100, -156, 46], [30, -156, 46], [30, -146, 46], [-1100, -146, 46])} fill="#FFFFFF" r={6} />
        <Puff points={pts([-1100, -64, 46], [30, -64, 46], [30, -56, 46], [-1100, -56, 46])} fill="#FFFFFF" r={6} />
        {crates.map((l, i) => <Crate key={l} label={l} delay={-i * 3.6} />)}
      </g>

      {/* kiosk */}
      <g className="sc-l2">
        <g className="sc-kiosk">
        <Face p="top" at={[0, 0, 0]}>
          <rect x="-34" y="-34" width="278" height="278" rx="44" fill="#F6F5FB" stroke="#FFFFFF" strokeWidth="3" />
          <rect x="30" y="40" width="270" height="250" rx="70" fill="#4E4875" opacity=".2" filter="url(#scBlur18)" />
        </Face>

        <Puff points={pts([0, 210, 190], [210, 210, 190], [210, 210, 0], [0, 210, 0])} fill="url(#scLeft)" r={40} />
        <Puff points={pts([210, 210, 190], [210, 0, 190], [210, 0, 0], [210, 210, 0])} fill="url(#scRight)" r={40} />
        <Puff points={pts([0, 0, 190], [210, 0, 190], [210, 210, 190], [0, 210, 190])} fill="#FBFAFE" r={40} />
        <polyline points={pts([210, 210, 175], [210, 210, 10])} stroke="#FFFFFF" strokeWidth="6" strokeLinecap="round" opacity=".7" />

        <Face p="top" at={[0, 0, 190]}>
          <rect x="14" y="14" width="182" height="182" rx="50" fill="#EFEDF6" stroke="#FFFFFF" strokeWidth="4" />
          <rect x="30" y="30" width="150" height="150" rx="40" fill="url(#scLid)" />
        </Face>

        {/* arched window — sunlit face */}
        <Face p="yf" at={[0, 210, 190]}>
          <path d="M38 176 V102 A30 30 0 0 1 98 102 V176 Z" fill="url(#scGlass)" stroke="#FFFFFF" strokeWidth="7" strokeLinejoin="round" />
          <path className="sc-glint" d="M48 170 V104 A20 20 0 0 1 62 86 L62 170 Z" fill="#FFFFFF" opacity=".22" />
          <line x1="68" y1="74" x2="68" y2="176" stroke="#FFFFFF" strokeWidth="4" />
          <line x1="38" y1="122" x2="98" y2="122" stroke="#FFFFFF" strokeWidth="4" />
          <rect x="30" y="174" width="76" height="9" rx="4.5" fill="#FFFFFF" />
          <rect x="128" y="40" width="44" height="6" rx="3" fill="#E9E6F2" />
          <rect x="128" y="52" width="30" height="6" rx="3" fill="#E9E6F2" />
        </Face>

        {/* shop front — shaded face */}
        <Face p="xf" at={[210, 210, 190]}>
          <rect x="36" y="100" width="150" height="26" fill="#2C2650" opacity=".14" filter="url(#scBlur6)" />
          <rect x="70" y="122" width="82" height="70" rx="14" fill="url(#scDoor)" />
          <rect x="80" y="132" width="62" height="58" rx="9" fill="#8E87AE" opacity=".55" />
          <circle cx="136" cy="162" r="3" fill="#F2C14E" />
          <g className="sc-signglow"><rect x="30" y="52" width="162" height="54" rx="14" fill="#E64BD2" opacity=".35" filter="url(#scBlur6)" /></g>
          <rect x="36" y="58" width="150" height="42" rx="10" fill="url(#scSign)" />
          <rect x="40" y="62" width="142" height="34" rx="8" fill="none" stroke="#FFFFFF" strokeOpacity=".45" strokeWidth="1.5" />
          <text x="111" y="86" textAnchor="middle" fontSize={long ? 16 : 20} fontWeight="800" fill="#FFFFFF" fontFamily="Inter, 'Hind Siliguri', sans-serif"
            {...(sign.length > 14 ? { textLength: 130, lengthAdjust: "spacingAndGlyphs" } : {})}>{sign}</text>
        </Face>
        <Face p="awn" at={[210, 174, 90]} className="sc-awning">
          {Array.from({ length: 8 }, (_, i) => (
            <g key={i} fill={i % 2 ? "#FFFFFF" : "#F2603F"}>
              <rect x={i * 18.75} y="0" width="18.75" height="44" />
              <circle cx={i * 18.75 + 9.375} cy="44" r="9.375" />
            </g>
          ))}
          <rect x="0" y="0" width="150" height="7" fill="#C2402A" opacity=".35" />
        </Face>

        {/* glass bench */}
        <Face p="top" at={[0, 0, 0]}><rect x="40" y="252" width="110" height="36" rx="10" fill="#4E4875" opacity=".13" filter="url(#scBlur6)" /></Face>
        <g className="sc-bench">
          {[[36, 272], [134, 272], [36, 250], [134, 250]].map(([x, y]) => (
            <polyline key={`${x}${y}`} points={pts([x, y, 30], [x, y, 0])} stroke="#FFFFFF" strokeOpacity=".85" strokeWidth="3" strokeLinecap="round" fill="none" />
          ))}
          <Face p="yf" at={[30, 246, 84]}><rect width="112" height="40" rx="7" fill="#FFFFFF" fillOpacity=".38" stroke="#FFFFFF" strokeOpacity=".9" strokeWidth="2" /></Face>
          <polygon points={pts([30, 246, 34], [142, 246, 34], [142, 278, 34], [30, 278, 34])} fill="#FFFFFF" fillOpacity=".5" stroke="#FFFFFF" strokeWidth="2" strokeLinejoin="round" />
          <Face p="yf" at={[30, 278, 34]}><rect width="112" height="6" rx="3" fill="#FFFFFF" fillOpacity=".7" /></Face>
        </g>

        {/* sparkles over the sign */}
        {[[795, 118, 0], [858, 92, 1.1], [830, 150, 2.2]].map(([x, y, d]) => (
          <g key={x} transform={`translate(${x} ${y})`}>
            <path className="sc-spark" style={{ animationDelay: `${d}s` }}
              d="M0 -9 C1.5 -2 2 -1.5 9 0 C2 1.5 1.5 2 0 9 C-1.5 2 -2 1.5 -9 0 C-2 -1.5 -1.5 -2 0 -9Z" fill={d === 1.1 ? "#F2C14E" : "#E64BD2"} />
          </g>
        ))}
        </g>
        {/* LAUNCH: the idea leaves the kiosk as a rocket, funding coins burst out */}
        {launch > 0 && (
          <g key={launch} className="sc-launch" transform="translate(640 150)">
            {[0, 1, 2, 3, 4].map((i) => <circle key={i} className="sc-smoke" style={{ "--i": i }} cx={(i - 2) * 16} cy="20" r="18" fill="#FFFFFF" />)}
            <g className="sc-rocket">
              <path className="sc-flame" d="M-11 34 Q0 78 11 34 Z" fill="#FFB020" />
              <path className="sc-flame in" d="M-6 34 Q0 60 6 34 Z" fill="#FFF1B0" />
              <path d="M-26 22 L-14 -2 L-14 30 Z" fill="#B532C4" />
              <path d="M26 22 L14 -2 L14 30 Z" fill="#B532C4" />
              <path d="M0 -62 C20 -40 18 6 14 34 L-14 34 C-18 6 -20 -40 0 -62 Z" fill="#FFFFFF" stroke="#E2DEEF" strokeWidth="2" />
              <path d="M0 -62 C9 -52 13 -42 14 -34 L-14 -34 C-13 -42 -9 -52 0 -62 Z" fill="#E64BD2" />
              <circle cx="0" cy="-12" r="8" fill="#6FC3FF" stroke="#FFFFFF" strokeWidth="3" />
            </g>
            {Array.from({ length: 9 }, (_, i) => {
              const a = (-160 + i * 17.5) * (Math.PI / 180);
              return (
                <g key={i} className="sc-burst" style={{ "--dx": `${Math.cos(a) * (150 + (i % 3) * 40)}px`, "--dy": `${Math.sin(a) * (120 + (i % 2) * 50)}px`, "--d": `${i * 30}ms` }}>
                  <circle r="11" fill="url(#scCoin)" stroke="#B9821A" strokeWidth="1.5" />
                  <text y="4.5" textAnchor="middle" fontSize="12" fontWeight="800" fill="#A86E0C">৳</text>
                </g>
              );
            })}
          </g>
        )}
      </g>

      {/* the ৳ coin rolls in */}
      <g className="sc-l3" transform="translate(890 500)">
        <ellipse cx="4" cy="62" rx="40" ry="9" fill="#4E4875" opacity=".18" filter="url(#scBlur6)" />
        <g className="sc-coin">
          <ellipse cx="7" cy="0" rx="40" ry="52" fill="#B9821A" />
          <ellipse cx="0" cy="0" rx="40" ry="52" fill="url(#scCoin)" />
          <ellipse cx="0" cy="0" rx="31" ry="42" fill="none" stroke="#FFF3C9" strokeOpacity=".7" strokeWidth="2.5" />
          <g className="sc-coin-glyph"><text x="0" y="15" textAnchor="middle" fontSize="44" fontWeight="800" fill="#A86E0C" fontFamily="'Hind Siliguri', Inter, sans-serif">৳</text></g>
        </g>
      </g>
    </svg>
  );
}
