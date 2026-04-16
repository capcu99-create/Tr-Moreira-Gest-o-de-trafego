import { supabase, isSupabaseConfigured } from './supabase';
import { Driver, Truck, Trip, TripExpense, Debt } from '../types';

const ensureConfigured = () => {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase não está configurado. Verifique as variáveis de ambiente.');
  }
};

export const dbService = {
  // Drivers
  async getDrivers() {
    ensureConfigured();
    const { data, error } = await supabase.from('drivers').select('*').order('name');
    if (error) throw error;
    return data as Driver[];
  },
  async addDriver(driver: Omit<Driver, 'id'>) {
    ensureConfigured();
    const { data, error } = await supabase.from('drivers').insert(driver).select().single();
    if (error) throw error;
    return data as Driver;
  },
  async updateDriver(id: string, updates: Partial<Driver>) {
    ensureConfigured();
    if (!id || id === 'undefined') throw new Error('ID do motorista inválido');
    const { data, error } = await supabase.from('drivers').update(updates).eq('id', id).select().single();
    if (error) throw error;
    return data as Driver;
  },
  async deleteDriver(id: string) {
    ensureConfigured();
    if (!id || id === 'undefined') throw new Error('ID do motorista inválido');
    const { error } = await supabase.from('drivers').delete().eq('id', id);
    if (error) throw error;
  },

  // Trucks
  async getTrucks() {
    ensureConfigured();
    const { data, error } = await supabase.from('trucks').select('*').order('plate');
    if (error) throw error;
    return data as Truck[];
  },
  async addTruck(truck: Omit<Truck, 'id'>) {
    ensureConfigured();
    const { data, error } = await supabase.from('trucks').insert(truck).select().single();
    if (error) throw error;
    return data as Truck;
  },
  async updateTruck(id: string, updates: Partial<Truck>) {
    ensureConfigured();
    if (!id || id === 'undefined') throw new Error('ID do veículo inválido');
    const { data, error } = await supabase.from('trucks').update(updates).eq('id', id).select().single();
    if (error) throw error;
    return data as Truck;
  },
  async deleteTruck(id: string) {
    ensureConfigured();
    if (!id || id === 'undefined') throw new Error('ID do veículo inválido');
    const { error } = await supabase.from('trucks').delete().eq('id', id);
    if (error) throw error;
  },

  // Trips
  async getTrips(type?: 'ida' | 'volta') {
    ensureConfigured();
    let query = supabase.from('trips').select('*, drivers(name), trucks!trips_truck_id_fkey(plate)');
    if (type) query = query.eq('type', type);
    const { data, error } = await query.order('loading_date', { ascending: false });
    if (error) throw error;
    return data;
  },
  async addTrip(trip: Omit<Trip, 'id'>) {
    ensureConfigured();
    const { data, error } = await supabase.from('trips').insert(trip).select().single();
    if (error) throw error;
    return data;
  },
  async updateTrip(id: string, updates: Partial<Trip>) {
    ensureConfigured();
    if (!id || id === 'undefined') throw new Error('ID do frete inválido');
    const { data, error } = await supabase.from('trips').update(updates).eq('id', id).select().single();
    if (error) throw error;
    return data;
  },
  async deleteTrip(id: string) {
    ensureConfigured();
    if (!id || id === 'undefined') throw new Error('ID do frete inválido');
    const { error } = await supabase.from('trips').delete().eq('id', id);
    if (error) throw error;
  },

  // Debts
  async getDebts() {
    ensureConfigured();
    const { data, error } = await supabase.from('debts').select('*').order('due_date');
    if (error) throw error;
    return data;
  },
  async addDebt(debt: any) {
    ensureConfigured();
    const { data, error } = await supabase.from('debts').insert(debt).select().single();
    if (error) throw error;
    return data;
  },
  async updateDebt(id: string, updates: any) {
    ensureConfigured();
    const { data, error } = await supabase.from('debts').update(updates).eq('id', id).select().single();
    if (error) throw error;
    return data;
  },
  async deleteDebt(id: string) {
    ensureConfigured();
    const { error } = await supabase.from('debts').delete().eq('id', id);
    if (error) throw error;
  },

  // Trip Expenses
  async getTripExpenses(tripId: string) {
    ensureConfigured();
    const { data, error } = await supabase.from('trip_expenses').select('*').eq('trip_id', tripId).order('date');
    if (error) throw error;
    return data as TripExpense[];
  },
  async addTripExpense(expense: Omit<TripExpense, 'id'>) {
    ensureConfigured();
    const { data, error } = await supabase.from('trip_expenses').insert(expense).select().single();
    if (error) throw error;
    return data as TripExpense;
  },
  async deleteTripExpense(id: string) {
    ensureConfigured();
    const { error } = await supabase.from('trip_expenses').delete().eq('id', id);
    if (error) throw error;
  }
};
