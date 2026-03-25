export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  total: number;
  page: number;
  pageSize: number;
}

export interface SystemHealth {
  status: 'ok' | 'error';
  docker: boolean;
  database: boolean;
  uptime: number;
}

export interface SystemInfo {
  publicIp: string;
  customDomain: string;
  dbClient: string;
  portRangeStart: number;
  totalContainers: number;
  runningContainers: number;
}
