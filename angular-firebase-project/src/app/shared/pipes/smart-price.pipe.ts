import { Pipe, PipeTransform } from "@angular/core";

@Pipe({
  name: "smartPrice",
  standalone: true,
})
export class SmartPricePipe implements PipeTransform {
  transform(value: unknown, maxDecimals = 2): string {
    const numeric = Number(value);

    if (!Number.isFinite(numeric)) {
      return "0";
    }

    if (Number.isInteger(numeric)) {
      return String(numeric);
    }

    const clamped = Math.max(0, Math.min(6, maxDecimals));
    return numeric.toFixed(clamped).replace(/\.?0+$/, "");
  }
}
