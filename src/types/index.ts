export type FieldType = 
  | 'text'
  | 'number'
  | 'date'
  | 'select'
  | 'range'
  | 'checkbox'
  | 'boolean'
  | 'codedValue';

export interface CodedOption {
  code: number;
  label: string;
}

export interface FormField {
  id: string;
  type: FieldType;
  label: string;
  required?: boolean;
  group?: string;
  options?: string[]; // For select fields
  min?: number; // For range/number
  max?: number; // For range/number
  booleanLabels?: {
    trueLabel: string;
    falseLabel: string;
  }; // For boolean fields (e.g., "1 - Yes", "0 - No")
  codedOptions?: CodedOption[]; // For codedValue fields
  condition?: {
    dependsOn: string;
    value: any;
  };
}

export interface FormData {
  userId: string;
  timestamp: string;
  [key: string]: any;
}

export interface FormConfig {
  fields: FormField[];
  groups: string[];
  title?: string; // Optional form title
} 