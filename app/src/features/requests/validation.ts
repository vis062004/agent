import type { ResourceRequestInput } from './types';

// Single source of truth for which fields are required — nothing else hardcodes `required`.
export const mandatoryFields: readonly (keyof ResourceRequestInput)[] = [
  'itemName',
  'category',
  'quantity',
  'businessJustification',
  'urgency',
];

export const fieldLabels: Record<keyof ResourceRequestInput, string> = {
  itemName: 'Item Name',
  category: 'Category',
  quantity: 'Quantity',
  businessJustification: 'Business Justification',
  urgency: 'Urgency',
};

export function isFieldMandatory(field: keyof ResourceRequestInput): boolean {
  return mandatoryFields.includes(field);
}

export function validateRequestForm(
  values: ResourceRequestInput
): Partial<Record<keyof ResourceRequestInput, string>> {
  const errors: Partial<Record<keyof ResourceRequestInput, string>> = {};

  for (const field of mandatoryFields) {
    const value = values[field];
    if (value === null || value === undefined || value.toString().trim() === '') {
      errors[field] = `${fieldLabels[field]} is required`;
    }
  }

  if (!errors.quantity) {
    const quantityNumber = Number(values.quantity);
    if (!Number.isInteger(quantityNumber) || quantityNumber <= 0) {
      errors.quantity = 'Quantity must be a whole number greater than zero';
    }
  }

  return errors;
}
