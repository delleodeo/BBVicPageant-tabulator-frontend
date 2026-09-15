export const roundOneCategories = [
  { key: 'productionOutfit', label: 'Production Outfit', weight: 10 },
  { key: 'swimsuit', label: 'Swimsuit', weight: 10 },
  { key: 'festivalCostume', label: 'Festival Costume', weight: 30 },
  { key: 'eveningGown', label: 'Evening Gown', weight: 20 },
  { key: 'beautyIntelligence', label: 'Beauty & Intelligence', weight: 30 }
];

export const finalCategories = [
  { key: 'intelligence', label: 'Intelligence', weight: 40 },
  { key: 'beauty', label: 'Beauty', weight: 40 }
];

export function validScore(value) {
  if (value === '' || value === null || value === undefined) return false;
  const numberValue = Number(value);
  return Number.isFinite(numberValue) && numberValue >= 0 && numberValue <= 10 && Math.abs(numberValue * 10 - Math.round(numberValue * 10)) < 0.000001;
}

export function fmt(value) {
  return value === null || value === undefined || value === '' ? '-' : Number(value).toFixed(2);
}
