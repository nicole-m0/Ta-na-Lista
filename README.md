# Tá na Lista! · Etapa 1

Aplicativo Android de listas de compras, local e offline. Sem conta, servidor, dados demonstrativos ou funcionalidades Premium. Nenhum deploy ou publicação foi realizado.

## Executar para revisar

Requisitos: Node.js 22.19+ e npm. O projeto usa Expo SDK 58; use uma versão do Expo Go para Android compatível com esse SDK.

```powershell
npm.cmd ci
npm.cmd start
```

No Android, abra o Expo Go e escaneie o QR exibido no terminal. Computador e celular devem estar na mesma rede. No PowerShell, o sufixo `.cmd` evita o bloqueio de execução de `npm.ps1`. Não é necessário liberar scripts globalmente.

Com Android SDK e emulador configurados:

```powershell
npm.cmd run android
```

O acesso à rede serve ao carregamento do ambiente de desenvolvimento. Listas e produtos usam SQLite no dispositivo e não fazem solicitações de rede. Para validar inicialização totalmente offline, use uma build Android local de desenvolvimento/release instalada; o Expo Go depende do Metro para recarregar o código durante desenvolvimento. A distribuição nativa não foi gerada nesta etapa.

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

`AdBanner` é o ponto de integração reutilizável; nesta etapa retorna `null`, sem banner fictício ou espaço vazio. A configuração está desativada e não contém IDs. O slot existe apenas na tela inicial; o checklist não contém publicidade.

Uma futura integração AdMob exigirá escolher um SDK nativo compatível, configurar o plugin e gerar uma development build; esse SDK não funciona no Expo Go padrão. Começar com IDs oficiais de teste, política de privacidade e consentimento aplicável, sem anúncios intersticiais. Nenhum SDK de anúncios foi instalado aqui.

Referências oficiais: [criação de projeto Expo](https://docs.expo.dev/get-started/create-a-project/), [Expo Router](https://docs.expo.dev/versions/latest/sdk/router/), [Expo SQLite](https://docs.expo.dev/versions/latest/sdk/sqlite/).

## Verificações

```powershell
npm.cmd run typecheck
npm.cmd run lint
npm.cmd test
npx.cmd expo install --check
npx.cmd expo export --platform android
```

Resultado desta entrega: typecheck e lint aprovados, 3 testes aprovados, `expo install --check` sem incompatibilidades e bundle Android exportado com sucesso. A exportação é apenas local, sem publicação.

Os testes verificam criação, renomeação, edição/remoção de produtos, marcar/desmarcar, progresso, duplicação com reset, IDs diferentes, exclusão em cascata, campos inválidos, gravações concorrentes serializadas, banco vazio, migração repetida, persistência após fechar/reabrir SQLite e rollback de falha ao duplicar. O SQLite do Node 22 emite aviso de API experimental; é usado apenas nos testes, não no app.

### Limites da validação

Não há Android SDK/ADB ou aparelho conectado disponível neste ambiente. A exportação Android verifica bundling e resolução de módulos, mas não é uma compilação APK e não substitui a execução nativa. Teclado, navegação por toque, TalkBack, aparência em tamanhos diferentes, animações e persistência através de um encerramento real do processo Android precisam da revisão no dispositivo. Não há suporte web validado nesta etapa.

O `npm audit` reportou 26 ocorrências na árvore transitiva (7 moderadas, 19 altas), principalmente propagadas por `braces`, `node-forge` e `uuid` na infraestrutura Expo/Metro/Xcode. `npm audit fix` sem `--force` não encontrou correção compatível; a sugestão automática força downgrade para Expo 44 e não foi aplicada. Reavaliar atualizações oficiais antes de distribuir o aplicativo. O UUID do aplicativo usa `expo-crypto`, não a versão transitiva de `uuid`.

## Roteiro para revisão Android

1. Abrir o app vazio, criar duas listas, renomear uma e voltar da checklist.
2. Adicionar produtos com vírgula decimal, unidades e categorias; usar “Adicionar e continuar”.
3. Tentar nome em branco, quantidade zero e texto inválido. Conferir mensagens e preservação do formulário.
4. Editar, marcar e desmarcar produtos; conferir contagem, progresso e aparência.
5. Duplicar uma lista parcialmente comprada e confirmar que a cópia está totalmente desmarcada.
6. Cancelar e confirmar exclusões de produto e lista.
7. Fechar e reabrir o app; confirmar os dados. Em build instalada, repetir em modo avião.
8. Conferir telas com fonte ampliada, TalkBack, movimento reduzido, teclado aberto e celulares pequenos/grandes.

Próximo passo recomendado: revisão manual Android da Etapa 1 e ajustes resultantes, antes de autorizar qualquer nova funcionalidade.
