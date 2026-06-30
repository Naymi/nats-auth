# NATS Authentication with TLS Certificates

CLI-инструмент для генерации TLS сертификатов и конфигураций для NATS сервера с архитектурой leaf node.

## Возможности

- 🔐 Автоматическая генерация TLS сертификатов (Root CA, server, leaf node)
- ⚙️ Генерация конфигураций NATS сервера с абсолютными путями
- 🎯 Простой CLI интерфейс на базе Commander.js
- 🌳 Поддержка архитектуры Leaf Node
- 🔒 Взаимная TLS аутентификация
- 👥 Менеджмент множественных агентов с уникальными именами
- 📊 Просмотр статуса и детальной информации об агентах
- ✏️ Редактирование конфигураций агентов без пересоздания сертификатов
- 🏷️ Поддержка кастомных имен серверов (server_name) для идентификации в логах
- 🌐 Поддержка JetStream доменов для логической изоляции потоков данных

## Требования

- Node.js (v18+), Yarn (v4.17.0+)
- [OpenSSL](https://www.openssl.org/) - для генерации сертификатов
- [NATS Server](https://github.com/nats-io/nats-server) - для запуска серверов

## Установка

```bash
yarn install
yarn build
```

## Использование

### Быстрая настройка

Генерация всех сертификатов и конфигураций одной командой:

```bash
yarn cli init
# or
node dist/cli.js init
```

Это создаст:
- Root CA (центр сертификации)
- Сертификат и конфигурацию main сервера
- Default агент в директории agents/agent/

### CLI Команды

#### Индивидуальная генерация

```bash
# Генерация Root CA и main сервера с опциональным именем и доменом
yarn cli server:init [--name <имя>] [--domain <домен>]

# Примеры:
yarn cli server:init --name hub --domain production
yarn cli server:init --name dev-server

# Генерация default агента (требует предварительного выполнения server:init)
yarn cli agent:init [--domain <домен>]

# Пример:
yarn cli agent:init --domain production
```

#### Менеджмент агентов

```bash
# Просмотр списка всех агентов
yarn cli agent:list

# Создание нового агента с кастомными параметрами
yarn cli agent:create <имя> [--port <порт>] [--host <хост>] [--domain <домен>] [--replace]

# Примеры:
yarn cli agent:create worker-1
yarn cli agent:create worker-2 --port 4224 --host 0.0.0.0
yarn cli agent:create worker-3 --domain production
yarn cli agent:create worker-4 --port 4225 --domain staging

# Если агент существует, будет запрошено подтверждение замены
# Используйте --replace для автоматической замены без подтверждения
yarn cli agent:create worker-1 --replace

# Получение детальной информации об агенте
yarn cli agent:info <имя>

# Редактирование конфигурации агента
yarn cli agent:edit <имя> [--port <порт>] [--host <хост>] [--remote-url <url>]

# Примеры:
yarn cli agent:edit worker-1 --port 5000
yarn cli agent:edit worker-2 --host 127.0.0.1 --remote-url tls://localhost:7422

# Запуск агента
yarn cli agent:start <имя> [--debug] [--trace]

# Примеры:
yarn cli agent:start worker-1
yarn cli agent:start worker-2 --debug
```

**Возможности менеджмента агентов:**
- **agent:list** - показывает все агенты с их статусом (сертификат, конфиг)
- **agent:create** - создает новый агент с уникальным именем и параметрами. При существующем агенте запрашивает подтверждение замены (используйте --replace для автоматической замены)
- **agent:info** - выводит детальную информацию: порт, хост, валидность сертификата, пути к файлам
- **agent:edit** - обновляет конфигурацию агента без пересоздания сертификатов
- **agent:start** - запускает агент с опциональным debug/trace логированием

#### Очистка

Удаление всех сгенерированных сертификатов и конфигураций:

```bash
yarn cli clean
# or
node dist/cli.js clean
```

Удаляет директории: `certs/`, `config/`, `agents/`

#### Справка

Просмотр всех доступных команд:

```bash
yarn cli --help
```

Справка по конкретной команде:

```bash
yarn cli server:init --help
yarn cli agent:create --help
```

### Запуск серверов

**Рекомендуется использовать CLI (с поддержкой debug/trace логов):**

#### Main сервер
```bash
yarn cli server:start
# или
node dist/cli.js server:start

# С debug логированием
yarn cli server:start --debug

# С trace логированием
yarn cli server:start --trace
```

#### Агенты
```bash
yarn cli agent:start <имя>
# или
node dist/cli.js agent:start <имя>

# Примеры:
yarn cli agent:start agent
yarn cli agent:start worker-1 --debug
yarn cli agent:start worker-2 --trace
```

**Альтернативный способ (прямой запуск nats-server):**

```bash
# Main сервер
nats-server -c config/main.conf

# Default agent
nats-server -c agents/agent/config/agent.conf

# Custom agents
nats-server -c agents/<имя-агента>/config/<имя-агента>.conf
```

## Архитектура

### Main Server
- **Client port**: 4222 (TLS включен)
- **Leaf node port**: 7422 (TLS включен)
- **JetStream**: Включен с директорией `./jetstream`
- Выступает в роли центрального NATS хаба
- Поддерживает pub/sub messaging и streaming

### Agent (Leaf Node)
- **Default port**: 4223 (настраивается при создании)
- **Default host**: 127.0.0.1 (настраивается при создании)
- **JetStream**: Включен с отдельной директорией `./jetstream-agent` (или `agents/<name>/jetstream`)
- Подключается к main серверу через TLS на порту 7422
- Использует клиентский сертификат для аутентификации
- Каждый агент имеет изолированную директорию с собственными:
  - Сертификатами (в `agents/<name>/certs/`)
  - Конфигурацией (в `agents/<name>/config/`)
  - JetStream хранилищем (в `agents/<name>/jetstream/`)

### Цепочка сертификатов
- Root CA подписывает сертификаты как сервера, так и всех leaf nodes
- Устанавливает взаимное доверие между компонентами
- Все соединения требуют взаимной TLS верификации (verify: true)
- Leaf node аутентифицируется с помощью клиентского сертификата, подписанного Root CA

### JetStream
Оба типа серверов (main и agents) имеют JetStream для:
- Персистентного хранения сообщений
- Streaming и replay функциональности
- At-least-once и exactly-once delivery гарантий
- Хранилища создаются автоматически при первом запуске сервера

## Структура проекта

```
.
├── src/
│   ├── cli.ts                          # CLI entry point
│   │
│   ├── core/                           # Core domain logic
│   │   ├── certificates/               # Certificate management
│   │   │   ├── authority.ts            # CertificateAuthority class
│   │   │   └── adapters/
│   │   │       ├── openssl.ts          # OpenSSL adapter
│   │   │       └── filesystem.ts       # Filesystem adapter
│   │   ├── config/                     # NATS configuration
│   │   │   ├── builder.ts              # NATSConfigBuilder class
│   │   │   └── defaults.ts             # Default configuration constants
│   │   ├── agent/                      # Agent registry and management
│   │   │   ├── registry.ts             # AgentRegistry class
│   │   │   └── paths.ts                # Agent path helpers
│   │   ├── domain/                     # Domain models
│   │   │   └── agent-name.ts           # AgentName value object
│   │   ├── validation/                 # Validation logic
│   │   │   ├── schemas.ts              # Zod schemas
│   │   │   └── validators.ts           # Validation functions
│   │   └── container.ts                # Dependency injection container
│   │
│   ├── commands/                       # CLI command implementations
│   │   ├── server/
│   │   │   ├── generate-config.ts      # Server NATS configuration
│   │   │   └── start.ts                # Start main server
│   │   └── agent/
│   │       ├── create.ts               # Create new agent
│   │       ├── edit.ts                 # Edit agent configuration
│   │       ├── generate-config.ts      # Agent NATS configuration
│   │       ├── info.ts                 # Get agent details
│   │       ├── list.ts                 # List all agents
│   │       └── start.ts                # Start agent
│   │
│   ├── shared/                         # Shared utilities
│   │   ├── fs.ts                       # File system helpers
│   │   ├── logger.ts                   # Logging utilities
│   │   └── paths.ts                    # Global path constants
│   │
│   └── types/                          # Global type definitions
│       └── nats-config.ts              # NATS configuration interfaces
│
├── tests/                              # Test files
│   ├── core/
│   │   ├── certificates/
│   │   ├── config/
│   │   └── agent/
│   └── shared/
│
├── certs/                              # Generated TLS certificates (gitignored)
│   ├── rootCA.key/crt                  # Root Certificate Authority
│   └── main.key/crt                    # Main server certificate
│
├── config/                             # Generated NATS configurations (gitignored)
│   └── main.conf                       # Main server config with absolute cert paths
│
├── agents/                             # Agent directories (gitignored)
│   └── <agent-name>/                   # Individual agent directory
│       ├── certs/                      # Agent certificates
│       │   ├── <agent-name>.key        # Agent private key
│       │   └── <agent-name>.crt        # Agent certificate
│       ├── config/                     # Agent configuration
│       │   └── <agent-name>.conf       # Agent NATS config
│       └── jetstream/                  # Agent JetStream data (created at runtime)
│
├── jetstream/                          # JetStream data for main server (gitignored)
└── package.json
```

### Архитектура кода

Проект следует принципам **Clean Architecture** и **SOLID**:

#### Core Domain (`src/core/`)
- **certificates/** - Certificate Authority и адаптеры (OpenSSL, filesystem)
- **config/** - NATS configuration builder и defaults
- **agent/** - Agent registry и управление путями
- **domain/** - Доменные модели (AgentName value object)
- **validation/** - Zod схемы и валидаторы
- **container.ts** - Dependency injection container

#### Commands (`src/commands/`)
Тонкие обертки над core модулями:
- Парсинг CLI аргументов
- Вызов core модулей
- Вывод результатов пользователю

#### Shared (`src/shared/`)
- **fs.ts** - Управление директориями (создание, удаление)
- **paths.ts** - Централизованные константы путей
- **logger.ts** - Утилиты для логирования

#### Types (`src/types/`)
- Глобальные интерфейсы для NATS конфигурации

### Структура директории агента

Каждый агент имеет свою изолированную директорию:
- **certs/** - Сертификаты и ключи агента
- **config/** - NATS конфигурация с абсолютными путями
- **jetstream/** - Директория для JetStream данных (создается при первом запуске)

## Детали сертификатов

Все сертификаты используют:
- 4096-битные RSA ключи
- SHA-256 алгоритм подписи
- SAN (Subject Alternative Name) с localhost, 127.0.0.1 и hostname
- Extended key usage для server и client аутентификации
- Серверные сертификаты валидны 825 дней
- Root CA валиден 10 лет

## Разработка и тестирование

### Скрипты разработки

```bash
# Сборка проекта
yarn build

# Сборка с очисткой
yarn build:clean

# Запуск CLI в режиме разработки (без сборки)
yarn cli <command>

# Линтинг
yarn lint
yarn lint:fix

# Форматирование кода
yarn format
yarn format:check
```

### Тестирование

```bash
# Запуск тестов
yarn test

# Запуск тестов один раз (без watch режима)
yarn test:run

# UI для тестов
yarn test:ui

# Покрытие кода тестами
yarn test:coverage
```

Проект использует:
- **Vitest** для unit-тестирования
- **Zod** для валидации данных
- **TypeScript** для типобезопасности

## Используемые технологии

### NATS Server
[NATS](https://nats.io/) - облачно-ориентированная система обмена сообщениями с поддержкой:
- **Core NATS** - легковесный pub/sub messaging
- **JetStream** - встроенное хранилище для persistence и streaming
- **Leaf Nodes** - распределенная архитектура для edge computing

Документация:
- [NATS Documentation](https://docs.nats.io/)
- [NATS Server](https://github.com/nats-io/nats-server)
- [JetStream Guide](https://docs.nats.io/nats-concepts/jetstream)
- [Leaf Nodes](https://docs.nats.io/running-a-nats-service/configuration/leafnodes)

Команды запуска:
```bash
# Запуск с конфигурационным файлом
nats-server -c <config-file>

# Запуск с debug логами
nats-server -c <config-file> -D

# Просмотр справки
nats-server --help
```

### OpenSSL
[OpenSSL](https://www.openssl.org/) - инструментарий для работы с TLS/SSL и криптографией.

Используемые команды в проекте:

**1. Генерация приватного ключа RSA**
```bash
openssl genrsa -out <keyfile> 4096
```
- Создает 4096-битный RSA ключ
- [Документация genrsa](https://www.openssl.org/docs/man3.0/man1/openssl-genrsa.html)

**2. Создание самоподписанного Root CA**
```bash
openssl req -x509 -new -nodes -key <keyfile> -sha256 -days 3650 -out <certfile> -subj "<subject>"
```
- `-x509` - создает самоподписанный сертификат
- `-sha256` - использует SHA-256 для подписи
- `-days 3650` - валидность 10 лет
- [Документация req](https://www.openssl.org/docs/man3.0/man1/openssl-req.html)

**3. Генерация Certificate Signing Request (CSR)**
```bash
openssl req -new -key <keyfile> -out <csrfile> -subj "<subject>"
```
- Создает запрос на подпись сертификата
- [Документация CSR](https://www.openssl.org/docs/man3.0/man1/openssl-req.html)

**4. Подпись сертификата с помощью CA**
```bash
openssl x509 -req -in <csrfile> -CA <ca-cert> -CAkey <ca-key> -CAcreateserial \
  -out <certfile> -days 825 -sha256 -extfile <extfile>
```
- `-CAcreateserial` - автоматическое создание serial number
- `-days 825` - максимальная валидность для современных браузеров
- `-extfile` - добавление расширений (SAN, extended key usage)
- [Документация x509](https://www.openssl.org/docs/man3.0/man1/openssl-x509.html)

Расширения сертификатов (SAN и Extended Key Usage):
```
subjectAltName = DNS:localhost,DNS:<hostname>,IP:127.0.0.1
extendedKeyUsage = serverAuth,clientAuth
```
- **SAN (Subject Alternative Name)** - альтернативные имена для валидации
- **Extended Key Usage** - назначение сертификата (server/client auth)
- [RFC 5280 - X.509 Certificate Extensions](https://tools.ietf.org/html/rfc5280)

## Полезные ресурсы

### NATS
- [NATS Official Website](https://nats.io/)
- [NATS GitHub](https://github.com/nats-io)
- [NATS Community](https://natsio.slack.com/)
- [NATS by Example](https://natsbyexample.com/)

### TLS/SSL & PKI
- [OpenSSL Documentation](https://www.openssl.org/docs/)
- [RFC 5280 - X.509 PKI Certificate](https://tools.ietf.org/html/rfc5280)
- [Mozilla SSL Configuration Generator](https://ssl-config.mozilla.org/)
- [SSL Labs](https://www.ssllabs.com/) - тестирование SSL/TLS конфигурации

## Безопасность

- Все соединения используют TLS
- Leaf Node аутентифицируется с помощью клиентского сертификата
- Root CA валидирует все сертификаты
- Взаимная TLS верификация для всех подключений

## Примеры использования

### Использование имен серверов и JetStream доменов

```bash
# Создание production окружения с именем и доменом
yarn cli server:init --name prod-hub --domain production

# Создание агентов для production домена
yarn cli agent:create prod-worker-1 --domain production
yarn cli agent:create prod-worker-2 --port 4224 --domain production

# Создание staging окружения
yarn cli server:init --name staging-hub --domain staging
yarn cli agent:create staging-worker --domain staging

# Запуск серверов - имена будут видны в логах
yarn cli server:start --debug
# В логах: [INF] Name: prod-hub
# В логах: [INF] Domain: production

yarn cli agent:start prod-worker-1 --debug
# В логах: [INF] Name: prod-worker-1
# В логах: [INF] Domain: production
```

**Преимущества использования доменов:**
- Логическая изоляция JetStream потоков между окружениями
- Один main сервер может обслуживать несколько доменов
- Упрощение управления в мульти-тенантных конфигурациях

### Типичный сценарий: создание инфраструктуры с несколькими агентами

```bash
# 1. Инициализация проекта (Root CA + main server + default agent)
yarn cli init

# 2. Создание дополнительных агентов для разных окружений
yarn cli agent:create dev-worker --port 4224
yarn cli agent:create staging-worker --port 4225
yarn cli agent:create prod-worker --port 4226 --host 0.0.0.0

# 3. Просмотр всех агентов
yarn cli agent:list

# 4. Запуск main сервера
yarn cli server:start --debug

# 5. В отдельных терминалах - запуск агентов
yarn cli agent:start dev-worker --debug
yarn cli agent:start staging-worker
yarn cli agent:start prod-worker
```

### Изменение конфигурации существующего агента

```bash
# Изменить порт без пересоздания сертификата
yarn cli agent:edit worker-1 --port 5000

# Изменить хост и remote URL
yarn cli agent:edit worker-1 --host 0.0.0.0 --remote-url tls://production-server:7422

# Проверить обновленную конфигурацию
yarn cli agent:info worker-1
```

### Замена агента (пересоздание сертификата и конфига)

```bash
# С подтверждением
yarn cli agent:create worker-1 --port 4230

# Без подтверждения (автоматическая замена)
yarn cli agent:create worker-1 --port 4230 --replace
```

## FAQ

**Q: Что делать, если команда `agent:init` завершается с ошибкой?**  
A: Убедитесь, что вы сначала выполнили `server:init` или `init`. Root CA должен существовать до создания агентов.

**Q: Можно ли изменить порт агента после создания?**  
A: Да, используйте `yarn cli agent:edit <name> --port <новый-порт>`. Это обновит только конфигурацию без пересоздания сертификата.

**Q: Как удалить агента?**  
A: Удалите директорию агента вручную: `rm -rf agents/<имя-агента>`, или выполните `yarn cli clean` для удаления всех сгенерированных файлов.

**Q: Сколько агентов можно создать?**  
A: Неограниченное количество, но каждый должен иметь уникальный порт и имя.

**Q: Где хранятся данные JetStream?**  
A: Для main сервера - в `./jetstream`, для каждого агента - в `agents/<имя>/jetstream/`. Эти директории создаются автоматически при первом запуске.

**Q: Нужно ли пересоздавать сертификаты при изменении конфигурации?**  
A: Нет, команда `agent:edit` обновляет только конфигурацию. Сертификаты пересоздаются только при `agent:create`.

**Q: Как проверить валидность сертификата агента?**  
A: Используйте `yarn cli agent:info <имя>` - команда покажет период валидности сертификата и предупредит, если он истек.

**Q: Можно ли использовать агенты на разных машинах?**  
A: Да, скопируйте директорию агента (`agents/<имя>/`) на целевую машину и обновите `remote-url` через `agent:edit`, указав внешний IP/hostname main сервера.

**Q: Зачем нужны имена серверов (server_name)?**  
A: Имена серверов помогают идентифицировать конкретные инстансы в логах, мониторинге и при отладке. Это особенно полезно при работе с несколькими серверами.

**Q: Что такое JetStream домен и зачем он нужен?**  
A: JetStream домен обеспечивает логическую изоляцию потоков и consumers между различными окружениями (production, staging, development). Серверы в одном домене видят только свои потоки данных.

**Q: Можно ли изменить имя сервера или домен после создания?**  
A: Имя сервера и домен задаются при генерации конфигурации. Для изменения нужно пересоздать конфигурацию командой `server:init` или `agent:create` с новыми параметрами.

**Q: Обязательно ли указывать домен при создании агента?**  
A: Нет, домен опционален. Если не указан, агент работает в глобальном пространстве JetStream без изоляции.

## Troubleshooting

### Ошибка "EADDRINUSE" при запуске сервера
Порт уже занят другим процессом. Используйте `agent:edit` для изменения порта или завершите процесс, занимающий порт:
```bash
# Найти процесс на порту
lsof -i :4223

# Завершить процесс
kill -9 <PID>
```

### TLS handshake errors
- Проверьте, что Root CA и сертификаты не истекли
- Убедитесь, что пути к сертификатам в конфиге корректны (абсолютные пути)
- Проверьте права доступа к файлам сертификатов

### Агент не может подключиться к main серверу
- Убедитесь, что main сервер запущен на порту 7422
- Проверьте `remote-url` в конфиге агента
- Если main сервер на другой машине, убедитесь, что порт 7422 открыт в firewall
