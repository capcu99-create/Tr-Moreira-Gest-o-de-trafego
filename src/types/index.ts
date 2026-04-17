export type Driver = {
  id: string;
  name: string;
  phone?: string;
  status: 'active' | 'inactive';
  work_status?: 'home' | 'road';
  truck_id?: string; // Fixed Cavalo
  current_trailer_id?: string; // Dynamic Carreta
  current_invoice?: string; // Shared NF for the trip
  avatar_url?: string;
  cnh_url?: string; // URL for CNH document
};

export type Truck = {
  id: string;
  plate: string;
  type: 'cavalo' | 'carreta';
  model?: string;
  trailer_category?: 'frigorifica' | 'normal';
  location_status?: 'yard' | 'road';
  maintenance_status?: 'ok' | 'needed';
  doc_url?: string; // URL for truck document
};

export type Trip = {
  id: string;
  driver_id: string;
  truck_id: string; // Cavalo
  trailer_id?: string | null; // Carreta
  origin: string;
  destination: string;
  cte: string;
  loading_date: string;
  cte_date?: string | null;
  delivery_date?: string | null;
  km_initial?: number;
  km_final?: number;
  freight_value: number;
  advance_value: number;
  received_date?: string;
  status: 'pending' | 'completed' | 'paid';
  type: 'ida' | 'volta';
  drivers?: { name: string };
  trucks?: { plate: string; model?: string };
};

export type TripExpense = {
  id: string;
  trip_id: string;
  type: 'fuel' | 'diverse' | 'advance';
  date: string;
  description: string;
  value: number;
  liters?: number;
};

export type Debt = {
  id: string;
  person_name: string;
  total_value: number;
  installments_count: number;
  installments_paid: number;
  due_date: string;
  type: 'pagar' | 'receber';
  status: 'pending' | 'paid';
};
