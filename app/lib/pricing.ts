import Decimal from "decimal.js";
import { convertToBaseUnit, DimensionType } from "./conversions";

export function calculatePrice(
  quantity: string,
  unit: string,
  dimension: DimensionType,
  basePrice: string
) {
  const baseQuantity =
    convertToBaseUnit(quantity, unit, dimension);

  const totalPrice =
    baseQuantity.mul(
      new Decimal(basePrice)
    );

  return {
    baseQuantity,
    totalPrice,
  };
}