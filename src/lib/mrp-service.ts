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

export interface MrpNode {
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

export interface ExecutePlanResponse {
  Root: MrpNode
  Children: MrpNode[]
}

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
