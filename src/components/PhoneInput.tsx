// external
import { useState } from "react";

// internal
import { formatPhone, normalizePhone } from "../utils/phone";

type PhoneInputProps = {
  value: string;
  onChange: (stored: string) => void;
  id?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  autoFocus?: boolean;
};

const digitsOf = (text: string) => text.replace(/\D/g, "");

export default function PhoneInput({
  value,
  onChange,
  id,
  placeholder = "081 234 1234",
  required,
  disabled,
  autoFocus,
}: PhoneInputProps) {
  const [text, setText] = useState(value ? formatPhone(value) : "");
  const [lastValue, setLastValue] = useState(value);
  const [touched, setTouched] = useState(false);

  if (value !== lastValue) {
    setLastValue(value);
    if (value !== (normalizePhone(text) ?? digitsOf(text))) {
      setText(value ? formatPhone(value) : "");
    }
  }

  const invalid =
    touched && text.trim() !== "" && normalizePhone(text) === null;

  return (
    <>
      <input
        id={id}
        type="tel"
        inputMode="tel"
        autoComplete="off"
        autoFocus={autoFocus}
        value={text}
        required={required}
        disabled={disabled}
        placeholder={placeholder}
        maxLength={20}
        aria-invalid={invalid}
        onChange={(e) => {
          const next = e.target.value.replace(/[^\d\s+()-]/g, "");
          setText(next);
          const stored = normalizePhone(next) ?? digitsOf(next);
          setLastValue(stored);
          onChange(stored);
        }}
        onBlur={() => {
          setTouched(true);
          const stored = normalizePhone(text);
          if (stored) setText(formatPhone(stored));
        }}
      />
      {invalid && (
        <div className="field-error">
          Enter a 10-digit number, like 081 234 1234.
        </div>
      )}
    </>
  );
}
