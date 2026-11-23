# Backend — Asanuma Odonto

API REST da aplicação, responsável por autenticação, autorização, regras de negócio e persistência. Para a visão geral e a execução integrada, consulte o [README principal](../README.md).

## Tecnologias

- Java 21
- Spring Boot 3.5.16
- Maven
- Spring Web e JDBC
- H2 como banco padrão
- BCrypt para armazenamento de senhas

## Executar localmente

Na pasta `backend/`, configure as credenciais iniciais da administradora e inicie a aplicação:

```bash
export ADMIN_EMAIL="admin@exemplo.com"
export ADMIN_PASSWORD="defina-uma-senha-segura"
mvn spring-boot:run
```

No PowerShell, defina as variáveis com `$env:ADMIN_EMAIL="admin@exemplo.com"` e `$env:ADMIN_PASSWORD="defina-uma-senha-segura"`. A senha deve ter de 8 a 72 caracteres.

O bootstrap cria a administradora se o e-mail configurado ainda não existir. O cadastro público não permite criar administradoras. A API inicia em `http://127.0.0.1:8080`; sua verificação de saúde está em `GET /api/health`.

Para iniciar pelo IntelliJ, abra `backend/pom.xml`, selecione o JDK 21 e use `backend/` como diretório de trabalho. O diretório de trabalho define onde o arquivo local do H2 será criado.

## Configuração

| Variável | Padrão | Descrição |
| --- | --- | --- |
| `PORT` | `8080` | Porta HTTP da API. |
| `ADMIN_EMAIL` | vazio | E-mail da administradora inicial. |
| `ADMIN_PASSWORD` | vazio | Senha inicial, obrigatória quando se cria uma administradora. |
| `DEMO_MODE` | `false` | Carrega dados e conta de demonstração quando habilitado. |
| `DB_URL` | `jdbc:h2:file:./data/asanumaodonto;DB_CLOSE_ON_EXIT=FALSE` | URL JDBC do banco. |
| `DB_USER` | `sa` | Usuário JDBC. |
| `DB_PASSWORD` | vazio | Senha JDBC para instalação local H2. |
| `ALLOWED_ORIGINS` | origens locais do Vite | Lista de origens CORS permitidas, separadas por vírgula. |
| `COOKIE_SECURE` | `false` | Use `true` quando a aplicação estiver publicada com HTTPS. |

Em uma base vazia, o modo de demonstração disponibiliza `demo@asanumaodonto.com` com a senha `Odonto@2026` e dados fictícios. Use-o somente em ambiente local descartável; não o habilite em uma instalação com dados reais.

## Perfis e regras de acesso

| Perfil | Permissões principais |
| --- | --- |
| Administradora | Dashboard, agenda, pacientes, procedimentos, prontuários, configurações e gerenciamento de usuários. |
| Secretária | Agenda, cadastro e edição de pacientes, agendamentos e própria conta. Não acessa procedimentos, prontuários, configurações administrativas ou exclusão de pacientes. |

A API valida as permissões no servidor. O cadastro público cria somente secretárias. As respostas da secretária omitem prontuários e valores financeiros; para agendar, ela recebe apenas as opções de procedimento necessárias.

Após três senhas incorretas, o login fica bloqueado por cinco minutos. Administradoras podem desbloquear contas antes do prazo e marcar usuários como ativos ou inativos. Contas inativas não autenticam e a sessão é invalidada na próxima requisição autenticada; o gerenciamento também impede a remoção, desativação ou rebaixamento da última administradora ativa.

## Rotas principais

Todas as rotas usam o prefixo `/api`.

| Recurso | Rotas | Acesso |
| --- | --- | --- |
| Saúde | `GET /health` | Público. |
| Autenticação | `POST /auth/login`, `POST /auth/register`, `GET /auth/me`, `POST /auth/logout` | Login e cadastro são públicos; demais operações exigem sessão. Cadastro público cria secretária. |
| Dados iniciais | `GET /bootstrap` | Sessão autenticada; resposta filtrada pelo perfil. |
| Conta | `PUT /account` | Sessão autenticada; edição da própria conta. |
| Configurações da clínica | `PUT /settings` | Administradora. |
| Usuários | `GET/POST /users`, `PUT/DELETE /users/{id}`, `POST /users/{id}/unlock` | Administradora. |
| Pacientes | `/patients` e `/patients/{id}` | Sessão autenticada; exclusão somente por administradora. |
| Procedimentos | `/procedures` e `/procedures/{id}` | Administradora. |
| Agendamentos | `/appointments` e `/appointments/{id}` | Sessão autenticada; regras de agenda verificadas pela API. |
| Prontuários | `/records` e `/records/{id}` | Administradora. |

Coleções de negócio suportam operações CRUD conforme o perfil. As respostas de erro seguem o formato `{ "message": "..." }`: `401` para sessão ausente ou credencial inválida, `403` para falta de permissão ou conta inativa, `404` para registro inexistente, `409` para conflito e `423` durante bloqueio temporário.

## Persistência e segurança

O H2 local é criado por padrão em `backend/data/asanumaodonto.mv.db`. `DB_URL`, `DB_USER` e `DB_PASSWORD` permitem configurar outra conexão JDBC. O schema é inicializado em `src/main/resources/schema.sql`; os registros de domínio ficam em JSON na tabela `clinic_entities`, e as contas ficam em `clinic_users`. O schema adiciona as colunas de situação e bloqueio de login de forma idempotente.

Senhas são armazenadas com BCrypt. A sessão usa cookie `HttpOnly` e `SameSite=Strict`; o prazo é de 12 horas sem a opção “Lembrar de mim” e de 7 dias quando ela está ativa. Escritas passam por validação de origem; CORS com credenciais exige origens explícitas. Em produção, use HTTPS, habilite `COOKIE_SECURE=true`, configure `ALLOWED_ORIGINS` com os hosts reais e mantenha credenciais fora do repositório.

Não existe migração automática dos dados da antiga demonstração Node/SQLite para o H2. Para fazer backup do arquivo H2, pare a API antes de copiá-lo.

## Testes

Execute os testes de integração com Maven na pasta `backend/`:

```bash
mvn test
```
