#!/bin/bash
# Скрипт для быстрого просмотра модулей GDD

if [ $# -eq 0 ]; then
    echo "Использование: $0 <номер_модуля> или $0 <имя_файла>"
    echo ""
    echo "Доступные модули:"
    ls -1 *.md | grep -E "^[0-9]{2}" | sort
    exit 1
fi

# Если передан номер модуля (например, 1 или 01)
if [[ $1 =~ ^[0-9]+$ ]]; then
    module=$(printf "%02d" "$1")
    filename="${module}.md"
elif [[ $1 =~ ^[0-9]{2}$ ]]; then
    filename="${1}.md"
else
    # Если передано имя файла
    filename="$1"
fi

if [ -f "$filename" ]; then
    echo "=== Модуль: $filename ==="
    echo "======================================"
    head -n 30 "$filename"
    echo ""
    echo "... (показано 30 из $(wc -l < "$filename") строк)"
    echo ""
    echo "Для просмотра полного файла: cat $filename | less"
    echo "Для редактирования: nano $filename"
else
    echo "✗ Ошибка: модуль '$filename' не найден"
    exit 1
fi
