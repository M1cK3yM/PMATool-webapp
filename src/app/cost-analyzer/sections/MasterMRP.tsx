import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { ExecutePlanResponse, PartMRP, PartMRPWithPath, flattenTree } from "@/lib/mrp-service";
import { useMemo, useState, useEffect, useRef } from "react";

interface MasterMRPProps {
  data: ExecutePlanResponse | null;
  onRowClick: (node: PartMRP, uniquePath: string) => void;
  selectedNode: PartMRP | null;
  selectedUniquePath?: string | null;
}

export default function MasterMRP({ data, onRowClick, selectedNode, selectedUniquePath }: MasterMRPProps) {
  const allParts = useMemo(() => {
    if (!data || data.length === 0) return [];
    return flattenTree(data);
  }, [data]);

  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const rowRefs = useRef<(HTMLTableRowElement | null)[]>([]);

  // Find the index of the selected node when it changes externally using unique path
  useEffect(() => {
    if (selectedUniquePath && allParts.length > 0) {
      const index = allParts.findIndex(
        part => part._uniquePath === selectedUniquePath
      );
      if (index !== -1) {
        setSelectedIndex(index);
      }
    } else if (selectedNode && allParts.length > 0 && !selectedUniquePath) {
      // Fallback: if no unique path provided, find by partCode/warehouse (for backward compatibility)
      const index = allParts.findIndex(
        part => part.partCode === selectedNode.partCode && part.warehouse === selectedNode.warehouse
      );
      if (index !== -1) {
        setSelectedIndex(index);
      }
    } else if (!selectedNode && !selectedUniquePath) {
      setSelectedIndex(null);
    }
  }, [selectedNode, selectedUniquePath, allParts]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (allParts.length === 0) return;

      // Only handle if the container or one of its children has focus
      const container = containerRef.current;
      if (!container || !container.contains(document.activeElement)) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        const newIndex = selectedIndex === null ? 0 : Math.min(selectedIndex + 1, allParts.length - 1);
        setSelectedIndex(newIndex);
        const part = allParts[newIndex];
        onRowClick(part, part._uniquePath);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        const newIndex = selectedIndex === null ? allParts.length - 1 : Math.max(selectedIndex - 1, 0);
        setSelectedIndex(newIndex);
        const part = allParts[newIndex];
        onRowClick(part, part._uniquePath);
      }
    };

    // Add event listener to document to catch keyboard events when container is focused
    document.addEventListener("keydown", handleKeyDown);
    
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [allParts, selectedIndex, onRowClick]);

  // Scroll selected row into view
  useEffect(() => {
    if (selectedIndex !== null && rowRefs.current[selectedIndex]) {
      rowRefs.current[selectedIndex]?.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }
  }, [selectedIndex]);

  return (
    <div className="h-full flex flex-col">
      <div 
        ref={containerRef}
        tabIndex={0}
        className="flex-1 overflow-auto p-4 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        onFocus={(e) => {
          // Auto-focus the container when clicked
          if (e.currentTarget === e.target) {
            e.currentTarget.focus();
          }
        }}
      >
        <Table fullHeight={true}>
          <TableHeader className="sticky-header">
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
              allParts.map((part, index) => (
                <TableRow
                  key={part._uniquePath}
                  ref={(el) => {
                    rowRefs.current[index] = el;
                  }}
                  onClick={() => {
                    setSelectedIndex(index);
                    onRowClick(part, part._uniquePath);
                    // Focus the container to enable keyboard navigation
                    containerRef.current?.focus();
                  }}
                  data-state={selectedIndex === index ? 'selected' : ''}
                  className={`cursor-pointer ${selectedIndex === index ? 'bg-muted' : ''} hover:bg-muted/50`}
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
