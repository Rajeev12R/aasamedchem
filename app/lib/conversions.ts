import Decimal from "decimal.js";

export const UNITS = {
  WEIGHT: {
    g: new Decimal(1),
    kg: new Decimal(1000),
  },

  VOLUME: {
    mL: new Decimal(1),
    L: new Decimal(1000),
  },

  COUNT: {
    item: new Decimal(1),
  },
} as const;

export type DimensionType =
  | "WEIGHT"
  | "VOLUME"
  | "COUNT";

export function convertToBaseUnit(
  quantity: string | number,
  unit: string,
  dimension: DimensionType
) {
  const conversionMap = UNITS[dimension];

  const factor =
    conversionMap[
      unit as keyof typeof conversionMap
    ];

  if (!factor) {
    throw new Error(
      `Invalid unit ${unit} for ${dimension}`
    );
  }

  return new Decimal(quantity).mul(factor);
}