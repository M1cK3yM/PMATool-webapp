"use client";

import type { Template } from "@/lib/template-service";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Copy } from "lucide-react";

interface TemplateRecordsTabProps {
  template: Template | null; // The currently selected template.
  records?: any[]; // Optional records passed from parent
  loading?: boolean;
  onCopyRecord: (record: any) => void; // Handler to copy selected record values to constant fields.
}

export default function TemplateRecordsTab({
  template,
  records = [],
  loading = false,
  onCopyRecord,
}: TemplateRecordsTabProps) {
  
  return (
    <Card className="h-full flex flex-col">
      <CardContent className="flex-1 flex flex-col gap-4 pt-6">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {/* Displays a count of loaded records. */}
            {loading ? "Loading..." : `${records.length} records found in database.`}
          </p>
          {/* Button to copy the selected record's data to the field value inputs. */}
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            // For now, copies first record if available. 
            // In a real app, you might want to select a row first.
            onClick={() => records.length > 0 && onCopyRecord(records[0])}
            disabled={records.length === 0}
          >
            <Copy className="size-4" />
            Copy Selected to Fields
          </Button>
        </div>
        
        {/* Table to display the sample records fetched from the database. */}
        <ScrollArea className="h-full border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                {/* Headers are dynamically generated based on the template's key fields. */}
                {template?.fields.length === 0 ? (
                   <TableHead>No Fields</TableHead>
                ) : (
                  template?.fields.map((f) => (
                    <TableHead key={f.fieldName} className="whitespace-nowrap">
                      {f.fieldName}
                    </TableHead>
                  ))
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={template?.fields.length || 1} className="h-24 text-center">
                    Loading data...
                  </TableCell>
                </TableRow>
              ) : records.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={
                      template?.fields.length || 1
                    }
                    className="h-24 text-center"
                  >
                    {/* Instructions for loading records */}
                    No template records loaded. Click the "Info" button on the
                    toolbar to fetch them.
                  </TableCell>
                </TableRow>
              ) : (
                records.map((row, idx) => (
                  <TableRow key={idx}>
                    {template?.fields.map((f) => (
                      <TableCell key={f.fieldName} className="whitespace-nowrap">
                        {row[f.fieldName] !== undefined ? String(row[f.fieldName]) : ""}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}