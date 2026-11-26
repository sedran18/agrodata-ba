# Scheduler

O serviço `scheduler` do Docker Compose executa as coletas agendadas em um container separado. Ele usa a mesma imagem do backend (`agrodata-ba-backend`), com as mesmas dependências Python, mas não inicia a API.

O comando do serviço substitui o `CMD` da imagem. Por isso o scheduler não executa `init_db`, `backfill` nem o Uvicorn. Essas etapas continuam somente no container `backend`.

## Horários

O fuso é `America/Bahia`.

| Job | Módulo | Quando |
| --- | --- | --- |
| Diário | `backend.app.collector.jobs.daily` | Todo dia, à meia-noite |
| Mensal | `backend.app.collector.jobs.monthly` | Dia 1 de cada mês, às 00:30 |

Os horários ficam em `backend/crontab`:

```cron
0 0 * * * ... python -m backend.app.collector.jobs.daily
30 0 1 * * ... python -m backend.app.collector.jobs.monthly
```

O cron não dispara essas linhas na subida do container. Também não recupera execuções perdidas enquanto o container esteve parado. Não há entrada `@reboot`.

## O que o container faz ao iniciar

1. Confere `DATABASE_URL` e o fuso `TZ`.
2. Grava essas variáveis em `/etc/scheduler.env`, porque o cron não herda o ambiente do Docker.
3. Aplica `America/Bahia` no relógio do container.
4. Mantém o processo `cron -f` em primeiro plano, aguardando o próximo horário.

A conexão com o PostgreSQL usa o hostname `db`, o mesmo do backend.

## Logs

A saída e os erros de cada job vão para o stdout do processo principal e aparecem nos logs do container:

```bash
docker compose logs -f scheduler
```

O job diário registra falha por produto e segue para o próximo. O processo ainda pode terminar com sucesso. O job mensal deixa a exceção subir; o traceback aparece no log e o cron continua ativo para a próxima data.

## Como alterar os agendamentos

Edite `backend/crontab`. O fuso das regras é `CRON_TZ`. O fuso usado pelo Python (`datetime.now()`) vem de `TZ` no serviço `scheduler` em `compose.yml`. Mantenha os dois em `America/Bahia`, a menos que a mudança seja intencional.

Depois de alterar o crontab ou o entrypoint, reconstrua a imagem do backend. O scheduler não tem build próprio:

```bash
docker compose build backend
```

## Riscos

- No dia 1, o job diário começa à meia-noite e o mensal às 00:30. Se a coleta diária ainda estiver em andamento, os dois acessam as mesmas tabelas ao mesmo tempo. O mensal apaga uma janela de cotações enquanto o diário pode estar gravando.
- Se o backend ainda estiver no `backfill` inicial nesse horário, a coleta agendada e o backfill também gravam juntos. Inserções repetidas da mesma cotação são ignoradas; a exclusão mensal não distingue a origem dos registros.
- Uma coleta diária que dure mais de 24 horas pode cruzar com a execução do dia seguinte. O crontab não usa trava de concorrência.
- Na primeira subida, as tabelas são criadas pelo backend. Um horário que vença antes do `init_db` terminar faz o job falhar até que o schema `cotacoes` exista.
- Com o container parado na hora marcada, aquela execução não roda depois. O restart `unless-stopped` só religa o cron; não repete o horário perdido.
