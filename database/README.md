# Banco de dados — Asanuma Odonto

Este diretório reúne materiais acadêmicos de modelagem e um script SQL de uma versão inicial do projeto. Ele documenta a evolução do modelo, mas não é o schema aplicado pela API atual.

## Conteúdo

| Caminho | Descrição |
| --- | --- |
| `modelagens/modeloBD.mwb` | Arquivo editável do modelo no MySQL Workbench. |
| `modelagens/modelagemV1.pdf` | Exportação em PDF da modelagem inicial. |
| `modelagens/v1.png` | Imagem da modelagem inicial. |
| `scripts/clinica_odonto.sql` | Script MySQL de uma versão anterior do modelo. |

## Banco usado pela aplicação

O backend atual usa H2 por padrão. Seu schema está em [`backend/src/main/resources/schema.sql`](../backend/src/main/resources/schema.sql) e é inicializado pela aplicação Spring Boot. A tabela `clinic_entities` armazena registros de domínio em JSON; `clinic_users` mantém as contas e dados de autenticação.

O SQL deste diretório não é executado pelo backend e não há migração automática entre ele e o H2. Não aplique esse script para preparar a instalação atual nem espere que seus registros sejam importados pela aplicação.

## Sobre o script MySQL legado

`clinica_odonto.sql` cria um banco chamado `clinica_odonto`, mas a instrução seguinte tenta selecionar `clinia_odonto`. Essa divergência impede a execução direta do script. Além disso, as tabelas e colunas representam o modelo inicial e não correspondem ao schema atual do backend.

Se for necessário usar esse material em uma atividade acadêmica com MySQL, revise e corrija o script antes de executá-lo, sempre em uma base descartável. Ele não deve ser usado com dados reais da clínica.
