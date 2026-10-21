# Retomada da Etapa 2 — 21/10/2026

## Estado encontrado antes de editar

Git limpo, sem alterações não commitadas. Histórico: `6e7fe27` (início), `a38b46d` (aplicativo base) e `1920656` (validação de quantidades, proteção de migração, testes e preparação da Development Build). Os commits têm mensagens genéricas; o código e o README ainda identificavam a Etapa 1. Não havia uma implementação separada da Etapa 2 no histórico disponível.

Foram inspecionados todos os arquivos de código, testes, configurações e documentação, além da estrutura de assets e scripts. Estrutura: duas telas Expo Router, componentes compartilhados, contexto do repositório, SQLite, tema, modelos, serviço de anúncios desativado e testes SQLite. Sem pastas nativas Android/iOS versionadas. Não foi encontrado AGENTS.md no projeto.

## Comparação dos requisitos

| Requisito | Encontrado | Resultado desta retomada |
| --- | --- | --- |
| Refinamento visual | Identidade verde, cards, estados vazios e acessibilidade básica | Controles de busca/organização e sugestões seguem o mesmo tema |
| Experiência do checklist | Marcar/desmarcar, editar, excluir com confirmação | Busca com resultado vazio próprio e contagem de resultados |
| Ordem original, pendentes, categorias | Apenas ordem de criação, com desempate por UUID | Três modos; pendentes primeiro; categorias com cabeçalhos e sem categoria ao final |
| Busca na lista | Ausente | Busca parcial, sem diferenciar acentos/maiúsculas, com botão de limpar |
| Adição rápida de vários produtos | Adicionar e continuar, com foco e feedback | Preservada; sugestões preenchem os campos para revisão antes de salvar |
| Progresso | Contagem, barra e percentual nas duas telas | Preservado; representa a lista inteira mesmo durante a busca |
| Produtos frequentes | Ausente | Até oito sugestões a partir dos produtos das listas existentes, sem rede |
| Duplicação desmarcada | Transacional, novos IDs, quantidades e categorias preservadas | Preservada e corrigida a ordem de cópia |
| Navegação e teclado | Voltar com fallback, modal com botão voltar Android, proteção do formulário ao salvar e ajuste ao teclado | Tecla Próximo vai à quantidade; rolagem do checklist recolhe o teclado; toques nos controles são atendidos com teclado aberto |
| Interface para anúncios futuros | AdBanner reutilizável na inicial retorna null, serviço desativado | Preservada; sem SDK, IDs, requisições ou espaço vazio |

## Implementação e preservação dos dados

Busca e ordenação operam em uma cópia do array, sem escrever a ordem no SQLite. A ordem original é criação e, no empate, sequência de inserção (`rowid`). Antes o UUID podia embaralhar produtos com a mesma data; isso ocorria especialmente na cópia, que usa um único instante para todos os produtos. A duplicação agora lê a origem explicitamente na mesma ordem e mantém essa ordem na cópia. Produtos antigos empatados podem aparecer na sequência de inserção em vez da anterior sequência alfabética dos UUIDs.

Sugestões contam ocorrências dos nomes nas listas existentes, ignorando maiúsculas e espaços nas extremidades, e usam os detalhes da ocorrência mais recentemente atualizada. No empate de frequência, a atualização mais recente vem primeiro. Duplicações contam como ocorrências; exclusões deixam de contribuir. Não existe histórico separado de compras nem catálogo externo; após excluir todas as listas não há sugestões. Tocar em uma sugestão não grava nada até usar Adicionar.

Banco `ta-na-lista.db`, esquema e `user_version = 1` mantidos. Nenhuma limpeza, migração, alteração de identificador Android, dependência ou configuração nativa. Testes criam seus próprios bancos temporários e não acessam o banco do celular. Nenhum recurso Premium, AdMob, deploy ou APK.

## Verificações

Resultados finais desta retomada:

- `npm.cmd run typecheck`: aprovado.
- `npm.cmd run lint`: aprovado, sem erros ou avisos do ESLint.
- `npm.cmd test`: 9 testes aprovados, nenhum erro (5 existentes e 4 novos).
- `npx.cmd expo export --platform android`: aprovado, 1.207 módulos; bundle Hermes e assets exportados localmente em `dist`, sem APK ou publicação.
- `git diff --check`: aprovado; apenas aviso do Git sobre futura normalização LF/CRLF no README.
- `npm.cmd ls --depth=0` e `npm.cmd ls --all --omit=dev`: aprovados. A árvore completa mostra dependências opcionais ausentes, sem erro de resolução.

Os novos testes cobrem busca sem acentos, estabilidade dos modos de organização sem alterar a origem, preservação da sequência na duplicação com datas empatadas e sugestões locais com frequência, detalhes recentes e exclusão. Os testes existentes de CRUD, persistência ao reabrir, migração, rollback, validação e gravações concorrentes continuam passando.

A consulta online `expo install --check` encontrou atualizações de correção recomendadas: Expo `~58.0.17` (instalado 58.0.16), expo-constants `~58.0.13` (58.0.12), expo-linking `~58.0.14` (58.0.13), expo-router `~58.0.25` (58.0.24) e expo-status-bar `~58.0.4` (58.0.3). Portanto a checagem de compatibilidade não está totalmente verde. `npm ls --depth=0` não indicou pacotes ausentes ou inválidos. Não foram aplicadas atualizações para preservar a base da Development Build nesta rodada. Reavaliar essas correções em uma rodada própria, com teste no aparelho e avaliação de eventual recompilação nativa.

O README anterior registra vulnerabilidades transitivas no npm audit; esse resultado é histórico e não foi revalidado nesta retomada. Os testes Node emitem avisos de SQLite experimental e detecção de módulos; não são erros de execução do app.

## Limitações e teste no celular

Não foi feita validação visual ou interação nativa no aparelho nesta retomada. Bundle e testes não comprovam comportamento do teclado, TalkBack ou layout no Android. A implementação está pronta para revisão da Etapa 2; a aprovação visual e funcional depende do teste no celular.

1. Executar `npm.cmd run start:dev` e abrir o projeto na Development Build já instalada, preservando a instalação e seus dados.
2. Confirmar listas antigas, produtos, quantidades e marcações; fechar/reabrir e conferir persistência.
3. Criar produtos de várias categorias, inclusive sem categoria. Alternar os três modos; marcar/desmarcar em Pendentes primeiro e conferir a movimentação. Voltar à ordem original.
4. Buscar “maca” para “Maçã”, testar maiúsculas, resultados ausentes e limpar. Marcar no resultado e conferir progresso da lista inteira.
5. Adicionar vários produtos com Adicionar e continuar; confirmar feedback, retorno do foco e manutenção de unidade/categoria. Testar quantidades inválidas e edição sem perder dados.
6. Conferir sugestões de produtos presentes em várias listas; selecionar, revisar os campos e salvar. Cancelar uma seleção e confirmar que nada foi adicionado.
7. Duplicar uma lista com vários produtos marcados: verificar sequência, quantidades, categorias, novos itens desmarcados e origem intacta.
8. Conferir teclado aberto, botão voltar Android, rolagem, fonte ampliada, TalkBack e tela pequena. Navegar da lista para a inicial e conferir progresso atualizado.
9. Com o código já carregado, testar as operações sem rede. Recarregar o JavaScript no cliente de desenvolvimento ainda depende do Metro; isso não representa dependência de rede dos dados do aplicativo.

## Development Build e próxima etapa

As alterações são de TypeScript/JavaScript e usam módulos já instalados. Não há mudança que exija nova Development Build. A compatibilidade com a instalação atual é esperada, condicionada à confirmação no aparelho, cujo binário não foi inspecionado aqui. Não desinstalar nem limpar armazenamento.

Etapa 3 não iniciada. Próximo passo: teste e aprovação da Etapa 2 pelo usuário.
