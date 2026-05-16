export const THEMES = [
  'Materials / skin safety',
  'Sustainability / vegan straps',
  'Titanium / durability / adventure use',
  'Gifting / engraving / corporate orders',
  'Servicing / battery / after-sales',
] as const;

export type ThemeName = (typeof THEMES)[number];

export const INTERNAL_TO_EXTERNAL: Record<string, ThemeName> = {
  'BPA-Free Straps': 'Materials / skin safety',
  'Nickel Allergy': 'Materials / skin safety',
  'Titanium Safety': 'Titanium / durability / adventure use',
  'Sustainability': 'Sustainability / vegan straps',
  'Vegan Straps': 'Sustainability / vegan straps',
};
