export interface Container {
  id: number;
  order_id: number;
  container_id: string;
  container_name: string;
  voice_port: number;
  query_port: number;
  admin_username: string;
  admin_password: string;
  admin_token: string;
  server_address: string;
  status: 'running' | 'stopped' | 'removed';
  created_at: string;
  expires_at: string;
  updated_at: string;
}
