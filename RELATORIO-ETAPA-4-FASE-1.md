# Tá na Lista! — Etapa 4, fase 1

Data: 23/10/2026. Escopo autorizado: segurança, privacidade, estabilidade e confiabilidade. O planejamento `RELATORIO-PLANEJAMENTO-ETAPA-4.md` foi lido integralmente antes das alterações. Não foi iniciada outra fase.

## Implementações realizadas

### Validação e operações SQLite

- Validação em runtime de nomes, inclusive tipo, limite de 80 caracteres e rejeição de controles internos (como NUL e quebra de linha), sem modificar registros antigos.
- Quantidade textual limitada aos 12 caracteres já permitidos pelo formulário; rejeição de tipos inesperados, valores não decimais, não positivos ou acima de 99999 também no parser. Validação numérica do repositório preservada.
- Validação de identificadores recebidos pelas operações e pela rota do checklist: texto não vazio, limite de tamanho e ausência de espaços/controles. Não foi exigido formato UUID para não impor uma alteração aos identificadores existentes.
- Validação de produto nulo/malformado; resultado contém apenas os campos previstos, sem propagar propriedades arbitrárias. Unidades/categorias continuam restritas às opções existentes.
- Renomear/excluir listas e editar/marcar/excluir produtos agora verificam a contagem de linhas afetadas. Identificador inexistente ou produto pertencente a outra lista gera erro recuperável, em vez de sucesso aparente. A atualização do timestamp da lista permanece na mesma transação da alteração de produto.
- A fila de gravações continua utilizável após falha. SQL parametrizado, transações, foreign keys, WAL, cascata, `quick_check`, `foreign_key_check` e recusa de versão futura foram preservados.

**Preservação:** banco `ta-na-lista.db`, localização padrão do expo-sqlite, schema/user_version 1, estrutura de tabelas, UUIDs e dados existentes não foram alterados. Não houve acesso ao SQLite do aparelho, limpeza, recriação, substituição ou migração de conteúdo.

### Inicialização e interface

- Extraído um inicializador testável que fecha a conexão quando a preparação falha ou quando o efeito perde atividade antes da publicação do repositório.
- A conexão usa `useNewConnection: true`, opção já existente no expo-sqlite instalado, para que o descarte de uma tentativa cancelada não feche uma conexão compartilhada. A conexão já publicada permanece de duração do processo; não é fechada durante escritas/leituras de componentes. Um gerenciador completo de desmontagem do repositório não foi introduzido nesta fase.
- A Home possui trava síncrona de operação, além de estado visual ocupado. Chamadas repetidas durante duplicação/exclusão não enfileiram outra operação; a trava é liberada mesmo quando ocorre erro. Criação e abertura do menu de mutação ficam bloqueadas durante a operação da Home.
- Mantidos os tratamentos de erro existentes, com mensagem de atualização/nova tentativa para operações da Home. Nenhum erro bruto de SQLite ou do SDK é mostrado ao usuário.

### Consentimento e privacidade do AdMob

- Corrigida uma regressão possível: o resultado UMP que exige revisão é preservado **antes** da inicialização de anúncios. Se esta falhar, o botão de revisão exigido continua disponível.
- Respostas malformadas de consentimento fecham o gate; `canRequestAds` precisa ser booleano e o status de revisão precisa ser reconhecido. `NOT_REQUIRED` não é interpretado como aceite; a permissão de solicitação continua vindo de `canRequestAds`.
- Referência do controlador passou a ser mantida em `ref`, descartada no cleanup, evitando que os botões reutilizem um controlador desativado de um efeito anterior. Respostas de efeitos inativos não atualizam a interface.
- Mantidos `gatherConsent()` por inicialização, formulário oficial UMP, ausência de cache próprio, revisão quando exigida, inicialização serializada e única por controlador e falha fechada. Anúncios permanecem exclusivos de desenvolvimento Android e não personalizados.
- Adicionado acesso permanente na Home a **Privacidade e dados locais**, com texto embarcado e disponível offline: armazenamento local, ausência de sincronização, exclusão/perda dos dados, limites de backup/criptografia, conexões e coleta possível do SDK, opções UMP e situação da política completa.
- Esse texto não inventa controlador, canal de direitos ou URL e não substitui a política de privacidade completa. O banner é desmontado enquanto esse modal está aberto, preservando a regra de não anunciar sobre formulários.

Os App IDs, banner de teste, plugin, measurement delay, permissões e bloqueio de produção não foram alterados. Não há formulário de consentimento imitado, reset de consentimento, targeting com conteúdo de listas, serviço externo adicional, anúncio real, Premium, assinatura ou pagamento.

Referências consultadas: [UMP Android](https://developers.google.com/admob/android/privacy) e [integração UMP da biblioteca](https://docs.page/invertase/react-native-google-mobile-ads/european-user-consent). A atualização por abertura, o gate e as mensagens da conta continuam sujeitos à configuração aplicável; não se declara conformidade jurídica integral com base na integração técnica.

## Auditoria de dependências

`npm.cmd audit --json` foi reexecutado com consulta ao registro npm, após a primeira tentativa restrita falhar por acesso ao endpoint. Resultado atual: **5 alertas altos, 0 moderados, 0 críticos**.

Entradas: `node-forge`, `@expo/code-signing-certificates`, `@expo/cli`, `expo` e `react-native-google-mobile-ads`. A causa direta apresentada nesta resposta é a verificação RSA PKCS#1 v1.5 de `node-forge <= 1.4.0` ([GHSA-86w9-cpqp-85rv](https://github.com/advisories/GHSA-86w9-cpqp-85rv)). A árvore instalada contém `node-forge@1.4.0` na CLI/certificados Expo. O alerta atribuído a AdMob é propagado por sua relação com Expo; não demonstra vulnerabilidade direta do SDK nativo Google.

O registro sugere Expo 44.0.6/AdMob 13.6.1 para parte da árvore, incompatíveis com a base atual. Embora uma entrada indique correção disponível sem detalhar uma versão, não há evidência suficiente nesta auditoria para garantir que uma alteração preserve a build instalada. Não foram executados `audit fix`, overrides, atualizações, instalação de dependências ou alterações no lockfile.

A resposta atual não lista `braces` (a árvore instalada contém 3.0.3). A diferença em relação aos 20 alertas históricos não decorre de correção aplicada nesta fase e não comprova ausência de risco. Manter Metro em rede confiável, não processar certificados não confiáveis e acompanhar correções compatíveis do tooling. Auditoria npm não examina integralmente dependências Maven nem certifica a segurança do APK.

## Preservação e recuperação em ambiente de teste

Foi acrescentado ensaio automatizado com banco temporário próprio: ativar WAL, desativar autocheckpoint, criar lista/produto e marcar compra; produzir snapshot SQLite consistente com `VACUUM INTO` para um arquivo novo; reabrir esse snapshot independentemente; comparar integralmente listas/produtos/timestamps/estados e verificar integridade, foreign keys e schema. A fonte também é comparada para garantir que o ensaio não alterou seus registros.

Procedimento recomendado para uma intervenção futura, sem executá-lo nos dados reais nesta entrega:

1. Identificar a instalação, assinatura e banco corretos; guardar cópias em diretório privado ignorado pelo Git, sem registrar nomes dos produtos em logs.
2. Em ambiente controlado, produzir snapshot por API SQLite consistente ou, com processo realmente fechado e nenhuma conexão escrevendo, preservar juntos banco/WAL/SHM. Não copiar só o arquivo principal com escrita ativa.
3. Nunca sobrescrever o original: abrir cópia de trabalho em outro caminho; verificar `quick_check`, `foreign_key_check`, schema e comparar todas as linhas/campos com o baseline.
4. Ensaiar recuperação usando o snapshot como banco separado. Qualquer restauração em instalação real exige procedimento próprio, interrupção segura dos escritores e preservação adicional do estado atual; não restaurar automaticamente ao encontrar erro.
5. Documentar resultado sem expor conteúdo pessoal e decidir guarda/descarte das cópias com o responsável. Os backups históricos de `.expo/` não foram modificados ou removidos.

Não foi criado recurso de exportação, backup em nuvem ou restauração na interface. O ensaio comprova o comportamento SQLite em Node com dados sintéticos; a API nativa Android e uma recuperação real não foram testadas nesta fase.

## Compatibilidade e funcionamento offline

Todas as alterações de aplicação são TypeScript/JavaScript e usam APIs já disponíveis nas dependências instaladas. Nenhuma alteração em `app.json`, `eas.json`, pacote Android, plugins, permissões, dependência nativa ou configuração de SDK. **Não há necessidade identificada de nova Development Build.** A validação pode usar o Metro e a build existente; não foi gerado APK, instalado artefato, executado deploy ou publicado conteúdo.

Listas continuam independentes de rede e anúncios. A tela informativa também é local. Falha offline do adaptador de anúncios segue coberta pelos testes de CRUD SQLite. A Development Build precisa do Metro para carregar/recarregar JavaScript; isso não equivale a dependência de rede para armazenar listas. Não foi declarado aprovado um novo teste físico em modo avião.

## Verificações automatizadas

Resultados finais:

| Verificação | Resultado |
| --- | --- |
| `npm.cmd run typecheck` | Aprovado |
| `npm.cmd run lint` | Aprovado, sem avisos ESLint |
| `npm.cmd test` | 25/25 aprovados: 17 anteriores e 8 novos |
| `git diff --check` | Aprovado nos arquivos rastreados; apenas avisos de normalização LF/CRLF |
| `npm.cmd audit --json` | Executado; 5 alertas altos pendentes, conforme análise acima |

Permanecem os avisos conhecidos de detecção de módulos TypeScript e SQLite experimental do runner Node, sem falha dos testes. Configuração Expo, dependências e lockfile não tiveram mudanças; não foram executados Expo Doctor, export de bundle ou build. O arquivo de planejamento já estava não rastreado no início desta fase e foi preservado.

Cobertura nova: tipos/limites/controles e entradas malformadas; nomes SQL literais; identificadores inválidos; operações sobre registros inexistentes ou de outra lista sem alterar linhas; rollback quando a atualização da lista falha e recuperação da fila; cópia consistente com WAL; cancelamento/falha de inicialização; repetição de operações; revisão UMP após falha de SDK e respostas inválidas. Mantidos testes anteriores de CRUD, persistência/reabertura, duplicação, ordem, sugestões, integridade, versão futura e falhas de anúncios offline.

Os testes não acessam o banco pessoal nem executam SDK real. Testes unitários da lógica não substituem ensaio de componentes React, layout, timing de toques e comportamento nativo.

## Pendências e próximos passos

1. Revisão manual na Development Build existente: dados antigos, CRUD, cliques repetidos na Home, teclado, TalkBack/fontes ampliadas, retorno Android, modal de privacidade sem banner, erros recuperáveis e modo avião após carregamento do JS. Usar listas sintéticas para ensaios de alteração; não modificar listas pessoais preservadas.
2. Testar mensagens reais de teste da conta AdMob em aparelho/regionais aplicáveis: aceitar/opções/recusar/revisar/alterar escolhas/sem rede. O App ID de demonstração atual não comprova a configuração da conta. A recusa pode permitir modos limitados conforme SDK; avaliar `canRequestAds` em vez de presumir sempre bloqueio.
3. Definir público/idade/países, finalidades, base legal, responsável e contato; finalizar política completa e cobertura brasileira com avaliação adequada. Não substituir IDs ou publicar mensagens/política sem o fluxo autorizado para essas ações externas.
4. Confirmar no manifest efetivo da instalação atual AD_ID, permissões, backup/transferência, componentes exportados e rede em texto claro. Foi revisada a evidência histórica do artefato, que confirma App ID/classes mas não substitui essa inspeção completa. A flag `ALLOW_BACKUP` anteriormente documentada era da instalação antiga. Não é possível afirmar o resultado atual apenas pelo JSON.
5. Acompanhar correção compatível de `node-forge`/tooling. Não expor Development Build depurável ao público. Futuro endurecimento nativo ou atualização de SDK que exigir build deve ser justificado e autorizado separadamente antes de executar.
6. Otimização de sugestões permanece adiada: não foi feito benchmark e não há evidência nova que justifique alterar o comportamento estável nesta fase.

Fase 1 entregue com correções locais e pendências externas/nativas explicitadas. Nenhum avanço para preços, totais, outras fases, monetização real ou publicação.
