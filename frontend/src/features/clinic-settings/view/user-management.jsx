import './user-management.css';
import { LockKeyhole, Pencil, Plus, ShieldCheck, Trash2, Unlock, UserRound } from 'lucide-react';
import { Button, EmptyState, ErrorNotice, Field, FormFooter, Loading, Modal } from '@/shared/view';
import { useUserManagementViewModel } from '../viewmodel/useUserManagementViewModel.js';

function UserForm({ user, busy, error, onSave, onCancel }) {
  return <form className="settings-form" onSubmit={onSave}>
    <ErrorNotice>{error}</ErrorNotice>
    <Field label="Nome completo" name="name" defaultValue={user?.name} minLength="3" maxLength="150" required autoComplete="name"/>
    <Field label="E-mail de acesso" name="email" type="email" defaultValue={user?.email} maxLength="254" required autoComplete="email"/>
    <Field label="Perfil" name="role"><select id="role" name="role" defaultValue={user?.role || 'Secretária'} required><option value="Secretária">Secretária</option><option value="Administrador">Administradora</option></select></Field>
    {user?.status === 'Bloqueado' ? <><Field label="Situação da conta" name="status"><input id="status" value="Bloqueado" disabled/></Field><input type="hidden" name="status" value="Ativo"/></> : <Field label="Situação da conta" name="status"><select id="status" name="status" defaultValue={user?.status || 'Ativo'} required><option value="Ativo">Ativo</option><option value="Inativo">Inativo</option></select></Field>}
    <div className="settings-separator"/>
    <Field label={user ? 'Nova senha (opcional)' : 'Senha inicial'} name="password" type="password" minLength="8" maxLength="72" required={!user} autoComplete="new-password" placeholder={user ? 'Deixe em branco para manter a senha atual' : 'Pelo menos 8 caracteres'} hint={user ? 'Preencha somente para redefinir a senha.' : 'A senha será armazenada com hash seguro.'}/>
    <FormFooter onCancel={onCancel} busy={busy} label={user ? 'Salvar alterações' : 'Criar usuário'}/>
  </form>;
}

export function UserManagement({ currentUser, onNotify }) {
  const vm = useUserManagementViewModel({ onNotify });
  const close = () => { vm.setError(''); vm.setDialog(null); };

  return <>
    <section className="card user-management-card">
      <div className="user-management-heading">
        <div className="settings-heading">
          <span className="settings-icon"><UserRound size={24}/></span>
          <div><h2>Usuários</h2><p>Contas e permissões de acesso à clínica</p></div>
        </div>
        <Button icon={Plus} onClick={() => vm.setDialog({ type: 'edit' })}>Adicionar usuário</Button>
      </div>
      <ErrorNotice>{vm.error}</ErrorNotice>
      {vm.loading ? <Loading label="Carregando usuários..."/> : vm.users.length === 0 ? <EmptyState title="Nenhum usuário encontrado"/> :
        <div className="user-table-wrap"><table className="user-table"><thead><tr><th scope="col">Usuário</th><th scope="col">E-mail</th><th scope="col">Perfil</th><th scope="col">Situação</th><th scope="col"><span className="sr-only">Ações</span></th></tr></thead>
          <tbody>{vm.users.map(user => <tr key={user.id}>
            <td><span className="user-name-cell"><span className="user-avatar"><UserRound size={17}/></span><strong>{user.name}</strong>{user.id === currentUser.id && <span className="user-you-label">Você</span>}</span></td>
            <td>{user.email}</td><td><span className={'user-role '+(user.role === 'Administrador' ? 'admin' : '')}>{user.role === 'Administrador' && <ShieldCheck size={14}/>} {user.role}</span></td>
            <td><span className={'user-status '+user.status.toLowerCase()}>{user.status === 'Bloqueado' && <LockKeyhole size={14}/>} {user.status}</span></td>
            <td><div className="user-actions">{user.id !== currentUser.id && <>
              {user.status === 'Bloqueado' && <button className="user-action unlock" type="button" aria-label={'Desbloquear '+user.name} title="Desbloquear agora" disabled={vm.busy} onClick={() => vm.unblock(user)}><Unlock size={17}/></button>}
              <button className="user-action" type="button" aria-label={'Editar '+user.name} title="Editar usuário" onClick={() => { vm.setError(''); vm.setDialog({ type: 'edit', user }); }}><Pencil size={17}/></button>
              <button className="user-action danger" type="button" aria-label={'Excluir '+user.name} title="Excluir usuário" onClick={() => { vm.setError(''); vm.setDialog({ type: 'delete', user }); }}><Trash2 size={17}/></button>
            </>}</div></td>
          </tr>)}</tbody>
        </table></div>}
    </section>
    {vm.dialog?.type === 'edit' && <Modal title={vm.dialog.user ? 'Editar usuário' : 'Adicionar usuário'} description="Defina os dados e o perfil de acesso à clínica." onClose={close}>
      <UserForm key={vm.dialog.user?.id || 'new'} user={vm.dialog.user} busy={vm.busy} error={vm.error} onSave={vm.save} onCancel={close}/>
    </Modal>}
    {vm.dialog?.type === 'delete' && <Modal title="Excluir usuário" description="A conta perderá acesso ao sistema." onClose={close}>
      <div className="user-delete-content"><p>Deseja excluir <strong>{vm.dialog.user.name}</strong> ({vm.dialog.user.email})? Essa ação não pode ser desfeita.</p><ErrorNotice>{vm.error}</ErrorNotice>
        <div className="form-footer"><Button type="button" variant="secondary" disabled={vm.busy} onClick={close}>Cancelar</Button><Button type="button" variant="danger" disabled={vm.busy} icon={Trash2} onClick={vm.remove}>{vm.busy ? 'Excluindo...' : 'Excluir usuário'}</Button></div>
      </div>
    </Modal>}
  </>;
}
