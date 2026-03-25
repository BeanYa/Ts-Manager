export interface Order {
  id: number;
  order_number: string;
  purchase_channel: 'taobao' | 'xianyu' | 'custom';
  buyer_name: string;
  buyer_contact: string;
  duration_days: number;
  notes: string;
  status: 'pending' | 'delivered' | 'recycled';
  created_at: string;
  updated_at: string;
}

export interface CreateOrderInput {
  order_number: string;
  purchase_channel: 'taobao' | 'xianyu' | 'custom';
  buyer_name: string;
  buyer_contact?: string;
  duration_days: number;
  notes?: string;
}

export interface UpdateOrderInput {
  order_number?: string;
  purchase_channel?: 'taobao' | 'xianyu' | 'custom';
  buyer_name?: string;
  buyer_contact?: string;
  duration_days?: number;
  notes?: string;
}
