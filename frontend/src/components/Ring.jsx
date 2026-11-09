/** Circular percentage ring. */
export default function Ring({ value = 0, size = 120, color = "var(--green2)", label, sub }) {
  return (
    <div className="bigring" style={{ "--p": value, "--c": color, width: size, height: size }}>
      <div><b>{label ?? `${value}%`}</b>{sub && <small>{sub}</small>}</div>
    </div>
  );
}
