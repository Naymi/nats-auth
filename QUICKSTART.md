# Быстрый старт

## Предварительные требования

- Node.js 18+ и Yarn 4.17.0+
- [OpenSSL](https://www.openssl.org/) для генерации сертификатов
- [NATS Server](https://github.com/nats-io/nats-server) для запуска серверов

## 1. Установка зависимостей

```bash
yarn install
yarn build
```

## 2. Инициализация (все в одной команде)

Создает Root CA, main сервер и default агент:

```bash
yarn cli init
```

Или используя встроенный CLI:
```bash
node dist/cli.js init
```

## 3. Запуск серверов

### Терминал 1 - Main сервер

```bash
yarn cli server:start
```

С debug логами:
```bash
yarn cli server:start --debug
```

С trace логами (максимальная детализация):
```bash
yarn cli server:start --trace
```

### Терминал 2 - Agent (Leaf Node)

```bash
yarn cli agent:start agent
```

С debug логами:
```bash
yarn cli agent:start agent --debug
```

## 4. Создание дополнительных агентов

```bash
# С автоматическим выбором порта
yarn cli agent:create worker-1

# С указанием порта и хоста
yarn cli agent:create worker-2 --port 4224 --host 0.0.0.0

# Запуск нового агента
yarn cli agent:start worker-1
```

## 5. Просмотр агентов

```bash
# Список всех агентов
yarn cli agent:list

# Детальная информация об агенте
yarn cli agent:info agent
yarn cli agent:info worker-1
```

## 6. Редактирование конфигурации агента

```bash
# Изменить порт
yarn cli agent:edit worker-1 --port 5000

# Изменить хост
yarn cli agent:edit worker-1 --host 127.0.0.1

# Изменить remote URL (адрес main сервера)
yarn cli agent:edit worker-1 --remote-url tls://production-server:7422
```

## 7. Проверка подключения

```bash
# Подключение к main серверу
nats pub -s localhost:4222 test "Hello from main"

# Подключение к default агенту
nats pub -s localhost:4223 test "Hello from agent"

# Подключение к custom агенту
nats pub -s localhost:4224 test "Hello from worker-1"
```

## 8. Очистка

Удаляет все сгенерированные сертификаты, конфигурации и агентов:

```bash
yarn cli clean
```

## Что создается

### После `yarn cli init`:

```
certs/
├── rootCA.key          # Root CA приватный ключ
├── rootCA.crt          # Root CA сертификат
├── main.key            # Main сервер приватный ключ
└── main.crt            # Main сервер сертификат

config/
└── main.conf           # Main сервер конфигурация (порты 4222, 7422)

agents/
└── agent/              # Default агент
    ├── certs/
    │   ├── agent.key   # Agent приватный ключ
    │   └── agent.crt   # Agent сертификат
    └── config/
        └── agent.conf  # Agent конфигурация (порт 4223)
```

### После создания дополнительных агентов:

```
agents/
├── agent/              # Default агент
├── worker-1/           # Custom агент
│   ├── certs/
│   │   ├── worker-1.key
│   │   └── worker-1.crt
│   └── config/
│       └── worker-1.conf
└── worker-2/           # Еще один custom агент
    ├── certs/
    │   ├── worker-2.key
    │   └── worker-2.crt
    └── config/
        └── worker-2.conf
```

## Альтернативные команды

### Пошаговая инициализация (вместо `init`)

```bash
# 1. Создать Root CA и main сервер
yarn cli server:init

# 2. Создать default агент
yarn cli agent:init
```

### Прямой запуск через nats-server

```bash
# Main сервер
nats-server -c config/main.conf

# Default агент
nats-server -c agents/agent/config/agent.conf

# Custom агент
nats-server -c agents/worker-1/config/worker-1.conf
```

## Справка по командам

Посмотреть все доступные команды:

```bash
yarn cli --help
```

Справка по конкретной команде:

```bash
yarn cli agent:create --help
yarn cli server:start --help
yarn cli agent:edit --help
```

## Режим разработки

Запуск CLI без сборки (через tsx):

```bash
yarn cli <command>
```

Например:
```bash
yarn cli init
yarn cli agent:list
yarn cli server:start --debug
```

## Следующие шаги

- Прочитайте [README.md](./README.md) для детального описания архитектуры и всех возможностей
- Изучите [PRD.md](./PRD.md) для понимания дизайн-решений и технических деталей
- Посмотрите [CLAUDE.md](./CLAUDE.md) для инструкций по работе с кодовой базой
