import { useCallback, useEffect, useState } from 'react';
import { errorMessage } from '@/shared/services/api';
import { checkClinicSession, deleteClinicEntity, loadClinic, logoutClinicUser, saveClinicEntity } from '@/app/services/clinic-service';
import { isAdmin } from '@/shared/model';

export function useAppViewModel() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [authNotice, setAuthNotice] = useState('');
  const [path, setPath] = useState(window.location.hash.slice(1) || 'agenda');
  const [modal, setModal] = useState(null);
  const [toast, setToast] = useState('');

  const refresh = useCallback(async () => {
    try {
      const result = await loadClinic();
      setData(result);
      setLoadError('');
      return result;
    } catch (cause) {
      if ([401, 403, 423].includes(cause.response?.status)) {
        setData(null);
        setModal(null);
        setLoadError('');
        setAuthNotice(cause.response.status === 401 ? '' : cause.response?.data?.message || 'Sua sessão expirou. Entre novamente para continuar.');
        window.location.hash = 'login';
        return null;
      }
      setLoadError(errorMessage(cause));
      throw cause;
    }
  }, []);

  useEffect(() => {
    if (!data?.user?.id) return undefined;
    let checking = false;
    const checkSession = async () => {
      if (checking) return;
      checking = true;
      try {
        await checkClinicSession();
      } catch (cause) {
        const status = cause.response?.status;
        if ([401, 403, 423].includes(status)) {
          setData(null);
          setModal(null);
          setLoadError('');
          setAuthNotice(status === 401 ? 'Sua sessão expirou. Entre novamente para continuar.' : cause.response?.data?.message || 'Sua sessão foi encerrada. Entre novamente para continuar.');
          window.location.hash = 'login';
        }
      } finally {
        checking = false;
      }
    };
    const timer = setInterval(checkSession, 10000);
    const onVisibilityChange = () => { if (document.visibilityState === 'visible') checkSession(); };
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [data?.user?.id]);

  useEffect(() => {
    refresh().catch(() => {}).finally(() => setLoading(false));
    const listener = () => setPath(window.location.hash.slice(1) || 'agenda');
    window.addEventListener('hashchange', listener);
    return () => window.removeEventListener('hashchange', listener);
  }, [refresh]);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(() => setToast(''), 5000);
    return () => clearTimeout(timer);
  }, [toast]);

  const navigate = route => { window.location.hash = route; };
  const requestedRoute = path.split('/')[0];
  const route = data && !isAdmin(data.user) && ['dashboard', 'procedimentos', 'prontuarios'].includes(requestedRoute)
    ? 'agenda'
    : requestedRoute;

  async function save(kind, item) {
    await saveClinicEntity(kind, item);
    await refresh();
    setToast(item.id ? 'Alterações salvas com sucesso.' : kind === 'appointments' ? 'Consulta agendada com sucesso.' : 'Registro salvo com sucesso.');
  }

  async function authenticated(user) {
    setLoading(true);
    setAuthNotice('');
    try {
      const session = await refresh();
      if (session) navigate(isAdmin(session.user || user) ? 'dashboard' : 'agenda');
    } catch {} finally { setLoading(false); }
  }

  async function confirmAction(currentModal) {
    if (currentModal.type === 'logout') {
      await logoutClinicUser();
      setData(null);
      setAuthNotice('');
      navigate('login');
      return;
    }
    await deleteClinicEntity(currentModal.kind, currentModal.item.id);
    await refresh();
    setToast('Registro excluído.');
  }

  return {
    data, setData, loading, setLoading, loadError, authNotice, path, modal, setModal, toast, setToast,
    refresh, navigate, save, authenticated, route, confirmAction,
  };
}
