// src/services/locationData.ts

export const countries: string[] = ["USA", "India"];

export const states: { [key: string]: string[] } = {
  USA: ["California", "Texas", "Florida"],
  India: ["Maharashtra", "Karnataka", "Tamil Nadu"],
};

export const districts: { [key: string]: string[] } = {
  California: ["Los Angeles", "San Francisco", "San Diego"],
  Texas: ["Harris", "Dallas", "Tarrant"],
  Florida: ["Miami-Dade", "Broward", "Palm Beach"],
  Maharashtra: ["Mumbai", "Pune", "Nagpur"],
  Karnataka: ["Bengaluru Urban", "Mysuru", "Mangaluru"],
  "Tamil Nadu": ["Chennai", "Coimbatore", "Madurai"],
};