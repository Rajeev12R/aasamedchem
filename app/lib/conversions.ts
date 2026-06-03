import Decimal from "decimal.js";

export const UNIT_CONVERSIONS = {
  g: new Decimal(1),
  kg: new Decimal(1000),

  mL: new Decimal(1),
  L: new Decimal(1000),

  item: new Decimal(1),
} as const;

export type Unit =
  | "g"
  | "kg"
  | "mL"
  | "L"
  | "item";

export function convertToBaseUnit(
  quantity: string | number,
  unit: Unit
): Decimal {
  return new Decimal(quantity)
    .mul(UNIT_CONVERSIONS[unit]);
}