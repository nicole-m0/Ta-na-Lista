# Tá na Lista! — Etapa 4, fase 2

Data: 23/10/2026. Escopo: investigar dependências, revisar UMP, estabilidade, persistência offline e proteção de informações. Não foi iniciada outra fase.

Antes de editar arquivos foram lidos integralmente `RELATORIO-PLANEJAMENTO-ETAPA-4.md`, `RELATORIO-ETAPA-4-FASE-1.md` e `DIAGNOSTICO-ADMOB.md`. O diretório já continha as alterações não commitadas da fase 1 e seus relatórios; foram preservados. A confirmação física histórica de AdMob em 23/10 prevalece sobre as hipóteses iniciais do diagnóstico, mas não comprova o funcionamento das alterações desta fase no Android.

## 1. Investigação dos cinco alertas

`npm.cmd audit --json` foi consultado novamente no registro: **5 altos, 0 moderados, 0 críticos**. Não são cinco falhas independentes: a resposta indica uma causa em `node-forge` e quatro entradas propagadas pela árvore.

| Entrada auditada | Gravidade npm | Origem/exposição identificada | Decisão |
| --- | --- | --- | --- |
| `node-forge@1.4.0` | Alta, CVSS v3 7,5 na resposta npm | Verificação RSA PKCS#1 v1.5 aceita elementos extras em DigestAlgorithm; risco de integridade ao processar assinaturas/certificados hostis, especialmente chaves de baixo expoente | Sem versão corrigida publicada identificada; acompanhar upstream |
| `@expo/code-signing-certificates@0.0.7` | Alta, propagada | Depende de `node-forge ^1.4.0`; código instalado usa verificação de certificado, assinatura e CSR | Versão publicada atual continua 0.0.7, sem solução por atualização identificada |
| `@expo/cli@58.1.14` | Alta, propagada | CLI depende diretamente de forge e do pacote de certificados | Última versão consultada da série 58 ainda usa forge ^1.4.0 |
| `expo@58.0.17` | Alta, propagada | Encadeamento via CLI; não é evidência de uma falha independente no SQLite/React Native | Manter SDK 58; não aplicar downgrade |
| `react-native-google-mobile-ads@17.4.0` | Alta, propagada | Encadeamento informado por Expo, não um advisory direto do SDK nativo Google | Preservar integração funcional e inventário de teste |

A classificação alta não foi reduzida. A exposição prática depende do uso do tooling e de material criptográfico não confiável; a aplicação inspecionada não importa forge nem processa certificados no fluxo de listas. Isso não prova que todo caminho de desenvolvimento esteja protegido. O pacote de certificados instalado contém chamadas `certificate.verify`, `publicKey.verify` e `csr.verify`: não é correto descartar o risco como uma dependência necessariamente inativa.

### Evidências de compatibilidade e correção

- `npm view node-forge dist-tags versions --json`: `latest = 1.4.0`; não foi encontrada versão publicada posterior à afetada.
- `npm view @expo/code-signing-certificates version dependencies --json`: 0.0.7, forge ^1.4.0.
- `npm view @expo/cli@58 ...`: a série consultada termina em 58.1.14, com forge ^1.4.0 e certificados ^0.0.7. Regressar para versões anteriores da mesma série mantém versões de forge dentro do intervalo afetado e pode reintroduzir correções antigas.
- O problema está descrito no [repositório do forge, issue 1149](https://github.com/digitalbazaar/forge/issues/1149); há uma [proposta de correção ainda aberta, PR 1152](https://github.com/digitalbazaar/forge/pull/1152), não uma versão publicada que possa ser adotada automaticamente.
- A auditoria sugere Expo 44.0.6 e AdMob 13.6.1 para parte da árvore. Esses downgrades não são compatíveis com a base atual. `fixAvailable: true` em uma entrada não substitui a verificação das versões e caminhos reais.
- `npx.cmd --no-install expo install --check`: **Dependencies are up to date**. A primeira tentativa sofreu `EACCES` de rede no ambiente restrito; a repetição com acesso autorizado passou.

**Atualizações aplicadas: nenhuma.** Não foi identificada uma atualização publicada que resolva os cinco alertas e preserve a base compatível. Não houve `audit fix`, `--force`, override, fork, edição de node_modules, instalação ou alteração de package.json/lockfile. Nenhuma dependência foi atualizada apenas para diminuir a contagem de alertas.

Mitigações: manter Metro e ferramentas em rede confiável, não expor o servidor de desenvolvimento publicamente, verificar origem dos certificados/chaves e não processar material hostil no tooling. Não desativar verificação criptográfica. Reavaliar quando forge/Expo publicarem correção compatível. A auditoria npm não examina todas as dependências Maven ou o APK final.

## 2. Alterações de código e proteção de informações

### Operações repetidas

O formulário de lista, o formulário de produto e as mutações do checklist verificavam somente `busy` do React. Dois callbacks usando o mesmo render podem observar `false` antes da atualização visual. Isso pode gerar inclusão duplicada ou dois toggles que anulam a marcação.

Foi reutilizada nesses três pontos a trava síncrona `createOperationGate`, mantida em `useRef`, que já existia na Home. A aquisição ocorre antes do primeiro await e novas chamadas durante a operação são ignoradas. O estado visual ocupado continua existindo, e a trava é liberada após sucesso, erro ou validação inválida. Não foi alterada a semântica do repositório: dois toggles deliberadamente executados em sequência continuam sendo duas operações.

### Mensagens de erro

No formulário de lista, validação e gravação agora têm tratamento separado. Antes, uma exceção de `save` cuja mensagem contivesse “caracteres” podia ser apresentada literalmente como se fosse validação. Agora o erro de gravação sempre usa mensagem fixa; validação inválida recebe orientação local previsível. O nome validado/normalizado é passado ao salvamento. O formulário permanece disponível para nova tentativa.

### Prevenção de inclusão acidental em Git

`.gitignore` passou a incluir bancos locais e seus WAL/SHM mais comuns, arquivos SQLite, APK/AAB e chaves de assinatura JKS/keystore/P12. `.expo/`, `.env*`, node_modules e dist já estavam ignorados. `git check-ignore --no-index` confirmou padrões representativos, sem criar arquivos sensíveis.

A consulta dos caminhos rastreados não encontrou arquivos `.db`, `.sqlite*`, `.apk`, `.jks`, `.keystore` ou `.env*`. Não foram abertos backups pessoais nem impressos seus conteúdos. Ignore não protege arquivos já rastreados, não criptografa o disco e não é controle universal de upload para outros serviços. Nenhum arquivo histórico foi removido.

## 3. Revisão de segurança do aplicativo

- A inspeção de `src` não encontrou chamadas de rede para listas, credenciais embutidas ou logs de payloads de compras. Há logs de diagnóstico AdMob restritos a desenvolvimento, com fases/campos padronizados; SDKs e dev client podem produzir logs próprios. Esta é revisão direcionada, não auditoria completa de todo o histórico Git ou de dependências.
- IDs de teste Google, identificadores EAS e pacote Android são identificadores públicos; não foram confundidos com segredos.
- SQL continua parametrizado, gravações serializadas, operações de produto e timestamp da lista transacionais, com recusa de registro inexistente ou pertencente a outra lista. Nenhum SQL/schema/migração foi alterado nesta fase.
- Mantidas validações de tipos, nomes, quantidade, unidade, categoria e identificadores da fase 1. Testes novos reforçam que entradas malformadas não alteram registros existentes.
- Banco permanece em armazenamento privado do aplicativo, sem promessa de criptografia adicional, backup automático próprio ou recuperação de exclusões. Development Build é depurável e não deve ser distribuída como release pública.
- Logs, backups e screenshots históricos em `.expo/` continuam locais e sensíveis. Não houve upload, limpeza, restauração nem acesso ao banco do aparelho.

## 4. UMP: revisão e limites de validação

Foi inspecionado o `AdsConsent.ts` da biblioteca instalada: `gatherConsent()` executa `requestInfoUpdate()` e depois `loadAndShowConsentFormIfRequired()`. A implementação atual continua usando o formulário oficial, gate por `canRequestAds`, revisão quando exigida e sem cache próprio de escolhas. A [documentação Google UMP](https://developers.google.com/admob/android/privacy) fundamenta a atualização por abertura, o acesso às opções e a prevenção de solicitações redundantes.

Não foi necessária mudança funcional no controlador UMP nesta fase. Foram acrescentados testes para concorrência de revisão/retry, desativação enquanto o SDK inicializa e exceção síncrona com diagnóstico limitado à fase. O formulário oficial pode refletir recusa e ainda permitir modalidades limitadas; testes não equiparam status de formulário a aceite. O gate conservador que bloqueia anúncios quando a coleta falha foi preservado, sem fallback com escolhas antigas.

| Validação automática possível | O que ela comprova |
| --- | --- |
| Consentimento pendente e operações simultâneas | Banner não fica autorizado antes da resposta; uma revisão em andamento não é duplicada por retry |
| Falha de consentimento, inicialização ou revisão | Estado recuperável, gate fechado e diagnóstico sem erro bruto |
| Desativação durante inicialização | Conclusão tardia não volta a autorizar anúncios |
| Resposta inválida e `canRequestAds=false` | Nenhuma autorização indevida pela lógica testada |
| Revisão exigida após falha do SDK | A opção continua disponível na lógica do controlador |
| Falha offline de anúncios com CRUD local | Ausência de acoplamento lógico que bloqueie SQLite |

| Teste real Android necessário | Evidência esperada |
| --- | --- |
| Abertura/atualização UMP por processo | Fluxo real da biblioteca, Activity e SDK inicializados na build instalada |
| Mensagens regionais da conta | Formulário correto, idioma, opções e provedores; conta/configuração correta |
| Aceitar, recusar, reabrir e alterar escolhas | Efeito real sobre sinais UMP e comportamento do SDK, incluindo modos limitados |
| Offline, rede lenta e retorno do background | Recuperação sem crash, listas utilizáveis e ausência de anúncio sem gate |
| Banner e modais | Inventário exclusivamente de teste, Home correta, ausência no checklist/formulários, espaçamento e ausência de toques acidentais |
| Reinício, dados antigos e modo avião | Persistência Android real e operações locais; distinguir recarga JS pelo Metro de disponibilidade dos dados |
| Manifest efetivo | AD_ID/permissões, backup/transferência, componentes exportados e condições de rede do binário instalado |

Nenhum ensaio físico novo foi executado nesta fase. A confirmação histórica do banner no Moto G84 não valida os formulários da conta, as escolhas por região ou os componentes alterados agora. O App ID de demonstração permanece inalterado; mensagens da conta própria não podem ser comprovadas com ele. Não foram registrados IDs de aparelho, forçadas regiões, resetado consentimento ou configuradas mensagens na conta.

Política completa, responsável/canal de direitos, público/idade/países e avaliação da cobertura brasileira permanecem pendentes. O texto local de privacidade da fase 1 continua disponível offline e não representa certificação de conformidade.

## 5. SQLite, falhas e offline

Foram mantidos `ta-na-lista.db`, caminho, schema/user_version 1, UUIDs, timestamps, listas e produtos existentes. Não houve migração, reset, alteração de pacote ou assinatura. Testes usam bancos temporários/sintéticos e não a instalação Android.

Novas regressões verificam:

1. Submissões simultâneas através da trava geram apenas um produto e um toggle; após fechar/reabrir o SQLite, os dados permanecem e a integridade passa.
2. Produto inválido, identificador inválido e exclusão repetida não modificam registros/timestamps restantes.
3. Falha de integridade simulada bloqueia inicialização sem reescrever registros nem schema. O teste simula o resultado do PRAGMA; não injeta corrupção física em um arquivo pessoal.
4. Falhas de abertura e fechamento de conexão são rejeições aguardáveis e não publicam repositório inválido.
5. Reentrada na trava e exceção síncrona não deixam operações bloqueadas permanentemente.

Continuam aprovados os ensaios anteriores de rollback, cópia consistente com WAL, reabertura, integridade, versão futura, cascata, busca, sugestões e falha offline do adaptador Ads. Nada passou a depender de serviço externo para operar listas. Os testes Node não provam persistência em encerramento do Android, rede real ou timing de eventos nativos.

## 6. Resultados

| Verificação | Resultado |
| --- | --- |
| Typecheck | Aprovado |
| Lint | Aprovado, sem avisos ESLint |
| Testes automatizados | **33/33 aprovados**, 25 anteriores e 8 novos |
| Expo install --check | Dependências alinhadas ao SDK |
| npm audit | 5 altos pendentes, 0 moderados/críticos; sem correção publicada compatível identificada |
| git diff --check | Sem erro; avisos conhecidos de normalização LF/CRLF |
| Verificação de arquivos sensíveis/ignore | Padrões representativos confirmados; nenhum dos tipos consultados rastreado |

Avisos conhecidos do runner Node: módulos TypeScript detectados automaticamente e SQLite experimental. Não houve falha de teste por esses avisos.

Nenhuma configuração ou dependência nativa foi alterada. Não há necessidade identificada de nova Development Build para estas alterações JavaScript/TypeScript. Não foram executados build, APK, instalação, deploy ou publicação. Package.json, lockfile, app.json e eas.json permaneceram intactos nesta fase.

## 7. Pendências e recomendações

1. Executar o roteiro físico acima na build existente, com dados sintéticos para operações de alteração e conferência das listas antigas sem modificá-las. Registrar resultado por cenário; não presumir aprovação pelos 33 testes.
2. Acompanhar correção publicada de forge e adoção compatível pelo Expo. Reexecutar auditoria antes de futura distribuição e reavaliar o risco residual do tooling. Não aplicar downgrade ou patch criptográfico improvisado.
3. Concluir definições de público/privacidade e planejar validação UMP da conta com inventário de teste. Qualquer mudança nativa ou App ID próprio exige justificativa prévia; nenhuma foi realizada.
4. Inspecionar manifest/backup/transferência e demais controles no artefato efetivo em uma validação Android própria. Não prometer que `allowBackup=false` elimina toda transferência entre fabricantes.
5. Para futura distribuição pública, revisar logs do SDK, exposição do dev client, política completa e Data safety. Não publicar nesta fase.

Fase 2 encerrada no escopo autorizado, com os alertas externos ainda explicitamente pendentes. Não houve avanço para outras fases, Premium, assinaturas, anúncios reais ou novas funcionalidades financeiras.
