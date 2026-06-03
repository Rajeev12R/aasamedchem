import Decimal from "decimal.js";
import { convertToBaseUnit, Unit } from "./conversions";

export function calculatePrice(
  quantity: string,
  unit: Unit,
  basePrice: string
) {
  const baseQuantity =
    convertToBaseUnit(quantity, unit);

  const totalPrice =
    baseQuantity.mul(
      new Decimal(basePrice)
    );

  return {
    baseQuantity,
    totalPrice,
  };
}