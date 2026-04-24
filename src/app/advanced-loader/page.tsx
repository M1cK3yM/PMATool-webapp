"use client";

import React, { useState, useRef, useEffect, startTransition } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Upload, Database, Settings2, TableProperties, Play } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

type DBField = {
  name: string;
  type: string;
  nullable: boolean;
  length: number;
};

export default function AdvancedLoaderPage() {
  const username = "Administrator"; // Defaulting for ease
  const [connType, setConnType] = useState("SRC");
  const [dbType, setDbType] = useState("FIN");
  const [tableName, setTableName] = useState("");

  const [dbFields, setDbFields] = useState<DBField[]>([]);
  const [excelHeaders, setExcelHeaders] = useState<string[]>([]);
  const [mappings, setMappings] = useState<Record<string, string>>({}); // ExcelHeader -> DBField

  const [isFetchingFields, setIsFetchingFields] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [upsert, setUpsert] = useState(false);
  const [customKeys, setCustomKeys] = useState<Record<string, boolean>>({}); // dbField -> true/false
  const [previewRows, setPreviewRows] = useState<any[][]>([]);

  const xmlFileInputRef = useRef<HTMLInputElement>(null);

  const performAutoMapping = (headers: string[], fields: DBField[]) => {
    const autoMappings: Record<string, string> = {};
    let matchCount = 0;

    // O(n) optimization using a Map
    const fieldMap = new Map(
      fields.filter(f => f.name).map(f => [f.name.toLowerCase().replace(/_/g, ""), f.name])
    );

    headers.forEach(header => {
      const normalizedHeader = header.toLowerCase().replace(/_/g, "");
      if (fieldMap.has(normalizedHeader)) {
        autoMappings[header] = fieldMap.get(normalizedHeader)!;
        matchCount++;
      }
    });

    setMappings(autoMappings);

    if (matchCount > 0) {
      toast.success(`Auto-mapped ${matchCount} fields successfully.`);
    } else if (headers.length > 0 && fields.length > 0) {
      toast.warning("Warning: No Excel headers could be auto-mapped to the database fields.");
    }
  };

  const handleFetchFields = async () => {
    if (!username || !connType || !dbType || !tableName) {
      toast.error("Please fill all connection details and table name");
      return;
    }

    setIsFetchingFields(true);

    // Allow the browser to paint the loading state before doing heavy work
    await new Promise(resolve => setTimeout(resolve, 50));

    try {
      const response = await fetch("http://localhost:8081/getFields", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
          connType,
          dbType,
          tableName,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch table fields");
      }

      const data = await response.json();
      const fetchedFields = data || [];

      // Use startTransition to prevent UI freeze during massive re-renders
      startTransition(() => {
        setDbFields(fetchedFields);
        if (excelHeaders.length > 0) {
          performAutoMapping(excelHeaders, fetchedFields);
        }
      });

      toast.success(`Fetched ${fetchedFields.length} fields for table ${tableName}`);
    } catch (error: any) {
      toast.error(error.message || "An error occurred fetching fields");
    } finally {
      setIsFetchingFields(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (selectedFile.size > 5 * 1024 * 1024) {
      toast.error("File too large (max 5MB)");
      return;
    }

    setFile(selectedFile);

    const reader = new FileReader();
    reader.onload = (evt) => {
      const buffer = evt.target?.result;
      if (!buffer) return;

      const worker = new Worker(new URL("./worker.ts", import.meta.url));
      worker.postMessage(buffer);

      worker.onmessage = (e) => {
        if (!e.data.success) {
          toast.error("Failed to parse Excel file");
          worker.terminate();
          return;
        }

        const headers = e.data.headers;
        const pRows = e.data.previewRows || [];

        if (headers && headers.length > 0) {
          // Use startTransition to prevent UI freeze during massive re-renders
          startTransition(() => {
            setExcelHeaders(headers);
            setPreviewRows(pRows);

            if (dbFields.length > 0) {
              performAutoMapping(headers, dbFields);
            } else {
              toast.success(`Loaded Excel with ${headers.length} headers`);
            }
          });
        } else {
          toast.error("Excel file appears to be empty or has no headers");
        }
        worker.terminate();
      };

      worker.onerror = (error) => {
        toast.error("Error running the Excel parser background task");
        console.error("Worker error:", error);
        worker.terminate();
      };
    };
    reader.readAsArrayBuffer(selectedFile);
  };

  const handleExportXML = () => {
    let xml = `<?xml version="1.0" standalone="yes"?>\n`;
    xml += `<DataLoadTemplate xmlns="http://tempuri.org/DataLoadTemplate.xsd">\n`;
    xml += `  <Template>\n`;
    xml += `    <ModuleName>Inventory</ModuleName>\n`;
    xml += `    <TableName>${tableName || "UNKNOWN"}</TableName>\n`;
    xml += `    <DatabaseName>${dbType}</DatabaseName>\n`;
    
    Object.entries(mappings).forEach(([excelHeader, dbField]) => {
      if (dbField && dbField !== "unmapped") {
        const isKey = !!customKeys[dbField];
        xml += `    <TableField>\n`;
        xml += `      <TableName>${tableName || "UNKNOWN"}</TableName>\n`;
        xml += `      <FieldName>${dbField}</FieldName>\n`;
        xml += `      <FieldValue>${excelHeader}</FieldValue>\n`;
        xml += `      <IsKey>${isKey}</IsKey>\n`;
        xml += `    </TableField>\n`;
      }
    });
    
    xml += `  </Template>\n`;
    xml += `</DataLoadTemplate>`;

    const blob = new Blob([xml], { type: "text/xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${tableName || "Mapping"}_Template.xml`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Template exported successfully");
  };

  const handleImportXML = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const xmlString = evt.target?.result as string;
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlString, "text/xml");

      const errorNode = xmlDoc.querySelector("parsererror");
      if (errorNode) {
        toast.error("Failed to parse XML template");
        return;
      }

      const tblNameNode = xmlDoc.querySelector("Template > TableName");
      if (tblNameNode && tblNameNode.textContent) {
        setTableName(tblNameNode.textContent);
      }

      const fieldNodes = xmlDoc.querySelectorAll("TableField");
      const newMappings: Record<string, string> = {};
      const newCustomKeys: Record<string, boolean> = {};

      fieldNodes.forEach(node => {
        const fieldName = node.querySelector("FieldName")?.textContent; // dbField
        const fieldValue = node.querySelector("FieldValue")?.textContent; // excel header
        const isKey = node.querySelector("IsKey")?.textContent === "true";

        if (fieldName && fieldValue) {
          newMappings[fieldValue] = fieldName;
          if (isKey) {
            newCustomKeys[fieldName] = true;
          }
        }
      });

      setMappings(newMappings);
      setCustomKeys(newCustomKeys);
      toast.success("Template loaded successfully");
    };
    reader.readAsText(file);
    
    if (xmlFileInputRef.current) {
        xmlFileInputRef.current.value = "";
    }
  };

  const handleMappingChange = (excelHeader: string, dbField: string) => {
    setMappings(prev => ({
      ...prev,
      [excelHeader]: dbField === "unmapped" ? "" : dbField
    }));
  };

  const handleUploadData = async () => {
    if (!file) {
      toast.error("Please upload an Excel file first");
      return;
    }

    // Filter out empty mappings
    const finalMappings = Object.entries(mappings).reduce((acc, [k, v]) => {
      if (v) acc[k] = v;
      return acc;
    }, {} as Record<string, string>);

    if (Object.keys(finalMappings).length === 0) {
      toast.error("Please map at least one field");
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("username", username);
      formData.append("connType", connType);
      formData.append("dbType", dbType);
      formData.append("tableName", tableName);
      formData.append("upsert", String(upsert));

      const mappedDbFields = Object.values(finalMappings);
      const activeKeys = Object.keys(customKeys).filter(k => customKeys[k] && mappedDbFields.includes(k));
      if (activeKeys.length > 0) {
        formData.append("customKeys", JSON.stringify(activeKeys));
      }

      formData.append("file", file);
      formData.append("mappings", JSON.stringify(finalMappings));

      const response = await fetch("http://localhost:8081/uploadDataLoader", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Upload failed");
      }

      toast.success("Data successfully loaded into database!");
    } catch (error: any) {
      toast.error(error.message || "An error occurred during upload");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="container mx-auto py-10 space-y-8 ">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Configuration */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings2 className="w-5 h-5" />
                Connection
              </CardTitle>
              <CardDescription>Target database configuration</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex space-x-2">
                <div className="space-y-2">
                  <Label>Connection Type</Label>
                  <Select value={connType} onValueChange={setConnType}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SRC">Source (SRC)</SelectItem>
                      <SelectItem value="DES">Destination (DES)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Database Type</Label>
                  <Select value={dbType} onValueChange={setDbType}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="FIN">Financial (FIN)</SelectItem>
                      <SelectItem value="MAN">Manufacturing (MAN)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Table Name</Label>
                <Input value={tableName} onChange={(e) => setTableName(e.target.value)} placeholder="PRODUCT_MASTER" />
              </div>
              <div className="flex items-center space-x-2 pt-2">
                <Checkbox
                  id="upsertCheck"
                  onCheckedChange={(checked) => setUpsert(checked.valueOf() as boolean)}
                />
                <Label htmlFor="upsertCheck" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Upsert on duplicate key
                </Label>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleFetchFields} disabled={isFetchingFields} className="w-full">
                {isFetchingFields ? "Fetching..." : "Connect & Fetch Fields"}
              </Button>
            </CardFooter>
          </Card>

          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="w-5 h-5" />
                Source File
              </CardTitle>
              <CardDescription>Upload an Excel or CSV file</CardDescription>
            </CardHeader>
            <CardContent>
              <Input type="file" accept=".xlsx, .xls, .csv" onChange={handleFileUpload} />
              {file && (
                <div className="mt-4 text-sm text-gray-500 bg-gray-50 dark:bg-gray-800 p-3 rounded-md">
                  Selected: <span className="font-medium text-gray-700 dark:text-gray-300">{file.name}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Mapping & Preview */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="mapping" className="w-full h-full flex flex-col">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="mapping">Field Mapping</TabsTrigger>
              <TabsTrigger value="preview">Data Preview</TabsTrigger>
            </TabsList>

            <TabsContent value="mapping" className="flex-1 mt-0">
              <Card className="h-full shadow-md">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TableProperties className="w-5 h-5" />
                    Field Mapping
                  </CardTitle>
                  <CardDescription>Map Excel columns to Database fields</CardDescription>
                </CardHeader>
                <CardContent>
                  {dbFields.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center border-2 border-dashed rounded-lg border-gray-200 dark:border-gray-700">
                      <Database className="w-12 h-12 text-gray-300 mb-4" />
                      <p className="text-gray-500">Connect to a table to view fields</p>
                    </div>
                  ) : excelHeaders.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center border-2 border-dashed rounded-lg border-gray-200 dark:border-gray-700">
                      <Upload className="w-12 h-12 text-gray-300 mb-4" />
                      <p className="text-gray-500">Upload a file to begin mapping</p>
                    </div>
                  ) : (
                    <div className="border rounded-md">
                      <Table>
                        <TableHeader className="bg-gray-50 dark:bg-gray-800/50">
                          <TableRow>
                            <TableHead>Excel Header</TableHead>
                            <TableHead>Database Field</TableHead>
                            <TableHead className="w-24 text-center">Is Key?</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {excelHeaders.map((header, idx) => (
                            <TableRow key={idx}>
                              <TableCell className="font-medium">
                                {header}
                              </TableCell>
                              <TableCell>
                                <select
                                  value={mappings[header] || "unmapped"}
                                  onChange={(e) => handleMappingChange(header, e.target.value)}
                                  className="flex h-10 w-full items-center justify-between rounded-md border border-gray-200 bg-white px-3 py-2 text-sm ring-offset-white focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-800 dark:bg-gray-950 dark:ring-offset-gray-950"
                                >
                                  <option value="unmapped" className="text-gray-400 italic">-- Skip / Do not map --</option>
                                  {dbFields.map(field => (
                                    <option key={field.name} value={field.name}>
                                      {field.name} ({field.type})
                                    </option>
                                  ))}
                                </select>
                              </TableCell>
                              <TableCell className="text-center flex justify-center py-5">
                                <Checkbox
                                  checked={mappings[header] && mappings[header] !== "unmapped" ? !!customKeys[mappings[header]] : false}
                                  disabled={!upsert || !mappings[header] || mappings[header] === "unmapped"}
                                  onCheckedChange={(checked) => {
                                    if (mappings[header] && mappings[header] !== "unmapped") {
                                      setCustomKeys(prev => ({ ...prev, [mappings[header]]: checked.valueOf() as boolean }));
                                    }
                                  }}
                                  title="Check to use this field as a Custom Primary Key for Upserts"
                                />
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
                <CardFooter className="flex justify-between gap-4 border-t pt-6">
                  <div className="flex gap-2">
                    <input type="file" accept=".xml" className="hidden" ref={xmlFileInputRef} onChange={handleImportXML} />
                    <Button variant="outline" onClick={() => xmlFileInputRef.current?.click()}>
                      Import XML
                    </Button>
                    <Button variant="outline" onClick={handleExportXML} disabled={Object.keys(mappings).length === 0}>
                      Export XML
                    </Button>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => { setMappings({}); setCustomKeys({}); }}>Clear Mappings</Button>
                    <Button
                      onClick={handleUploadData}
                      disabled={isUploading || excelHeaders.length === 0 || Object.values(mappings).filter(Boolean).length === 0}
                    >
                      <Play className="w-4 h-4 mr-2" />
                      {isUploading ? "Executing..." : "Execute Data Load"}
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            </TabsContent>

            <TabsContent value="preview" className="flex-1 mt-0">
              <Card className="h-full shadow-md">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="w-5 h-5" />
                    Excel Records Preview
                  </CardTitle>
                  <CardDescription>First 100 rows of the uploaded file</CardDescription>
                </CardHeader>
                <CardContent>
                  {previewRows.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center border-2 border-dashed rounded-lg border-gray-200 dark:border-gray-700">
                      <p className="text-gray-500">Upload an Excel file to see preview</p>
                    </div>
                  ) : (
                    <div className="border rounded-md overflow-x-auto">
                      <Table>
                        <TableHeader className="bg-gray-50 dark:bg-gray-800/50">
                          <TableRow>
                            {excelHeaders.map((header, idx) => (
                              <TableHead key={idx} className="whitespace-nowrap">{header}</TableHead>
                            ))}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {previewRows.map((row, rowIdx) => (
                            <TableRow key={rowIdx}>
                              {excelHeaders.map((_, colIdx) => (
                                <TableCell key={colIdx} className="whitespace-nowrap">
                                  {row[colIdx] !== undefined ? String(row[colIdx]) : ""}
                                </TableCell>
                              ))}
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
