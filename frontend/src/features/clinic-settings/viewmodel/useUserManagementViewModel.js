import { useCallback, useEffect, useState } from 'react';
import { errorMessage } from '@/shared/services/api';
import { createUser, deleteUser, listUsers, unlockUser, updateUser } from '../services/user-management-service.js';

export function useUserManagementViewModel({ onNotify }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [dialog, setDialog] = useState(null);

  const refresh = useCallback(async ({ clearError = true } = {}) => {
    if (clearError) setError('');
    try {
      setUsers(await listUsers());
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    const timer = setInterval(() => refresh({ clearError: false }), 15000);
    return () => clearInterval(timer);
  }, [refresh]);

  async function save(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    const values = Object.fromEntries(new FormData(event.currentTarget));
    try {
      if (dialog.user) {
        await updateUser(dialog.user.id, values);
        onNotify('Usuário atualizado.');
      } else {
        await createUser(values);
        onNotify('Usuário criado.');
      }
      setDialog(null);
      await refresh();
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    setBusy(true);
    setError('');
    try {
      await deleteUser(dialog.user.id);
      setDialog(null);
      onNotify('Usuário excluído.');
      await refresh();
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setBusy(false);
    }
  }

  async function unblock(user) {
    setBusy(true);
    setError('');
    try {
      await unlockUser(user.id);
      onNotify(`Acesso de ${user.name} desbloqueado.`);
      await refresh();
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setBusy(false);
    }
  }

  return { users, loading, busy, error, setError, dialog, setDialog, save, remove, unblock };
}
