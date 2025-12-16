import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { ExecutePlanResponse, PartMRP, flattenTree } from "@/lib/mrp-service";
import { useMemo } from "react";

interface MasterMRPProps {
  data: ExecutePlanResponse | null;
  onRowClick: (node: PartMRP) => void;
  selectedNode: PartMRP | null;
}

export default function MasterMRP({ data, onRowClick, selectedNode }: MasterMRPProps) {
  const allParts = useMemo(() => {
    if (!data || data.length === 0) return [];
    return flattenTree(data);
  }, [data]);

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
            {allParts.length > 0 ? (
              allParts.map((part) => (
                <TableRow
                  key={`${part.partCode}-${part.warehouse}`}
                  onClick={() => onRowClick(part)}
                  data-state={selectedNode?.partCode === part.partCode && selectedNode?.warehouse === part.warehouse ? 'selected' : ''}
                  className="cursor-pointer"
                >
                  <TableCell>{part.partCode}</TableCell>
                  <TableCell>{part.warehouse}</TableCell>
                  <TableCell>{part.partDesc}</TableCell>
                  <TableCell>{part.costingSpec}</TableCell>
                  <TableCell>{part.plannedQty}</TableCell>
                  <TableCell>{part.addReqQty}</TableCell>
                  <TableCell>{part.batchQty}</TableCell>
                  <TableCell>{part.batchUom}</TableCell>
                  <TableCell>{part.totalBatches}</TableCell>
                  <TableCell>{part.batchQtyNom}</TableCell>
                  <TableCell>{part.batchUomNom}</TableCell>
                  <TableCell>{part.userQty}</TableCell>
                  <TableCell>{part.stdCost}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={13} className="text-center text-muted-foreground py-8">
                  No data available
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
