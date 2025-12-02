"use client";
import type { Template } from '@/lib/template-service'; 
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table'
import { ScrollArea } from '@/components/ui/scroll-area';

interface TemplateListProps {
  tables: Template[];
  selectedTemplateId: number | null;
  onSelect: (templateId: number) => void; 
  onDelete: (templateId: number) => void;
}

export default function TemplateList({
  tables,
  selectedTemplateId,
  onSelect,
  onDelete,
}: TemplateListProps) {
  
  return (
    // Changed: h-full ensures the scroll area takes the entire available space provided by the parent CardContent
    <div className="h-full">
      <ScrollArea className="h-full border rounded-md">
        <Table>
          <TableHeader>
              <TableRow>
                <TableHead>Module</TableHead>
                <TableHead>Table Name</TableHead>
                <TableHead>Database</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
          </TableHeader>
          <TableBody>
            {tables.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center h-24">
                  No templates found. Click "New Template" to create one.
                </TableCell>
              </TableRow>
            ) : (
              tables.map((table) => (
              <TableRow
                key={table.ID}
                className={`cursor-pointer ${
                  table.ID === selectedTemplateId
                    ? 'bg-sky-50 dark:bg-sky-800 text-slate-900 dark:text-slate-100 font-medium'
                    : 'hover:bg-muted/50'
                }`}
                onClick={() => onSelect(table.ID)}
                tabIndex={0}
                role="button"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') onSelect(table.ID)
                }}
                aria-selected={table.ID === selectedTemplateId}
              >
                <TableCell>{table.moduleName}</TableCell>
                <TableCell>{table.tableName}</TableCell>
                <TableCell>{table.databaseName}</TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="text-destructive"
                    onClick={(e) => {
                      e.stopPropagation(); 
                      onDelete(table.ID);
                    }}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </TableCell>
              </TableRow>
              ))
            )}
        </TableBody>
      </Table>
    </ScrollArea>
    </div>
  )
}