# Frontend — Asanuma Odonto

Interface web para as rotinas da clínica odontológica. O frontend usa React e Vite e consome a API Spring Boot descrita no [README do backend](../backend/README.md). Para visão geral do produto, consulte o [README principal](../README.md).

## Tecnologias e requisitos

- Node.js 22.13 ou superior
- npm
- React 19
- Vite 7
- Axios

## Executar em desenvolvimento

Inicie primeiro a API Spring Boot na pasta `backend/`. Em seguida, na pasta `frontend/`, instale as dependências e inicie o Vite:

```bash
npm ci
npm run dev
```

Abra `http://127.0.0.1:5173`. O Vite encaminha `/api` para `http://127.0.0.1:8080`, conforme `vite.config.js`. Use o mesmo hostname (por exemplo, `127.0.0.1`) no navegador e nas URLs da aplicação para manter a sessão por cookie na mesma origem.

`VITE_HOST` altera o endereço de escuta do Vite; o padrão é `127.0.0.1`. Para usar outra origem de API durante o desenvolvimento, configure `API_PROXY_TARGET`. `VITE_API_BASE_URL` muda a URL base usada pelo cliente HTTP; para desenvolvimento local, prefira `/api` e o proxy do Vite.

## Acesso por outros dispositivos da rede local

Inicie a API Spring Boot normalmente. Depois, na pasta `frontend/`, inicie o Vite escutando na interface de rede:

```bash
VITE_HOST=0.0.0.0 npm run dev
```

No PowerShell:

```powershell
$env:VITE_HOST = "0.0.0.0"
npm run dev
```

Descubra o IPv4 da máquina que executa o Vite (`hostname -I` no Linux ou `ipconfig` no Windows) e, no outro dispositivo conectado à mesma rede, abra `http://IP-DA-MAQUINA:5173`. O frontend continua chamando `/api` na mesma origem; o Vite encaminha as chamadas ao backend local em `127.0.0.1:8080`, portanto não é necessário expor a porta 8080 nem alterar `ALLOWED_ORIGINS` nesse modo.

Se não conectar, permita a entrada TCP na porta 5173 no firewall da máquina anfitriã, restrita ao perfil de rede privada e à rede local. Verifique também se os dispositivos estão na mesma rede e se o roteador não isola clientes (por exemplo, rede de convidados). O endereço `0.0.0.0` é apenas o endereço de escuta; não o use no navegador.

Esse fluxo usa o servidor de desenvolvimento do Vite e é indicado para desenvolvimento ou demonstração em uma rede confiável. Para uso contínuo ou com dados reais, publique o build em um servidor configurado para HTTPS e encaminhe `/api` ao backend.

## Funcionalidades por perfil

| Perfil | Acesso principal |
| --- | --- |
| Administradora | Dashboard, agenda, pacientes, procedimentos, prontuários, configurações e usuários. |
| Secretária | Agenda, cadastro e edição de pacientes, agendamento e conta própria. |

Em **Configurações → Usuários**, a administradora pode criar, editar, ativar ou inativar contas, redefinir senhas e excluir usuários. A lista exibe contas **Ativas**, **Inativas** ou **Bloqueadas** e permite desbloquear uma conta imediatamente. Três senhas incorretas bloqueiam o login por cinco minutos. A última administradora ativa não pode ser removida, desativada ou rebaixada.

Enquanto o sistema está aberto, o frontend consulta a sessão a cada 10 segundos e quando a aba volta a ficar visível. Se a API indicar conta inativa ou bloqueada, a sessão local é encerrada e a interface retorna ao login.

Na agenda, as consultas podem ser visualizadas por dia, semana ou mês e reagendadas por edição ou arraste. A API valida expediente, dentista, duração e sobreposição antes de salvar.

## Organização do código

O frontend segue MVVM por funcionalidade em `src/features/<funcionalidade>`:

- `model/`: dados e regras específicas do domínio.
- `view/`: páginas, formulários, componentes React e estilos.
- `viewmodel/`: hooks para estado, validações e ações da interface.
- `services/`: chamadas HTTP e integrações da funcionalidade.

A composição e a sessão da aplicação ficam em `src/app`. Código reutilizável fica em `src/shared`; componentes compostos, como o shell da aplicação e o odontograma, ficam em `src/widgets`.

## Build e publicação

Para gerar os arquivos de produção:

```bash
npm run build
```

O Vite grava a saída em `frontend/dist/`. O repositório não inclui uma configuração de hospedagem de produção; publique `dist/` em um servidor estático e encaminhe `/api` à API Spring Boot. Sirva interface e API na mesma origem para simplificar o uso de cookies de sessão, ou configure CORS e cookies adequadamente para a arquitetura escolhida.

## Scripts declarados

`npm run dev` e `npm run build` são os fluxos mantidos para desenvolvimento e build. O `package.json` também declara scripts de servidor, demonstração, testes e preparação de rede que apontam para diretórios ausentes neste checkout (`server/`, `scripts/` e `tests/`); esses fluxos não estão disponíveis até que seus arquivos sejam incluídos.
