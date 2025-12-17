import { apiClient } from "./api-client"

export interface ExecutePlanParams {
  planId: string;
  resultName: string;
  userUom?: string;
  username: string;
}

export interface ExecuteSingleProductParams {
  partCode: string;
  warehouse: string;
  uom: string;
  userUom?: string;
  plannedVolume: number;
  username: string;
}

interface MaterialIn {
  partCode: string
  warehouse: string
  mrpIndex: number
  processStage: string
  recipeCode: string
  setupQty: number
  inputQty: number
  inputUom: string
  inputNomUom: string
  totalQty: number
  setupQtyNom: number
  inputQtyNom: number
  totalQtyNom: number
  userQty: number
  uomChanged: boolean
  detailDesc: string
}

export interface LaborIn {
  laborClass: string
  processStage: string
  recipeCode: string
  laborUnits: number
  setupTime: number
  setupTimeUnit: string
  runRateFlag: string
  runTime: number
  runRate: number
  runTimeUnit: string
  setupHours: number
  runtimeHours: number
  batchHours: number
  recoveryRate: number
  recoveryTimeUnit: string
  ohAllocationFlag: string
  ohAllocationCost: number
  directCost: number
  ohCost: number
}

interface MachineIn {
  machineCode: string
  laborClass: string
  laborUnits: number
  processStage: string
  recipeCode: string
  setupTime: number
  setupTimeUnit: string
  runRateFlag: string
  runTime: number
  runRate: number
  runTimeUnit: string
  setupHours: number
  runtimeHours: number
  batchHours: number
  recoveryFlag: string
  recoveryRate: number
  recoveryTimeUnit: string
  ohAllocationFlag: string
  ohAllocationCost: number
  directCost: number
  ohCost: number
}

export interface MiscIn {
  inputProduct: string
  processStage: string
  recipeCode: string
  fixedCost: number
  inputQty: number
  inputUom: string
  unitCost: number
}

export interface PartMRP {
  partCode: string
  warehouse: string
  partDesc: string
  costingFactory: string
  costingSpec: string
  costingSpecVer: number
  finalStage: string
  finalStageRecipe: string
  finalStageRecipeVer: string
  stdCost: number
  bomLevel: number
  batchQty: number
  minBatchQty: number
  minBatchQtyNom: number
  maxBatchQty: number
  maxBatchQtyNom: number
  batchUom: string
  batchQtyNom: number
  batchUomNom: string
  status: string
  plannedQty: number
  addReqQty: number
  totalBatches: number
  adjustedQty: number
  uomChanged: boolean
  messageInfo: string
  userQty: number
  materialIns: MaterialIn[] | null
  labIns: LaborIn[] | null
  machineIns: MachineIn[] | null
  miscIns: MiscIn[] | null
}

export interface Tree {
  Root: PartMRP
  Children: Tree[] | null
}

// Alias for backward compatibility during migration
export type MrpNode = PartMRP

export type ExecutePlanResponse = Tree[]

export async function executePlan(params: ExecutePlanParams): Promise<ExecutePlanResponse> {
  const { planId, username, userUom } = params;
  const payload = {
    id: planId,
    username,
    userUom,
  };

  try {
    const { data } = await apiClient.post(`/mrp/executePlan/${planId}`, payload);
    return data as ExecutePlanResponse;
  } catch (error) {
    throw new Error(`An unexpected error occurred while executing plan ${planId}`);
  }
}

export async function executeSingleProduct(params: ExecuteSingleProductParams): Promise<ExecutePlanResponse> {
  const { partCode, warehouse, uom, userUom, plannedVolume, username } = params;
  const payload = {
    partCode,
    warehouse,
    uom,
    userUom,
    plannedVolume,
    username,
  };

  try {
    const response = await apiClient.post(`/mrp/executeCPlan`, payload);
    return response.data as ExecutePlanResponse;
  } catch (error) {
    throw new Error(`An unexpected error occurred while executing for part ${partCode}`);
  }
}

export interface PartMRPWithPath extends PartMRP {
  _uniquePath: string; // Unique path identifier for this node in the tree
  _rootPartCode: string; // Part code of the root product this node belongs to
}

export function flattenTree(trees: Tree[]): PartMRPWithPath[] {
  const result: PartMRPWithPath[] = [];
  
  function traverse(tree: Tree, path: string[] = []) {
    const currentPath = [...path, `${tree.Root.partCode}-${tree.Root.warehouse}`];
    const uniquePath = currentPath.join('|');
    const rootPartCode = path.length === 0 ? tree.Root.partCode : path[0].split('-')[0];
    
    result.push({
      ...tree.Root,
      _uniquePath: uniquePath,
      _rootPartCode: rootPartCode,
    });
    
    if (tree.Children) {
      for (const child of tree.Children) {
        traverse(child, currentPath);
      }
    }
  }
  
  for (const tree of trees) {
    traverse(tree);
  }
  
  return result;
}

export function findPartInTrees(trees: Tree[], partCode: string, warehouse?: string): PartMRP | null {
  for (const tree of trees) {
    if (tree.Root.partCode === partCode && (!warehouse || tree.Root.warehouse === warehouse)) {
      return tree.Root;
    }
    if (tree.Children) {
      const found = findPartInTrees(tree.Children, partCode, warehouse);
      if (found) return found;
    }
  }
  return null;
}

// Find the Tree node (including its children) for a given partCode/warehouse
export function findTreeNodeForPart(trees: Tree[], partCode: string, warehouse?: string): Tree | null {
  for (const tree of trees) {
    if (tree.Root.partCode === partCode && (!warehouse || tree.Root.warehouse === warehouse)) {
      return tree;
    }
    if (tree.Children) {
      const found = findTreeNodeForPart(tree.Children, partCode, warehouse);
      if (found) return found;
    }
  }
  return null;
}
