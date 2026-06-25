import { Pipe, PipeTransform } from "@angular/core";

const EN_MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

/**
 * Formats ISO datetime strings without timezone conversion.
 *
 * PostgreSQL sends timestamps like "2026-03-01T00:00:00.000Z".
 * Angular DatePipe would convert these to the browser's local timezone,
 * potentially shifting the date by one day (e.g. UTC-5: March 1 → Feb 28).
 *
 * This pipe simply takes the date portion before 'T', which is always the
 * correct calendar date as stored in the database.
 *
 * Optional lang param: "hu" → "2026. 03. 01." | "en" → "Mar 1, 2026" | default → "2026-03-01"
 */
@Pipe({ name: "isoDate", standalone: true })
export class IsoDatePipe implements PipeTransform {
  transform(value: string | Date | null | undefined, lang?: string): string {
    if (!value) return "—";
    let dateStr: string;
    if (value instanceof Date) {
      dateStr = value.toISOString().split("T")[0];
    } else {
      const str = String(value);
      dateStr = str.includes("T")
        ? str.split("T")[0]
        : (str.split(" ")[0] ?? str);
    }

    if (lang === "en") {
      const parts = dateStr.split("-");
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10);
      const day = parseInt(parts[2], 10);
      return `${EN_MONTHS[month - 1]} ${day}, ${year}`;
    }

    if (lang === "hu") {
      const [year, month, day] = dateStr.split("-");
      return `${year}. ${month}. ${day}.`;
    }

    return dateStr;
  }
}
