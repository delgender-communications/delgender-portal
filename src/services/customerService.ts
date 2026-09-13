import { api } from "./api";

export interface Customer {
  id: number;
  fullName: string;
  jobTitle?: string | null;
  companyName: string;
  email: string;
  phoneNumber: string;
  industry: string;
  idNumber?: string | null;
}

export async function searchCustomers(search = ""): Promise<Customer[]> {
  const { data } = await api.get<Customer[]>("/api/v1/customers", {
    params: { search: search || undefined },
  });
  return data;
}
