import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";

export default function MasterMRP() {
  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-auto p-4">
        <Table>
          <TableHeader className="sticky top-0 z-10 bg-background">
            <TableRow>
              <TableHead className="w-[120px]">Part Code</TableHead>
              <TableHead className="w-[80px]">WH</TableHead>
              <TableHead className="w-[200px]">Part Description</TableHead>
              <TableHead className="w-[100px]">Proc Spec</TableHead>
              <TableHead className="w-[100px]">Planned</TableHead>
              <TableHead className="w-[100px]">Add Qty</TableHead>
              <TableHead className="w-[100px]">Batch Qty</TableHead>
              <TableHead className="w-[80px]">UOM</TableHead>
              <TableHead className="w-[100px]">Batches</TableHead>
              <TableHead className="w-[100px]">Nom Qty</TableHead>
              <TableHead className="w-[100px]">Nom UOM</TableHead>
              <TableHead className="w-[100px]">User Qty</TableHead>
              <TableHead className="w-[100px]">Std Cost</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell colSpan={13} className="text-center text-muted-foreground py-8">
                No data available
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
