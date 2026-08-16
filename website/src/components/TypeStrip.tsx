/**
 * Property-type marquee. Every entry maps to a real `PropertyType` in the
 * Prisma schema, so nothing here is invented.
 */
const TYPES = [
  'Villa',
  'Apartment',
  'Cabin',
  'Cottage',
  'Farmhouse',
  'Penthouse',
  'Studio',
  'Hostel',
  'Homestay',
  'Hotel',
  'Camping Site',
  'RV',
  'Dorm',
  'Long-Term Home',
];

export function TypeStrip() {
  return (
    <div className="typestrip" aria-label="Property types available on Stay Q">
      <div className="marquee">
        {/* Duplicated track so the CSS translateX(-50%) loop is seamless. */}
        {[0, 1].map((copy) => (
          <div className="marquee__track" key={copy} aria-hidden={copy === 1}>
            {TYPES.map((t) => (
              <span className="typestrip__item" key={`${copy}-${t}`}>
                <span className="typestrip__dot" aria-hidden="true" />
                {t}
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
