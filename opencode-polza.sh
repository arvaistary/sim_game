#!/usr/bin/env bash
# -*- coding: utf-8 -*-

# Принудительно UTF-8 для корректного отображения
export LANG=en_US.UTF-8
export LC_ALL=en_US.UTF-8

# ╔═══════════════════════════════════════════════════════════════════╗
# ║                                                                   ║
# ║   ██████╗  ██████╗ ██╗     ███████╗ █████╗      █████╗ ██╗       ║
# ║   ██╔══██╗██╔═══██╗██║     ╚══███╔╝██╔══██╗    ██╔══██╗██║       ║
# ║   ██████╔╝██║   ██║██║       ███╔╝ ███████║    ███████║██║       ║
# ║   ██╔═══╝ ██║   ██║██║      ███╔╝  ██╔══██║    ██╔══██║██║       ║
# ║   ██║     ╚██████╔╝███████╗███████╗██║  ██║ ██╗██║  ██║██║       ║
# ║   ╚═╝      ╚═════╝ ╚══════╝╚══════╝╚═╝  ╚═╝ ╚═╝╚═╝  ╚═╝╚═╝       ║
# ║                                                                   ║
# ║   OpenCode Configuration Script                                   ║
# ║   https://polza.ai                                                ║
# ║                                                                   ║
# ╚═══════════════════════════════════════════════════════════════════╝

set -e

# ====================================
# POLZA.AI SETTINGS
# ====================================
PROVIDER_ID="polza"
PROVIDER_NAME="Polza.ai"
BASE_HOST="https://polza.ai/api/"
BASE_URL="${BASE_HOST}v2"
MODELS_URL="${BASE_HOST}/v2/models?type=chat"
BALANCE_URL="${BASE_HOST}/v1/balance"
CONFIG_FILE=""  # Будет установлено в select_config_location()
GLOBAL_CONFIG_DIR="$HOME/.config/opencode"
GLOBAL_CONFIG_FILE="$GLOBAL_CONFIG_DIR/opencode.json"
LOCAL_CONFIG_FILE="opencode.json"
# ====================================

# Цвета Polza.ai (зеленая тема)
MAIN_GREEN='\033[0;32m'
BRIGHT_GREEN='\033[1;32m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BOLD='\033[1m'
DIM='\033[2m'
NC='\033[0m'

# ASCII Logo
print_logo() {
    echo ""
    echo -e "${BRIGHT_GREEN}${BOLD}"
    echo "  ╔════════════════════════════════════════════╗"
    echo "  ║                                            ║"
    echo "  ║   ██████╗  ██████╗ ██╗     ███████╗ █████╗ ║"
    echo "  ║   ██╔══██╗██╔═══██╗██║     ╚══███╔╝██╔══██╗║"
    echo "  ║   ██████╔╝██║   ██║██║       ███╔╝ ███████║║"
    echo "  ║   ██╔═══╝ ██║   ██║██║      ███╔╝  ██╔══██║║"
    echo "  ║   ██║     ╚██████╔╝███████╗███████╗██║  ██║║"
    echo "  ║   ╚═╝      ╚═════╝ ╚══════╝╚══════╝╚═╝  ╚═╝║"
    echo "  ║                                            ║"
    echo "  ╚════════════════════════════════════════════╝"
    echo -e "${NC}"
    echo -e "      ${DIM}OpenCode Configuration Script v1.0${NC}"
    echo ""
}

print_separator() {
    echo -e "${MAIN_GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

print_step() {
    echo -e "${BRIGHT_GREEN}▸${NC} $1"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}!${NC} $1"
}

# Проверка зависимостей
check_dependencies() {
    local missing=()

    command -v curl &> /dev/null || missing+=("curl")
    command -v jq &> /dev/null || missing+=("jq")

    if [ ${#missing[@]} -ne 0 ]; then
        print_error "Отсутствуют зависимости: ${missing[*]}"
        echo "    Установи: ${BOLD}sudo apt install ${missing[*]}${NC}"
        exit 1
    fi

    # Проверка opencode
    if ! command -v opencode &> /dev/null; then
        print_error "OpenCode не установлен"
        echo ""
        echo -e "    Установи opencode:"
        echo -e "    ${DIM}curl -fsSL https://opencode.ai/install | bash${NC}"
        echo ""
        exit 1
    fi
    print_success "OpenCode найден"
}

# Выбор места сохранения конфига
select_config_location() {
    echo ""
    print_step "Куда сохранить конфиг?"
    echo ""
    echo -e "  ${BRIGHT_GREEN}1.${NC} Глобально (для всех проектов)"
    echo -e "     ${DIM}$GLOBAL_CONFIG_FILE${NC}"
    echo ""
    echo -e "  ${BRIGHT_GREEN}2.${NC} Локально (только этот проект)"
    echo -e "     ${DIM}$(pwd)/opencode.json${NC}"
    echo ""
    read -p "    Выбор [1/2]: " choice < /dev/tty

    case $choice in
        1)
            CONFIG_FILE="$GLOBAL_CONFIG_FILE"
            # Создаём директорию если нет
            if [ ! -d "$GLOBAL_CONFIG_DIR" ]; then
                mkdir -p "$GLOBAL_CONFIG_DIR"
            fi
            print_success "Выбран глобальный конфиг"
            ;;
        2|*)
            CONFIG_FILE="$LOCAL_CONFIG_FILE"
            print_success "Выбран локальный конфиг"
            ;;
    esac
}

# Запрос API ключа
get_api_key() {
    echo ""
    print_step "Введи API ключ Polza.ai"
    echo -e "    ${DIM}(получить ключ: https://polza.ai/dashboard)${NC}"
    echo ""
    read -s -p "    API Key: " API_KEY < /dev/tty
    echo ""

    if [ -z "$API_KEY" ]; then
        print_error "API ключ не может быть пустым"
        exit 1
    fi
    
    print_success "API ключ получен"
}

# Проверка API ключа через баланс
verify_api_key() {
    echo ""
    print_step "Проверка API ключа..."

    RESPONSE=$(curl -s -w "\n%{http_code}" \
        -H "Authorization: Bearer $API_KEY" \
        -H "Content-Type: application/json" \
        "$BALANCE_URL" 2>/dev/null) || {
        print_error "Не удалось подключиться к API"
        exit 1
    }

    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    BODY=$(echo "$RESPONSE" | sed '$d')

    if [ "$HTTP_CODE" != "200" ]; then
        print_error "Неверный API ключ (HTTP $HTTP_CODE)"
        case $HTTP_CODE in
            401) echo "    Ключ недействителен или истёк" ;;
            403) echo "    Доступ запрещён" ;;
            *)   echo "    Проверь API ключ" ;;
        esac
        exit 1
    fi

    print_success "API ключ валиден"

    # Выводим баланс как есть
    echo ""
    echo -e "  ${BRIGHT_GREEN}Баланс:${NC}"
    echo "$BODY" | jq -r 'to_entries[] | "    \(.key): \(.value)"' 2>/dev/null || echo "    $BODY"
}

# Получение списка моделей
fetch_models() {
    echo ""
    print_step "Загрузка списка моделей..."
    
    RESPONSE=$(curl -s -w "\n%{http_code}" \
        -H "Authorization: Bearer $API_KEY" \
        -H "Content-Type: application/json" \
        "$MODELS_URL" 2>/dev/null) || {
        print_error "Не удалось подключиться к API"
        exit 1
    }
    
    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    BODY=$(echo "$RESPONSE" | sed '$d')
    
    if [ "$HTTP_CODE" != "200" ]; then
        print_error "Ошибка API (HTTP $HTTP_CODE)"
        case $HTTP_CODE in
            401) echo "    Неверный API ключ" ;;
            403) echo "    Доступ запрещён" ;;
            404) echo "    Endpoint не найден" ;;
            *)   echo "    Проверь подключение и API ключ" ;;
        esac
        exit 1
    fi
    
    MODEL_COUNT=$(echo "$BODY" | jq -r '.data | length' 2>/dev/null || echo "0")
    
    if [ "$MODEL_COUNT" == "0" ] || [ "$MODEL_COUNT" == "null" ]; then
        print_error "Список моделей пуст"
        exit 1
    fi
    
    print_success "Найдено моделей: ${BOLD}$MODEL_COUNT${NC}"
    MODELS_JSON="$BODY"
}

# Генерация конфига
generate_models_config() {
    print_step "Генерация конфигурации..."
    
    MODELS_CONFIG=$(echo "$MODELS_JSON" | jq '
        .data | map({
            key: .id,
            value: {
                name: .name,
                limit: {
                    context: (.top_provider.context_length // 128000),
                    output: (.top_provider.max_completion_tokens // 8192)
                }
            }
        }) | from_entries
    ')
    
    # Avoid ARG_MAX limits on Windows by passing models via temp file.
    MODELS_TMP="$(mktemp)"
    echo "$MODELS_CONFIG" > "$MODELS_TMP"
    
    PROVIDER_CONFIG=$(jq -n \
        --arg npm "@ai-sdk/openai-compatible" \
        --arg name "$PROVIDER_NAME" \
        --arg baseURL "$BASE_URL" \
        --arg apiKey "$API_KEY" \
        --slurpfile models "$MODELS_TMP" \
        '{
            npm: $npm,
            name: $name,
            options: {
                baseURL: $baseURL,
                apiKey: $apiKey
            },
            models: $models[0]
        }')
    
    rm -f "$MODELS_TMP"
}

# Обновление конфига
update_config() {
    PROVIDER_TMP="$(mktemp)"
    echo "$PROVIDER_CONFIG" > "$PROVIDER_TMP"
    OUTPUT_TMP="$(mktemp)"

    if [ -f "$CONFIG_FILE" ]; then
        print_step "Обновление существующего конфига..."
        
        EXISTING_CONFIG=$(cat "$CONFIG_FILE")
        HAS_PROVIDER=$(echo "$EXISTING_CONFIG" | jq -r ".provider.\"$PROVIDER_ID\" // empty")
        
        if [ -n "$HAS_PROVIDER" ]; then
            print_warning "Провайдер 'polza' уже существует — перезаписываю"
        fi
        
        echo "$EXISTING_CONFIG" | jq \
            --arg pid "$PROVIDER_ID" \
            --slurpfile pconfig "$PROVIDER_TMP" \
            '.provider[$pid] = $pconfig[0]' > "$OUTPUT_TMP"
    else
        print_step "Создание нового конфига..."
        
        jq -n \
            --arg schema "https://opencode.ai/config.json" \
            --arg pid "$PROVIDER_ID" \
            --slurpfile pconfig "$PROVIDER_TMP" \
            '{
                "$schema": $schema,
                provider: {
                    ($pid): $pconfig[0]
                }
            }' > "$OUTPUT_TMP"
    fi
    
    mv "$OUTPUT_TMP" "$CONFIG_FILE"
    rm -f "$PROVIDER_TMP"
    print_success "Сохранено в ${BOLD}$CONFIG_FILE${NC}"
}

# Финальный вывод
show_result() {
    echo ""
    print_separator
    echo ""
    echo -e "${GREEN}${BOLD}  ✓ Конфигурация завершена!${NC}"
    echo ""
    echo -e "  ${BOLD}Добавленные модели:${NC}"
    echo "$MODELS_JSON" | jq -r '.data[] | "    \u001b[32m•\u001b[0m \(.id)"'
    echo ""
    print_separator
    echo ""
    echo -e "  ${BOLD}Следующие шаги:${NC}"
    echo ""
    echo -e "  ${BRIGHT_GREEN}1.${NC} Выбери модель:"
    echo -e "     ${DIM}$ /models${NC}"
    echo ""
    echo -e "  ${BRIGHT_GREEN}2.${NC} Начни работу!"
    echo ""
    print_separator
    echo ""
    echo -e "  ${DIM}Документация: https://polza.ai/docs${NC}"
    echo -e "  ${DIM}Поддержка:    https://polza.ai/docs/glavnoe/support${NC}"
    echo ""
}

# ====================================
# MAIN
# ====================================
main() {
    clear
    print_logo
    print_separator
    
    check_dependencies
    select_config_location
    get_api_key
    verify_api_key
    fetch_models
    generate_models_config
    update_config
    show_result
}

main "$@"
