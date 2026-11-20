const familyHues = [155, 218, 36, 296] as const;

/** Vary the hue by orbital orientation and principal level within each family. */
export function orbitalHue(family: number, axis: number, level: number) {
	return familyHues[family] + 13 * (axis - family) + 3 * (level - 4);
}
