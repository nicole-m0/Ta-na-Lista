# Tá na Lista! — Finalização da Etapa 3 e planejamento da Etapa 4

Data: 23/10/2026. Entrega exclusivamente de análise e planejamento. A implementação da Etapa 4 depende de autorização do usuário.

## 1. Resumo do estado atual e fontes

O aplicativo Android possui listas de compras locais e offline em SQLite, sem conta ou backend. A integração nativa AdMob está operacional com anúncios oficiais de teste. O erro `RNGoogleMobileAdsModule` foi resolvido atualizando a instalação antiga com o APK existente, sem necessidade de corrigir a biblioteca ou gerar outro APK.

Fontes examinadas: README atual; README da Etapa 1 no commit `a38b46d`; `RELATORIO-ETAPA-2.md`; `RELATORIO-ETAPA-3.md`; seção final de `DIAGNOSTICO-ADMOB.md`; histórico Git; código de telas, formulários, repositório, store, checklist, anúncios e testes; configurações Expo e dependências. O Git estava limpo no início desta análise. Não foi encontrado `AGENTS.md` no inventário do projeto.

**Limite do planejamento original:** não há arquivo separado de relatório da Etapa 1 nem roteiro detalhado de Etapa 4 no histórico local consultado. A Etapa 1 está documentada no README histórico. O único direcionamento funcional futuro explícito encontrado é a possibilidade de preços, estabelecimentos, comprovantes e eventos financeiros, com tabelas próprias referenciando os UUIDs existentes. Isso é uma possibilidade arquitetural, não uma autorização ou especificação desses recursos. Nenhum deles deve ser tratado como requisito original confirmado para a Etapa 4. Se existir roteiro externo, conciliá-lo antes de implementar novas funcionalidades.

A base é Expo SDK 58, React Native 0.88, React 19.3, TypeScript, Expo Router, `expo-sqlite` e `react-native-google-mobile-ads` fixado em 17.4.0. O aplicativo instalado é uma Development Build, não uma distribuição pública de produção.

## 2. Funcionalidades concluídas

| Área | Implementação existente | Evidência e limites |
| --- | --- | --- |
| Listas | Criar, renomear, duplicar e excluir com confirmação | Código e testes de repositório |
| Produtos | Adicionar, editar, excluir, marcar/desmarcar; quantidades decimais, sete unidades e oito categorias opcionais | Validação no formulário e no repositório |
| Compra | Progresso, contagem e percentual; adicionar e continuar | Dados persistidos localmente |
| Organização | Ordem original, pendentes primeiro e agrupamento por categoria | Ordenação visual sem regravar a ordem no SQLite |
| Busca | Busca parcial ignorando acentos e maiúsculas; limpar e estado sem resultados | Busca dentro da lista |
| Sugestões | Até oito produtos frequentes derivados das listas existentes | Sem catálogo remoto; não é histórico permanente de compras |
| Duplicação | Novos UUIDs, sequência, quantidades e categorias preservadas; cópia desmarcada | Transação com rollback; origem preservada |
| Interface | Identidade visual, ícone, estados vazios/erro, áreas seguras e recursos básicos de acessibilidade | Revisão completa com TalkBack, fontes ampliadas e diferentes telas ainda pendente |
| SQLite | WAL, chaves estrangeiras, escritas serializadas, SQL parametrizado, integridade e recusa de schema futuro | Banco `ta-na-lista.db`, `user_version = 1` |
| AdMob | SDK nativo, banner adaptativo oficial de teste somente na Home e gate UMP | Banner confirmado no Moto G84; checklist sem banner |
| Privacidade técnica dos anúncios | Gate por `canRequestAds`, revisão quando UMP exige, falha fechada e requisições não personalizadas | Fluxo implementado; mensagens da conta e cobertura regional não validadas |

A confirmação física final de 23/10 registrada no diagnóstico prevalece sobre trechos históricos que ainda dizem que a build ou o teste nativo estão pendentes. A atualização preservou todas as linhas e timestamps do SQLite, com comparação integral e integridade válidas. Esta análise não acessou novamente o banco do aparelho.

## 3. Pendências da Etapa 3

### Consentimento e privacidade dos anúncios

1. Definir público, idade, países atendidos, finalidades e requisitos aplicáveis; classificação de conteúdo `G` não substitui a definição de público nem as configurações destinadas a menores.
2. Validar as mensagens em Privacy & messaging da conta correta, idioma e provedores. O App ID de demonstração pertence ao Google: o banner funcionar não valida mensagens da conta da desenvolvedora. A documentação Google vincula as mensagens ao App ID configurado e orienta atualizar o consentimento a cada abertura. [Fonte: UMP Android](https://developers.google.com/admob/android/privacy).
3. Planejar teste regional com aparelho de teste UMP: apresentação inicial, opções aplicáveis, recusa, revisão, alteração das escolhas, falha de rede e retomada. O resultado que permite anúncios deve vir do SDK; não presumir que toda recusa implica `canRequestAds = false`, nem interpretar `NOT_REQUIRED` como aceite.
4. Definir identidade e contato do controlador, canal de direitos, texto e URL verdadeira da política de privacidade. Não inventar dados institucionais. A política geral deve poder ser consultada independentemente do botão condicional de opções UMP.
5. Revisar cobertura brasileira e base legal com orientação adequada antes de monetização real. UMP não comprova, sozinho, conformidade integral; anúncios não personalizados não eliminam as obrigações de transparência e avaliação das escolhas.
6. Documentar os fluxos de dados dos SDKs. O conteúdo das listas não é enviado pelo código inspecionado; o SDK de anúncios pode coletar IP, interações, diagnósticos e identificadores. Bloquear AD_ID não equivale a impedir toda coleta. [Fonte: divulgação de dados do Google Mobile Ads](https://developers.google.com/admob/android/privacy/play-data-disclosure).
7. Preparar insumos de Data safety para uma futura versão distribuível, conferindo comportamento e versões finais; não preencher ou submeter a Play Console nesta etapa.

Validação de mensagens vinculadas à conta pode exigir configuração e App ID próprios: isso é um trabalho futuro que precisa de autorização específica, inventário dos impactos nativos e manutenção de inventário de teste. Não substituir IDs nem ativar anúncios reais nesta análise ou automaticamente ao iniciar a Etapa 4.

### Qualidade e fechamento técnico

- Completar ensaios físicos de modo avião, encerramento/reabertura, falhas de rede, consentimento, fontes ampliadas, telas estreitas, TalkBack, teclado e navegação Android.
- Confirmar o manifest efetivo da instalação atual: permissões, AD_ID, backup/transferência, componentes exportados e diferenças entre desenvolvimento e produção. O diagnóstico registra `ALLOW_BACKUP` na instalação antiga; isso não descreve necessariamente o APK atualizado. O JSON e uma inspeção parcial não comprovam todos esses controles no binário final.
- Atualizar futuramente as passagens históricas do README e do relatório da Etapa 3 que ainda orientam gerar/instalar uma build já existente, dizem que anúncios estão desativados ou registram somente 16 testes. Preservar o histórico com datas e indicar o resultado atual.
- Reavaliar os alertas de dependências antes de ampliar o projeto. A contagem histórica não deve ser divulgada como auditoria atual.

## 4. Escopo recomendado para a Etapa 4

**Recomendação: consolidação, privacidade e confiabilidade da base atual, seguida da definição de um incremento funcional pequeno.** A Etapa 3 está funcionalmente validada quanto ao módulo nativo e ao banner, mas não encerrada quanto à privacidade e à regressão completa.

### Etapa 4A — base obrigatória proposta

- Concluir as pendências verificáveis da Etapa 3, sem alterar a lógica de listas nem contornar UMP.
- Consolidar a documentação atual, o mapa de dados e os requisitos da política de privacidade; qualquer publicação de política continua fora desta tarefa.
- Revisar riscos técnicos abaixo, acrescentando apenas correções justificadas e testes de regressão quando a implementação for autorizada.
- Elaborar e validar um procedimento consistente de preservação/recuperação dos dados em ambiente de teste. Não criar automaticamente backup em nuvem, exportação pública ou rotina que substitua o banco do usuário.
- Registrar resultados físicos pendentes e critérios claros de encerramento.

### Etapa 4B — incremento funcional condicionado ao roteiro e à aprovação

Se o roteiro externo confirmar a evolução financeira mencionada no README, o primeiro candidato é **preço unitário opcional e total estimado por lista, inteiramente local**. A proposta é inferida da direção futura documentada; não constitui escopo já contratado.

Antes de aprovar esse candidato, especificar moeda, limites, escala/precisão, arredondamento com quantidades fracionárias, total de comprados versus total geral, tratamento de preço ausente, edição e duplicação. Produto antigo deve continuar sem preço, não receber preço zero fictício. Planejar migração incremental e representação monetária exata, sem usar ponto flutuante binário diretamente como fonte dos cálculos monetários. Só criar tabelas/campos após revisar esse desenho com o roteiro original.

Estabelecimentos, comprovantes, câmera/OCR, eventos financeiros, comparações e histórico permanente devem ficar para incrementos próprios, com justificativa, requisitos de dados e aprovação. Backup/exportação, lixeira e sincronização também não são funcionalidades aprovadas por esta proposta.

### Fora do escopo

Premium, assinaturas, compras, pagamentos, remoção paga de anúncios, backend, login, analytics adicionais, mediação, anúncios reais, novos formatos de anúncio, suporte iOS/web e publicação. O parâmetro `premium` existente é somente um gate técnico; não comprova produto ou autorização de monetização. Não gerar APK, executar deploy, instalar atualizações ou publicar o aplicativo como parte deste planejamento.

## 5. Segurança, privacidade e proteção local

Não foi encontrada no código inspecionado evidência de SQL montado com entradas do usuário, envio de listas para servidores, segredo embutido ou rotina destrutiva de migração. Isso é análise de código, não certificação de segurança do APK.

| Prioridade | Achado ou risco | Ação recomendada e condição |
| --- | --- | --- |
| P0 — antes de anúncios reais | Consentimento regional e transparência incompletos | Manter testes e gate atual; concluir definições, política e validações da conta antes de qualquer ativação real |
| P1 — antes de novas dependências/funcionalidades | Auditoria histórica reporta 20 alertas altos transitivos de `braces`/`node-forge` no tooling | Reexecutar auditoria com acesso ao registro, avaliar árvore/caminho/exposição e patches compatíveis; não usar `audit fix --force`, downgrade ou overrides cegos |
| P1 — proteção dos dados | Sem recuperação oferecida pelo aplicativo; desinstalação/limpeza/perda do dispositivo podem eliminar listas | Validar procedimento de cópia consistente e restauração em cópia de teste antes de migrações; avisos corretos, sem prometer recuperação |
| P1 — configuração nativa | `allowBackup: false` e permissões bloqueadas precisam ser confrontados com manifest final e regras de transferência | Revisar artefato existente quando autorizado; mudanças nativas somente por necessidade demonstrada, com build separadamente autorizada |
| P2 — confiabilidade | `StoreProvider` não fecha explicitamente a conexão aberta se a inicialização falha ou o efeito perde atividade | Revisar ciclo de vida e repetição de tentativas, propriedade da conexão e descarte seguro, sem fechar conexão ainda em uso |
| P2 — consistência da interface | Mutação de lista na Home não possui trava de operação como o checklist/formulários; repetição rápida pode enfileirar operações | Testar cliques repetidos, especialmente duplicação/exclusão; propor bloqueio durante operação se reproduzido |
| P2 — escala local | Sugestões carregam todos os produtos e agrupam em memória; busca normaliza consulta repetidamente | Medir com bases grandes sintéticas antes de otimizar; preservar semântica, frequência e ordem |

O Android documenta que `allowBackup=false` pode não impedir transferências entre aparelhos em alguns fabricantes Android 12+, exigindo avaliação de regras específicas. Não afirmar que esse único atributo elimina todas as cópias. [Fonte: Auto Backup Android](https://developer.android.com/identity/data/autobackup).

Regras para a implementação futura:

- Preservar `com.tanalista.app`, assinatura, nome e localização do SQLite, UUIDs, relacionamentos e registros antigos. Não desinstalar, limpar armazenamento ou recriar tabelas para resolver incompatibilidades.
- Manter migrações incrementais transacionais e testes com bancos anteriores e versão futura. Ausência de novas tabelas/colunas nesta etapa de planejamento; manter schema 1.
- Em cópia consistente, considerar WAL/SHM: copiar apenas o arquivo principal enquanto há escrita pode omitir transações. Usar mecanismo consistente e verificar integridade antes de restauração; não experimentar restaurações no banco real.
- Continuar validação no repositório e na interface: nomes de 1 a 80 caracteres após trim, quantidade decimal finita positiva até 99999, unidades/categorias permitidas e parâmetros SQL. Para futuras rotas/importações, validar tipos, tamanho, formato e existência dos identificadores; uma tipagem TypeScript não valida entrada externa em runtime.
- Garantir que falha de gravação não seja apresentada como sucesso e que exclusões continuem explícitas e confirmadas. Revisar alterações que não atingem registros para evitar sucesso aparente em dados obsoletos.
- Não expor listas, strings de consentimento, IDs de dispositivo, cópias SQLite ou logs brutos em Git, relatórios ou serviços externos. `.expo/` está ignorada, mas seus backups/logs continuam sensíveis no computador; definir guarda, acesso e descarte consciente, sem apagá-los nesta tarefa.
- Não prometer criptografia própria: o app usa armazenamento privado do Android e não configura SQLCipher. Criptografia adicional exige análise de ameaça, chaves e migração não destrutiva; não introduzi-la como mudança automática.
- Preservar isolamento entre SQLite e anúncios; nenhuma lista, nome de produto ou categoria deve alimentar publicidade. Falhas de SDK, rede ou consentimento não podem impedir CRUD local.
- Manter Metro em rede confiável, sem exposição pública. Development Build é depurável; endurecimento para distribuição pública deve ter revisão própria.

## 6. Ordem de implementação após autorização

1. Conciliar eventual roteiro externo e aprovar o escopo exato: 4A isolada ou 4A com um incremento 4B especificado.
2. Registrar baseline de código, dependências e testes; planejar preservação de dados sem acessar/modificar o banco real sem necessidade.
3. Revalidar vulnerabilidades e configuração nativa; selecionar correções compatíveis, sem mudança ampla de stack.
4. Definir público, mapa de dados, requisitos de política e plano de testes UMP. Configuração da conta e IDs próprios somente quando autorizados; pendências externas não justificam desativar o gate.
5. Corrigir problemas de confiabilidade confirmados e lacunas documentais; executar regressão da base offline e AdMob.
6. Encerrar a validação da Etapa 3 com evidências e pendências externas explicitadas. Trabalhos locais de 4A podem avançar sem monetização real; publicação continua bloqueada pelo escopo.
7. Somente se aprovado o incremento 4B: detalhar modelo/UX/migração, ensaiar em cópia de teste, implementar em partes e validar compatibilidade com dados antigos.
8. Apresentar resultado e riscos residuais. Qualquer necessidade de APK, deploy ou publicação exige nova autorização; não está incluída na autorização genérica para implementar código.

## 7. Critérios de teste e validação

| Grupo | Critério de aceite |
| --- | --- |
| Preservação | Sem migração funcional, comparar integralmente linhas/UUIDs/timestamps/estados antes e depois em base de teste; em migração autorizada, comparar todos os campos antigos, admitindo somente diferenças previstas |
| Integridade | `quick_check = ok`, `foreign_key_check` sem violações, schema esperado; banco futuro recusado sem alteração; falha não apaga/repara silenciosamente dados |
| Transações | Falha induzida reverte duplicação/migração inteira; operações concorrentes mantêm consistência; tentativas repetidas não causam duplicações involuntárias |
| Funcional | CRUD, exclusões canceladas/confirmadas, duplicação desmarcada, busca sem acentos, ordenação estável, progresso global e sugestões preservados |
| Entradas | Vazio, espaços, limites de tamanho, nomes com aspas/SQL armazenados literalmente; zero/negativo/NaN/infinito/acima do limite, hexadecimal/notação científica/unidade/categoria inválidas rejeitados sem gravação |
| Offline | Dados antigos e CRUD disponíveis sem internet e após encerramento/reabertura; distinguir recarga JS dependente de Metro de funcionamento offline de distribuição standalone |
| AdMob | Somente banner oficial de teste na Home; ausente no checklist e durante formulários/menus/confirmações; sem sobreposição nem clique acidental; sem coleta do conteúdo das listas |
| Consentimento | Atualização por abertura, escolhas aplicáveis, revisão quando exigida, mudança de permissão e falhas; nenhuma solicitação antes do gate e nenhuma inicialização duplicada no controlador; erro mantém listas acessíveis |
| Privacidade nativa | Manifest e regras efetivas compatíveis com decisões de permissões, backup e transferência; logs sem conteúdo de compras e sem exposição indevida de identificadores |
| Usabilidade | Android voltar/gestos/três botões, teclado, fonte ampliada, TalkBack, movimento reduzido e telas pequenas; erros recuperáveis sem perda do formulário |
| Incremento financeiro, se aprovado | Valores ausentes/limites/decimais, arredondamento, quantidades fracionárias, total comprado/geral, duplicação, migração e offline conforme especificação aprovada |

As regressões automatizadas devem passar com `npm.cmd run typecheck`, `npm.cmd run lint` e `npm.cmd test`. Revalidar alinhamento Expo e dependências quando houver alteração relevante. Testes Node usam SQLite temporário, não o banco do celular. Ensaios físicos que alterem registros devem usar dados de teste e não as listas pessoais preservadas.

## 8. Verificação desta análise e decisão

Resultados desta rodada: `npm.cmd run typecheck` e `npm.cmd run lint` concluíram sem erros; `npm.cmd test` passou com 17/17 testes. Permanecem apenas os avisos conhecidos do Node sobre detecção de módulos TypeScript e SQLite experimental. `git diff --check` não apontou problemas nos arquivos rastreados; o status final registra somente este novo relatório como não rastreado.

Não foram reexecutados `npm audit`, Expo Doctor, inspeção nativa ou testes no aparelho nesta análise. Os 20 alertas altos são evidência histórica da Etapa 3, não uma contagem atual confirmada; a auditoria atualizada permanece uma ação prioritária antes da implementação. As fontes oficiais de UMP, divulgação de dados do SDK e backup Android foram consultadas para fundamentar este planejamento.

Não foram executados build, export de bundle, deploy, instalação, alteração de conta AdMob ou acesso ao banco do aparelho. A única entrega intencional é este relatório; configurações, código, dependências e dados permanecem preservados.

**Decisão recomendada:** aprovar primeiro a Etapa 4A de consolidação e manter 4B dependente da confirmação do roteiro e da especificação. Aguardar autorização antes de implementar qualquer parte da Etapa 4.
