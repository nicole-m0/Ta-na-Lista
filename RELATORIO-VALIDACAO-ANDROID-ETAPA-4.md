# Tá na Lista! — Validação Android da Etapa 4

Preparação: 23/10/2026. Execução: 11/11/2026. **Status: concluída e aprovada no escopo das Fases 1 e 2 da Etapa 4.** Os 12 passos do roteiro foram executados no Moto G84 5G (Android 15) com a Development Build `e11a08c0` já instalada, sem nova build, sem reinstalação e sem alteração de código, schema ou dependências. As linhas da lista antiga e de seus 7 produtos permaneceram idênticas ao baseline. Pendências que dependem de configuração externa ou de ensaios não incluídos no roteiro estão listadas ao final da seção de 11/11.

## Execução de 11/11/2026

### Conexão do aparelho

- Três consultas `adb devices -l` retornaram lista vazia. Consulta somente de leitura com `Get-PnpDevice` mostrou o aparelho presente como `moto g84 5G`, classe WPD (transferência de arquivos), status OK, `VID_22B8&PID_2E82`, sem interface ADB e sem dispositivo com erro. O Windows também registrava uma conexão anterior `PID_2E81`, compatível com o modo com ADB usado em 23/10. Nenhum driver foi instalado nem configuração alterada.
- Após o usuário reativar a Depuração USB, o aparelho passou a `device` (`model:moto_g84_5G`). O serial não é registrado neste relatório.

### Resultados por passo

| Ordem | Ensaio/ação | Resultado | Situação |
| --- | --- | --- | --- |
| 1 | Consultar ADB | Aparelho em estado `device`, modelo moto_g84_5G | Aprovado |
| 2 | Pacote instalado e origem do binário | `com.tanalista.app` 1.0.0, versionCode 1; primeira instalação 20/10/2026 16:05:33; última atualização 23/10/2026 15:07:25 (sem mudança desde então). `base.apk` copiado para arquivo novo: 280.916.302 bytes, SHA-256 `d121df35ca3999fb7b7a5440e6d6725d5297d845ea9d1bf07a6ddc855f521a89`, idêntico ao artefato EAS `e11a08c0` | Aprovado |
| 3 | Conectar a build existente ao Metro | Metro desta raiz com `npm.cmd run start:dev -- --lan` (`EXPO_OFFLINE=1`, telemetria desativada); `adb reverse tcp:8081 tcp:8081`; deep link `exp+ta-na-lista://expo-development-client/?url=http%3A%2F%2F127.0.0.1%3A8081` resolvido para `com.tanalista.app/.MainActivity` (não Expo Go). Início frio, bundle Android com 1352 módulos, JS iniciado às 14:53:02 | Aprovado |
| 4 | Baseline de preservação | Antes de abrir o app com o código novo, com o processo parado: cópia via `run-as`/`tar` de banco, WAL e SHM para pasta nova; análise somente na cópia local. `quick_check` e `integrity_check` ok, 0 violações de chave estrangeira, `user_version = 1`, WAL. 1 lista, 7 produtos (7 comprados). Hashes iguais ao snapshot de 23/10. Arquivos do aparelho com tamanhos e datas inalterados após a cópia | Aprovado |
| 5 | Home e privacidade local | Botão **Privacidade e dados locais** presente na Home, o que confirma a execução do código das Fases 1 e 2. Modal com as cinco seções; banner ausente enquanto o modal está aberto e de volta após fechá-lo | Aprovado |
| 6 | Lista isolada de validação | Nome vazio rejeitado com mensagem de validação, sem gravação. Criada uma única lista `VALIDACAO ETAPA 4 - 2026-11-11` (contagem passou de 1 para 2 listas) | Aprovado |
| 7 | Produtos sintéticos | Quantidade `0` rejeitada ("Use uma quantidade maior que zero e até 99.999."); `1e3` rejeitada ("Informe uma quantidade decimal, como 1 ou 1,5."); formulário preservado e nada gravado. `1,5` kg/Mercearia aceito via **Adicionar e continuar**, com nome limpo e unidade/categoria preservadas. Edição de quantidade (2 → 3 litro). Exclusão de produto descartável: cancelar manteve o item; confirmar removeu | Aprovado |
| 8 | Checklist | Marcar/desmarcar com progresso atualizado (1 de 2 → 0 de 2 → 1 de 2). Ordenações **Pendentes primeiro**, **Categorias** (cabeçalhos Laticínios e Mercearia na ordem definida) e **Ordem original** corretas. Busca `TESTE B` encontrou 1 de 2, sem diferença de maiúsculas; `xyz` exibiu "Nenhum produto encontrado"; limpar busca restaurou a lista | Aprovado |
| 9 | Encerrar e reabrir | `am force-stop` seguido de início frio: listas, quantidades, unidades, categorias e marcações persistidas; lista antiga com 7 de 7 | Aprovado |
| 10 | Operar sem internet | Modo avião confirmado (`airplane_mode_on=1`, sem rede ativa, ping externo inalcançável); ADB e Metro mantidos pelo USB. Início frio: listas carregadas; marcar/desmarcar gravados; privacidade local aberta; anúncios bloqueados com "Anúncios indisponíveis. Suas listas continuam funcionando offline."; **Verificar anúncios novamente** falhou novamente de modo fechado, sem travar | Aprovado |
| 11 | Anúncio e UMP | Banner adaptativo marcado **Anúncio de teste** somente na Home. Nenhuma view de anúncio nos 45 dumps de checklist, formulários, diálogos e modal. Com a rede restaurada, **Verificar anúncios novamente** recuperou o banner sem reiniciar o app. Nenhum anúncio foi tocado | Aprovado no escopo testável |
| 12 | Comparação final | Ver tabela abaixo | Aprovado |

O ensaio de toque repetido foi feito em **Adicionar e continuar**: dois toques sequenciais rápidos resultaram em um único produto gravado, sem erro de validação visível e sem duplicação. O ensaio não permite afirmar que a trava síncrona bloqueou o segundo toque; registra apenas o resultado observado. Dois toques injetados exatamente simultâneos pelo ADB se anulam no Android e não servem como ensaio; essa tentativa não gerou envio.

### Comparação final com o baseline de 11/11

Cópia final feita com o app parado, em pasta nova, comparada com uma cópia de leitura do baseline.

| Item | Baseline | Final |
| --- | --- | --- |
| `quick_check` / `integrity_check` | ok / ok | ok / ok |
| Violações de chave estrangeira | 0 | 0 |
| `user_version` | 1 | 1 |
| SHA-256 do schema (`sqlite_master`) | `a42df5f29d4d08c04c621b0430a78718aed5b575010120a53c0ba37395c32c06` | idêntico |
| Linhas da lista antiga | `87c0ca7aed89967b1e0b3fbbad3bb8e86138364bd49358ce6d3ed0765b6da333` | idêntico |
| Linhas dos 7 produtos antigos | `ce6c00a6854599047f304664f735b21c1551c9d8dc4b883332988fa83e2d2847` | idêntico |
| Totais | 1 lista, 7 produtos | 2 listas, 9 produtos |

Nenhuma linha antiga foi alterada, removida ou recebeu produto novo. As únicas linhas novas são a lista sintética e seus dois produtos: `Produto teste A` (1,5 kg, Mercearia, desmarcado) e `Produto teste B` (3 litro, Laticínios, marcado). Os hashes usam o mesmo método do snapshot de 23/10 (todas as colunas, ordenadas por ID), sem expor nomes pessoais.

### Logs e avisos

- Nas consultas de logcat do processo não houve `FATAL EXCEPTION`, erro `AndroidRuntime` nem `RNGoogleMobileAdsModule ... could not be found`. Com rede: `[AdMob] sdk-import: success`. Sem rede: `[AdMob] consent: failed`, comportamento esperado do gate fechado.
- Metro emitiu os avisos conhecidos de ausência de `iosAppId` e "Unable to resolve manifest assets"; ícones e fontes foram exibidos normalmente na tela.
- Na abertura inicial a tela do aparelho estava apagada e bloqueada; o usuário desbloqueou antes da primeira captura.

### Observações encontradas (sem impacto nos dados; não corrigidas)

1. **Acessibilidade:** no dump da interface, o rótulo de acessibilidade do produto contém a quantidade com ponto (por exemplo `Produto teste A, 1.5 kg`), enquanto a tela exibe `1,5 kg`. O TalkBack não foi executado; a leitura falada desse rótulo não foi verificada. Origem: `accessibilityLabel` em `src/components/ProductRow.tsx`, que usa o número sem formatação pt-BR.
2. **Texto:** o checklist exibe "1 pendentes" quando há um único item pendente. Origem: `src/app/list/[id].tsx`.

### Configuração nativa observada

`dumpsys package` da instalação atual registra `flags=[ DEBUGGABLE HAS_CODE ALLOW_CLEAR_USER_DATA ]`, sem `ALLOW_BACKUP`, coerente com `allowBackup: false`. A flag `ALLOW_BACKUP` registrada em 23/10 pertencia à instalação anterior. Permissões efetivas (incluindo AD_ID), componentes exportados e regras de transferência entre aparelhos não foram inspecionados nesta rodada.

### Pendências após a validação

1. **UMP por região:** apresentação do formulário, aceitar, recusar, revisar e alterar escolhas continuam pendentes. O App ID de demonstração pertence ao Google e não valida as mensagens da conta da desenvolvedora. O botão **Privacidade dos anúncios** não apareceu nesta sessão, o que indica que o SDK não exigiu revisão; isso não equivale a aceite nem a validação regional.
2. **Fora do roteiro de 12 passos:** renomear, duplicar e excluir lista; TalkBack; fonte ampliada; telas de outros tamanhos; navegação por gestos e três botões. Não foram executados nesta rodada.
3. **Manifest efetivo:** AD_ID, permissões e componentes exportados ainda não inspecionados no binário instalado.
4. As duas observações acima aguardam autorização para correção.
5. Os alertas de tooling (`node-forge`) registrados na fase 2 não foram reavaliados nesta rodada.

### Verificações automatizadas

Antes da validação, em 11/11/2026: `npm.cmd run typecheck` e `npm.cmd run lint` aprovados; `npm.cmd test` com 33/33 aprovados. O código não foi alterado desde então.

### Preservação e estado final

- Nenhum APK gerado ou instalado, nenhuma build, nenhuma escrita direta no banco, nenhum script de restauração executado, nenhuma alteração de schema, migração ou dependência.
- A lista sintética permanece no aparelho; nenhum registro de teste foi removido.
- Ao final: app encerrado, Metro encerrado, `adb reverse` removido e modo avião desativado pelo usuário.
- Evidências locais, ignoradas pelo Git e com dados pessoais (não compartilhar): `.expo/installed-2026-11-11.apk`, `.expo/sqlite-baseline-2026-11-11/`, `.expo/validation-2026-11-11/` (capturas, dumps de interface e horários) e `.expo/sqlite-final-2026-11-11/` (cópia final e `comparison.json`). Os backups históricos de `.expo/` não foram sobrescritos.

---

## Registro histórico da preparação (23/10/2026)

As seções abaixo preservam o registro de 23/10, quando o aparelho não foi reconhecido pelo ADB. A coluna "Situação" do roteiro reflete aquela data; os resultados estão na seção de 11/11 acima.

### Preparação (23/10/2026)

- Lido integralmente `RELATORIO-ETAPA-4-FASE-2.md`. Base automatizada histórica: 33 testes aprovados; isso não comprova funcionamento no Android.
- Node local: v22.19.0. Dependências já instaladas. Não foi executada instalação ou atualização.
- `package.json`, `package-lock.json`, `app.json` e `eas.json` não apresentam diferenças em relação ao Git. Fases recentes alteraram apenas JavaScript/TypeScript, documentação e proteção de arquivos; nenhuma necessidade de nova build foi identificada na análise estática.
- Pacote configurado: `com.tanalista.app`. Google Mobile Ads 17.4.0 com App ID/banner oficiais de teste, measurement delay e bloqueio de produção preservados. Banco `ta-na-lista.db`, schema 1 preservado.
- A build histórica `e11a08c0` foi instalada e validada em 23/10 conforme `DIAGNOSTICO-ADMOB.md`. A instalação atual ainda não foi consultada nesta rodada: a compatibilidade com o binário presente no celular permanece **pendente de confirmação**, embora não haja mudança nativa que exija recompilação.
- Platform Tools existente em `.expo/android-tools/platform-tools/adb.exe`. A execução restrita falhou por permissão da pasta de configuração; repetição autorizada iniciou o daemon ADB na porta 5037.
- `adb devices -l`: cabeçalho sem dispositivos. Não foi reconhecido Moto G84 nem dispositivo `unauthorized` nesta consulta.
- Metro iniciado nesta raiz com `npm.cmd run start:dev -- --lan`, `EXPO_OFFLINE=1` e telemetria desativada para o processo. Endpoint `http://127.0.0.1:8081/status` respondeu **`packager-status:running`**. Esse resultado comprova o servidor local, não a conexão do aparelho.
- Aviso sobre ausência de `iosAppId` apareceu na inicialização; o projeto e a validação são Android. Não foi aplicada alteração iOS sem necessidade.

### Interação solicitada e ponto de espera (23/10/2026)

Foi solicitado ao usuário:

1. Conectar o Moto G84 por cabo USB de dados e manter a tela desbloqueada.
2. Ativar **Configurações → Sistema → Opções do desenvolvedor → Depuração USB**. Se necessário, habilitar o menu tocando sete vezes em **Número da versão**, em Sobre o telefone.
3. Aceitar **Permitir depuração USB?** somente reconhecendo este computador; selecionar Transferência de arquivos se necessário.
4. Confirmar “USB conectado e depuração autorizada”, ou informar a mensagem exibida.

Até a confirmação, não serão executadas ações dependentes no aparelho. Nenhum app foi aberto, encerrado, reinstalado ou alterado nesta preparação.

#### Retomada após confirmação de conexão pelo usuário (23/10/2026)

O usuário informou que conectou o Moto G84 via USB e ativou a depuração. Foram realizadas duas consultas novas com `adb devices -l`, ambas com lista vazia, sem estado `device`, `unauthorized` ou `offline`.

ADB confirmado: Android Debug Bridge 1.0.41, Platform Tools 37.0.1, executável desta raiz e daemon presente no Windows. Consulta somente de leitura via `Get-PnpDevice -PresentOnly`, filtrada pelos nomes Motorola/Moto G84/Android/ADB/MTP, não retornou correspondências. Isso não comprova defeito no cabo ou driver; apenas indica que nenhum dispositivo com esses nomes foi encontrado. Não foram instalados drivers, reiniciado o daemon, revogadas autorizações nem alteradas configurações USB.

Foi solicitada nova interação: desbloquear o aparelho, reconectar diretamente em outra porta USB, selecionar **Transferência de arquivos/Android Auto** na notificação USB, conferir depuração e aceitar a autorização RSA se aparecer. Se só carregar e não houver notificação, testar outro cabo de dados. Aguardar relato sobre a notificação e a autorização antes de retomar as verificações dependentes do aparelho.

O roteiro permanece no passo 1. Sem reconhecimento não foi possível identificar o binário instalado, capturar baseline SQLite, observar telas/anúncios ou executar fluxos. As listas não foram acessadas ou alteradas. Não houve geração de APK, reinstalação ou avanço de fase.

### Roteiro seguro para continuidade (situação em 23/10/2026)

| Ordem | Ensaio/ação | Evidência necessária | Situação |
| --- | --- | --- | --- |
| 1 | Consultar ADB após confirmação | Moto G84 em estado `device`; identidade/modelo Android conferidos sem publicar serial | Pendente |
| 2 | Consultar pacote instalado e origem do binário | Pacote, versão, datas e identificação do APK; não confiar somente no versionCode 1 | Pendente |
| 3 | Encaminhar porta USB 8081 e conectar à build existente | Metro e cliente `com.tanalista.app` identificados; não usar Expo Go | Pendente |
| 4 | Registrar baseline de preservação | Cópia consistente e/ou comparação integral privada de registros antigos, sem imprimir nomes/conteúdo pessoal | Pendente |
| 5 | Abrir Home e privacidade local | Evidência visual de carregamento, texto acessível e ausência de banner sobre modal | Pendente |
| 6 | Criar lista isolada de validação | Nome exclusivo de teste; criação sem duplicação por callbacks simultâneos | Pendente |
| 7 | Adicionar/editar produtos sintéticos | Quantidade decimal, unidade/categoria, adicionar e continuar; entradas inválidas sem gravação | Pendente |
| 8 | Checklist de teste | Marcar/desmarcar, busca e ordem; persistência das mudanças apenas nos itens sintéticos | Pendente |
| 9 | Encerrar/reabrir o aplicativo | Registros sintéticos persistidos e antigos intactos | Pendente |
| 10 | Operar sem internet | CRUD/checklist e privacidade local disponíveis; distinguir conexão USB/Metro de acesso à internet | Pendente |
| 11 | Anúncio e UMP | Banner explicitamente de teste; carregamento/erros observados; gate e revisão conforme respostas reais do SDK | Pendente |
| 12 | Comparação final | Todas as linhas/campos/timestamps das listas antigas preservados; apenas dados de teste alterados | Pendente |

As ações que dependerem do usuário serão explicadas individualmente e só continuarão após confirmação. Em especial, alterações de rede, fechamento/reabertura e escolhas de consentimento não serão presumidos como realizados.

Criar somente registros sintéticos identificados, por exemplo `VALIDAÇÃO ETAPA 4 — <data/hora>`, verificando antes que a lista não existia. Não renomear, marcar, editar, duplicar ou excluir listas antigas. Não tocar em áreas de anúncios. Não limpar armazenamento, cache de dados do app ou consentimento. Não executar SQL de escrita diretamente no banco real.

Para operações dependentes de UI, primeiro confirmar a tela/contexto; não usar coordenadas sem evidência atual. Registros de teste não serão removidos automaticamente ao terminar. Se uma inconsistência atingir dados antigos, interromper e investigar; não restaurar backup por conta própria, pois isso sobrescreveria o estado atual.

Uma cópia do banco com processo ativo exige mecanismo SQLite consistente ou interrupção segura de escritores; copiar apenas o `.db` pode omitir WAL. Cópias e logs devem ficar privados em `.expo/`, sem sobrescrever os backups históricos. Não manipular as cópias antigas como se fossem baseline atual.

### Limites específicos de anúncios e offline (23/10/2026)

O App ID de demonstração não valida mensagens da conta da desenvolvedora. Se um formulário não aparecer, registrar a resposta observada e não declarar aceitação/recusa regional aprovada. Sem IDs próprios, aparelho de teste UMP e configuração aplicável, esses cenários poderão permanecer pendentes. Não substituir IDs nem forçar exibição ignorando consentimento.

Modo avião com bundle carregado verifica operações locais sem internet; inicialização fria de Development Build pode continuar dependendo do Metro. Separar esses resultados. Solicitar instruções de rede ao usuário com restauração posterior explicitamente confirmada, sem presumir que USB ou Wi-Fi foram desligados.

### Erros e correções (23/10/2026)

Até aqui, somente erro de permissão do ADB no ambiente restrito, resolvido executando a ferramenta com acesso autorizado. Nenhum erro de aplicativo foi reproduzido. **Nenhuma correção de código foi aplicada nesta preparação.**

Os cinco alertas de tooling registrados na fase 2 continuam pendências documentadas; não foram reclassificados ou corrigidos nesta preparação. Manifest/permissões/backup efetivos da instalação atual ainda precisam ser conferidos no Android.

### Preservação e conclusão provisória (23/10/2026)

Nenhum dado SQLite do aparelho foi lido ou modificado nesta rodada. Alterações anteriores de código e documentos foram preservadas. Não foi gerado APK, efetuado deploy ou publicação. A validação permanece aberta no reconhecimento USB; o relatório deve ser atualizado com evidências reais à medida que os ensaios ocorrerem.
