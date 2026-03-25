import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/client';

export function useContainers() {
  return useQuery({
    queryKey: ['containers'],
    queryFn: async () => {
      const res = await api.getContainers();
      return res.data;
    },
  });
}

export function useContainer(id: number) {
  return useQuery({
    queryKey: ['containers', id],
    queryFn: async () => {
      const res = await api.getContainer(id);
      return res.data;
    },
    enabled: !!id,
  });
}

export function useResetContainer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.resetContainer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['containers'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
    },
  });
}

export function useRecycleContainer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.recycleContainer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['containers'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
    },
  });
}

export function useRefreshContainer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.refreshContainer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['containers'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
    },
  });
}
