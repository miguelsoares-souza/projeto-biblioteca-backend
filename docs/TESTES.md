# Verificação do projeto

## Revisão final para entrega em 06/10/2026

- `npm test` executado novamente: 2 testes aprovados, 0 falhas; persistência simulada.
- `npm start` executado novamente: PostgreSQL conectado com tabelas verificadas e MongoDB Atlas conectado; servidor em localhost:3000.
- Verificação HTTP somente de leitura: página inicial, quatro listagens, pesquisa de livros e quatro formulários de cadastro responderam HTTP 200, sem erros 500/503.
- Nenhum dado real foi criado, alterado ou apagado nesta revisão final. Os CRUDs reais já haviam sido testados na etapa descrita abaixo.
- Apresentação corrigida para os três integrantes. Arquitetura, funcionalidades e credenciais locais preservadas.

## Continuação em 06/10/2026

- `npm install`: concluído, dependências já atualizadas conforme o lockfile; dois apontamentos moderados informados pelo NPM, sem aplicar alterações incompatíveis.
- `npm test`: 2 testes aprovados, 0 falhas, com persistência simulada.
- Sequelize/PostgreSQL: autenticação real confirmada em localhost:5432/biblioteca_db.
- Na etapa anterior foram verificados cadastro/consulta reais de usuário e livro, empréstimo e devolução, com remoção dos registros temporários.
- MongoDB Atlas: URI real configurada somente em config/local.js; conexão e ping confirmados no banco biblioteca_db.
- `npm start`: reiniciado e confirmou PostgreSQL e MongoDB conectados; servidor disponível em localhost:3000.
- Testes HTTP com persistência real: páginas, listagens e formulários responderam HTTP 200. Cadastros, edições e exclusões responderam HTTP 303, sem erros 500/503 nos fluxos válidos.
- PostgreSQL real via HTTP: cadastro, consulta, edição e exclusão de usuário e livro; pesquisa de livro; empréstimo com relacionamentos, listagem, devolução e exclusão. Consultas diretas aos models confirmaram a gravação e as alterações de disponibilidade. Exclusão de usuário com empréstimo retornou HTTP 409, conforme esperado.
- Atlas real via HTTP: inserção, consulta, atualização de nota/comentário e exclusão de avaliação. Consultas diretas pelo Mongoose confirmaram o documento persistido, a alteração e a remoção.
- Todos os registros temporários desta verificação foram removidos; nenhum script temporário foi adicionado ao projeto.
- Navegador integrado: tentativa de conexão falhou porque a ponte nativa do navegador não está disponível; não foi realizada inspeção visual nesta continuação.
- Credenciais: config/local.js está no .gitignore e é excluído pelo script de empacotamento; node_modules também é excluído da entrega.

As seções abaixo registram a verificação inicial de 30/09/2026.

## Ambiente e resultado

Verificação realizada em 30/09/2026, Windows, Node.js 22.23.3 e NPM 10.9.9. O Node portátil está fora da pasta do projeto. Não foram fornecidas credenciais de PostgreSQL nem de MongoDB Atlas.

| Verificação | Resultado |
| --- | --- |
| `npm install` | Concluído; package-lock.json gerado |
| Dependências diretas | Express 5.2.1, Sequelize 6.37.8, pg 8.23.1 e Mongoose 8.24.4 |
| Sintaxe dos 19 arquivos JavaScript | Válida com `node --check` |
| `npm test` | 2 testes aprovados, 0 falhas; o primeiro percorre os fluxos HTTP abaixo |
| `npm start` | Servidor iniciado em localhost:3000 |
| Página inicial e CSS | HTTP 200 |
| Operações sem configuração dos bancos | HTTP 503 com orientação de configuração |
| Configuração das chaves estrangeiras | usuarioId → Usuarios e livroId → Livros, exclusão RESTRICT |
| Navegador integrado | Indisponível neste ambiente; não foi feita inspeção visual automatizada |

## O que os testes automatizados verificam

`tests/fluxos.test.js` usa requisições ao Express, com persistência simulada em memória. Os models Sequelize e Mongoose são carregados e suas validações também são executadas, mas as chamadas de gravação/consulta são substituídas no processo de teste. A aplicação normal não usa essa simulação.

- Cadastro, listagem, edição e exclusão de usuários, livros, empréstimos e avaliações.
- E-mail inválido, campos vazios, ano fracionado, datas impossíveis e nota fora do intervalo.
- Usuário/livro inexistente, ID MongoDB inválido e registro não encontrado.
- Pesquisa por título, ano mínimo, disponibilidade, ASC/DESC e duas páginas de resultados.
- Livro fica indisponível após empréstimo; tentativa repetida é recusada.
- Devolução libera o livro; data anterior ao empréstimo é recusada.
- Reabertura de empréstimo devolvido é recusada.
- Exclusão de empréstimo antigo não libera livro que já foi emprestado novamente.
- Cancelamento do empréstimo ativo libera o livro.
- Exclusão de usuário/livro com empréstimos e de livro com avaliação é bloqueada.
- Links das páginas geradas respondem; formulários possuem os campos esperados e os POSTs gravam os dados enviados.
- Texto de usuário é escapado no HTML.
- Falha interna retorna mensagem compreensível sem expor a mensagem bruta; servidor continua respondendo.
- Log contém data/hora, operação e mensagem.

## Limites da verificação realizada

PostgreSQL e MongoDB Atlas foram realmente conectados e testados em 06/10/2026, conforme os resultados no início deste documento. Foram verificados tabelas, CRUD persistido nos dois bancos, relacionamentos e bloqueio de exclusão de usuário com empréstimo. Os registros temporários foram removidos.

Não foram realizados testes específicos de rollback, concorrência de empréstimos ou permanência de um registro de teste após reiniciar a aplicação. A inspeção visual automatizada do navegador também não foi realizada. Os testes de `npm test` usam persistência simulada e complementam, sem substituir, os testes reais já concluídos.

## Avisos da instalação

`npm audit` informou dois apontamentos moderados: um em `uuid`, dependência transitiva, e outro propagado ao Sequelize. A correção automática sugerida faz downgrade do Sequelize para 3.30.0; ela não foi aplicada porque mudaria a versão principal usada pelo projeto. Não há dependências diretas adicionais para contornar o aviso. A aplicação utiliza IDs inteiros no Sequelize, mas o apontamento transitivo continua presente. A instalação também avisou sobre a descontinuação de dependências transitivas `dottie` e `uuid`.

## Entrega

O script `npm run empacotar` inclui os arquivos necessários e gera `logs/errors.log` vazio dentro do ZIP. Não inclui `node_modules`, `config/local.js`, logs preenchidos nem a pasta de ZIPs. Use somente o novo ZIP da versão atual e confira seu conteúdo antes de enviar ao Moodle. Em outra máquina, as credenciais precisam ser preenchidas localmente conforme o README.
