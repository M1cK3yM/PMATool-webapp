import { apiClient } from "./api-client";

export interface CustomUomConversion {
  gem_dbkey: number;
  company_code: string;
  part_code?: string;
  unit_from: string;
  unit_to: string;
  uom_conversion_factor: number;
  sys_conv_method: string;
  sys_formula_code: string;
  gem_transaction_id?: string;
  system_date: string; // Dates are typically strings in JSON
  sys_create_user: string;
  sys_modified_date?: string;
  sys_modify_user: string;
}

export interface CustomUomConversionReq {
  gem_dbkey?: number;
  company_code: string;
  part_code?: string;
  unit_from: string;
  unit_to: string;
  uom_conversion_factor: number;
  sys_conv_method: string;
  gem_transaction_id?: string;
}

export async function getConversions(username: string): Promise<CustomUomConversion[]> {
  try {
    const { data } = await apiClient.post("/getConversions", { username });
    return data;
  } catch (error) {
    console.error("Failed to fetch conversions:", error);
    throw new Error("Failed to fetch conversions.");
  }
}

export async function createConversion(username: string, conversionData: CustomUomConversionReq[]): Promise<{ message: string }> {
  try {
    const { data } = await apiClient.post(`/conversion/${username}`, conversionData);
    return data;
  } catch (error) {
    console.error("Failed to create conversion:", error);
    throw new Error("Failed to create conversion.");
  }
}
