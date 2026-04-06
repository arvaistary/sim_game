#!/bin/bash
# Скрипт для вывода статистики по модулям GDD

echo "=========================================="
echo "      СТАТИСТИКА МОДУЛЕЙ GDD"
echo "=========================================="
echo ""

total_lines=0
total_size=0
echo "№ | Модуль                     | Строк | Размер"
echo "---+----------------------------+-------+-------"

modules=("01_general.md" "02_implementation.md" "03_core_mechanics.md" "04_balance.md" "05_save_system.md" "06_death_system.md" "07_random_events.md" "08_family.md" "09_hobbies.md" "10_achievements.md" "11_seasonal.md" "12_technical.md" "13_roadmap.md" "14_conclusion.md")

i=1
for module in "${modules[@]}"; do
    lines=$(wc -l < "$module")
    size=$(du -h "$module" | cut -f1)
    total_lines=$((total_lines + lines))
    printf "%2d | %-26s | %5d | %5s\n" "$i" "$module" "$lines" "$size"
    i=$((i + 1))
done

echo "=========================================="
echo "   ИТОГО:                     | %5d |" "$total_lines"
echo "=========================================="
echo ""

# Самый большой модуль
max_lines=0
max_module=""
for module in "${modules[@]}"; do
    lines=$(wc -l < "$module")
    if [ $lines -gt $max_lines ]; then
        max_lines=$lines
        max_module=$module
    fi
done

percentage=$((max_lines * 100 / total_lines))
echo "Самый большой модуль:"
echo "  $max_module — $max_lines строк ($percentage%)"
echo ""

# Самый маленький модуль
min_lines=999999
min_module=""
for module in "${modules[@]}"; do
    lines=$(wc -l < "$module")
    if [ $lines -lt $min_lines ]; then
        min_lines=$lines
        min_module=$module
    fi
done

percentage=$((min_lines * 100 / total_lines))
echo "Самый маленький модуль:"
echo "  $min_module — $min_lines строк ($percentage%)"
echo ""

# Средний размер
avg_lines=$((total_lines / ${#modules[@]}))
echo "Средний размер модуля:"
echo "  $avg_lines строк"
echo ""

# Количество таблиц
tables=$(grep -c "^|" *.md 2>/dev/null | awk -F: '{sum+=$2} END {print sum}')
echo "Количество таблиц во всех модулях:"
echo "  Около $tables таблиц"
echo ""

# Количество подразделов
subsections=$(grep -c "^### " *.md 2>/dev/null | awk -F: '{sum+=$2} END {print sum}')
echo "Количество подразделов (###):"
echo "  $subsections"
echo ""

echo "=========================================="
echo "Всего модулей: ${#modules[@]}"
echo "Всего строк: $total_lines"
echo "Дата создания: 6 апреля 2026"
echo "Версия документа: 1.0"
echo "=========================================="
