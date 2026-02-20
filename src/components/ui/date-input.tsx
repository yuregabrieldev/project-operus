import * as React from "react";

import { Input } from "@/components/ui/input";

type DateInputProps = Omit<React.ComponentProps<typeof Input>, "type" | "value" | "onChange"> & {
  value?: string;
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
};

const toDisplay = (value?: string): string => {
  if (!value) return "";
  if (value.includes("/")) return value;
  const parts = value.split("-");
  if (parts.length !== 3) return "";
  const [yyyy, mm, dd] = parts;
  if (!yyyy || !mm || !dd) return "";
  return `${dd}/${mm}/${yyyy}`;
};

const isValidDate = (day: number, month: number, year: number): boolean => {
  if (year < 1000 || year > 9999) return false;
  if (month < 1 || month > 12) return false;
  if (day < 1 || day > 31) return false;
  const dt = new Date(year, month - 1, day);
  return dt.getFullYear() === year && dt.getMonth() === month - 1 && dt.getDate() === day;
};

const toIso = (display: string): string => {
  const digits = display.replace(/\D/g, "");
  if (digits.length !== 8) return "";
  const day = Number(digits.slice(0, 2));
  const month = Number(digits.slice(2, 4));
  const year = Number(digits.slice(4, 8));
  if (!isValidDate(day, month, year)) return "";
  return `${year.toString().padStart(4, "0")}-${month.toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}`;
};

const withMask = (raw: string): string => {
  const digits = raw.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
};

export const DateInput = React.forwardRef<HTMLInputElement, DateInputProps>(
  ({ value, onChange, onBlur, placeholder = "dd/mm/yyyy", ...props }, ref) => {
    const [displayValue, setDisplayValue] = React.useState(toDisplay(value));

    React.useEffect(() => {
      setDisplayValue(toDisplay(value));
    }, [value]);

    const emitChange = (nextIso: string) => {
      if (!onChange) return;
      onChange({
        target: { value: nextIso },
        currentTarget: { value: nextIso },
      } as React.ChangeEvent<HTMLInputElement>);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const masked = withMask(e.target.value);
      setDisplayValue(masked);

      if (masked.length === 0) {
        emitChange("");
        return;
      }

      const nextIso = toIso(masked);
      if (nextIso) emitChange(nextIso);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      const nextIso = toIso(displayValue);
      if (!nextIso && displayValue.length > 0) {
        setDisplayValue("");
        emitChange("");
      } else if (nextIso) {
        setDisplayValue(toDisplay(nextIso));
      }
      onBlur?.(e);
    };

    return (
      <Input
        {...props}
        ref={ref}
        type="text"
        inputMode="numeric"
        placeholder={placeholder}
        value={displayValue}
        onChange={handleChange}
        onBlur={handleBlur}
      />
    );
  }
);

DateInput.displayName = "DateInput";

