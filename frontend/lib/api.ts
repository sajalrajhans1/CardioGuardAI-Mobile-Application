import axios from "axios";
import * as SecureStore from "expo-secure-store";

/*
|--------------------------------------------------------------------------
| Main Backend API (Your Existing Server)
|--------------------------------------------------------------------------
*/

const API = axios.create({
  baseURL: "http://10.12.176.166:5000/api",
  timeout: 10000,
});

API.interceptors.request.use(
  async (config) => {
    const token = await SecureStore.getItemAsync("token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

/*
|--------------------------------------------------------------------------
| ML Model API (Food Analysis)
|--------------------------------------------------------------------------
*/

const ML_API = axios.create({
  baseURL: "http://10.12.176.40:8000",
  timeout: 15000,
});

/*
|--------------------------------------------------------------------------
| Types
|--------------------------------------------------------------------------
*/

export interface FoodAnalysisResponse {
  food_detected: string;
  nutrition: {
    calories: number;
    fat: number;
    saturated_fat: number;
    sugar: number;
    sodium: number;
  };
  heart_health_risk: "LOW" | "MODERATE" | "HIGH";
  reasons: string[];
}

/*
|--------------------------------------------------------------------------
| Analyze Food By Name
|--------------------------------------------------------------------------
*/

export async function analyzeFoodByName(
  food: string
): Promise<FoodAnalysisResponse> {
  try {
    const response = await ML_API.post("/analyze-food", {
      food,
    });

    return response.data;
  } catch (error: any) {
    if (error.response?.data?.error) {
      throw new Error(error.response.data.error);
    }

    throw new Error("Food analysis failed");
  }
}

/*
|--------------------------------------------------------------------------
| Analyze Food By Image
|--------------------------------------------------------------------------
*/

export async function analyzeFoodByImage(
  base64: string
): Promise<FoodAnalysisResponse> {
  try {
    const response = await ML_API.post("/analyze-food", {
      image: base64,
    });

    return response.data;
  } catch (error: any) {
    if (error.response?.data?.error) {
      throw new Error(error.response.data.error);
    }

    throw new Error("Food image analysis failed");
  }
}

/*
|--------------------------------------------------------------------------
| Export Main API
|--------------------------------------------------------------------------
*/

export default API;