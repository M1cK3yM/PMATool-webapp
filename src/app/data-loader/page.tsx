'use client'; 

import { useState, useEffect } from 'react';
import TemplateList from "./components/templateList";
import FieldList from "./components/fieldList";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  Template,
  TemplateField,
  TemplateForm,
  listTemplates,
  getTemplate,
  createTemplate,
  updateTemplate,
  deleteTemplate,
} from "@/lib/template-service";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AddFieldsDialog } from './components/addFieldsDialog';
import FormList from './components/formList';
import type { TableField as ApiTableField } from '@/lib/table-service';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  FileDown,
  FilePlus2,
  FolderOpen,
  ClipboardPaste,
  Upload,
  Info,
  Book,
  RefreshCcw,
  ListFilter,
  FileText,
  Settings,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import FieldInfoPanel from './components/fieldInfoPanel';
import TemplateRecordsTab from './components/templateRecordsTab';
import { UploaderDialog } from './components/uploaderDialog';
import { SettingsDialog } from './components/settingsDialog';


// --- Main App Component (replaces frmDataLoader) ---
export default function Home() {
  // --- React State ---

  // Stores the list of all available templates (for the left panel).
  const [templateList, setTemplateList] = useState<Template[]>([]);
  // Stores the currently selected template with all its fields and forms.
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  // Loading states for UI feedback.
  const [isLoadingList, setIsLoadingList] = useState(true);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  
  // Stores the currently selected field for the "Field Information" panel.
  const [selectedField, setSelectedField] = useState<TemplateField | null>(null);
  // Controls the filter applied to the fields list (e.g., 'keys', 'constants').
  const [fieldFilter, setFieldFilter] = useState("all");
  // Stores the currently selected form to manage its details.
  const [selectedForm, setSelectedForm] = useState<TemplateForm | null>(null);

  // States for the "New Template" modal form.
  const [newModuleName, setNewModuleName] = useState("");
  const [newTableName, setNewTableName] = useState("");
  const [newDatabaseName, setNewDatabaseName] = useState("");
  const [newTableHelp, setNewTableHelp] = useState("");

  // States to control various modals and alerts.
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isAddFieldsModalOpen, setIsAddFieldsModalOpen] = useState(false);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [isUploaderOpen, setIsUploaderOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState<Template | null>(null);

  // States for database connection strings, displayed in the status bar/settings.
  const [finDbConnection, setFinDbConnection] = useState("ross_fin.udl");
  const [manDbConnection, setManDbConnection] = useState("ross_man.udl");


  // --- Data Loading ---
  /**
   * Fetches the initial list of templates from the API.
   * Updates the global templateList state.
   */
  const loadTemplateList = async () => {
    setIsLoadingList(true);
    const data = await listTemplates(); // API call to get all templates (names/IDs only).
    setTemplateList(data);
    setIsLoadingList(false);
    return data;
  };

  /**
   * Runs once on component mount to fetch the initial template list.
   * Automatically selects the first template if the list is not empty.
   */
  useEffect(() => {
    loadTemplateList().then((data) => {
      if (data.length > 0) {
        handleTableSelect(data[0].ID);
      }
    });
  }, []);

  // --- Event Handlers ---
  /**
   * Handles user selection of a template from the list.
   * Fetches the full template details (fields, forms).
   */
  const handleTableSelect = async (templateId: number) => {
    if (selectedTemplate?.ID === templateId) return;

    setIsLoadingDetails(true);
    setSelectedField(null); // Clear previous field selection.
    setFieldFilter("all"); // Reset field filter.

    const fullTemplate = await getTemplate(templateId); // API call for full template details.
    setSelectedTemplate(fullTemplate);
    
    // Set the first form as selected, or null if none exist.
    if (fullTemplate && fullTemplate.forms.length > 0) {
      setSelectedForm(fullTemplate.forms[0]);
    } else {
      setSelectedForm(null);
    }
    setIsLoadingDetails(false);
  };

  /**
   * Handles the 'Save Template' button click.
   * Applies the renumbering logic and sends the updated template to the API.
   */
  const handleSaveTemplate = async () => {
    if (!selectedTemplate) {
      toast.error("No template selected to save.");
      return;
    }

    // Apply C# "RenumFields" logic (re-sorts fields and updates fieldOrder).
    const renumberedTemplate = renumberFields(selectedTemplate);

    await updateTemplate(renumberedTemplate); // API call to save all nested data.
    // Refresh the local state to ensure data is clean after save.
    handleTableSelect(renumberedTemplate.ID);
  };

  /**
   * Handles the 'Save As' action.
   * Pre-populates the New Template modal with data from the current template.
   */
  const handleSaveAsTemplate = () => {
    if (!selectedTemplate) {
      toast.error("No template selected to save.");
      return;
    }
    // Pre-populate modal fields for saving a copy.
    setNewModuleName(selectedTemplate.moduleName);
    setNewTableName(selectedTemplate.tableName + "_COPY");
    setNewDatabaseName(selectedTemplate.databaseName);
    setNewTableHelp(selectedTemplate.tableHelp);
    setIsCreateModalOpen(true);
  };

  /**
   * Handles saving a completely new template record.
   * This logic is used by the 'New Template' button and 'Save As' function.
   */
  const handleSaveNewTemplate = async () => {
    if (!newTableName || !newDatabaseName) {
      toast.error("Table Name and Database Name are required.");
      return;
    }

    const newTemplateData = {
      moduleName: newModuleName,
      tableName: newTableName,
      databaseName: newDatabaseName,
      tableHelp: newTableHelp,
    };

    const result = await createTemplate(newTemplateData);

    if (result) {
      // Reset modal state.
      setIsCreateModalOpen(false);
      setNewModuleName("");
      setNewTableName("");
      setNewDatabaseName("");
      setNewTableHelp("");
      // Refresh the list and auto-select the new template.
      const data = await loadTemplateList();
      const newTemplate = data.find(t => t.ID === result.id);
      if (newTemplate) {
        handleTableSelect(newTemplate.ID);
      }
    }
  };

  /**
   * Sets up the confirmation modal before deleting a template.
   */
  const handleDeleteTemplateClick = (templateId: number) => {
    const template = templateList.find(t => t.ID === templateId);
    if (template) {
      setTemplateToDelete(template);
      setIsDeleteAlertOpen(true);
    }
  };

  /**
   * Executes the template deletion after user confirmation.
   */
  const handleConfirmDelete = async () => {
    if (!templateToDelete) return;
    
    await deleteTemplate(templateToDelete.ID); // API call to delete template.
    
    // Reset state and refresh UI.
    setIsDeleteAlertOpen(false);
    setTemplateToDelete(null);
    setSelectedTemplate(null);
    
    loadTemplateList().then((data) => {
      if (data.length > 0) {
        handleTableSelect(data[0].ID);
      }
    });
  };

  /**
   * Handles adding new fields (retrieved from the database schema) to the current template.
   */
  const handleAddFields = (newFields: ApiTableField[]) => {
    if (!selectedTemplate) return;

    // Determine the next sequential order number for the new fields.
    let maxOrder = selectedTemplate.fields.reduce((max, f) => Math.max(max, f.fieldOrder), 0);
    
    // Map API schema data into the frontend TemplateField structure.
    const fieldsToAdd: TemplateField[] = newFields.map((nf, i) => {
      maxOrder += 10;
      return {
        ID: 0, // Mark as new record for the backend.
        TemplateID: selectedTemplate.ID,
        fieldName: nf.name,
        fieldPrompt: nf.name,
        fieldValue: "",
        fieldType: "V", 
        isKey: nf.primary_key.toString().toLowerCase() === 'true',
        formID: "MAIN", 
        formOrder: 10,
        fieldOrder: maxOrder,
        dataType: nf.type,
        fieldLength: Number(nf.length),
        defaultValue: "",
        comments: "",
      };
    });

    // Update state to include the new fields.
    setSelectedTemplate({
      ...selectedTemplate,
      fields: [...selectedTemplate.fields, ...fieldsToAdd],
    });
    
    toast.success(`Added ${fieldsToAdd.length} fields. Click "Save Template" to commit.`);
  };

  /**
   * Updates a single field's data within the selectedTemplate state.
   */
  const handleUpdateField = (updatedField: TemplateField) => {
    if (!selectedTemplate) return;

    // Map through the existing fields and replace the one that matches the ID/Name.
    const newFields = selectedTemplate.fields.map(f => 
      f.ID === updatedField.ID && f.fieldName === updatedField.fieldName ? updatedField : f
    );
    
    setSelectedTemplate({
      ...selectedTemplate,
      fields: newFields,
    });
  };
  
  /**
   * Handles deleting a field from the current template in memory.
   */
  const handleDeleteField = (fieldToDelete: TemplateField) => {
     if (!selectedTemplate) return;
     
     // Filter fields: use ID for saved fields (ID > 0), and fieldName for new fields (ID = 0).
     const newFields = selectedTemplate.fields.filter(f => {
       if (fieldToDelete.ID !== 0) {
         return f.ID !== fieldToDelete.ID;
       }
       return f.fieldName !== fieldToDelete.fieldName;
     });

     setSelectedTemplate({
       ...selectedTemplate,
       fields: newFields,
     });
     toast.info(`Field removed. Click "Save Template" to commit.`);
  };
  
  /**
   * Adds a new form/grouping to the current template.
   */
  const handleAddForm = (newForm: Omit<TemplateForm, "ID" | "TemplateID" | "formScreenFile">) => {
    if (!selectedTemplate) return;
    
    const formToAdd: TemplateForm = {
      ...newForm,
      ID: 0, 
      TemplateID: selectedTemplate.ID,
      formScreenFile: "",
    };
    
    setSelectedTemplate({
      ...selectedTemplate,
      forms: [...selectedTemplate.forms, formToAdd],
    });
  };

  /**
   * Updates a single form's details within the selectedTemplate state.
   */
  const handleUpdateForm = (updatedForm: TemplateForm) => {
    if (!selectedTemplate) return;

    const newForms = selectedTemplate.forms.map(f =>
      f.ID === updatedForm.ID && f.formID === updatedForm.formID ? updatedForm : f
    );
    
    setSelectedTemplate({
      ...selectedTemplate,
      forms: newForms,
    });
  };
  
  /**
   * Handles deleting a form/grouping from the current template.
   */
  const handleDeleteForm = (formToDelete: TemplateForm) => {
    if (!selectedTemplate) return;

    // Find the actual form details.
    const formToDeleteDetails = selectedTemplate.forms.find(f => 
      f.ID !== 0 ? f.ID === formToDelete.ID : f.formID === formToDelete.formID
    );

    // Filter out the form from the list.
    const newForms = selectedTemplate.forms.filter(f => {
      if (formToDelete.ID !== 0) {
        return f.ID !== formToDelete.ID;
      }
      return f.formID !== formToDelete.formID;
    });

    // Reset the `formID` field for any fields previously assigned to this deleted form.
    const newFields = selectedTemplate.fields.map(f => {
      if (formToDeleteDetails && f.formID === formToDeleteDetails.formID) {
        return { ...f, formID: "", formOrder: 0 };
      }
      return f;
    });

    setSelectedTemplate({
      ...selectedTemplate,
      forms: newForms,
      fields: newFields,
    });
    toast.info(`Form removed. Click "Save Template" to commit.`);
  };

  /**
   * Implements the C# "RenumFields" logic (reordering logic).
   * It sorts fields primarily by their assigned Form Order and secondarily by manual Field Order,
   * then reassigns a sequential 'fieldOrder' value (10, 20, 30...).
   */
  const renumberFields = (template: Template): Template => {
    let fieldOrder = 10;
    
    // 1. Sort forms by their sequence to establish top-level grouping order.
    const sortedForms = [...template.forms].sort((a, b) => a.formSeq - b.formSeq);
    
    // 2. Map fields to get the correct numeric Form Order, then sort.
    const newFields = template.fields.map(f => {
      const form = sortedForms.find(form => form.formID === f.formID);
      return {
        ...f,
        formOrder: form ? form.formSeq : 999, // Use formSeq for primary sorting.
      };
    }).sort((a, b) => {
      // Primary sort: by the Form's sequence number.
      if (a.formOrder !== b.formOrder) {
        return a.formOrder - b.formOrder;
      }
      // Secondary sort: by the user-defined Field Order.
      return a.fieldOrder - b.fieldOrder;
    }).map(f => {
      // 3. Re-assign the final sequential fieldOrder value.
      const renumberedField = { ...f, fieldOrder: fieldOrder };
      fieldOrder += 10;
      return renumberedField;
    });

    return { ...template, fields: newFields };
  };
  
  /**
   * Filters the master list of fields based on the selected criteria.
   * This is used by the "View" dropdown.
   */
  const filteredFields = (selectedTemplate?.fields || []).filter(field => {
    if (fieldFilter === 'all') return true;
    if (fieldFilter === 'keys') return field.isKey;
    if (fieldFilter === 'constants') return field.fieldType === 'C';
    if (fieldFilter === 'variables') return field.fieldType === 'V';
    // Filter by a specific Form ID.
    if (fieldFilter.startsWith('form_')) {
      const formId = fieldFilter.split('_')[1];
      return field.formID === formId;
    }
    return true;
  });

  /**
   * Placeholder function for the C# "Paste" functionality.
   * Attempts to paste tab-separated column names from the clipboard.
   */
  const handlePaste = async () => {
    if (!selectedTemplate) {
      toast.error("Please select a template first.");
      return;
    }
    try {
      const text = await navigator.clipboard.readText();
      const lines = text.split('\n').filter(line => line.trim() !== '');
      if (lines.length === 0) {
        toast.info("Clipboard is empty or contains no valid lines.");
        return;
      }
      
      const newApiFields: ApiTableField[] = lines.map(line => {
        const parts = line.split('\t'); // Assuming tab-separated data from C# clipboard paste.
        return {
          name: parts[0] || "",
          type: "V", // Default to Variable field type.
          primary_key: "false",
          nullable: "true",
          length: "0",
        } as ApiTableField;
      });
      
      // Filter out fields that already exist to prevent duplicates.
      const existingFieldNames = new Set(selectedTemplate.fields.map(f => f.fieldName));
      const fieldsToAdd = newApiFields.filter(f => f.name && !existingFieldNames.has(f.name));
      
      if (fieldsToAdd.length === 0) {
        toast.info("No new fields found in clipboard data.");
        return;
      }

      handleAddFields(fieldsToAdd);
    } catch (err) {
      toast.error("Failed to paste from clipboard.");
      console.error(err);
    }
  };

  /**
   * Placeholder for the C# "Info" button logic.
   * This would typically fetch sample records and table metadata.
   */
  const handleInfo = () => {
    if (!selectedTemplate) return;
    toast.info("Fetching template records and table info... (Not Implemented)");
  }

  /**
   * Executes the client-side renumbering function and updates local state.
   */
  const handleRenum = () => {
    if (!selectedTemplate) return;
    const renumbered = renumberFields(selectedTemplate);
    setSelectedTemplate(renumbered);
    toast.success("Fields re-numbered. Click 'Save Template' to commit.");
  };

  /**
   * Placeholder for the C# "Export" (to Excel) functionality.
   */
  const handleExport = () => {
    if (!selectedTemplate) return;
    toast.info("Exporting template definition to Excel... (Not Implemented)");
  }
  
  /**
   * Placeholder for the C# "Open Doc" functionality.
   */
  const handleOpenDoc = () => {
    if (!selectedTemplate) return;
    toast.info("Attempting to open local documentation... (Not Implemented)");
  }

  /**
   * Placeholder for the C# "Report" functionality (generating Crystal Report).
   */
  const handleReport = () => {
    if (!selectedTemplate) return;
    toast.info("Generating Crystal Report... (Not Implemented)");
  }
  
  // --- Render ---
  
  if (isLoadingList) {
    return <div className="p-4">Loading Templates...</div>;
  }

  return (
    // Main container for the Data Loader application.
    <main className="flex flex-col flex-1 h-full min-h-0">
      
      {/* --- Toolbar: Top-level actions for file/template management --- */}
      <div className="flex flex-wrap items-center p-2 border-b bg-muted/50 gap-1">
        
        {/* File Actions: Load, Save, Save As, New */}
        <Button onClick={loadTemplateList} variant="ghost" size="sm" className="gap-2">
          <FolderOpen className="size-4" /> Load
        </Button>
        <Button onClick={handleSaveTemplate} variant="ghost" size="sm" className="gap-2" disabled={!selectedTemplate}>
          Save
        </Button>
        <Button onClick={handleSaveAsTemplate} variant="ghost" size="sm" className="gap-2" disabled={!selectedTemplate}>
          Save As
        </Button>
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogTrigger asChild>
             <Button variant="ghost" size="sm" className="gap-2">
              <FilePlus2 className="size-4" /> New Template
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Template</DialogTitle>
              <DialogDescription>
                Define a new table template. You can add fields after creation.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="moduleName" className="text-right">Module</Label>
                <Input id="moduleName" value={newModuleName} onChange={(e) => setNewModuleName(e.target.value)} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="tableName" className="text-right">Table Name</Label>
                <Input id="tableName" value={newTableName} onChange={(e) => setNewTableName(e.target.value)} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="dbName" className="text-right">Database</Label>
                <Input id="dbName" value={newDatabaseName} onChange={(e) => setNewDatabaseName(e.target.value)} className="col-span-3" placeholder="e.g., FIN or MAN" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="tableHelp" className="text-right">Help Text</Label>
                <Textarea id="tableHelp" value={newTableHelp} onChange={(e) => setNewTableHelp(e.target.value)} className="col-span-3" />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" onClick={handleSaveNewTemplate}>Save Template</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        <div className="h-6 border-l mx-1" />

        {/* Field Management Actions: Adding/Pasting fields, Renumbering */}
        <Button 
          variant="ghost" size="sm" className="gap-2"
          onClick={() => setIsAddFieldsModalOpen(true)}
          disabled={!selectedTemplate}
        >
          C-Fields/V-Fields...
        </Button>
        <Button onClick={handlePaste} variant="ghost" size="sm" className="gap-2" disabled={!selectedTemplate}>
          <ClipboardPaste className="size-4" /> Paste
        </Button>
        <Button onClick={handleExport} variant="ghost" size="sm" className="gap-2" disabled={!selectedTemplate}>
          <FileDown className="size-4" /> Export
        </Button>
        
        <div className="h-6 border-l mx-1" />

        {/* Utility/Process Actions: Info, Upload, Docs, Reports */}
        <Button onClick={handleInfo} variant="ghost" size="sm" className="gap-2" disabled={!selectedTemplate}>
          <Info className="size-4" /> Info
        </Button>
        <Button onClick={() => setIsUploaderOpen(true)} variant="ghost" size="sm" className="gap-2" disabled={!selectedTemplate}>
          <Upload className="size-4" /> UPLOAD
        </Button>
        <Button onClick={handleOpenDoc} variant="ghost" size="sm" className="gap-2" disabled={!selectedTemplate}>
          <Book className="size-4" /> Open Doc
        </Button>
        <Button onClick={handleRenum} variant="ghost" size="sm" className="gap-2" disabled={!selectedTemplate}>
          <RefreshCcw className="size-4" /> Renum
        </Button>
        
        {/* Field Filtering Dropdown (replicates C# View button menu) */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-2" disabled={!selectedTemplate}>
              <ListFilter className="size-4" /> View: {fieldFilter === 'all' ? 'All' : fieldFilter.startsWith('form_') ? 'Form' : fieldFilter}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuRadioGroup value={fieldFilter} onValueChange={setFieldFilter}>
              <DropdownMenuRadioItem value="all">All Fields</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="keys">Key Fields</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="constants">Constant Fields</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="variables">Variable Fields</DropdownMenuRadioItem>
              <DropdownMenuSeparator />
              {selectedTemplate?.forms.map(form => (
                <DropdownMenuRadioItem key={form.formID} value={`form_${form.formID}`}>
                  Form: {form.formID}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button onClick={handleReport} variant="ghost" size="sm" className="gap-2" disabled={!selectedTemplate}>
          <FileText className="size-4" /> Report
        </Button>

        <Button onClick={() => setIsSettingsOpen(true)} variant="ghost" size="sm" className="gap-2 ml-auto">
          <Settings className="size-4" /> Settings
        </Button>
      </div>

      {/* --- Main Content Area: Divided into vertical columns (left/right) --- */}
      <div className="flex flex-col flex-1 min-h-0">
        
        {/* --- Top Row: Template List, Forms, and Records Tabs --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 w-full flex-basis-1/2 min-h-0">

          {/* Left Column: Template List & Help */}
          <div className="w-full p-4 flex flex-col gap-4 border-r min-h-0">
              <Card className="flex flex-col flex-1">
                <CardHeader>
                  <CardTitle>Template Tables</CardTitle>
                </CardHeader>
                <CardContent className="flex-1 min-h-0">
                  <TemplateList
                    tables={templateList}
                    selectedTemplateId={selectedTemplate?.ID || null}
                    onSelect={handleTableSelect}
                    onDelete={handleDeleteTemplateClick}
                  />
                </CardContent>
              </Card>

              {/* Table Help Textarea (Corresponds to old bottom-left textbox) */}
              <div>
                <h4 className="text-sm font-medium mb-1">Table Help</h4>
                <Textarea
                  className="h-24 mt-2"
                  value={selectedTemplate?.tableHelp || ""}
                  onChange={(e) => selectedTemplate && setSelectedTemplate({
                    ...selectedTemplate,
                    tableHelp: e.target.value,
                  })}
                  disabled={!selectedTemplate}
                />
              </div>
          </div>

          {/* Right Column: Forms and Records Tabs */}
          <div className="w-full p-4 flex flex-col gap-4 min-h-0">
            <Tabs defaultValue="forms" className="flex flex-col flex-1">
              <TabsList>
                <TabsTrigger value="forms">Data Entry Forms</TabsTrigger>
                <TabsTrigger value="records" disabled={!selectedTemplate}>
                  Template Records
                </TabsTrigger>
              </TabsList>
              <TabsContent value="forms" className="flex-1">
                <FormList
                  forms={selectedTemplate?.forms || []}
                  onAddForm={handleAddForm}
                  onDeleteForm={handleDeleteForm}
                  onUpdateForm={handleUpdateForm}
                  onSelectForm={setSelectedForm}
                  selectedForm={selectedForm}
                />
              </TabsContent>
              <TabsContent value="records" className="flex-1">
                <TemplateRecordsTab 
                  template={selectedTemplate}
                  onCopyRecord={() => toast.info("Copying record to fields... (Not Implemented)")}
                />
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* --- Bottom Row: Fields List and Field Details --- */}
        <div className="w-full p-4 flex flex-col border-t flex-1 min-h-0">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 flex-1 min-h-0">
            
            {/* Field List (The main grid for field definitions) */}
            <Card className="h-full flex flex-col flex-1">
              <CardHeader>
                <CardTitle>Fields for {selectedTemplate?.tableName || "..."}</CardTitle>
              </CardHeader>
              <CardContent className="flex-1 min-h-0">
                {isLoadingDetails ? (
                  <div className="text-center p-8">Loading fields...</div>
                ) : (
                  <FieldList
                    fields={filteredFields}
                    onDeleteField={handleDeleteField}
                    onUpdateField={handleUpdateField}
                    onSelectField={setSelectedField}
                    selectedField={selectedField}
                  />
                )}
              </CardContent>
            </Card>

            {/* Field Info Panel (Detail view for the selected field) */}
            <FieldInfoPanel 
              field={selectedField} 
              forms={selectedTemplate?.forms || []} 
              onUpdateField={handleUpdateField}
            />
          </div>
        </div>

      </div>
      
      {/* --- Status Bar: Displays connection status/paths --- */}
      <div className="flex items-center p-2 border-t bg-muted/50 text-sm text-muted-foreground">
        <div className="px-2 border-r">
          FIN DB: <span className="font-medium text-foreground">{finDbConnection}</span>
        </div>
        <div className="px-2">
          MAN DB: <span className="font-medium text-foreground">{manDbConnection}</span>
        </div>
      </div>

      {/* --- Modals and Alerts --- */}
      <AddFieldsDialog
        open={isAddFieldsModalOpen}
        onOpenChange={setIsAddFieldsModalOpen}
        template={selectedTemplate}
        onAddFields={handleAddFields}
      />
      
      <UploaderDialog
        open={isUploaderOpen}
        onOpenChange={setIsUploaderOpen}
        template={selectedTemplate}
      />
      <SettingsDialog
        open={isSettingsOpen}
        onOpenChange={setIsSettingsOpen}
        finDb={finDbConnection}
        manDb={manDbConnection}
        onSave={(fin, man) => {
          setFinDbConnection(fin);
          setManDbConnection(man);
        }}
      />
      
      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the template
              <strong> {templateToDelete?.tableName}</strong> and all its
              associated fields and forms. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleConfirmDelete}
            >
              Delete Template
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}