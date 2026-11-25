import './components.css';
import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { X, Search, ArrowRight, CalendarDays, ClipboardList, ChartNoAxesCombined, Inbox, LoaderCircle, AlertCircle, Eye, EyeOff } from 'lucide-react';
const ModalCloseContext = createContext(null);

export function formSnapshot(form) {
    return JSON.stringify(Array.from(new FormData(form).entries()));
}
export function ToothLogo({ size = 48 }) { return <svg width={size} height={size} viewBox="0 0 64 64" fill="none" role="img" aria-label="Logotipo Asanuma Odonto"><path d="M18 15c-8 2-7 14-3 22 3 6 2 15 7 15s4-17 10-17 5 17 10 17 4-9 7-15c4-8 5-20-3-22-7-2-9 4-14 4s-7-6-14-4Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" /><path d="m49 8 2 5 5 2-5 2-2 5-2-5-5-2 5-2ZM12 28l1.6 4.4L18 34l-4.4 1.6L12 40l-1.6-4.4L6 34l4.4-1.6Z" fill="var(--logo-spark, #a9cfff)" stroke="currentColor" strokeWidth="1.5" /></svg>; }
export function Button({ children, variant = 'primary', className = '', icon: Icon, ...props }) { return <button className={'button ' + variant + ' ' + className} {...props}>{Icon && <Icon size={19} aria-hidden="true" />}{children}</button>; }
export function IconButton({ icon: Icon, label, ...props }) { return <button type="button" className="icon-button" aria-label={label} title={label} {...props}><Icon size={19} aria-hidden="true" /></button>; }
export function SearchField({ value, onChange, placeholder = 'Buscar...', label = 'Buscar' }) { return <div className="search-field"><Search size={19} aria-hidden="true" /><input type="search" aria-label={label} placeholder={placeholder} value={value} onChange={event => onChange(event.target.value)} /></div>; }
export function Field({ label, name, children, required = false, hint, ...props }) {
    const helpId = hint ? name + '-hint' : undefined;
    return <div className="field"><label htmlFor={name}>{label}</label>{children || <input id={name} name={name} required={required} aria-describedby={helpId} {...props} />} {hint && <small id={helpId}>{hint}</small>}</div>;
}
export function PasswordField({ name = 'password', label = 'Senha', autoComplete = 'current-password', ...props }) {
    const [visible, setVisible] = useState(false);
    return <div className="field"><label htmlFor={name}>{label}</label><div className="password-field"><input id={name} name={name} type={visible ? 'text' : 'password'} autoComplete={autoComplete} required {...props} /><IconButton icon={visible ? EyeOff : Eye} label={visible ? 'Ocultar senha' : 'Mostrar senha'} onClick={() => setVisible(!visible)} /></div></div>;
}
export function Badge({ children, tone }) { const text = String(children); const semantic = tone || (text === 'Concluída' || text === 'Concluído' || text === 'Ativo' ? 'success' : text === 'Em atendimento' || text === 'Em tratamento' ? 'warning' : text === 'Cancelada' || text === 'Inativo' ? 'neutral' : text === 'Retorno' ? 'purple' : 'blue'); return <span className={'badge ' + semantic}><span className="status-dot" />{children}</span>; }
export function EmptyState({ title = 'Nenhum registro encontrado', description, action }) { return <div className="empty-state"><span className="empty-icon"><Inbox size={29} /></span><h3>{title}</h3>{description && <p>{description}</p>}{action}</div>; }
export function ErrorNotice({ children }) { return children ? <div role="alert" className="error-notice"><AlertCircle size={19} /><span>{children}</span></div> : null; }
export function Loading({ label = 'Carregando sua clínica...' }) { return <div className="loading-state" role="status"><LoaderCircle size={28} className="spin" /><span>{label}</span></div>; }
export function useModalClose({ confirm = true } = {}) {
    const requestClose = useContext(ModalCloseContext);
    if (!confirm || !requestClose) return action => action?.();
    return requestClose;
}
export function UnsavedChangesPrompt({ onContinue, onLeave }) {
    return <div className="unsaved-changes" role="alertdialog" aria-labelledby="unsaved-changes-title" aria-describedby="unsaved-changes-description">
        <h3 id="unsaved-changes-title">Alterações não salvas</h3>
        <p id="unsaved-changes-description">Se sair agora, as alterações feitas neste formulário serão perdidas.</p>
        <div className="form-footer">
            <Button type="button" variant="secondary" autoFocus onClick={onContinue}>Continuar editando</Button>
            <Button type="button" variant="danger" onClick={onLeave}>Sair mesmo assim</Button>
        </div>
    </div>;
}
export function Modal({ title, description, children, onClose, wide = false }) {
    const ref = useRef(null);
    const closeRef = useRef(onClose);
    const formRef = useRef(null);
    const initialFormSnapshot = useRef(null);
    const dirtyRef = useRef(false);
    const pendingActionRef = useRef(null);
    const previousFocusRef = useRef(null);
    const requestCloseRef = useRef(null);
    const [confirmDiscard, setConfirmDiscard] = useState(false);
    closeRef.current = onClose;

    const requestClose = useCallback(action => {
        if (confirmDiscard) {
            continueEditing();
            return;
        }
        const nextAction = action || closeRef.current;
        if (dirtyRef.current) {
            pendingActionRef.current = nextAction;
            previousFocusRef.current = document.activeElement;
            setConfirmDiscard(true);
            return;
        }
        nextAction?.();
    }, [confirmDiscard]);
    requestCloseRef.current = requestClose;

    useEffect(() => {
        const element = ref.current;
        const prior = document.activeElement;
        formRef.current = element.querySelector('form');
        initialFormSnapshot.current = formRef.current ? formSnapshot(formRef.current) : null;
        element.showModal();
        const onCancel = event => {
            event.preventDefault();
            requestCloseRef.current();
        };
        element.addEventListener('cancel', onCancel);
        return () => {
            element.removeEventListener('cancel', onCancel);
            element.close();
            prior?.focus?.();
        };
    }, []);

    function updateFormDirty(event) {
        const form = event.target.form;
        if (form === formRef.current) {
            dirtyRef.current = formSnapshot(form) !== initialFormSnapshot.current;
        }
    }

    function continueEditing() {
        pendingActionRef.current = null;
        setConfirmDiscard(false);
        requestAnimationFrame(() => previousFocusRef.current?.focus?.());
    }

    function discardChanges() {
        const action = pendingActionRef.current || closeRef.current;
        pendingActionRef.current = null;
        dirtyRef.current = false;
        setConfirmDiscard(false);
        action?.();
    }

    return <dialog
        className={'modal ' + (wide ? 'wide' : '') + (confirmDiscard ? ' unsaved-changes-modal' : '')}
        ref={ref}
        aria-labelledby="dialog-title"
        onInputCapture={updateFormDirty}
        onChangeCapture={updateFormDirty}
        onClick={event => {
            if (event.target === event.currentTarget) {
                const rect = event.currentTarget.getBoundingClientRect();
                if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) requestClose();
            }
        }}
    >
        <div className="modal-heading">
            <div><h2 id="dialog-title">{title}</h2>{description && <p>{description}</p>}</div>
            <IconButton icon={X} label="Fechar janela" onClick={() => requestClose()} />
        </div>
        <ModalCloseContext.Provider value={requestClose}>
            <div hidden={confirmDiscard}>{children}</div>
            {confirmDiscard && <UnsavedChangesPrompt onContinue={continueEditing} onLeave={discardChanges} />}
        </ModalCloseContext.Provider>
    </dialog>;
}
export function FormFooter({ onCancel, busy, label = 'Salvar', extra }) { const requestClose = useModalClose(); return <div className="form-footer">{extra}<Button type="button" variant="secondary" onClick={() => requestClose(onCancel)}>Cancelar</Button><Button type="submit" disabled={busy} icon={busy ? LoaderCircle : undefined}>{busy ? 'Salvando...' : label}</Button></div>; }
export function SectionHeading({ title, description, action, eyebrow }) { return <header className="page-heading"><div>{eyebrow && <div className="eyebrow">{eyebrow}</div>}<h1>{title}</h1><div className="heading-rule" />{description && <p>{description}</p>}</div>{action && <div className="heading-actions">{action}</div>}</header>; }
export function Benefits() { return <ul className="auth-benefits">{[[CalendarDays, 'Agenda de consultas organizada'], [ClipboardList, 'Prontuários e odontograma digitais'], [ChartNoAxesCombined, 'Indicadores da clínica em tempo real']].map(([Icon, text]) => <li key={text}><span><Icon size={20} /></span>{text}</li>)}</ul>; }
export { ArrowRight };
