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
# Генерация Root CA и main сервера
yarn cli server:init

# Генерация default агента (требует предварительного выполнения server:init)
yarn cli agent:init
```

#### Менеджмент агентов

```bash
# Просмотр списка всех агентов
yarn cli agent:list

# Создание нового агента с кастомными параметрами
yarn cli agent:create <имя> [--port <порт>] [--host <хост>]

# Примеры:
yarn cli agent:create worker-1
yarn cli agent:create worker-2 --port 4224 --host 0.0.0.0

# Получение детальной информации об агенте
yarn cli agent:info <имя>

# Редактирование конфигурации агента
yarn cli agent:edit <имя> [--port <порт>] [--host <хост>] [--remote-url <url>]

# Примеры:
yarn cli agent:edit worker-1 --port 5000
yarn cli agent:edit worker-2 --host 127.0.0.1 --remote-url tls://localhost:7422
```

**Возможности менеджмента агентов:**
- **agent:list** - показывает все агенты с их статусом (сертификат, конфиг)
- **agent:create** - создает новый агент с уникальным именем и параметрами
- **agent:info** - выводит детальную информацию: порт, хост, валидность сертификата, пути к файлам
- **agent:edit** - обновляет конфигурацию агента без пересоздания сертификатов

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

#### Main сервер
```bash
nats-server -c config/main.conf
```

#### Default agent
```bash
nats-server -c agents/agent/config/agent.conf
```

#### Custom agents
```bash
nats-server -c agents/<имя-агента>/config/<имя-агента>.conf
# Например:
nats-server -c agents/worker-1/config/worker-1.conf
```

## Архитектура

### Main Server
- **Client port**: 4222 (TLS включен)
- **Leaf node port**: 7422 (TLS включен)
- Выступает в роли центрального NATS хаба

### Agent (Leaf Node)
- **Port**: 4223
- Подключается к main серверу через TLS
- Использует клиентский сертификат для аутентификации

### Цепочка сертификатов
- Root CA подписывает сертификаты как сервера, так и leaf node
- Устанавливает взаимное доверие между компонентами
- Все соединения требуют взаимной TLS верификации

## Структура проекта

```
.
├── src/
│   ├── cli.ts                      # CLI entry point
│   ├── features/
│   │   ├── ca/
│   │   │   └── generate-root-ca.ts        # Root CA generation
│   │   ├── server/
│   │   │   ├── generate-certificate.ts    # Main server certificate
│   │   │   └── generate-config.ts         # Main server configuration
│   │   └── agent/
│   │       ├── generate-certificate.ts    # Leaf node certificate (с поддержкой имен)
│   │       ├── generate-config.ts         # Agent configuration (с кастомными параметрами)
│   │       ├── list-agents.ts             # Список агентов
│   │       ├── create-agent.ts            # Создание агента
│   │       ├── get-agent-info.ts          # Информация об агенте
│   │       └── edit-agent.ts              # Редактирование конфигурации
│   └── utils/
│       ├── fs.ts                   # File system utilities
│       └── paths.ts                # Path constants
├── certs/                          # Сгенерированные сертификаты (gitignored)
│   ├── rootCA.key/crt              # Root Certificate Authority
│   └── main.key/crt                # Сертификат main сервера
├── config/                         # Сгенерированные конфигурации NATS (gitignored)
│   └── main.conf                   # Конфигурация main сервера
├── agents/                         # Директории агентов (gitignored)
│   └── <имя-агента>/               # Индивидуальная директория агента
│       ├── certs/                  # Сертификаты агента
│       │   ├── <имя-агента>.key    # Приватный ключ
│       │   └── <имя-агента>.crt    # Сертификат
│       ├── config/                 # Конфигурация агента
│       │   └── <имя-агента>.conf   # NATS конфигурация
│       └── jetstream/              # JetStream данные (создается при запуске)
├── jetstream/                      # JetStream данные main сервера (gitignored)
└── package.json
```

### Архитектура кода

Проект организован по фичам:
- **ca/** - Генерация Root Certificate Authority
- **server/** - Сертификат и конфигурация main сервера
- **agent/** - Сертификаты, конфигурации и менеджмент leaf nodes

Утилиты в `src/utils/`:
- **fs.ts** - Управление директориями (создание, удаление)
- **paths.ts** - Централизованные константы путей

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

## Детали сертификатов

Все сертификаты используют:
- 4096-битные RSA ключи
- SHA-256 алгоритм подписи
- SAN (Subject Alternative Name) с localhost, 127.0.0.1 и hostname
- Extended key usage для server и client аутентификации
- Серверные сертификаты валидны 825 дней
- Root CA валиден 10 лет

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
