import { FormConfig } from '../types';

export const defaultFormConfig: FormConfig = {
  groups: ['Personal Information', 'Clinical Information'],
  fields: [
    {
      id: 'name',
      type: 'text',
      label: 'Full Name',
      required: true,
      group: 'Personal Information',
    },
    {
      id: 'age',
      type: 'number',
      label: 'Age',
      required: true,
      group: 'Personal Information',
    },
    {
      id: 'hasDiabetes',
      type: 'checkbox',
      label: 'Has Diabetes',
      group: 'Clinical Information',
    },
    {
      id: 'glucoseLevel',
      type: 'number',
      label: 'Glucose Level',
      group: 'Clinical Information',
      condition: {
        dependsOn: 'hasDiabetes',
        value: true,
      },
    },
  ],
}; 