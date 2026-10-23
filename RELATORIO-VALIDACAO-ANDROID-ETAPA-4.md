# Tá na Lista! — Validação Android da Etapa 4

Data de preparação: 23/10/2026. **Status: em andamento. O usuário confirmou cabo conectado e depuração ativada; as consultas ADB da retomada ainda não reconhecem o aparelho. Nenhum teste físico desta rodada está aprovado.**

## Preparação e evidências atuais

- Lido integralmente `RELATORIO-ETAPA-4-FASE-2.md`. Base automatizada histórica: 33 testes aprovados; isso não comprova funcionamento no Android.
- Node local: v22.19.0. Dependências já instaladas. Não foi executada instalação ou atualização.
- `package.json`, `package-lock.json`, `app.json` e `eas.json` não apresentam diferenças em relação ao Git. Fases recentes alteraram apenas JavaScript/TypeScript, documentação e proteção de arquivos; nenhuma necessidade de nova build foi identificada na análise estática.
- Pacote configurado: `com.tanalista.app`. Google Mobile Ads 17.4.0 com App ID/banner oficiais de teste, measurement delay e bloqueio de produção preservados. Banco `ta-na-lista.db`, schema 1 preservado.
- A build histórica `e11a08c0` foi instalada e validada em 23/10 conforme `DIAGNOSTICO-ADMOB.md`. A instalação atual ainda não foi consultada nesta rodada: a compatibilidade com o binário presente no celular permanece **pendente de confirmação**, embora não haja mudança nativa que exija recompilação.
- Platform Tools existente em `.expo/android-tools/platform-tools/adb.exe`. A execução restrita falhou por permissão da pasta de configuração; repetição autorizada iniciou o daemon ADB na porta 5037.
- `adb devices -l`: cabeçalho sem dispositivos. Não foi reconhecido Moto G84 nem dispositivo `unauthorized` nesta consulta.
- Metro iniciado nesta raiz com `npm.cmd run start:dev -- --lan`, `EXPO_OFFLINE=1` e telemetria desativada para o processo. Endpoint `http://127.0.0.1:8081/status` respondeu **`packager-status:running`**. Esse resultado comprova o servidor local, não a conexão do aparelho.
- Aviso sobre ausência de `iosAppId` apareceu na inicialização; o projeto e a validação são Android. Não foi aplicada alteração iOS sem necessidade.

## Interação solicitada e ponto de espera

Foi solicitado ao usuário:

1. Conectar o Moto G84 por cabo USB de dados e manter a tela desbloqueada.
2. Ativar **Configurações → Sistema → Opções do desenvolvedor → Depuração USB**. Se necessário, habilitar o menu tocando sete vezes em **Número da versão**, em Sobre o telefone.
3. Aceitar **Permitir depuração USB?** somente reconhecendo este computador; selecionar Transferência de arquivos se necessário.
4. Confirmar “USB conectado e depuração autorizada”, ou informar a mensagem exibida.

Até a confirmação, não serão executadas ações dependentes no aparelho. Nenhum app foi aberto, encerrado, reinstalado ou alterado nesta preparação.

### Retomada após confirmação de conexão pelo usuário

O usuário informou que conectou o Moto G84 via USB e ativou a depuração. Foram realizadas duas consultas novas com `adb devices -l`, ambas com lista vazia, sem estado `device`, `unauthorized` ou `offline`.

ADB confirmado: Android Debug Bridge 1.0.41, Platform Tools 37.0.1, executável desta raiz e daemon presente no Windows. Consulta somente de leitura via `Get-PnpDevice -PresentOnly`, filtrada pelos nomes Motorola/Moto G84/Android/ADB/MTP, não retornou correspondências. Isso não comprova defeito no cabo ou driver; apenas indica que nenhum dispositivo com esses nomes foi encontrado. Não foram instalados drivers, reiniciado o daemon, revogadas autorizações nem alteradas configurações USB.

Foi solicitada nova interação: desbloquear o aparelho, reconectar diretamente em outra porta USB, selecionar **Transferência de arquivos/Android Auto** na notificação USB, conferir depuração e aceitar a autorização RSA se aparecer. Se só carregar e não houver notificação, testar outro cabo de dados. Aguardar relato sobre a notificação e a autorização antes de retomar as verificações dependentes do aparelho.

O roteiro permanece no passo 1. Sem reconhecimento não foi possível identificar o binário instalado, capturar baseline SQLite, observar telas/anúncios ou executar fluxos. As listas não foram acessadas ou alteradas. Não houve geração de APK, reinstalação ou avanço de fase.

## Roteiro seguro para continuidade

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

## Limites específicos de anúncios e offline

O App ID de demonstração não valida mensagens da conta da desenvolvedora. Se um formulário não aparecer, registrar a resposta observada e não declarar aceitação/recusa regional aprovada. Sem IDs próprios, aparelho de teste UMP e configuração aplicável, esses cenários poderão permanecer pendentes. Não substituir IDs nem forçar exibição ignorando consentimento.

Modo avião com bundle carregado verifica operações locais sem internet; inicialização fria de Development Build pode continuar dependendo do Metro. Separar esses resultados. Solicitar instruções de rede ao usuário com restauração posterior explicitamente confirmada, sem presumir que USB ou Wi-Fi foram desligados.

## Erros e correções

Até aqui, somente erro de permissão do ADB no ambiente restrito, resolvido executando a ferramenta com acesso autorizado. Nenhum erro de aplicativo foi reproduzido. **Nenhuma correção de código foi aplicada nesta preparação.**

Os cinco alertas de tooling registrados na fase 2 continuam pendências documentadas; não foram reclassificados ou corrigidos nesta preparação. Manifest/permissões/backup efetivos da instalação atual ainda precisam ser conferidos no Android.

## Preservação e conclusão provisória

Nenhum dado SQLite do aparelho foi lido ou modificado nesta rodada. Alterações anteriores de código e documentos foram preservadas. Não foi gerado APK, efetuado deploy ou publicação. A validação permanece aberta no reconhecimento USB; o relatório deve ser atualizado com evidências reais à medida que os ensaios ocorrerem.
