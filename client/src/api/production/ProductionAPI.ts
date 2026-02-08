import axios, { AxiosInstance } from "axios";
import { IProductionAPI } from "./IProductionAPI";
import { PlantDTO, CreatePlantDTO, HarvestPlantsDTO, AdjustOilIntensityDTO } from "../../models/production/PlantDTO";

export class ProductionAPI implements IProductionAPI {
  private readonly ax: AxiosInstance;

  constructor() {
    this.ax = axios.create({
      baseURL: import.meta.env.VITE_GATEWAY_URL,
      headers: { "Content-Type": "application/json" },
    });
  }

  private h(token: string) {
    return { headers: { Authorization: `Bearer ${token}` } };
  }

  async getAllPlants(token: string, status?: string, commonName?: string): Promise<PlantDTO[]> {
    const params: any = {};
    if (status) params.status = status;
    if (commonName) params.commonName = commonName;
    const res = await this.ax.get("/production/plants", { ...this.h(token), params });
    const plants = res.data?.data || res.data;
    // Convert aromaticOilStrength to number (comes as string/decimal from DB)
    return Array.isArray(plants) ? plants.map(p => ({
      ...p,
      aromaticOilStrength: parseFloat(p.aromaticOilStrength)
    })) : plants;
  }

  async getPlantById(token: string, id: string): Promise<PlantDTO> {
    const res = await this.ax.get(`/production/plants/${id}`, this.h(token));
    const plant = res.data?.data || res.data;
    // Convert aromaticOilStrength to number
    if (plant && typeof plant === 'object') {
      plant.aromaticOilStrength = parseFloat(plant.aromaticOilStrength);
    }
    return plant;
  }

  async createPlant(token: string, data: CreatePlantDTO): Promise<any> {
    const res = await this.ax.post("/production/plants", data, this.h(token));
    return res.data;
  }

  async updatePlant(token: string, id: string, data: CreatePlantDTO): Promise<any> {
    const res = await this.ax.put(`/production/plants/${id}`, data, this.h(token));
    return res.data;
  }

  async deletePlant(token: string, id: string): Promise<any> {
    const res = await this.ax.delete(`/production/plants/${id}`, this.h(token));
    return res.data;
  }

  async harvestPlants(token: string, data: HarvestPlantsDTO): Promise<any> {
    const res = await this.ax.post("/production/plants/harvest", data, this.h(token));
    return res.data;
  }

  async adjustOilStrength(token: string, id: string, data: AdjustOilIntensityDTO): Promise<any> {
    const res = await this.ax.patch(`/production/plants/${id}/oil-strength`, data, this.h(token));
    return res.data;
  }

  async markProcessed(token: string, plantIds: string[]): Promise<any> {
    const res = await this.ax.patch("/production/plants/mark-processed", { plantIds }, this.h(token));
    return res.data;
  }
}
