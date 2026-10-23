# Diagnóstico Android — RNGoogleMobileAdsModule (23/10/2026)

## Conclusão

**Resolvido via atualização autorizada:** o Moto G84 executava uma Development
Build anterior, instalada em 20/10, sem as classes AdMob. Ela foi atualizada com
o APK já existente da build EAS `e11a08c0`, usando somente `adb install -r`.
O erro desapareceu e o banner oficial de teste foi exibido. O SQLite foi
comparado integralmente com o backup; todas as linhas e timestamps coincidem.

A última build EAS **incluiu e compilou AdMob**. A hipótese de que o commit
`49c3db0` teria excluído as alterações locais foi refutada pelos logs e pelo APK.
As seções iniciais abaixo preservam o histórico; a confirmação física e os
resultados definitivos estão na seção final.

## Evidências confirmadas

- Build: `e11a08c0-f34d-4e29-bf27-7a770043ce03`, perfil `development`, Android,
  distribuição interna, pacote `com.tanalista.app`, versão `1.0.0`, versionCode `1`.
  Concluída em 22/10/2026, 16:59:06 (Brasília).
- O commit informado pelo EAS é `49c3db0`, anterior à integração. Entretanto,
  `READ_PACKAGE_JSON` registra `react-native-google-mobile-ads: 17.4.0` e
  `READ_APP_CONFIG` registra o plugin, `androidSdk: classic`, o App ID oficial de
  teste e `delayAppMeasurementInit: true`. As alterações relevantes não commitadas
  no momento do envio **entraram no snapshot compilado**. O hash do commit não
  deve ser usado sozinho como inventário do upload.
- Houve `npm ci --include=dev`, prebuild e tarefas Gradle do AdMob, incluindo
  `compileDebugKotlin`, `compileDebugJavaWithJavac` e empacotamento. Também foram
  executadas as tarefas de autolinking da aplicação. Resultado: `BUILD SUCCESSFUL`.
- A resolução local do autolinking encontra o pacote Java, a instância
  `ReactNativeGoogleMobileAdsPackage`, `RNGoogleMobileAdsSpec` e CMake gerado.
- O fingerprint EAS `b81c841222f51aa3e593aabcb47bd2b6c787bdd0` coincide com o
  fingerprint Android calculado da configuração local antes de qualquer alteração
  nesta investigação. Isso compara entradas nativas, não o APK instalado nem todo
  o código JavaScript.
- O APK contém `assets/app.fingerprint`, com hash
  `b05b7a54152cbe7e7581a52a71e09fdcb19f8d46` e uma entrada explícita do AdMob
  17.4.0 por `expoConfigPlugins` e `rncoreAutolinkingAndroid`. É o fingerprint
  interno calculado durante a compilação; não é o mesmo cálculo pré-upload acima.
- O APK baixado do artefato dessa build tem 280.916.302 bytes e SHA-256
  `d121df35ca3999fb7b7a5440e6d6725d5297d845ea9d1bf07a6ddc855f521a89`.
  Todos os CRCs ZIP passaram. Foram examinadas definições de classes DEX, não
  apenas referências em strings: `ReactNativeGoogleMobileAdsModule` e
  `ReactNativeGoogleMobileAdsPackage` estão em `classes2.dex`; `PackageList` está
  em `classes4.dex`. O manifest binário contém o pacote, a chave APPLICATION_ID
  e o App ID de teste configurado. A presença das classes não prova sua resolução
  em runtime no aparelho.
- Expo 58 / RN 0.88 / React 19.3 atendem à matriz declarada. AdMob 17.4.0 declara
  RN >=0.86; `expo install --check` passou. Não foi encontrada evidência de
  incompatibilidade que justifique downgrade. Compilar não substitui teste físico.
- O módulo Android clássico usa a interoperabilidade de módulos legados. No RN
  instalado, os defaults da Nova Arquitetura habilitam essa interoperabilidade;
  não se deve trocar flags ou editar a biblioteca apenas por ela registrar
  `isTurboModule: false`.

## Avisos e configuração

O aviso Gradle sobre `android_app_id` inclui a ressalva de que pode ser ignorado
com o plugin Expo. O App ID aparece no manifest do APK; duplicar configuração
legada não corrige esse erro. O aviso de `iosAppId` não se aplica a este APK.
Codegen SKIPPED é coerente com `includesGeneratedCode: true` no pacote, que
distribui seus arquivos gerados. Não foi encontrado erro fatal nos logs.

O perfil EAS já usa `developmentClient: true` e saída APK. Não há diretório
Android versionado substituindo o prebuild nem exclusão local do AdMob no
autolinking. Nenhuma mudança nativa foi necessária com as evidências atuais.

## O que falta confirmar no Android

Na investigação inicial, ADB não estava no PATH nem no local padrão do SDK.
Na retomada de runtime, Platform Tools oficiais foram extraídas em
`.expo/android-tools/platform-tools/`; `adb devices -l` retornou lista vazia.
O aparelho não foi acessado. Não é possível afirmar qual build está instalada. As duas builds
EAS existentes usam versionCode `1`, então esse número e o nome do app não bastam.
Também não havia Metro ativo nesta máquina na consulta de processos. Não foi
possível determinar qual servidor forneceu o bundle na ocasião do erro.

Com Platform Tools disponível e o aparelho conectado/autorizado, consultar:

```powershell
adb devices -l
adb shell dumpsys package com.tanalista.app
adb shell pm path com.tanalista.app
```

Copiar o caminho `base.apk` retornado por `pm path` e ler o APK instalado:

```powershell
adb pull "/caminho/retornado/base.apk" ".expo/installed-base.apk"
Get-FileHash -Algorithm SHA256 .expo/installed-base.apk
```

Comparar com o SHA-256 acima. Se diferente, inspecionar esse APK antes de concluir
que é antigo. Se for a instalação anterior, atualizar com o **APK existente** da
build identificada, mantendo pacote e assinatura. Não desinstalar, limpar dados
ou usar downgrade para contornar falhas de instalação. Atualização preserva o
armazenamento do pacote; nenhuma migração ou alteração SQLite foi introduzida.

```powershell
adb install -r ".expo/diagnostic-verified.apk"
npm.cmd run start:dev -- --clear
```

Abrir o Tá na Lista! Development Client diretamente e selecionar o Metro desta
raiz. Não abrir pelo Expo Go. Limpar cache Metro não adiciona módulos ao APK.
Conferir listas/itens/comprados existentes, reinício e uso local offline. Se o
hash instalado já for o correto e o erro persistir, coletar stack e logcat do
processo ao reproduzir, revisar registro do pacote e carregamento JNI. Isso
distinguirá falha de runtime da biblioteca de erro de instalação/servidor.

## Alterações e validação da investigação inicial

Corrigida a documentação que dizia que a build ainda não existia. Nenhum fallback
para ocultar o erro, mudança em dependências, banco, esquema, anúncios ou fluxo
da aplicação foi aplicado. Evidências brutas e APK ficaram em `.expo/`, ignorado
pelo Git. Typecheck e lint passaram; os 16 testes passaram, incluindo persistência,
rollback, integridade e falhas de anúncios sem afetar listas. Avisos conhecidos
do runner Node sobre módulos TS/SQLite experimental não são falhas.

Nova build só será necessária se a comparação/reprodução identificar correção
nativa concreta. Após essa identificação e autorização, o comando será:

```powershell
npx.cmd eas-cli build --platform android --profile development
```

Nenhuma build, instalação, desinstalação, publicação ou anúncio real foi executado.

## Retomada: erro durante execução com Metro

O processo Metro foi identificado na raiz correta, com `start --dev-client --clear`,
escutando na porta 8081. `/json/list` retornou `[]` nas consultas: não houve cliente
inspecionável para comprovar pacote, instalação ou runtime do celular. ADB também
não encontrou aparelhos. A opção `--dev-client` seleciona o modo do servidor, mas
não comprova qual binário o usuário abriu.

O relato de erro nativo junto à mensagem de anúncios indisponíveis é consistente
com o `catch` do import em `AdsProvider`. `NativeGoogleMobileAdsModule.ts` executa
`getEnforcing` ao importar a biblioteca. Esse ponto vem **antes** de
`gatherConsent`, `setRequestConfiguration` e `initialize`. Portanto o erro nativo
relatado não é causado por recusa UMP ou pelo ID de inventário. A mesma mensagem
da interface também pode representar outras falhas; ela sozinha não distingue
essas causas. O App ID de demonstração ainda pode causar uma falha UMP posterior,
depois que o carregamento nativo funcionar.

A inspeção do código Android mostra que o pacote fornece o módulo por `getModule`
e registra sua informação. A implementação clássica é um módulo legado, atendido
pela interoperabilidade habilitada em `ReactNativeNewArchitectureFeatureFlagsDefaults`
do RN 0.88 instalado. Não basta mudar `isTurboModule` para true: sua classe não
implementa a especificação TurboModule. Nenhuma flag ou fonte da dependência foi
alterada. Esse exame estático não comprova que o registro tenha sido executado no
processo do aparelho.

Correções JS justificadas nesta retomada:

- O botão de nova tentativa antes não fazia nada quando o import falhava, pois
  o controlador ainda não existia. Agora dispara outra tentativa de import e
  apresenta estado ocupado. Isso não instala nem fabrica o módulo ausente; uma
  falha de avaliação retida pelo Metro pode exigir recarregar o bundle.
- Logs de desenvolvimento distinguem `sdk-import`, `consent`, `privacy` e
  `initialize`. O import informa motivo padronizado, `executionEnvironment` e
  presença de `expoGoConfig`, sem imprimir o erro cru, dados de listas ou IDs de
  dispositivo. Esses campos são pistas, não identificação conclusiva do APK.
- O erro original não foi suprimido; consentimento continua obrigatório e o gate
  permanece fechado em falhas. Não houve alterações SQLite, dependências ou IDs.

Como testar: com o Metro atual, recarregar o Development Client e observar
`[AdMob] sdk-import`. `native-module-unavailable` confirma falha anterior ao UMP;
`sdk-import: success` seguido de `consent: failed` aponta para outra etapa.
Conectar USB, habilitar/autorizar depuração no Android e consultar:

```powershell
& .expo/android-tools/platform-tools/adb.exe devices -l
& .expo/android-tools/platform-tools/adb.exe shell dumpsys activity activities
& .expo/android-tools/platform-tools/adb.exe shell pm path com.tanalista.app
```

Com o caminho retornado, usar `adb pull` e comparar o hash conforme roteiro acima.
O pacote do Expo Go é `host.exp.exponent`; verificar também qual Activity está
ativa. Se a instalação correta reproduzir a falha, obter seu PID via `adb shell
pidof com.tanalista.app` e capturar `adb logcat --pid=PID -d` para arquivo local
ignorado em `.expo/`, revisando-o antes de compartilhar. Não limpar o logcat nem
o armazenamento do app. Nova build continua condicionada a uma correção nativa
demonstrada; as mudanças JS acima podem ser testadas pelo Metro sem outro APK.

Referência de compatibilidade: [README oficial da biblioteca](https://github.com/invertase/react-native-google-mobile-ads),
conferido junto ao código instalado 17.4.0. A compatibilidade declarada não
substitui a reprodução no aparelho.

Validação após as alterações de runtime: typecheck aprovado, lint aprovado sem
avisos e 17/17 testes aprovados. O teste acrescentado distingue as três etapas
de falha sem transmitir o erro bruto ao diagnóstico. Os testes de persistência,
rollback e falha de anúncios sem afetar listas também continuam aprovados.
Não foi realizado teste físico nesta retomada, pois não havia aparelho no ADB.

## Confirmação física via ADB — Moto G84 5G

Dispositivo Android 15 reconhecido como `device`. Pacote instalado:
`com.tanalista.app`, versão `1.0.0`, versionCode `1`, minSdk 24, targetSdk 36,
flags DEBUGGABLE e ALLOW_BACKUP. Primeira instalação e última atualização:
**20/10/2026 às 16:05:33**, conforme PackageManager. Instalador:
`com.google.android.packageinstaller`. O nome/versão não distinguia as builds.

O APK instalado foi copiado por `adb pull`, sem alterar a instalação:

| Evidência | APK instalado | APK EAS e11a08c0 |
| --- | --- | --- |
| Tamanho em bytes | 273.322.457 | 280.916.302 |
| SHA-256 | `4e6511d4eeb6afe8e638d5f27ae8e635c4802a779c420d4abab995699c396ccf` | `d121df35ca3999fb7b7a5440e6d6725d5297d845ea9d1bf07a6ddc855f521a89` |
| Classes AdMob em DEX | Ausentes | Presentes |
| App ID AdMob no manifest | Ausente | Presente, ID oficial de teste |
| AdMob no fingerprint interno | Ausente | 17.4.0, plugin e autolinking |

Fingerprint interno do instalado: `0d0939c4b06164d769f7f8ff48ce461905bfcd11`.
Ambos os APKs passaram na verificação de CRC ZIP. Os certificados DER extraídos
dos blocos APK Signature Scheme v2 têm o mesmo SHA-256:
`f6bfe6b50212308cf10921b6c9462c072ea2843177b08364ee7cca23922f1683`.
Essa comparação confirma o mesmo certificado; não substitui a validação da
assinatura que o Android faz ao instalar uma atualização.

Aberta `com.tanalista.app/.MainActivity`; o launcher identificado pertence ao
mesmo pacote, `expo.modules.devlauncher`. Expo Go também existe no aparelho,
mas **não foi o processo desta reprodução**. O Metro desta raiz foi iniciado e
conectado via `adb reverse tcp:8081 tcp:8081`. O primeiro ensaio com `--localhost`
escutava apenas em `::1` e não atendia o encaminhamento IPv4; reiniciar o Metro
com `--lan` resolveu a conexão, sem mudar arquivos de configuração.

O cliente do inspector foi identificado como `com.tanalista.app (motorola moto
g84 5G)`, React Native Bridgeless. O logcat do PID 9727 registrou o carregamento
do bundle Metro, criação de `BridgelessReactContext` e, às 15:02:59:

```text
TurboModuleRegistry.getEnforcing(...): 'RNGoogleMobileAdsModule' could not be found.
[AdMob] sdk-import: success
[AdMob] consent: failed
```

**Ressalva que corrige a interpretação anterior dos logs:** receber o namespace
do import dinâmico não comprova que todos os exports foram avaliados/utilizáveis.
O stack aponta para `NativeGoogleMobileAdsModule.ts`, `MobileAds.ts`, `index.ts`
e `asyncRequireModule.ts`. Logo `sdk-import: success` seguido de `consent: failed`
não prova falha de consentimento UMP: neste caso a falta do módulo nativo impede
o acesso utilizável ao SDK. Não há evidência de recusa/configuração UMP como
causa desse erro.

Não existe módulo para registrar/carregar neste APK instalado; não se trata de
um módulo presente nele mas perdido por autolinking. A presença na **outra** build
EAS não se aplica ao processo que executa este APK antigo. RN 0.88 e Nova
Arquitetura foram identificados; não há justificativa para downgrade ou patch
em flags de registro. Compatibilidade efetiva da build nova ainda precisa ser
testada depois da atualização.

Também apareceu um erro tratado do DevLauncher ao procurar
`expo.modules.splashscreen.SplashScreenManager`. Ele não impediu abrir o bundle
e não explica a ausência das classes AdMob. Não foi aplicado patch para esse
aviso incidental.

Próximo passo recomendado: atualizar **com o APK e11a08c0 já baixado**, mantendo
pacote, certificado e armazenamento. A atualização não foi executada nesta
investigação. Após decidir aplicar a atualização:

```powershell
& .expo/android-tools/platform-tools/adb.exe install -r .expo/diagnostic-verified.apk
```

Não usar `-d`, `uninstall`, `pm clear` ou limpeza do banco. Se a instalação falhar,
parar e analisar a mensagem. Depois conferir o hash instalado, recarregar o
Development Client com o Metro desta raiz, verificar listas/itens/comprados e
coletar novo logcat. A ausência do erro nativo deve ser verificada antes de
investigar eventuais falhas UMP dos IDs de demonstração. Não gerar outro APK.

Evidências locais, ignoradas pelo Git: `.expo/adb-package.txt`,
`.expo/installed-base.apk`, `.expo/installed-apk-inspection.json`,
`.expo/adb-app-logcat-confirmed.txt` e `.expo/adb-activities-confirmed.txt`.
Logs brutos ficam locais e devem ser revisados antes de compartilhamento.
Nenhum comando de alteração de dados, reinstalação, build ou publicação foi
executado. O app foi aberto e o erro reproduzido; não foram criadas/editadas listas.
Nesta rodada somente a documentação mudou; os resultados anteriores de
typecheck/lint e 17 testes continuam válidos para o código, sem nova execução.

## Atualização autorizada e validação final — 23/10/2026

O usuário autorizou explicitamente a atualização com `adb install -r`. Antes
de instalar, o app foi fechado sem limpeza de dados. SQLite, WAL e SHM foram
copiados via `run-as`/tar para `.expo/sqlite-update-before/`; uma conexão SQLite
local validou `quick_check`, foreign keys e criou `consistent-backup.db`.
Estado inicial: 1 lista, 7 produtos, 7 comprados, schema 1. Foram calculados hashes
do conteúdo completo de todas as linhas, ordenadas por ID, sem expor seus nomes.
O APK e os certificados foram novamente conferidos antes da instalação.

Executado `adb install -r .expo/diagnostic-verified.apk`: **Success**. Sem `-d`,
desinstalação, `pm clear`, troca de assinatura ou pacote. O APK foi copiado do
novo caminho Android e seu SHA-256 coincide exatamente com o artefato EAS:
`d121df35ca3999fb7b7a5440e6d6725d5297d845ea9d1bf07a6ddc855f521a89`.
PackageManager preservou firstInstallTime de 20/10 e registrou lastUpdateTime
23/10/2026 às 15:07:25. A instalação permanece versão 1.0.0/versionCode 1.

A comparação imediatamente após instalar passou: todas as linhas e estados de
compra eram idênticos ao backup, com integridade e foreign keys válidas. O app
foi conectado ao Metro pelo USB, e o novo processo carregou o SDK nativo e UMP.
O banner **AdMob Adaptive Banner**, marcado **Anúncio de teste**, foi confirmado
visualmente na Home. A lista antiga também apareceu com seus 7 itens. A navegação
ao checklist foi conferida; o banner não aparece nessa tela. Não foram clicados
anúncios nem configurados IDs reais.

Durante a checagem de navegação, um toque acidental desmarcou um item. A conferência
detectou somente a mudança de `purchased` e `updatedAt` de um produto e `updatedAt`+da lista, sem inclusão/exclusão de linhas. Com o app fechado, os arquivos SQLite
consistentes do backup foram restaurados, sem excluir arquivos. A comparação
completa voltou a passar. O app foi reaberto e uma nova comparação após o uso
confirmou novamente **todas as linhas e timestamps originais**, 1 lista e 7/7
itens comprados. O app foi deixado aberto novamente.

Logs do novo processo não apresentaram `RNGoogleMobileAdsModule ... could not be
found`, `FATAL EXCEPTION` ou falhas `[AdMob]`. A inicialização chegou ao UMP e ao
SDK Ads, e a imagem do banner demonstra a conclusão do carregamento. Os logs e
capturas ficam em `.expo/update-runtime-logcat*.txt` e `.expo/update-*.png`.
Eles podem conter metadados pessoais/IDs emitidos pelos SDKs e não são publicados.

Hashes finais dos registros, iguais ao estado anterior à atualização:

- Lists: `87c0ca7aed89967b1e0b3fbbad3bb8e86138364bd49358ce6d3ed0765b6da333`.
- Products: `ce6c00a6854599047f304664f735b21c1551c9d8dc4b883332988fa83e2d2847`.

Nenhum código da aplicação foi alterado nesta instalação. Os testes automatizados
anteriores (typecheck, lint, 17 testes) não precisaram ser repetidos; nesta rodada
foram feitos os testes físicos, hashes do APK e validações SQLite. Nenhum novo
APK foi gerado e nada foi publicado. Fluxos completos de consentimento por região,
recusa/revisão e testes de layout adicionais continuam pendentes; não se declara
que o App ID de demonstração validou mensagens da conta AdMob da desenvolvedora.
