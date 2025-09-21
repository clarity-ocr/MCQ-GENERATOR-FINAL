// in src/services/locationData.ts

export const countries: string[] = ["India", "United States"];

export const states: { [key:string]: string[] } = {
  "India": ["Andhra Pradesh", "Tamil Nadu", "Maharashtra", "Karnataka"],
  "United States": ["California", "New York", "Texas", "Florida"],
};

export const districts: { [key:string]: string[] } = {
  // India
  "Andhra Pradesh": ["Visakhapatnam", "Vijayawada", "Guntur", "Nellore"],
  "Tamil Nadu": ["Chennai", "Coimbatore", "Madurai", "Tiruchirappalli"],
  "Maharashtra": ["Mumbai", "Pune", "Nagpur", "Thane"],
  "Karnataka": ["Bengaluru", "Mysuru", "Mangaluru", "Hubballi"],
  // United States
  "California": ["Los Angeles County", "San Diego County", "Orange County", "Riverside County"],
  "New York": ["Kings County (Brooklyn)", "Queens County", "New York County (Manhattan)", "Suffolk County"],
  "Texas": ["Harris County (Houston)", "Dallas County", "Tarrant County", "Bexar County"],
  "Florida": ["Miami-Dade County", "Broward County", "Palm Beach County", "Hillsborough County"],
};