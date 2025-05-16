import {
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Checkbox,
  FormControlLabel,
  Slider,
  Box,
  Typography,
  RadioGroup,
  Radio,
  FormLabel,
} from "@mui/material";
import { FormField as FormFieldType } from "../types";
import { UseFormRegister } from "react-hook-form";

interface FormFieldProps {
  field: FormFieldType;
  register: UseFormRegister<Record<string, any>>;
}

export default function FormField({ field, register }: FormFieldProps) {
  const renderField = () => {
    switch (field.type) {
      case "text":
        return (
          <TextField
            {...register(field.id)}
            label={field.label}
            type="text"
            required={field.required}
            fullWidth
            margin="normal"
          />
        );

      case "number":
        return (
          <TextField
            {...register(field.id)}
            label={field.label}
            type="number"
            required={field.required}
            inputProps={{ step: "any" }}
            fullWidth
            margin="normal"
          />
        );

      case "date":
        return (
          <Box sx={{ mt: 2, mb: 1 }}>
            <Typography variant="body2" sx={{ mb: 0.5 }}>
              {field.label}
              {field.required ? " *" : ""}
            </Typography>
            <TextField
              {...register(field.id)}
              type="date"
              required={field.required}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
          </Box>
        );

      case "boolean": {
        // Boolean field renders as radio buttons but stores 0/1
        const trueLabel = field.booleanLabels?.trueLabel || "1 - Yes";
        const falseLabel = field.booleanLabels?.falseLabel || "0 - No";
        return (
          <Box sx={{ mt: 2, mb: 1 }}>
            <FormControl component="fieldset" required={field.required}>
              <FormLabel component="legend">{field.label}</FormLabel>
              <RadioGroup row {...register(field.id)}>
                <FormControlLabel
                  value="1"
                  control={<Radio />}
                  label={trueLabel}
                />
                <FormControlLabel
                  value="0"
                  control={<Radio />}
                  label={falseLabel}
                />
              </RadioGroup>
            </FormControl>
          </Box>
        );
      }

      case "codedValue":
        // CodedValue field renders as radio buttons with custom codes and labels
        return (
          <Box sx={{ mt: 2, mb: 1 }}>
            <FormControl component="fieldset" required={field.required}>
              <FormLabel component="legend">{field.label}</FormLabel>
              <RadioGroup row {...register(field.id)}>
                {field.codedOptions?.map((option) => (
                  <FormControlLabel
                    key={option.code}
                    value={String(option.code)}
                    control={<Radio />}
                    label={`${option.code} - ${option.label}`}
                  />
                ))}
              </RadioGroup>
            </FormControl>
          </Box>
        );

      case "select":
        return (
          <FormControl fullWidth margin="normal">
            <InputLabel>{field.label}</InputLabel>
            <Select {...register(field.id)} label={field.label}>
              {field.options?.map((option) => (
                <MenuItem key={option} value={option}>
                  {option}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        );

      case "range":
        return (
          <FormControl fullWidth margin="normal">
            <InputLabel>{field.label}</InputLabel>
            <Slider
              {...register(field.id)}
              min={field.min}
              max={field.max}
              valueLabelDisplay="auto"
            />
          </FormControl>
        );

      case "checkbox":
        return (
          <FormControlLabel
            control={<Checkbox {...register(field.id)} />}
            label={field.label}
          />
        );

      default:
        return null;
    }
  };

  return renderField();
}
