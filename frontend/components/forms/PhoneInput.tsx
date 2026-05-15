"use client";

import type { ChangeEvent, ChangeEventHandler, InputHTMLAttributes } from "react";

type PhoneInputProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "type" | "inputMode" | "pattern" | "title" | "onChange"
> & {
  onChange?: ChangeEventHandler<HTMLInputElement>;
};

const phoneCharactersPattern = "[0-9+()\\s-]*";

function sanitizePhone(value: string) {
  return value.replace(/[^0-9+()\s-]/g, "");
}

export function PhoneInput({ onChange, maxLength = 30, ...props }: PhoneInputProps) {
  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const cleaned = sanitizePhone(event.currentTarget.value);
    if (cleaned !== event.currentTarget.value) {
      event.currentTarget.value = cleaned;
    }
    onChange?.(event);
  }

  return (
    <input
      {...props}
      type="tel"
      inputMode="tel"
      pattern={phoneCharactersPattern}
      title="Utilisez seulement des chiffres, espaces, +, -, et parentheses."
      maxLength={maxLength}
      onChange={handleChange}
    />
  );
}
