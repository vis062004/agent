export type ResourceCategory = 'Laptop' | 'Monitor' | 'Peripheral' | 'Software' | 'Other';
export type UrgencyLevel = 'Low' | 'Medium' | 'High';

export interface ResourceRequestInput {
  itemName: string;
  category: ResourceCategory | '';
  quantity: string;
  businessJustification: string;
  urgency: UrgencyLevel | '';
}

export const CATEGORY_OPTIONS: ResourceCategory[] = [
  'Laptop',
  'Monitor',
  'Peripheral',
  'Software',
  'Other',
];

export const URGENCY_OPTIONS: UrgencyLevel[] = ['Low', 'Medium', 'High'];

export const initialRequestValues: ResourceRequestInput = {
  itemName: '',
  category: '',
  quantity: '',
  businessJustification: '',
  urgency: '',
};
