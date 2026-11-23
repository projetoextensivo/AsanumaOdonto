# Asanuma Odonto

Sistema web acadêmico para apoiar a gestão de uma clínica odontológica. O projeto reúne uma interface React, uma API REST em Spring Boot e materiais de modelagem do banco de dados.

## Visão geral

O Asanuma Odonto centraliza rotinas administrativas e informações de atendimento odontológico. O sistema atende a uma clínica particular e não inclui convênios nem processamento de pagamentos.

### Funcionalidades

- Autenticação por sessão e cadastro público de contas de secretária.
- Bloqueio temporário de cinco minutos após três tentativas de login com senha incorreta; a administradora pode desbloquear a conta antes.
- Administração de usuários: criação, edição de perfil, redefinição de senha e exclusão de contas.
- Cadastro e manutenção de pacientes.
- Agenda com visualizações mensal, semanal e diária, além de reagendamento por edição ou arraste.
- Validação de expediente, dentista, duração e conflitos de horário pela API.
- Cadastro de procedimentos e prontuários, com histórico por paciente e odontograma.
- Configurações da clínica e indicadores no dashboard.
- Ações de contato com pacientes relacionadas ao atendimento.

### Perfis de acesso

| Perfil | Acesso |
| --- | --- |
| Administradora | Dashboard, agenda, pacientes, procedimentos, prontuários, configurações e dados financeiros das consultas. |
| Secretária | Agenda, cadastro e edição de pacientes, agendamentos e dados da própria conta. Não acessa procedimentos, prontuários, configurações administrativas nem exclusão de pacientes. |

As permissões são aplicadas pela API. O cadastro público permite criar apenas contas de secretária.

## Tecnologias

| Camada | Tecnologias |
| --- | --- |
| Frontend | React 19, JavaScript, Vite 7, Axios |
| Backend | Java 21, Spring Boot 3.5, Maven, JDBC |
| Persistência padrão | H2 em arquivo; banco e credenciais configuráveis por ambiente |
| Testes do backend | JUnit, Spring Boot Test e MockMvc |

## Estrutura do repositório

```text
AsanumaOdonto
│
├── backend/
│   ├── src/main/java/br/com/asanumaodonto/
│   │   ├── api/          # Rotas REST e tratamento de erros
│   │   ├── config/       # CORS, validação de origem e carga inicial
│   │   ├── repository/   # Persistência JDBC
│   │   └── service/      # Autenticação, autorização e regras de negócio
│   ├── src/main/resources/ # Configuração, schema H2 e dados de demonstração
│   └── src/test/         # Testes de integração da API
├── database/             # Modelagens e scripts SQL acadêmicos
└── frontend/
    └── src/
        ├── app/          # Composição, navegação e estado da aplicação
        ├── features/     # Funcionalidades organizadas em MVVM
        ├── shared/       # Serviços, componentes e utilitários comuns
        └── widgets/      # Componentes compostos, como agenda e odontograma
```

A estrutura em `database/` documenta modelagens acadêmicas; o backend atual usa o schema H2 de `backend/src/main/resources/schema.sql`. Não há migração automática dos dados de demonstração antigos para o H2.

## Documentação por componente

- [Backend](backend/README.md): configuração da API, perfis, rotas e persistência.
- [Frontend](frontend/README.md): arquitetura da interface, desenvolvimento e build.
- [Banco de dados](database/README.md): materiais de modelagem e relação com o schema atual.

## Requisitos

- JDK 21
- Maven 3.9 ou superior
- Node.js 22.13 ou superior e npm

## Executar localmente

### 1. Inicie a API

Na raiz do repositório, configure as credenciais iniciais da administradora e inicie o Spring Boot:

```bash
cd backend
export ADMIN_EMAIL="admin@exemplo.com"
export ADMIN_PASSWORD="defina-uma-senha-segura"
mvn spring-boot:run
```

No PowerShell, use `$env:ADMIN_EMAIL="admin@exemplo.com"` e `$env:ADMIN_PASSWORD="defina-uma-senha-segura"` antes de executar o Maven. A senha deve ter entre 8 e 72 caracteres. O bootstrap cria a administradora na primeira inicialização; não existe cadastro público de administradora.

A API fica disponível em `http://127.0.0.1:8080/api`. O endpoint de saúde é `GET /api/health`.

### 2. Inicie a interface

Em outro terminal, a partir da raiz:

```bash
cd frontend
npm install
npm run dev
```

Abra `http://127.0.0.1:5173`. Durante o desenvolvimento, o Vite encaminha as chamadas `/api` para `http://127.0.0.1:8080`. Use o mesmo hostname no navegador e nos endereços da aplicação para que o cookie de sessão funcione como esperado.

Para acessar o frontend de outros dispositivos na mesma rede, consulte [Acesso por outros dispositivos da rede local](frontend/README.md#acesso-por-outros-dispositivos-da-rede-local).

Em uma instalação vazia, entre com a administradora e cadastre os procedimentos antes de criar agendamentos.

## Ambiente de demonstração

Para carregar dados fictícios no Spring, configure `DEMO_MODE=true` antes de iniciar a API. Esse modo também disponibiliza a conta de demonstração `demo@asanumaodonto.com` com senha `Odonto@2026`. Use essas credenciais apenas em ambiente local de demonstração; não habilite esse modo em uma instalação com dados reais.

## Configuração

As variáveis abaixo são lidas pelo backend ou frontend conforme indicado:

| Variável | Componente | Padrão / finalidade |
| --- | --- | --- |
| `PORT` | Backend | Porta HTTP; padrão `8080`. |
| `ADMIN_EMAIL` | Backend | E-mail da administradora inicial. |
| `ADMIN_PASSWORD` | Backend | Senha da administradora inicial; 8–72 caracteres. |
| `DEMO_MODE` | Backend | `false`; com `true`, carrega dados e conta fictícios. |
| `DB_URL` | Backend | URL JDBC; padrão H2 em `./data/asanumaodonto.mv.db`. |
| `DB_USER`, `DB_PASSWORD` | Backend | Credenciais JDBC; padrão H2 local (`sa`, senha vazia). |
| `ALLOWED_ORIGINS` | Backend | Origens permitidas para CORS; por padrão, origens locais do Vite. |
| `COOKIE_SECURE` | Backend | `false` localmente; habilite `true` quando a aplicação usar HTTPS. |
| `VITE_HOST` | Frontend/Vite | `127.0.0.1`; use `0.0.0.0` para aceitar conexões dos dispositivos da rede local. |
| `API_PROXY_TARGET` | Frontend/Vite | Destino alternativo do proxy `/api`; padrão `http://127.0.0.1:8080`. |
| `VITE_API_BASE_URL` | Frontend | URL base da API; prefira `/api` com proxy para manter a mesma origem. |

O banco H2 é criado em relação ao diretório de trabalho do processo Java. Para cópia de segurança, pare a API antes de copiar os arquivos do banco.

## API e segurança

A API usa sessões HTTP com cookies `HttpOnly` e `SameSite=Strict`; senhas de usuários são armazenadas com BCrypt. Rotas de negócio exigem autenticação e verificam permissões no servidor. As respostas da secretária omitem dados financeiros e prontuários que não são necessários para o seu trabalho.

Após três senhas incorretas, a conta fica bloqueada por cinco minutos. A lista administrativa de usuários mostra as situações **Ativo**, **Inativo** ou **Bloqueado**; uma administradora pode desbloquear uma conta bloqueada imediatamente. Contas inativas não podem iniciar sessão.

Quando uma conta é desativada, a API invalida a sessão na próxima requisição autenticada. Enquanto a aplicação está aberta, o navegador consulta a sessão a cada 10 segundos e redireciona para o login assim que detectar a desativação (ou bloqueio).

Principais grupos de rotas sob `/api`:

- `/auth/*`: login, cadastro permitido, consulta da sessão e logout.
- `/bootstrap`: dados iniciais da interface filtrados pelo perfil.
- `/account` e `/settings`: conta autenticada e configurações administrativas.
- `/users`: administração de usuários, exclusiva da administradora (`GET`, `POST`, `PUT /{id}` e `DELETE /{id}`).
- `/patients`, `/procedures`, `/appointments`, `/records`: operações de negócio; coleções suportam operações CRUD conforme o perfil.

Os erros retornam um objeto `{ "message": "..." }`. Em geral, `401` indica sessão ausente ou credenciais inválidas, `403` falta de permissão/conta inativa, `404` registro inexistente, `409` conflito e `423` bloqueio temporário de login.

Para uso fora do ambiente local, configure HTTPS, `COOKIE_SECURE=true`, origens permitidas explícitas e infraestrutura apropriada para proteger dados pessoais e clínicos. Não use credenciais ou dados reais no modo de demonstração.

## Testes e build

Na pasta `backend/`, execute os testes de integração com:

```bash
mvn test
```

Na pasta `frontend/`, gere os arquivos de produção com:

```bash
npm run build
```

O frontend também declara scripts auxiliares para demonstração e testes automatizados; confira a disponibilidade dos arquivos correspondentes antes de usá-los.

### Desenvolvedores

- Ketellyn Santos
- Lucas Ciriaco
- Lucas Máximo
- Manuela Garcia
- Pablo Cordeiro
- Vinicius Francelino

## Licença

Projeto acadêmico. Uma licença de distribuição ainda não foi definida.
