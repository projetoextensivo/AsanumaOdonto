import './settings-forms.css';
import { Save, ShieldCheck } from 'lucide-react';
import { Button, Field, ErrorNotice } from '@/shared/view';
import { useAccountViewModel, useClinicSettingsViewModel } from '../viewmodel/useSettingsViewModels.js';
export function ClinicSettingsForm({ settings, onUpdated, onNotify }) {
    const { busy, error, submit } = useClinicSettingsViewModel({ onUpdated, onNotify });
    return <form className="settings-form" onSubmit={submit}>
        <ErrorNotice>{error}</ErrorNotice>
        <Field label="Nome da clínica" name="clinicName" defaultValue={settings.clinicName} required />
        <div className="form-grid">
            <Field label="Telefone" name="phone" type="tel" inputMode="tel" maxLength="20" autoComplete="tel" defaultValue={settings.phone} placeholder="(11) 99999-9999" required />
            <Field label="E-mail da clínica" name="email" type="email" maxLength="254" autoComplete="email" defaultValue={settings.email} placeholder="contato@clinica.com.br" required />
        </div>
        <Field label="Endereço" name="address" autoComplete="street-address" maxLength="250" defaultValue={settings.address} placeholder="Rua, número, bairro, cidade e CEP" required />
        <div className="form-grid">
            <Field label="Abertura" name="openTime" type="time" defaultValue={settings.openTime} required />
            <Field label="Encerramento" name="closeTime" type="time" defaultValue={settings.closeTime} required />
        </div>
        <p className="field-help">Atendimento de segunda a sábado. Os agendamentos respeitam este expediente.</p>
        <Button icon={Save} disabled={busy}>{busy ? 'Salvando...' : 'Salvar configurações'}</Button>
    </form>;
}

export function AccountForm({ user, onUpdated, onNotify }) {
    const { busy, error, submit, passwordChangeRequested, onPasswordChange } = useAccountViewModel({ onUpdated, onNotify });
    return <form className="settings-form" onSubmit={submit}>
        <ErrorNotice>{error}</ErrorNotice>
        <Field label="Seu nome" name="name" defaultValue={user.name} required />
        <Field label="E-mail de acesso" name="email" value={user.email} disabled />
        <Field label="Cargo" name="role" value={user.role} disabled />
        <div className="settings-separator" />
        <h3>Alterar senha</h3>
        <p className="field-help">Para alterar a senha, preencha a senha atual e a nova senha. Os dois campos serão obrigatórios.</p>
        <Field label="Senha atual" name="currentPassword" type="password" autoComplete="current-password" required={passwordChangeRequested} onChange={onPasswordChange} />
        <Field label="Nova senha" name="newPassword" type="password" minLength="8" maxLength="72" autoComplete="new-password" placeholder="Pelo menos 8 caracteres" required={passwordChangeRequested} onChange={onPasswordChange} />
        <Button icon={ShieldCheck} disabled={busy}>{busy ? 'Salvando...' : 'Salvar minha conta'}</Button>
    </form>;
}
