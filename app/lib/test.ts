import { calculatePrice } from "./pricing";

const result = calculatePrice(
  "2.567891",
  "L",
  "VOLUME",
  "0.375"
);

console.log(result.baseQuantity.toString());

console.log(result.totalPrice.toString());