# Roteiro da apresentação

Os três integrantes — Miguel Soares de Souza, Vitor Hugo Santos de Oliveira e Thalles Guilherme Barboza Garbelotti — devem entender o fluxo inteiro, da tela até cada banco.

1. **Objetivo:** explicar que a biblioteca cadastra leitores e livros, controla empréstimos e recebe avaliações.
2. **Estrutura:** abrir `app.js` e mostrar as pastas config, models, routes, services e public.
3. **PostgreSQL:** mostrar `config/db_sequelize.js`, sem abrir ou projetar credenciais de `config/local.js`.
4. **Models:** abrir Usuario, Livro e Emprestimo. Identificar tipos, obrigatoriedade, chave primária e autoIncrement.
5. **Relacionamentos:** abrir `models/index.js` e explicar Usuario 1:N Emprestimo e Livro 1:N Emprestimo.
6. **Usuário:** cadastrar, listar e editar. Mostrar os inputs `name`, a rota POST e `req.body`.
7. **Livro:** cadastrar e mostrar a consulta com `findAll`. Demonstrar exclusão de um livro sem vínculos.
8. **Empréstimo:** emprestar um livro, mostrar a indisponibilidade, editar para devolver. Explicar a classe e a transação em `services/EmprestimoService.js`.
9. **Consulta Sequelize:** pesquisar título, filtrar ano/disponibilidade, ordenar e paginar. Mostrar `req.query`, `where`, `Op.like`, `Op.gte`, `order`, `limit` e `offset` em `routes/livros.js`.
10. **MongoDB:** mostrar a conexão Mongoose e o schema Avaliacao. Explicar collection, documento, fields e ObjectId.
11. **Avaliação:** cadastrar e listar. Mostrar `new Avaliacao(...).save()` e `find()`.
12. **Atualização:** editar a nota/comentário e mostrar `findOneAndUpdate()`.
13. **Exclusão:** excluir a avaliação e mostrar `findOneAndDelete()`.
14. **Validação/erro:** tentar excluir usuário com empréstimo, abrir um ID inexistente ou enviar dado inválido. Mostrar o tratamento e a linha do log.
15. **Dois bancos:** concluir com a justificativa dos dados relacionados no PostgreSQL e das avaliações como documentos no MongoDB, dentro da mesma aplicação.

Prepare antes: bancos conectados, um usuário, seis livros (para paginação), nenhum segredo visível e o terminal pronto. Não use apenas os testes simulados como demonstração dos bancos.

## Perguntas possíveis

| Pergunta | Onde encontrar a resposta |
| --- | --- |
| Como a aplicação inicia? | `app.js`: função iniciar e app.listen |
| Para que servem require e module.exports? | `config/db_sequelize.js` exporta a conexão; os models a importam |
| Qual a diferença entre GET e POST? | `routes/usuarios.js`: GET apresenta formulário/lista; POST grava |
| O que são req.params, req.query e req.body? | `routes/livros.js`: ID na rota, filtros na URL e dados do formulário |
| Onde estão os tipos e campos obrigatórios? | `models/Usuario.js`, `Livro.js`, `Emprestimo.js` e `Avaliacao.js` |
| Qual é a chave estrangeira do empréstimo? | `models/index.js`: usuarioId e livroId |
| Como mostrar nomes em vez de somente IDs? | `routes/emprestimos.js`: include de Usuario e Livro |
| Onde está cada operação CRUD do PostgreSQL? | `routes/usuarios.js` e `routes/livros.js`; empréstimos na classe de serviço |
| Onde está cada operação CRUD do MongoDB? | `routes/avaliacoes.js` |
| O que acontece ao emprestar um livro indisponível? | `services/EmprestimoService.js`: método criar recusa antes da gravação |
| Por que usar uma transação? | `services/EmprestimoService.js`: empréstimo e disponibilidade precisam ser gravados juntos |
| Por que bloquear a linha do livro? | Mesmo arquivo: duas requisições não podem emprestar simultaneamente o mesmo exemplar |
| Onde está a Orientação a Objetos? | `services/EmprestimoService.js`: class, constructor, this.db e métodos; instanciação em routes/emprestimos.js |
| O que significam limit e offset? | `routes/livros.js`: cinco por página e quantidade de registros ignorados |
| Como o ano é filtrado? | `routes/livros.js`: Op.gte dentro de where |
| O que sync faz? Ele apaga os dados? | `app.js`: sync() cria tabelas ausentes, sem force |
| Como a avaliação referencia o livro? | `models/Avaliacao.js` e `routes/avaliacoes.js`: livroId e verificação no PostgreSQL, sem FK entre bancos |
| A avaliação exige usuário cadastrado? | Não; usuario é um nome textual no schema Avaliacao |
| Como são tratados erros? | try/catch nas rotas e middleware final em `app.js` |
| O que é registrado no log? | `utils/log.js`: data/hora, operação e mensagem, sem credenciais |
| Por que escapar HTML? | `utils/html.js`: impede interpretar nomes/comentários como marcação ou script |
| Quais são os limites dos testes automatizados? | `tests/fluxos.test.js` e `docs/TESTES.md`: persistência simulada; integração real depende dos bancos |
| Por que dois bancos? | Justificativa no `README.md` |

Pratiquem as respostas com as próprias palavras e acompanhem um cadastro completo: formulário → rota → validação → model → banco → redirecionamento → listagem.
