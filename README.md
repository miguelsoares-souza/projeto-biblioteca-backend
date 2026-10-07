# Sistema de Biblioteca

Projeto 1 da disciplina Programação Web Back-End da UTFPR. O sistema permite cadastrar usuários e livros, controlar empréstimos e registrar avaliações dos livros.

## Integrantes

- Miguel Soares de Souza — RA: 2678233
- Thalles Guilherme Barboza Garbelotti — RA: 1884255
- Vitor Hugo Santos de Oliveira — RA: 2706555

## Funcionalidades

- Cadastro, listagem, edição e exclusão de usuários e livros.
- Registro, listagem, edição de datas e cancelamento de empréstimos.
- Devolução de livros e controle de disponibilidade.
- Pesquisa de livros por título, ano mínimo e disponibilidade.
- Ordenação por título e paginação dos resultados.
- Cadastro, listagem, edição e exclusão de avaliações.

## Tecnologias

O projeto utiliza Node.js, JavaScript com CommonJS, HTML e CSS. As dependências são instaladas pelo NPM:

| Dependência | Função |
| --- | --- |
| Express | Definir as rotas e receber os dados dos formulários |
| Sequelize | Definir os models e realizar operações no PostgreSQL |
| pg | Conectar o Sequelize ao PostgreSQL |
| Mongoose | Definir o schema e realizar operações no MongoDB Atlas |

## Organização dos arquivos

```text
app.js                    Início da aplicação e configuração do Express
package.json              Dependências e comandos
package-lock.json         Versões das dependências
config/                   Conexões e configuração local dos bancos
models/                   Usuario, Livro, Emprestimo e Avaliacao
routes/                   Rotas de cada cadastro
services/                 Classe EmprestimoService
public/                   Página inicial e CSS
utils/                    Validação, montagem do HTML e log
logs/errors.log           Registro de erros
tests/                    Testes automatizados
docs/                     Roteiro de apresentação e registro dos testes
scripts/empacotar.ps1      Geração do ZIP de entrega
```

## Bancos de dados

Os dois bancos fazem parte da mesma aplicação. O PostgreSQL armazena usuários, livros e empréstimos, pois esses dados têm uma estrutura definida e relacionamentos entre si. O MongoDB armazena as avaliações em documentos, reunindo nota, comentário, autor da avaliação e data.

### PostgreSQL e Sequelize

| Model | Campos |
| --- | --- |
| Usuario | `id` (INTEGER, chave primária e autoIncrement), `nome` e `email` (STRING, obrigatórios) |
| Livro | `id` (INTEGER, chave primária e autoIncrement), `titulo` e `autor` (STRING, obrigatórios), `ano` (INTEGER, opcional), `disponivel` (BOOLEAN, padrão true) |
| Emprestimo | `id` (INTEGER, chave primária e autoIncrement), `dataEmprestimo` (DATEONLY, obrigatória), `dataDevolucao` (DATEONLY, opcional), `usuarioId` e `livroId` (INTEGER, chaves estrangeiras obrigatórias) |

Cada livro cadastrado representa um exemplar. Um usuário pode ter vários empréstimos, e um livro pode ser emprestado várias vezes ao longo do tempo.

```text
Usuario 1 ---- N Emprestimo N ---- 1 Livro
```

Os relacionamentos estão em `models/index.js`, usando `hasMany()` e `belongsTo()`. Na listagem de empréstimos, `include` permite mostrar o nome do usuário e o título do livro.

As operações de CRUD usam `create()`, `findAll()`, `findByPk()`, `save()` e `destroy()`.

### MongoDB e Mongoose

O schema está em `models/Avaliacao.js`, na collection `avaliacoes`:

| Campo | Tipo e regra |
| --- | --- |
| `_id` | ObjectId gerado pelo MongoDB |
| `livroId` | Número inteiro positivo, obrigatório |
| `usuario` | Nome de quem avalia, obrigatório, até 255 caracteres |
| `nota` | Número inteiro de 1 a 5, obrigatório |
| `comentario` | Texto obrigatório, até 2.000 caracteres |
| `data` | Data preenchida automaticamente |

Antes de salvar uma avaliação, a aplicação verifica se o livro existe no PostgreSQL. O campo `usuario` guarda o nome informado no formulário e não exige um usuário cadastrado.

O CRUD utiliza `new Avaliacao(...).save()`, `find()`, `findOneAndUpdate()` e `findOneAndDelete()`. A atualização também executa as validações do schema.

## Instalação e execução

É necessário ter Node.js 22 ou superior, NPM, PostgreSQL e acesso a um cluster MongoDB Atlas.

### 1. Instalar as dependências

Na pasta do projeto, execute:

```powershell
npm install
```

### 2. Configurar as conexões

Se `config/local.js` ainda não existir, copie o arquivo de exemplo:

```powershell
Copy-Item config/local.example.js config/local.js
```

Preencha os seguintes campos em `config/local.js`:

| Campo | Valor esperado |
| --- | --- |
| `postgres.host` | Endereço do servidor PostgreSQL, como localhost para uma instalação local |
| `postgres.port` | Porta do PostgreSQL, normalmente 5432 |
| `postgres.database` | Nome do banco criado no PostgreSQL |
| `postgres.username` | Usuário com acesso ao banco |
| `postgres.password` | Senha desse usuário |
| `mongoUri` | URI completa de conexão do MongoDB Atlas |
| `port` | Porta da aplicação, inicialmente 3000 |

O arquivo `config/local.js` contém as credenciais locais. Ele está no `.gitignore` e é excluído pelo comando de empacotamento.

No PostgreSQL, crie um banco pelo pgAdmin e informe seu nome na configuração. A conexão está em `config/db_sequelize.js`. Ao iniciar, a aplicação executa `sequelize.sync()` para criar as tabelas ausentes, sem apagar os dados existentes. O banco precisa existir antes dessa etapa.

No MongoDB Atlas, crie um cluster e um usuário de banco de dados. Libere o IP da máquina em Network Access e copie a string de conexão para Node.js. Preencha usuário, senha e nome do banco na URI e coloque-a no campo `mongoUri`. A conexão está em `config/db_mongoose.js`. Mais informações estão na [documentação do Atlas](https://www.mongodb.com/docs/atlas/connect-to-database-deployment/).

No cluster Biblioteca, use **Connect → Drivers**, JavaScript e Node.js Driver. Essa URI também funciona com o Mongoose já instalado; não é necessário instalar MongoDB localmente. Cole a URI real somente em `config/local.js`, substitua os campos de usuário e senha pelo usuário de banco do Atlas e inclua `/biblioteca_db` antes do `?`, preservando os parâmetros fornecidos pelo Atlas. O nome do cluster não é o nome do banco. Caracteres especiais nas credenciais devem ser codificados para URL.

Não publique a URI com senha nem envie `config/local.js` na entrega. Depois de salvar, reinicie com `npm start`. O terminal deve confirmar separadamente PostgreSQL e MongoDB conectados. Enquanto houver alguma pendência, as operações continuam bloqueadas e indicam qual banco precisa de configuração.

### 3. Iniciar a aplicação

```powershell
npm start
```

Abra **http://localhost:3000**. Para encerrar, pressione Ctrl+C no terminal.

Se o PowerShell bloquear o comando `npm`, utilize `npm.cmd install` e `npm.cmd start`.

Sem a configuração dos dois bancos, a página inicial abre, mas as operações mostram uma mensagem de indisponibilidade. Depois de preencher as conexões, reinicie a aplicação.

## Rotas e formulários

| Método | Rota | Função |
| --- | --- | --- |
| GET | `/` | Página inicial |
| GET | `/usuarios`, `/livros`, `/emprestimos`, `/avaliacoes` | Listagens |
| GET | `/usuarios/novo`, `/livros/novo`, `/emprestimos/novo`, `/avaliacoes/nova` | Formulários de cadastro |
| POST | `/usuarios`, `/livros`, `/emprestimos`, `/avaliacoes` | Salvar novo registro |
| GET | `/<recurso>/:id/editar` | Abrir formulário de edição |
| POST | `/<recurso>/:id/editar` | Salvar alterações |
| GET | `/<recurso>/:id/excluir` | Abrir confirmação de exclusão |
| POST | `/<recurso>/:id/excluir` | Excluir registro |
| GET | `/livros/pesquisar` | Consultar livros com filtros |

Nas rotas, `<recurso>` corresponde a `usuarios`, `livros`, `emprestimos` ou `avaliacoes`.

Os formulários enviam dados por POST, recebidos em `req.body`. O ID da edição ou exclusão é recebido em `req.params`. Os filtros de pesquisa são enviados por GET e recebidos em `req.query`.

## Consultas de livros

As consultas estão em `routes/livros.js` e utilizam:

- `where` com `Op.like` para pesquisar parte do título. A pesquisa diferencia maiúsculas e minúsculas.
- `Op.gte` para filtrar pelo ano mínimo.
- `where.disponivel` para mostrar livros disponíveis ou emprestados.
- `order` para ordenar o título em ASC ou DESC.
- `limit: 5` e `offset` para exibir cinco livros por página.

Exemplo de consulta:

```text
/livros/pesquisar?titulo=Node&ano=2020&disponivel=true&ordem=ASC&pagina=1
```

## Empréstimos e Orientação a Objetos

A classe `EmprestimoService`, em `services/EmprestimoService.js`, concentra as regras dos empréstimos. Seu `constructor` recebe a conexão com o banco, e os métodos `criar`, `atualizar` e `excluir` são chamados pelas rotas.

Um empréstimo só pode ser registrado se o usuário e o livro existirem e o exemplar estiver disponível. Ao emprestar, `disponivel` passa a ser false. Ao preencher a data de devolução ou cancelar um empréstimo ativo, o livro volta a ficar disponível.

A edição permite corrigir datas e registrar a devolução. Para trocar o usuário ou o livro, é necessário cancelar o empréstimo e cadastrar outro. Um empréstimo devolvido não pode ser reaberto. Excluir um empréstimo antigo já devolvido não altera a disponibilidade atual do exemplar.

A gravação do empréstimo e a alteração da disponibilidade são feitas na mesma transação. O bloqueio da linha do livro impede que duas requisições o emprestem ao mesmo tempo.

## Validações e tratamento de erros

O sistema verifica campos obrigatórios, formato do e-mail, ano inteiro entre 1 e 9999, datas válidas e nota inteira entre 1 e 5. A devolução não pode ser anterior ao empréstimo.

Usuários e livros com empréstimos vinculados não podem ser excluídos. As avaliações também precisam ser removidas antes de excluir o livro correspondente.

As rotas usam `try/catch`. Quando ocorre uma falha, o tratamento em `app.js` retorna uma mensagem, como “Livro indisponível” ou “Usuário não encontrado”, sem encerrar o servidor.

O arquivo `utils/log.js` registra data/hora, operação e mensagem em `logs/errors.log`, usando o módulo `fs`. Senhas e strings de conexão não são gravadas no log. Os textos dos cadastros também são escapados antes de serem exibidos no HTML.


