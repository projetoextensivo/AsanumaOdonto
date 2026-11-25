import { useEffect, useRef, useState } from 'react';
import './auth-form.css';
import { ArrowRight, LoaderCircle } from 'lucide-react';
import { Button, Field, PasswordField, ErrorNotice, Modal, UnsavedChangesPrompt, formSnapshot } from '@/shared/view';
import { useAuthViewModel } from '../viewmodel/useAuthViewModel.js';
export function AuthForm({ mode, onMode, onAuthenticated, onTerms, notice }) {
    const { register, busy, error, setError, login, submit } = useAuthViewModel({ mode, onAuthenticated });
    const formRef = useRef(null);
    const initialFormSnapshot = useRef(null);
    const [pendingMode, setPendingMode] = useState(null);
    useEffect(() => { initialFormSnapshot.current = formSnapshot(formRef.current); }, []);
    function changeMode(nextMode) {
        if (formSnapshot(formRef.current) !== initialFormSnapshot.current) {
            setPendingMode(nextMode);
            return;
        }
        setError('');
        onMode(nextMode);
    }
    function discardModeChange() {
        const nextMode = pendingMode;
        setPendingMode(null);
        setError('');
        onMode(nextMode);
    }
    return <><form ref={formRef} onSubmit={submit} className="auth-form">{!register && <ErrorNotice>{notice}</ErrorNotice>}<ErrorNotice>{error}</ErrorNotice>{register && <Field label="Nome completo" name="name" placeholder="Digite seu nome" autoComplete="name" required />}<Field label="E-mail" name="email" type="email" autoComplete="email" placeholder="seuemail@clinica.com" required /><div className={register ? 'form-grid' : ''}><PasswordField placeholder={register ? 'Mín. 8 caracteres' : 'Digite sua senha'} minLength={register ? 8 : undefined} autoComplete={register ? 'new-password' : 'current-password'} />{register && <PasswordField name="confirmPassword" label="Confirmar senha" placeholder="Repita a senha" minLength={8} autoComplete="new-password" />}</div>{register ? <label className="checkbox-row"><input type="checkbox" name="terms" required /><span>Li e aceito os <button type="button" className="text-button" onClick={onTerms}>termos de uso</button></span></label> : <div className="auth-options"><label className="checkbox-row"><input type="checkbox" name="remember" defaultChecked />Lembrar de mim</label><button type="button" className="text-button" onClick={() => setError('Para recuperar o acesso, procure a pessoa responsável pela clínica. O envio de e-mails ainda não está configurado.')}>Esqueci minha senha</button></div>}<Button type="submit" disabled={busy} className="auth-submit" icon={busy ? LoaderCircle : ArrowRight}>{busy ? 'Aguarde...' : register ? 'Criar conta' : 'Entrar'}</Button></form><p className="auth-switch">{register ? 'Já tem uma conta?' : 'Ainda não tem conta?'} <button className="text-button" onClick={() => changeMode(register ? 'login' : 'register')}>{register ? 'Entrar' : 'Cadastre-se'}</button></p>{!register && <div className="demo-access"><span>Conheça a plataforma com dados fictícios</span><Button variant="outline" disabled={busy} onClick={() => login({ email: 'demo@asanumaodonto.com', password: 'Odonto@2026', remember: false })}>Explorar demonstração <ArrowRight size={17} /></Button></div>}{pendingMode && <Modal title="Alterações não salvas" onClose={() => setPendingMode(null)}><UnsavedChangesPrompt onContinue={() => setPendingMode(null)} onLeave={discardModeChange} /></Modal>}</>;
}
