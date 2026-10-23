# Tá na Lista! · Etapa 3

Estado atual: anúncios oficiais de teste com `react-native-google-mobile-ads@17.4.0`, gate UMP, revisão de privacidade quando aplicável, verificações de integridade SQLite e permissões reduzidas. Consulte [o relatório da Etapa 3](RELATORIO-ETAPA-3.md) para resultados, riscos e pendências da conta AdMob. A Development Build e11a08c0 já foi concluída e contém o módulo nativo AdMob; o Moto G84 foi atualizado via adb install -r para esse APK, com dados SQLite conferidos integralmente e banner de teste exibido. O erro RNGoogleMobileAdsModule foi resolvido. Consulte [o diagnóstico Android](DIAGNOSTICO-ADMOB.md) antes de gerar outra build. O restante deste documento mantém também registros das etapas anteriores, identificados abaixo.

Retomada de 21/10/2026: busca local, organização por ordem original/pendentes/categorias e sugestões locais de produtos foram acrescentadas. A Development Build já foi instalada e testada no Android pelo usuário; os trechos sobre preparação da primeira build abaixo são o registro da etapa anterior. Consulte [o relatório da Etapa 2](RELATORIO-ETAPA-2.md) para o estado atual, verificações e roteiro de teste. Nenhuma build ou publicação foi feita nesta retomada.

Aplicativo Android de listas de compras, local e offline. Sem conta, servidor, dados demonstrativos ou funcionalidades Premium. Nenhum deploy ou publicação foi realizado.

## Executar para revisar

Requisitos: Node.js 22.19+ e npm. O projeto usa Expo SDK 58 e agora exige Development Build para o SDK nativo de anúncios.

```powershell
npm.cmd ci
npm.cmd run start:dev
```

No Android, abra a nova Development Build e escaneie o QR exibido no terminal. Computador e celular devem estar na mesma rede. No PowerShell, o sufixo `.cmd` evita o bloqueio de execução de `npm.ps1`. Não é necessário liberar scripts globalmente. Não usar Expo Go para validar anúncios.

Com Android SDK e emulador configurados:

```powershell
npm.cmd run android
```

O acesso à rede serve ao carregamento do ambiente de desenvolvimento. Listas e produtos usam SQLite no dispositivo e não fazem solicitações de rede. Para validar inicialização totalmente offline, use uma build Android local de desenvolvimento/release instalada; o Expo Go depende do Metro para recarregar o código durante desenvolvimento. A distribuição nativa não foi gerada nesta etapa.

## Development Build no Android

O projeto inclui `expo-dev-client` compatível com SDK 58 e um perfil `development` em `eas.json`, com distribuição interna e saída APK. O identificador Android continua `com.tanalista.app`; nenhuma funcionalidade ou esquema SQLite foi alterado.

Na verificação deste computador, Java/JDK e ADB não foram encontrados no PATH, as variáveis JAVA_HOME/ANDROID_HOME/ANDROID_SDK_ROOT estavam ausentes e Android Studio/SDK/JDK não foram encontrados nas pastas usuais ou nos registros de instalação consultados. Não foi instalada nenhuma ferramenta nativa, não foi gerada a pasta `android` e nenhuma compilação foi iniciada.

O caminho mais simples é o EAS Build na nuvem, sujeito à cota gratuita e à fila do plano Free. É necessário ter uma conta Expo e vincular o projeto. Os comandos abaixo são próximos passos, ainda não executados:

```powershell
npx.cmd eas-cli@latest login
npx.cmd eas-cli@latest init
```

Após conferir a conta e a vinculação, o comando seguinte **envia o código ao EAS e inicia a compilação nativa na nuvem**; não publica na Play Store:

```powershell
npx.cmd eas-cli@latest build --platform android --profile development
```

Na primeira build, o EAS pode pedir para gerar uma chave de assinatura Android. Ao terminar, abra o link de instalação no celular, baixe o APK e autorize a instalação para o navegador usado. Não é necessário ADB, cabo USB ou Android Studio para essa opção. Não desinstale uma instalação existente para resolver diferenças de assinatura sem antes preservar seus dados.

Com a build instalada, mantenha computador e celular na mesma rede e execute:

```powershell
npm.cmd run start:dev
```

Abra o Tá na Lista! instalado e leia o QR code com o cliente de desenvolvimento; não use Expo Go. O servidor Metro continua necessário durante o desenvolvimento. Alterações em dependências nativas ou configuração nativa exigem uma nova build. O SQLite desta instalação é separado dos dados anteriormente usados no Expo Go.

Alternativa local: instalar/configurar Android Studio, Android SDK e JDK compatíveis, habilitar depuração USB e usar `npx.cmd expo run:android --device`. Essa alternativa exige downloads maiores e não foi preparada no Windows nesta etapa.

Referências: [Development Builds](https://docs.expo.dev/develop/development-builds/introduction/), [configuração EAS](https://docs.expo.dev/build/eas-json/) e [limites atuais do plano gratuito](https://expo.dev/pricing).

## Funcionalidades

- Tela inicial com identidade verde, saudação, criação de listas, datas, contagem e progresso.
- Criar, renomear, duplicar e excluir listas. Exclusão exige confirmação.
- Duplicação transacional: novos identificadores, produtos e quantidades copiados, todos desmarcados.
- Produtos com nome, quantidade decimal, sete unidades e oito categorias opcionais.
- Edição, exclusão confirmada, marcação e desmarcação; progresso atualizado após a gravação local.
- “Adicionar e continuar” mantém o formulário aberto, limpa nome/quantidade e preserva unidade/categoria para agilizar compras semelhantes.
- Estados vazios, falhas com opção de tentar novamente, validação, áreas seguras, botões acessíveis e animação que respeita movimento reduzido.
- Ícone próprio de sacola/checklist: PNG de 1024 px, foreground adaptativo transparente e fonte SVG. São uma proposta pronta para revisão visual, sem imagens externas. O script `scripts/generate-icon.ps1` permite regenerar os PNGs no Windows.

## Estrutura

```text
src/
  app/                 Expo Router: inicial, layout e list/[id]
  components/          Formulários, cards, botões, progresso e slot de anúncio
  db/repository.ts     Migração e operações SQLite, independentes da interface
  hooks/useStore.tsx   Inicialização e injeção do repositório
  services/ads.ts      Configuração isolada de anúncios, desativada
  theme/               Cores
  types/               Modelos, unidades e categorias
assets/                Ícones PNG e fonte SVG
scripts/               Geração dos ícones
tests/                 Integração com SQLite real via Node
```

## Tecnologias e dependências

- Expo SDK 58, React 19.3, React Native 0.88 e TypeScript.
- Expo Router, expo-sqlite, expo-crypto (UUID), expo-status-bar.
- expo-constants e expo-linking: infraestrutura do Router.
- react-native-safe-area-context e react-native-screens: navegação e áreas seguras.
- @expo/vector-icons: Ionicons, carregados do pacote local.
- react-dom 19.3.0: versão explícita para alinhar o peer dependency da infraestrutura do Router ao React; o alvo desta etapa é Android.
- ESLint e eslint-config-expo para verificação. Testes usam `node:test` e `node:sqlite`, sem framework adicional.
- Animação com `Animated` nativo; nenhuma dependência de animação foi adicionada diretamente.

Versões exatas resolvidas estão no `package-lock.json`; prefira `npm.cmd ci` para instalações reproduzíveis.

## Persistência e evolução

Banco `ta-na-lista.db`, com WAL e foreign keys. A migração inicial roda em transação e registra `PRAGMA user_version = 1`. Versões futuras devem acrescentar migrações incrementais; nunca apagar/recriar o banco do usuário. Bancos de versão superior são recusados sem modificação. O fluxo de recuperação não apaga dados.

Listas e produtos têm UUID e datas ISO de criação/atualização. Cada alteração de produto atualiza a lista. Exclusão em cascata impede produtos órfãos. Escritas são serializadas para evitar transações concorrentes. Os testes usam a mesma implementação do repositório e SQL, com um adaptador para SQLite do Node.

Futuros preços, estabelecimentos, comprovantes e eventos financeiros poderão usar tabelas próprias referenciando os UUIDs existentes, mediante novas migrações. Nenhuma dessas funcionalidades ou tabelas foi implementada. Desinstalar o aplicativo ou limpar seu armazenamento remove o banco local; backup/sincronização não fazem parte desta etapa.

## Anúncios

`AdBanner` usa somente o banner adaptativo de teste Google na tela inicial, após UMP permitir solicitações e a inicialização do SDK concluir. Não aparece em formulários, menus, confirmações de exclusão ou checklist. Configuração central em `src/services/ads.ts`, desabilitada em produção, com gate preparado para futuro Premium. Falhas não impedem acesso às listas offline.

O plugin nativo foi configurado e exige nova Development Build, que só deve ser gerada após autorização. Mensagens de consentimento da conta AdMob, política de privacidade e validação no aparelho permanecem pendentes; os IDs de demonstração pertencem ao Google. Instruções completas no relatório da Etapa 3. Sem anúncios intersticiais ou obrigatórios.

Referências oficiais: [criação de projeto Expo](https://docs.expo.dev/get-started/create-a-project/), [Expo Router](https://docs.expo.dev/versions/latest/sdk/router/), [Expo SQLite](https://docs.expo.dev/versions/latest/sdk/sqlite/).

## Verificações

```powershell
npm.cmd run typecheck
npm.cmd run lint
npm.cmd test
npx.cmd expo install --check
npx.cmd expo export --platform android
```

Resultado atual da Etapa 3: typecheck e lint aprovados, 16 testes aprovados, `expo-doctor` com 20/20 verificações aprovadas, `expo install --check` sem incompatibilidades e bundle Android exportado com sucesso. A exportação é apenas local, sem publicação. As análises históricas abaixo não substituem o relatório atual.

Na análise inicial, o Git estava limpo e todas as funcionalidades básicas acima já estavam implementadas. Foram corrigidas a aceitação de notações não decimais na quantidade (como `0x10` e `1e3`) e a ordem da migração, que agora recusa bancos de versão superior antes de alterar configurações. Foram acrescentados testes de regressão e validação de categoria inválida. O `expo-doctor` identificou `expo-font` como dependência obrigatória ausente de `@expo/vector-icons`; o pacote compatível e seu plugin foram adicionados pelo instalador oficial do Expo.

Os testes verificam criação, renomeação, edição/remoção de produtos, marcar/desmarcar, progresso, duplicação com reset, IDs diferentes, exclusão em cascata, campos inválidos, gravações concorrentes serializadas, banco vazio, migração repetida, persistência após fechar/reabrir SQLite e rollback de falha ao duplicar. O SQLite do Node 22 emite aviso de API experimental; é usado apenas nos testes, não no app.

### Limites da validação

Não há Android SDK/ADB ou aparelho conectado disponível neste ambiente. A exportação Android verifica bundling e resolução de módulos, mas não é uma compilação APK e não substitui a execução nativa. Teclado, navegação por toque, TalkBack, aparência em tamanhos diferentes, animações e persistência através de um encerramento real do processo Android precisam da revisão no dispositivo. Não há suporte web validado nesta etapa.

O `npm audit` atual reporta 20 alertas altos transitivos, propagados por `braces` e `node-forge` no tooling Expo/Metro. Correções compatíveis sem force removeram os três alertas moderados de xcode/uuid. A sugestão restante força downgrades incompatíveis e não foi aplicada. Detalhes e riscos no relatório da Etapa 3. O UUID do aplicativo usa `expo-crypto`.

## Roteiro para revisão Android

1. Abrir o app vazio, criar duas listas, renomear uma e voltar da checklist.
2. Adicionar produtos com vírgula decimal, unidades e categorias; usar “Adicionar e continuar”.
3. Tentar nome em branco, quantidade zero e texto inválido. Conferir mensagens e preservação do formulário.
4. Editar, marcar e desmarcar produtos; conferir contagem, progresso e aparência.
5. Duplicar uma lista parcialmente comprada e confirmar que a cópia está totalmente desmarcada.
6. Cancelar e confirmar exclusões de produto e lista.
7. Fechar e reabrir o app; confirmar os dados. Em build instalada, repetir em modo avião.
8. Conferir telas com fonte ampliada, TalkBack, movimento reduzido, teclado aberto e celulares pequenos/grandes.

Próximo passo: aguardar autorização para gerar a nova Development Build e executar o roteiro físico da Etapa 3, preservando a instalação e os dados existentes.
