# Tá na Lista! — Etapa 3

## Escopo e arquitetura

Implementação Android com anúncios de teste. Nenhum EAS Build, publicação, anúncio real, assinatura ou compra foi executado/implementado. Git estava limpo antes das mudanças; não houve reset, limpeza de dados ou recriação do projeto.

Base examinada: Expo 58.0.16, React Native 0.88.0, React 19.3, TypeScript 6.0.3, Expo Router 58.0.24 e SQLite 58.0.13. Após correções compatíveis, lockfile resolve Expo 58.0.17, Router 58.0.25, Linking 58.0.14, Status Bar 58.0.4 e Constants 58.0.13. React Native e SQLite foram preservados. Usar `npm.cmd ci` para reproduzir o lockfile.

O StoreProvider abre `ta-na-lista.db`; Repository serializa gravações e usa parâmetros SQL, WAL, foreign keys, transações e cascata. A interface usa Expo Router, Safe Area e confirma exclusões. Os antigos AdBanner/ads eram stubs. Não foram encontrados fetch de listas, analytics, segredos ou logs de conteúdo no código da aplicação. IDs EAS/pacote são identificadores públicos.

## Anúncios e compatibilidade

Escolhida e fixada `react-native-google-mobile-ads@17.4.0`, após consultar documentação oficial e metadados do pacote: Expo >=47, RN >=0.86, Nova Arquitetura obrigatória; Android min SDK 24, compile/target 36. Expo 58/RN 0.88 atendem a base declarada. Não houve compilação Gradle: compatibilidade efetiva do APK ainda depende da nova build.

SDKs Android incluídos: Google Mobile Ads 25.5.0 clássico e UMP 4.0.0. Plugin Expo configurado com `androidSdk: classic` e `delayAppMeasurementInit: true`.

Somente IDs oficiais Google:

| Uso | ID |
| --- | --- |
| App Android | `ca-app-pub-3940256099942544~3347511713` |
| Banner adaptativo Android | `ca-app-pub-3940256099942544/9214589741` |

O banner reutilizável só monta na Home focada, sem formulário, menu ou confirmação de exclusão abertos. Footer com espaçamento de 40 dp entre seções e 24 dp internos; largura adaptativa medida no contêiner, dentro da Safe Area. Falha de carregamento desmonta o banner até nova montagem, sem interromper o checklist. Sem intersticiais, vídeos obrigatórios, mediação ou palavras-chave derivadas das listas.

`src/services/ads.ts` centraliza enabled, ID e solicitação não personalizada. `adsEnabled` considera enabled, premium, modo de desenvolvimento e Android; builds de produção ficam bloqueadas nesta etapa. `AdsProvider` aceita futuramente um entitlement `premium`, atualmente false, sem implementar Premium. Desabilitar impede novas montagens; SDK já inicializado não pode ser desinicializado. Não existem dependências da lógica de listas para anúncios.

## Consentimento e limites

Na abertura do processo, o adaptador chama `AdsConsent.gatherConsent()` (atualização UMP + formulário oficial quando necessário). Só após sucesso e `canRequestAds` verdadeiro configura/inicializa Mobile Ads. Não se usa status OBTAINED como prova de aceite, nem cache próprio de consentimento. UMP administra os sinais de escolha, inclusive veiculação limitada quando permitida. Solicitações são sempre não personalizadas nesta etapa; isso não significa ausência de coleta.

Falhas de atualização, formulário ou inicialização fecham o gate; não há fallback para anúncios usando escolhas antigas. Offline: listas continuam disponíveis e aparece opção de tentar verificar anúncios novamente. A verificação não depende do banco de compras. Inicialização é serializada e única por controlador. Ao revisar privacidade, banner é desmontado e somente volta se o resultado atual permitir. Botão `Privacidade dos anúncios` aparece quando UMP retorna privacyOptionsRequirementStatus REQUIRED. Nenhum formulário de consentimento foi imitado, nenhuma string de consentimento ou ID de dispositivo é registrada pelo app.

O App ID de demonstração pertence ao Google e não pode ser configurado na conta da desenvolvedora. Portanto não há garantia de formulário UMP disponível com ele. Erros de configuração podem impedir o banner, por decisão de falhar de modo fechado. Não ignorar UMP para forçar exibição. Validação de mensagens reais vinculadas à conta fica pendente; nesta etapa não substituir por IDs reais.

UMP não é certificado de conformidade integral com LGPD: NOT_REQUIRED informa a avaliação do SDK para mensagens configuradas, não constitui uma base legal brasileira. Permanecem pendentes definição de público/idade, países, finalidades, base legal, transparência e direitos do titular. A ANPD recomenda avaliar consentimento para publicidade e escolhas efetivas. Antes de qualquer etapa real, revisar a cobertura brasileira e escolher ferramenta oficial/CMP adequada se UMP não cobrir o fluxo necessário. Não tratar anúncios não personalizados como dispensa automática de obrigações.

## Segurança e dados

- SQL parametrizado e validações existentes de nome (1–80), quantidade finita positiva até 99999, unidade e categoria preservadas. Teste com nome contendo SQL confirma armazenamento literal.
- Mantido schema/user_version 1: nenhuma migração destrutiva nem alteração do nome/local do banco. Acrescentados `PRAGMA quick_check` e `foreign_key_check` na abertura. Inconsistências bloqueiam acesso com erro recuperável, sem apagar ou reparar silenciosamente dados.
- Testes existentes cobrem rollback, duplicação, gravações concorrentes, cascata e reabertura. Exclusão da lista continua exigindo confirmação. Não há desfazer/lixeira/exportação nesta etapa.
- Removidas do manifest via blockedPermissions: armazenamento externo de leitura/escrita, áudio, overlay, vibração e Advertising ID. Antes o app.json não declarava permissões, mas o template Expo introduzia permissões por padrão; a ausência no JSON não equivale a ausência no APK.
- INTERNET permanece necessário ao dev client e AdMob; SDK declara também ACCESS_NETWORK_STATE e WAKE_LOCK. Não há câmera, contatos ou localização solicitados pelo app. AD_ID é bloqueado para minimizar identificadores; isso não elimina IP, app set ID ou diagnóstico do SDK.
- `allowBackup: false` restringe backup automático Android, sem remover dados atuais. O alcance sobre transferência entre aparelhos depende da versão/fabricante e deve ser verificado no APK. Sem backup/exportação próprios: desinstalar, limpar armazenamento ou perder o aparelho pode perder listas. Não desinstalar para atualizar a build.
- Sem logs de payloads/listas/erros crus adicionados; bibliotecas e dev client podem emitir logs de diagnóstico/IDs de teste. Não compartilhar logcat bruto sem revisão.
- Development Build continua contendo Metro/dev menu e não é release para distribuição pública. Conferir manifest final, componentes exportados, rede em texto claro (Metro pode requerer HTTP), backups/transferência, minificação e assinatura em futura build de produção. Não foi introduzida lib extra de segurança, autenticação ou criptografia personalizada.

### Auditoria de dependências

`npm audit` inicial após AdMob: 23 alertas (20 altos, 3 moderados). Aplicado `npm audit fix` sem force, após simulação; patches dentro do SDK e atualização compatível de tooling resolveram `@expo/config-plugins → xcode → uuid` (xcode 4.0.0, uuid 7 removido). Nenhum downgrade/override incompatível.

Resultado final: **20 altos, 0 moderados, 0 críticos**. São entradas propagadas de duas causas diretas: `braces` (exaustão de pilha por padrões profundamente aninhados, GHSA-vfj7-8cjw-p6xm) na cadeia Metro/micromatch; e `node-forge` (verificação RSA PKCS#1 v1.5, GHSA-86w9-cpqp-85rv) no tooling de certificados/CLI Expo. O npm sugere Expo 44/RN 0.72/AdMob 13 para resolver a árvore, incompatíveis com esta base; não aplicados. O alerta atribuído ao AdMob é propagado por peers Expo/RN, não evidência de falha direta do SDK Google.

Risco pendente: tooling processando entradas/certificados não confiáveis; manter Metro restrito a rede confiável e acompanhar patches upstream. Não declarar a árvore livre de vulnerabilidades. A auditoria npm não examina todas as dependências Maven nem comprova segurança do APK. Relatório técnico bruto local em `.expo/stage3-audit.json` (ignorado pelo Git).

## Pendências da conta AdMob e privacidade

1. Em futura etapa autorizada, cadastrar app Android correto e revisar Privacy & messaging, países, provedores e idioma pt-BR. Nenhum dado da conta foi inventado.
2. Criar/publicar mensagens oficiais aplicáveis ao EEE/Reino Unido/Suíça e regiões dos EUA quando aplicável; revisar requisitos brasileiros e públicos menores de idade. Definir público e flags legais antes de anúncios reais.
3. Informar URL pública verdadeira de política de privacidade, identidade do controlador e canal de direitos; hoje não existem dados fornecidos para preenchê-los.
4. Para teste futuro de mensagens da conta, registrar aparelho de teste UMP, simular regiões apenas em desenvolvimento, testar aceitar/recusar/reabrir/revogar/sem internet. Não usar reset de consentimento em produção. App de demonstração atual não valida a configuração da sua conta.
5. Sem mediação nesta etapa; qualquer novo parceiro exige nova revisão de consentimento e declaração.

### Insumos para política e Data safety (rascunho técnico, não declaração final)

Listas/produtos, categorias, quantidades, datas e estados de compra ficam no SQLite privado do app; não são enviados pelo código a servidores nem usados como targeting/analytics. Sem login, nome/email de cadastro ou backend. Exclusão é local; desinstalação/limpeza pode apagar tudo. Sem promessa de recuperação, armazenamento criptografado pelo app ou prazo de retenção de terceiros inventado.

Google Mobile Ads pode coletar/compartilhar IP (localização aproximada), interações com anúncios/app, diagnósticos e identificadores do dispositivo/app para publicidade, medição e prevenção de fraude. AD_ID foi removido; outros identificadores podem permanecer. Transporte do SDK Google utiliza TLS segundo a documentação. Test ads também fazem conexões externas; não afirmar “nenhum dado é coletado”. UMP processa escolhas conforme sua documentação.

Antes de preencher Play Console: conferir versão final dos SDKs e comportamento em runtime; categorias coletadas/compartilhadas, finalidades, opcionalidade, retenção/exclusão, países e provedores; declarar presença de anúncios e a ausência de envio do conteúdo das compras. Identidade/contato do controlador, URL, base legal e retenção de cada agente ficam pendentes. Não foi submetido formulário Play Store.

## Testes

| Verificação | Resultado |
| --- | --- |
| Typecheck `npm.cmd run typecheck` | Passou |
| Lint `npm.cmd run lint` | Passou, sem avisos |
| Testes `npm.cmd test` | 16/16 passaram |
| Expo Doctor | 20/20 passaram |
| `npx.cmd expo install --check` | Dependências alinhadas |
| Introspecção Expo Android | Plugin, test App ID, measurement delay, backup e remoções de permissões conferidos; não equivale ao manifest mesclado do APK |
| Export do bundle Android | Passou: 1382 módulos, saída `.expo/stage3-export`; não é APK |
| Ativação/desativação | Testados enabled/Premium/produção/plataforma, concorrência, recusa, revisão, falha de inicialização, desativação durante consentimento |
| Offline | Falha simulada do adaptador impede SDK; SQLite continua criando/editando/checklist; não é teste físico de modo avião |
| Dados locais | Reabertura, migração idempotente de dados existentes, rollback, cascata, versão futura recusada, órfãos preservados e detecção de inconsistência |
| Aparelho e compilação nativa | Não executados; pendentes após autorização da build |

Avisos conhecidos do runner Node 22: SQLite experimental e detecção automática de módulos TS; não são falhas dos testes. Export Android é verificação adicional de bundling, não instalação nem execução em aparelho.

O plugin avisa que iosAppId está ausente: esta entrega é Android e não prepara uma build iOS. Não gerar iOS sem configurar seu ID de teste oficial e revisar requisitos específicos. Metro encontrou cache antigo incompatível e recuperou com leitura completa; o export terminou com sucesso.

## Nova Development Build — somente após autorização

É necessária nova build por incluir SDK/plugin nativos e novas regras de manifest. `eas.json` já tem developmentClient, distribuição interna e APK, preservados. No PowerShell, na raiz:

```powershell
npx.cmd eas-cli build --platform android --profile development
```

Depois: baixar APK no link fornecido pelo EAS e instalar como atualização sobre o app existente (mesmo pacote `com.tanalista.app` e mesma chave). Alternativa com Android Platform Tools:

```powershell
adb install -r "C:\caminho\ta-na-lista-development.apk"
npm.cmd run start:dev
```

Se assinatura incompatível, não desinstalar nem limpar armazenamento para resolver: isso remove listas. Recuperar a chave correta. Se houver versão incompatível, revisar versionCode/build antes da atualização. Development Build exige Metro para carregar JS; testar offline após bundle carregado e distinguir isso de um APK standalone.

Roteiro físico pendente: registrar listas existentes antes de atualizar; confirmar listas/itens e comprados após atualização/reinício; checklist em modo avião; UMP com mensagens reais de teste configuradas quando autorizado; recusa/revisão e falha de rede; banner marcado como teste somente na Home; abrir formulário/menu/exclusão e navegar para checklist; verificar toque acidental, telas estreitas, fontes grandes, navegação por gestos e três botões. Conferir manifest final e permissão AD_ID ausente. Nenhum desses testes físicos foi declarado aprovado.

## Fontes oficiais consultadas

- [Invertase: requisitos](https://docs.page/invertase/react-native-google-mobile-ads/prerequisites) e APIs/tipos do pacote instalado 17.4.0.
- [Invertase: UMP](https://docs.page/invertase/react-native-google-mobile-ads/european-user-consent).
- [Google: UMP Android](https://developers.google.com/admob/android/privacy).
- [Google: anúncios de teste](https://developers.google.com/admob/android/test-ads).
- [Google: LGPD](https://support.google.com/admob/answer/9930897?hl=pt-BR).
- [ANPD: guia cookies e dados pessoais](https://www.gov.br/anpd/pt-br/centrais-de-conteudo/materiais-educativos-e-publicacoes/guia-orientativo-cookies-e-protecao-de-dados-pessoais.pdf).
- [Google: Data safety, SDK 25.5.0](https://developers.google.com/admob/android/privacy/play-data-disclosure).
- [Advisory braces](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm), [node-forge](https://github.com/advisories/GHSA-86w9-cpqp-85rv), [uuid](https://github.com/advisories/GHSA-w5hq-g745-h8pq).

Aguardando aprovação para o próximo passo. Não avançar para anúncios reais, Premium ou publicação.
