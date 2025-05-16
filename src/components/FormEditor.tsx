import React, { useState } from "react";
import {
  Box,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Typography,
  Grid,
  IconButton,
  Paper,
  Divider,
  List,
  ListItem,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  SelectChangeEvent,
  ListItemSecondaryAction,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import { FormField, FormConfig, CodedOption, FieldType } from "../types";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";

interface FormEditorProps {
  config: FormConfig;
  onChange: (newConfig: FormConfig) => void;
}

export default function FormEditor({ config, onChange }: FormEditorProps) {
  const [newGroup, setNewGroup] = useState("");
  const [newField, setNewField] = useState<Partial<FormField>>({
    id: "",
    type: "text",
    label: "",
    group: config.groups[0],
    booleanLabels: {
      trueLabel: "1 - Yes",
      falseLabel: "0 - No",
    },
    codedOptions: [
      { code: 0, label: "No" },
      { code: 1, label: "Yes" },
    ],
  });
  const [editingField, setEditingField] = useState<FormField | null>(null);

  // State for coded options dialog
  const [openCodedDialog, setOpenCodedDialog] = useState(false);
  const [codedOptions, setCodedOptions] = useState<CodedOption[]>([
    { code: 0, label: "No" },
    { code: 1, label: "Yes" },
  ]);
  const [newCode, setNewCode] = useState<number>(0);
  const [newLabel, setNewLabel] = useState<string>("");
  const [newOption, setNewOption] = useState({ code: 0, label: "" });

  const handleAddGroup = () => {
    if (newGroup && !config.groups.includes(newGroup)) {
      const newGroups = [...config.groups, newGroup];
      onChange({ ...config, groups: newGroups });
      setNewGroup("");
    }
  };

  const handleDeleteGroup = (group: string) => {
    const newGroups = config.groups.filter((g) => g !== group);
    const newFields = config.fields.filter((f) => f.group !== group);
    onChange({ groups: newGroups, fields: newFields });
  };

  const handleFieldChange = (
    e:
      | React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>
      | SelectChangeEvent,
  ) => {
    const { name, value } = e.target;

    if (name === "type" && value === "codedValue") {
      // Initialize coded options when field type changes to codedValue
      setCodedOptions([
        { code: 0, label: "No" },
        { code: 1, label: "Yes" },
      ]);
      setNewField((prev) => ({
        ...prev,
        [name as string]: value,
        codedOptions: [
          { code: 0, label: "No" },
          { code: 1, label: "Yes" },
        ],
      }));
    } else {
      setNewField((prev) => ({ ...prev, [name as string]: value }));
    }
  };

  const handleAddCodedOption = () => {
    if (newLabel.trim()) {
      const updatedOptions = [
        ...codedOptions,
        { code: newCode, label: newLabel },
      ];
      setCodedOptions(updatedOptions);
      setNewField((prev) => ({
        ...prev,
        codedOptions: updatedOptions,
      }));
      setNewCode((prev) => prev + 1);
      setNewLabel("");
    }
  };

  const handleDeleteCodedOption = (codeToDelete: number) => {
    const updatedOptions = codedOptions.filter(
      (option) => option.code !== codeToDelete,
    );
    setCodedOptions(updatedOptions);
    setNewField((prev) => ({
      ...prev,
      codedOptions: updatedOptions,
    }));
  };

  const handleOpenCodedDialog = () => {
    setOpenCodedDialog(true);
  };

  const handleCloseCodedDialog = () => {
    setOpenCodedDialog(false);
  };

  const handleAddField = () => {
    if (newField.id && newField.label && newField.type) {
      const fieldToAdd = { ...newField } as FormField;

      // Special handling for different field types
      if (fieldToAdd.type === "date") {
        // Ensure date fields have default values if needed
        fieldToAdd.required = fieldToAdd.required || false;
      } else if (fieldToAdd.type === "select" && !fieldToAdd.options) {
        // Default options for select fields
        fieldToAdd.options = ["Option 1", "Option 2"];
      } else if (fieldToAdd.type === "range") {
        // Default min/max for range fields
        fieldToAdd.min = fieldToAdd.min || 0;
        fieldToAdd.max = fieldToAdd.max || 100;
      } else if (fieldToAdd.type === "boolean") {
        // Ensure boolean fields have labels
        if (!fieldToAdd.booleanLabels) {
          fieldToAdd.booleanLabels = {
            trueLabel: "1 - Yes",
            falseLabel: "0 - No",
          };
        }
      } else if (fieldToAdd.type === "codedValue") {
        // Ensure codedValue fields have options
        if (!fieldToAdd.codedOptions || fieldToAdd.codedOptions.length === 0) {
          fieldToAdd.codedOptions = [
            { code: 0, label: "No" },
            { code: 1, label: "Yes" },
          ];
        }
      }

      const newFields = [...config.fields, fieldToAdd];
      onChange({ ...config, fields: newFields });
      setNewField({
        id: "",
        type: "text",
        label: "",
        group: config.groups[0],
        booleanLabels: {
          trueLabel: "1 - Yes",
          falseLabel: "0 - No",
        },
        codedOptions: [
          { code: 0, label: "No" },
          { code: 1, label: "Yes" },
        ],
      });
    }
  };

  const handleDeleteField = (fieldId: string) => {
    const newFields = config.fields.filter((f) => f.id !== fieldId);
    onChange({ ...config, fields: newFields });
  };

  const handleEditField = (field: FormField) => {
    setEditingField(field);
  };

  const handleSaveFieldEdit = () => {
    if (!editingField) return;

    const updatedConfig = {
      ...config,
      fields: config.fields.map((field) =>
        field.id === editingField.id ? editingField : field,
      ),
    };

    onChange(updatedConfig);
    setEditingField(null);
  };

  const handleDragEnd = (result: any) => {
    if (!result.destination) return;

    const items = Array.from(config.fields);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    onChange({
      ...config,
      fields: items,
    });
  };

  return (
    <Box sx={{ mt: 4 }}>
      <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Form Configuration
        </Typography>

        {/* Groups Section */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="subtitle1" gutterBottom>
            Groups
          </Typography>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={8}>
              <TextField
                fullWidth
                label="New Group Name"
                value={newGroup}
                onChange={(e) => setNewGroup(e.target.value)}
              />
            </Grid>
            <Grid item xs={4}>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleAddGroup}
                disabled={!newGroup}
                fullWidth
              >
                Add Group
              </Button>
            </Grid>
          </Grid>

          <Box sx={{ mt: 2 }}>
            {config.groups.map((group) => (
              <Box
                key={group}
                sx={{ display: "flex", alignItems: "center", mb: 1 }}
              >
                <Typography sx={{ flexGrow: 1 }}>{group}</Typography>
                <IconButton
                  onClick={() => handleDeleteGroup(group)}
                  disabled={config.fields.some((f) => f.group === group)}
                  size="small"
                >
                  <DeleteIcon />
                </IconButton>
              </Box>
            ))}
          </Box>
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* Fields Section */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="subtitle1" gutterBottom>
            Add New Field
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Field ID"
                name="id"
                value={newField.id}
                onChange={handleFieldChange}
                margin="normal"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Field Label"
                name="label"
                value={newField.label}
                onChange={handleFieldChange}
                margin="normal"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth margin="normal">
                <InputLabel>Field Type</InputLabel>
                <Select
                  name="type"
                  value={newField.type}
                  onChange={handleFieldChange}
                  label="Field Type"
                >
                  <MenuItem value="text">Text</MenuItem>
                  <MenuItem value="number">Number</MenuItem>
                  <MenuItem value="date">Date</MenuItem>
                  <MenuItem value="select">Select</MenuItem>
                  <MenuItem value="range">Range</MenuItem>
                  <MenuItem value="checkbox">Checkbox</MenuItem>
                  <MenuItem value="boolean">Boolean (Yes/No)</MenuItem>
                  <MenuItem value="codedValue">
                    Coded Value (Multiple Options)
                  </MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth margin="normal">
                <InputLabel>Group</InputLabel>
                <Select
                  name="group"
                  value={newField.group}
                  onChange={handleFieldChange}
                  label="Group"
                >
                  {config.groups.map((group) => (
                    <MenuItem key={group} value={group}>
                      {group}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Conditional fields based on field type */}
            {newField.type === "boolean" && (
              <>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Yes Label"
                    name="booleanLabels.trueLabel"
                    value={newField.booleanLabels?.trueLabel || "1 - Yes"}
                    onChange={(e) => {
                      setNewField((prev) => {
                        const currentLabels = prev.booleanLabels || {
                          trueLabel: "1 - Yes",
                          falseLabel: "0 - No",
                        };
                        return {
                          ...prev,
                          booleanLabels: {
                            ...currentLabels,
                            trueLabel: e.target.value,
                          },
                        };
                      });
                    }}
                    margin="normal"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="No Label"
                    name="booleanLabels.falseLabel"
                    value={newField.booleanLabels?.falseLabel || "0 - No"}
                    onChange={(e) => {
                      setNewField((prev) => {
                        const currentLabels = prev.booleanLabels || {
                          trueLabel: "1 - Yes",
                          falseLabel: "0 - No",
                        };
                        return {
                          ...prev,
                          booleanLabels: {
                            ...currentLabels,
                            falseLabel: e.target.value,
                          },
                        };
                      });
                    }}
                    margin="normal"
                  />
                </Grid>
              </>
            )}

            {/* Coded Value options */}
            {newField.type === "codedValue" && (
              <Grid item xs={12}>
                <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                  <Typography variant="body2" sx={{ mr: 2 }}>
                    Coded Options:
                  </Typography>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<EditIcon />}
                    onClick={handleOpenCodedDialog}
                  >
                    Edit Options
                  </Button>
                </Box>

                <List
                  dense
                  sx={{
                    bgcolor: "background.paper",
                    border: "1px solid #e0e0e0",
                    borderRadius: 1,
                  }}
                >
                  {codedOptions.map((option) => (
                    <ListItem key={option.code}>
                      <ListItemText
                        primary={`${option.code} - ${option.label}`}
                      />
                    </ListItem>
                  ))}
                </List>
              </Grid>
            )}

            <Grid item xs={12}>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleAddField}
                disabled={!newField.id || !newField.label}
                fullWidth
              >
                Add Field
              </Button>
            </Grid>
          </Grid>
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* Current Fields */}
        <Box>
          <Typography variant="subtitle1" gutterBottom>
            Current Fields
          </Typography>
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="fields">
              {(provided) => (
                <List
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  sx={{
                    minHeight: "100px",
                    bgcolor: "background.paper",
                    borderRadius: 1,
                    border: "1px solid",
                    borderColor: "divider",
                  }}
                >
                  {config.fields.map((field, index) => (
                    <Draggable
                      key={field.id}
                      draggableId={field.id}
                      index={index}
                    >
                      {(provided, snapshot) => (
                        <ListItem
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          sx={{
                            bgcolor: snapshot.isDragging
                              ? "action.hover"
                              : "background.paper",
                            borderBottom: "1px solid",
                            borderColor: "divider",
                            "&:last-child": {
                              borderBottom: "none",
                            },
                          }}
                        >
                          <DragIndicatorIcon
                            sx={{
                              mr: 2,
                              color: "text.secondary",
                              cursor: "grab",
                            }}
                          />
                          <ListItemText
                            primary={field.label}
                            secondary={`Type: ${field.type} | Group: ${field.group}`}
                          />
                          <ListItemSecondaryAction>
                            <IconButton
                              edge="end"
                              aria-label="edit"
                              onClick={() => handleEditField(field)}
                              sx={{ mr: 1 }}
                            >
                              <EditIcon />
                            </IconButton>
                            <IconButton
                              edge="end"
                              aria-label="delete"
                              onClick={() => handleDeleteField(field.id)}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </ListItemSecondaryAction>
                        </ListItem>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </List>
              )}
            </Droppable>
          </DragDropContext>
        </Box>
      </Paper>

      {/* Dialog for editing coded options */}
      <Dialog
        open={openCodedDialog}
        onClose={handleCloseCodedDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Edit Coded Options</DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 2, mt: 1 }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={3}>
                <TextField
                  fullWidth
                  label="Code"
                  type="number"
                  value={newCode}
                  onChange={(e) => setNewCode(Number(e.target.value))}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Label"
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                />
              </Grid>
              <Grid item xs={3}>
                <Button
                  variant="contained"
                  onClick={handleAddCodedOption}
                  disabled={!newLabel.trim()}
                  fullWidth
                >
                  Add
                </Button>
              </Grid>
            </Grid>
          </Box>

          <List sx={{ width: "100%", bgcolor: "background.paper" }}>
            {codedOptions.map((option) => (
              <ListItem
                key={option.code}
                secondaryAction={
                  <IconButton
                    edge="end"
                    onClick={() => handleDeleteCodedOption(option.code)}
                  >
                    <DeleteIcon />
                  </IconButton>
                }
              >
                <ListItemText primary={`${option.code} - ${option.label}`} />
              </ListItem>
            ))}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseCodedDialog}>Done</Button>
        </DialogActions>
      </Dialog>

      {/* Edit Field Dialog */}
      <Dialog
        open={!!editingField}
        onClose={() => setEditingField(null)}
        maxWidth="sm"
        fullWidth
      >
        {editingField && (
          <>
            <DialogTitle>Edit Field</DialogTitle>
            <DialogContent>
              <Box
                sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 2 }}
              >
                <TextField
                  label="Field ID"
                  value={editingField.id}
                  onChange={(e) =>
                    setEditingField({ ...editingField, id: e.target.value })
                  }
                  fullWidth
                />
                <TextField
                  label="Label"
                  value={editingField.label}
                  onChange={(e) =>
                    setEditingField({ ...editingField, label: e.target.value })
                  }
                  fullWidth
                />
                <FormControl fullWidth>
                  <InputLabel>Type</InputLabel>
                  <Select
                    value={editingField.type}
                    label="Type"
                    onChange={(e) =>
                      setEditingField({
                        ...editingField,
                        type: e.target.value as FieldType,
                      })
                    }
                  >
                    <MenuItem value="text">Text</MenuItem>
                    <MenuItem value="number">Number</MenuItem>
                    <MenuItem value="date">Date</MenuItem>
                    <MenuItem value="boolean">Boolean</MenuItem>
                    <MenuItem value="codedValue">Coded Value</MenuItem>
                  </Select>
                </FormControl>
                <FormControl fullWidth>
                  <InputLabel>Group</InputLabel>
                  <Select
                    value={editingField.group}
                    label="Group"
                    onChange={(e) =>
                      setEditingField({
                        ...editingField,
                        group: e.target.value,
                      })
                    }
                  >
                    {config.groups.map((group) => (
                      <MenuItem key={group} value={group}>
                        {group}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                {editingField.type === "codedValue" && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Coded Options
                    </Typography>
                    <List>
                      {editingField.codedOptions?.map((option) => (
                        <ListItem key={option.code}>
                          <ListItemText
                            primary={option.label}
                            secondary={`Code: ${option.code}`}
                          />
                          <ListItemSecondaryAction>
                            <IconButton
                              edge="end"
                              aria-label="delete"
                              onClick={() =>
                                handleDeleteCodedOption(option.code)
                              }
                            >
                              <DeleteIcon />
                            </IconButton>
                          </ListItemSecondaryAction>
                        </ListItem>
                      ))}
                    </List>
                    <Box sx={{ display: "flex", gap: 2, mt: 2 }}>
                      <TextField
                        label="Option Label"
                        value={newOption.label}
                        onChange={(e) =>
                          setNewOption({ ...newOption, label: e.target.value })
                        }
                        size="small"
                      />
                      <Button
                        variant="contained"
                        onClick={() => {
                          if (newOption.label.trim()) {
                            const updatedField = {
                              ...editingField,
                              codedOptions: [
                                ...(editingField.codedOptions || []),
                                { ...newOption },
                              ],
                            };
                            const updatedConfig = {
                              ...config,
                              fields: config.fields.map((field) =>
                                field.id === editingField.id
                                  ? updatedField
                                  : field,
                              ),
                            };
                            onChange(updatedConfig);
                            setEditingField(null);
                            setNewOption({
                              code: editingField.codedOptions?.length || 0,
                              label: "",
                            });
                          }
                        }}
                        disabled={!newOption.label}
                      >
                        Add Option
                      </Button>
                    </Box>
                  </Box>
                )}
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setEditingField(null)}>Cancel</Button>
              <Button onClick={handleSaveFieldEdit} variant="contained">
                Save Changes
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
}
