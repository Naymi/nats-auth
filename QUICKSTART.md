# Быстрый старт

## 1. Установка зависимостей
```bash
yarn install
```

## 2. Генерация сертификатов

```bash
yarn setup
```

Или по отдельности:
```bash
yarn gen:main   # Root CA и main сервер
yarn gen:agent  # Leaf сертификат и agent
```

## 3. Запуск

### Терминал 1 - Main сервер
```bash
yarn start:main
```

### Терминал 2 - Agent (Leaf Node)
```bash
yarn start:agent
```

## 4. Проверка подключения

```bash
# Подключение к main
nats pub -s localhost:4222 test "Hello from main"

# Подключение к agent
nats pub -s localhost:4223 test "Hello from agent"
```

## Что создается

- **certs/rootCA.{key,crt}** - Root CA для подписи сертификатов
- **certs/leaf.{key,crt}** - Клиентский сертификат для leaf node
- **config/main.conf** - Конфигурация main сервера (порты 4222, 7422)
- **config/agent.conf** - Конфигурация agent с подключением к main
