export const VALID_UNITS = {
  "Modern Mass": ["mg", "g", "kg", "lb", "oz"],
  "Modern Volume": ["ml", "l", "drop"],
  "Ancient Mass": ["litra", "mna", "ouggia", "drachma", "obol"],
  "Ancient Volume": ["xestes", "kotyle", "kyathos"],
  "Count": ["piece", "bunch", "leaf"]
};

export const FLATTENED_UNITS = Object.values(VALID_UNITS).flat();
