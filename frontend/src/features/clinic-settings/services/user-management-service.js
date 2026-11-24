import { api } from '@/shared/services/api';

export async function listUsers() {
  return (await api.get('/users')).data;
}

export async function createUser(user) {
  return (await api.post('/users', user)).data;
}

export async function updateUser(id, user) {
  return (await api.put(`/users/${id}`, user)).data;
}

export async function unlockUser(id) {
  return (await api.post(`/users/${id}/unlock`)).data;
}

export function deleteUser(id) {
  return api.delete(`/users/${id}`);
}
