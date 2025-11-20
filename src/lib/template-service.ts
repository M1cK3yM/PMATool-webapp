// Imports the base API client for making HTTP requests.
import { apiClient } from "@/lib/api-client";
// Imports the notification library for displaying success/error messages.
import { toast } from "sonner";

// --- Frontend Types (camelCase) ---
// These interfaces define the data structure used throughout the React components.

/**
 * Defines a single field within a Template.
 * Corresponds to a column definition for the data import process.
 */
export interface TemplateField {
  ID: number; // Unique primary key from the database (0 if new).
  TemplateID: number; // Foreign key linking to the parent Template.
  fieldName: string; // The exact name of the column in the database.
  fieldPrompt: string; // User-friendly prompt for data entry.
  fieldValue: string; // The constant value assigned if fieldType is 'C'.
  fieldType: string; // 'C' (Constant) or 'V' (Variable).
  isKey: boolean; // Flag if this field is part of the primary key.
  formID: string; // Logical group/form this field belongs to (e.g., 'MAIN').
  formOrder: number; // The display order based on the parent form's sequence.
  fieldOrder: number; // Overall display order within the list.
  dataType: string; // The field's database data type (e.g., 'STRING').
  fieldLength: number; // The maximum length of the field.
  defaultValue: string; // The database default value for the field.
  comments: string; // User-editable notes/comments about the field.
}

/**
 * Defines a structural form/grouping for organizing fields on a template.
 */
export interface TemplateForm {
  ID: number; // Unique primary key from the database (0 if new).
  TemplateID: number; // Foreign key linking to the parent Template.
  formID: string; // Unique identifier for the form (e.g., 'TAB1').
  formName: string; // Display name of the form (e.g., 'General Info').
  formSeq: number; // The sequence/order in which forms should appear.
  formHelp: string; // Detailed help text for the form.
  formScreenFile: string; // Path/URL to an image of the form screen.
}

/**
 * Defines the main structure for a single Data Loader Template.
 */
export interface Template {
  ID: number; // Unique primary key for the template.
  moduleName: string; // ERP Module (e.g., 'IC', 'PM').
  tableName: string; // The physical name of the target database table.
  databaseName: string; // The database (e.g., 'FIN', 'MAN').
  tableHelp: string; // General descriptive help for the table.
  fields: TemplateField[]; // List of all fields associated with this template.
  forms: TemplateForm[]; // List of all forms/groups associated with this template.
}

// --- API Types (snake_case from Go, with uppercase ID) ---
// These types mirror the JSON structure expected by the Go backend (often snake_case).

interface TemplateFieldResponse {
  ID: number;
  TemplateID: number;
  field_name: string;
  field_prompt: string;
  field_value: string;
  field_type: string;
  is_key: boolean;
  form_id: string;
  form_order: number;
  field_order: number;
  data_type: string;
  field_length: number;
  default_value: string;
  comments: string;
}

interface TemplateFormResponse {
  ID: number;
  TemplateID: number;
  form_id: string;
  form_name: string;
  form_seq: number;
  form_help: string;
  form_screen_file: string;
}

interface TemplateResponse {
  ID: number;
  module_name: string;
  table_name: string;
  database_name: string;
  table_help: string;
  fields: TemplateFieldResponse[] | null;
  forms: TemplateFormResponse[] | null;
}

// --- Data Transformation Functions (API -> Frontend) ---

/**
 * Maps a single TemplateField object from API snake_case format to frontend camelCase format.
 * @param res The API response object.
 * @returns The frontend TemplateField object.
 */
function mapFieldFromAPI(res: TemplateFieldResponse): TemplateField {
  return {
    ID: res.ID,
    TemplateID: res.TemplateID,
    fieldName: res.field_name,
    fieldPrompt: res.field_prompt,
    fieldValue: res.field_value,
    fieldType: res.field_type,
    isKey: res.is_key,
    formID: res.form_id,
    formOrder: res.form_order,
    fieldOrder: res.field_order,
    dataType: res.data_type,
    fieldLength: res.field_length,
    defaultValue: res.default_value,
    comments: res.comments,
  };
}

/**
 * Maps a single TemplateForm object from API snake_case format to frontend camelCase format.
 * @param res The API response object.
 * @returns The frontend TemplateForm object.
 */
function mapFormFromAPI(res: TemplateFormResponse): TemplateForm {
  return {
    ID: res.ID,
    TemplateID: res.TemplateID,
    formID: res.form_id,
    formName: res.form_name,
    formSeq: res.form_seq,
    formHelp: res.form_help,
    formScreenFile: res.form_screen_file,
  };
}

/**
 * Maps the main Template object from API snake_case format to frontend camelCase format,
 * recursively mapping associated fields and forms.
 * @param res The API response object.
 * @returns The frontend Template object.
 */
function mapTemplateFromAPI(res: TemplateResponse): Template {
  return {
    ID: res.ID,
    moduleName: res.module_name,
    tableName: res.table_name,
    databaseName: res.database_name,
    tableHelp: res.table_help,
    fields: (res.fields || []).map(mapFieldFromAPI),
    forms: (res.forms || []).map(mapFormFromAPI),
  };
}

// --- Data Transformation Functions (Frontend -> API) ---

/**
 * Maps a single TemplateField object from frontend camelCase format to API snake_case format.
 * Sets mandatory IDs for database operations.
 * @param field The frontend TemplateField object.
 * @returns The API TemplateField payload object.
 */
function mapFieldToAPI(field: TemplateField): Omit<TemplateFieldResponse, 'template_id'> {
  return {
    ID: field.ID,
    TemplateID: field.TemplateID,
    field_name: field.fieldName,
    field_prompt: field.fieldPrompt,
    field_value: field.fieldValue,
    field_type: field.fieldType,
    is_key: field.isKey,
    form_id: field.formID,
    form_order: field.formOrder,
    field_order: field.fieldOrder,
    data_type: field.dataType,
    field_length: field.fieldLength,
    default_value: field.defaultValue,
    comments: field.comments,
  };
}

/**
 * Maps a single TemplateForm object from frontend camelCase format to API snake_case format.
 * @param form The frontend TemplateForm object.
 * @returns The API TemplateForm payload object.
 */
function mapFormToAPI(form: TemplateForm): Omit<TemplateFormResponse, 'template_id'> {
  return {
    ID: form.ID,
    TemplateID: form.TemplateID,
    form_id: form.formID,
    form_name: form.formName,
    form_seq: form.formSeq,
    form_help: form.formHelp,
    form_screen_file: form.formScreenFile,
  };
}

/**
 * Maps the main Template object from frontend camelCase format to API snake_case format.
 * Includes nested fields and forms for full state replacement.
 * @param template The frontend Template object.
 * @returns The complete API Template payload object.
 */
function mapTemplateToAPI(template: Template): Omit<TemplateResponse, 'fields' | 'forms'> & { fields: Omit<TemplateFieldResponse, 'template_id'>[], forms: Omit<TemplateFormResponse, 'template_id'>[] } {
  return {
    ID: template.ID,
    module_name: template.moduleName,
    table_name: template.tableName,
    database_name: template.databaseName,
    table_help: template.tableHelp,
    fields: (template.fields || []).map(mapFieldToAPI),
    forms: (template.forms || []).map(mapFormToAPI),
  };
}

// --- API Service Functions ---

/**
 * Fetches the list of all templates from the backend.
 * This is used to populate the main template list in the left pane.
 * @returns A promise that resolves to an array of Templates.
 */
export async function listTemplates(): Promise<Template[]> {
  try {
    const { data } = await apiClient.get<TemplateResponse[]>("/templates");
    return data.map(mapTemplateFromAPI);
  } catch (error: any) {
    toast.error("Failed to load templates: " + (error.message || "Unknown error"));
    return [];
  }
}

/**
 * Fetches a single, detailed template (including all fields and forms) by its ID.
 * This is called when the user selects a template from the list.
 * @param id The ID of the template to fetch.
 * @returns A promise that resolves to the full Template object or null.
 */
export async function getTemplate(id: number): Promise<Template | null> {
  try {
    const { data } = await apiClient.get<TemplateResponse>(`/templates/${id}`);
    return mapTemplateFromAPI(data);
  } catch (error: any) {
    toast.error(
      "Failed to load template details: " + (error.message || "Unknown error")
    );
    return null;
  }
}

/**
 * Creates a new template record in the database.
 * This is called when the user saves a new template definition (e.g., "Save As").
 * @param template The base details of the new template.
 * @returns A promise resolving to the ID of the newly created template.
 */
export async function createTemplate(
  template: Omit<Template, "ID" | "fields" | "forms">
) {
  try {
    // The payload is structured for initial creation (no fields or forms yet).
    const payload = {
      ID: 0,
      module_name: template.moduleName,
      table_name: template.tableName,
      database_name: template.databaseName,
      table_help: template.tableHelp,
      fields: [],
      forms: [],
    };
    const { data } = await apiClient.post("/templates", payload);
    toast.success(`Template "${template.tableName}" created with ID ${data.id}`);
    return data;
  } catch (error: any) {
    toast.error("Failed to create template: " + (error.message || "Unknown error"));
    return null;
  }
}

/**
 * Updates an existing template, replacing all nested fields and forms.
 * This is the main "Save Template" operation.
 * @param template The complete Template object to update.
 * @returns A promise that resolves upon successful update.
 */
export async function updateTemplate(template: Template) {
  try {
    // Map the complete frontend state (including changes to fields/forms) to the API payload.
    const payload = mapTemplateToAPI(template);
    await apiClient.put(`/templates/${template.ID}`, payload);
    toast.success(`Template "${template.tableName}" updated successfully.`);
  } catch (error: any) {
    toast.error("Failed to update template: " + (error.message || "Unknown error"));
  }
}

/**
 * Deletes a template and its associated records (fields/forms) from the database.
 * @param id The ID of the template to delete.
 * @returns A promise that resolves upon successful deletion.
 */
export async function deleteTemplate(id: number) {
  try {
    await apiClient.delete(`/templates/${id}`);
    toast.success(`Template deleted successfully.`);
  } catch (error: any) {
    toast.error("Failed to delete template: " + (error.message || "Unknown error"));
  }
}