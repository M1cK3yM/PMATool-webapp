import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { ExecutePlanResponse, MrpNode } from "@/lib/mrp-service";

interface MasterMRPProps {
  data: ExecutePlanResponse | null;
  onRowClick: (node: MrpNode) => void;
  selectedNode: MrpNode | null;
}

export default function MasterMRP({ data, onRowClick, selectedNode }: MasterMRPProps) {
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
            {data ? (
              <>
                <TableRow
                  key={data.Root.partCode}
                  onClick={() => onRowClick(data.Root)}
                  data-state={selectedNode?.partCode === data.Root.partCode ? 'selected' : ''}
                  className="cursor-pointer"
                >
                  <TableCell>{data.Root.partCode}</TableCell>
                  <TableCell>{data.Root.warehouse}</TableCell>
                  <TableCell>{data.Root.partDesc}</TableCell>
                  <TableCell>{data.Root.costingSpec}</TableCell>
                  <TableCell>{data.Root.plannedQty}</TableCell>
                  <TableCell>{data.Root.addReqQty}</TableCell>
                  <TableCell>{data.Root.batchQty}</TableCell>
                  <TableCell>{data.Root.batchUom}</TableCell>
                  <TableCell>{data.Root.totalBatches}</TableCell>
                  <TableCell>{data.Root.batchQtyNom}</TableCell>
                  <TableCell>{data.Root.batchUomNom}</TableCell>
                  <TableCell>{data.Root.userQty}</TableCell>
                  <TableCell>{data.Root.stdCost}</TableCell>
                </TableRow>
                {data.Children.map((child) => (
                  <TableRow
                    key={child.partCode}
                    onClick={() => onRowClick(child)}
                    data-state={selectedNode?.partCode === child.partCode ? 'selected' : ''}
                    className="cursor-pointer"
                  >
                    <TableCell>{child.partCode}</TableCell>
                    <TableCell>{child.warehouse}</TableCell>
                    <TableCell>{child.partDesc}</TableCell>
                    <TableCell>{child.costingSpec}</TableCell>
                    <TableCell>{child.plannedQty}</TableCell>
                    <TableCell>{child.addReqQty}</TableCell>
                    <TableCell>{child.batchQty}</TableCell>
                    <TableCell>{child.batchUom}</TableCell>
                    <TableCell>{child.totalBatches}</TableCell>
                    <TableCell>{child.batchQtyNom}</TableCell>
                    <TableCell>{child.batchUomNom}</TableCell>
                    <TableCell>{child.userQty}</TableCell>
                    <TableCell>{child.stdCost}</TableCell>
                  </TableRow>
                ))}
              </>
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
