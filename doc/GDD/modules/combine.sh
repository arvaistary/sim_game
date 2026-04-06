#!/bin/bash
# Скрипт для объединения всех модулей GDD в один файл

OUTPUT_FILE="../GDD.md"

echo "Объединение модулей GDD..."
echo "=================================="

# Проверка наличия всех модулей
modules=("01_general.md" "02_implementation.md" "03_core_mechanics.md" "04_balance.md" "05_save_system.md" "06_death_system.md" "07_random_events.md" "08_family.md" "09_hobbies.md" "10_achievements.md" "11_seasonal.md" "12_technical.md" "13_roadmap.md" "14_conclusion.md")

missing_modules=()
for module in "${modules[@]}"; do
    if [ ! -f "$module" ]; then
        missing_modules+=("$module")
    else
        echo "✓ Найден: $module"
    fi
done

if [ ${#missing_modules[@]} -gt 0 ]; then
    echo ""
    echo "Ошибка: не найдены следующие модули:"
    for module in "${missing_modules[@]}"; do
        echo "  - $module"
    done
    exit 1
fi

echo ""
echo "Объединение модулей в $OUTPUT_FILE..."

# Объединение всех модулей
cat 01_general.md 02_implementation.md 03_core_mechanics.md 04_balance.md 05_save_system.md 06_death_system.md 07_random_events.md 08_family.md 09_hobbies.md 10_achievements.md 11_seasonal.md 12_technical.md 13_roadmap.md 14_conclusion.md > "$OUTPUT_FILE"

# Проверка результата
if [ $? -eq 0 ]; then
    total_lines=$(wc -l < "$OUTPUT_FILE")
    echo ""
    echo "✓ Успешно объединено!"
    echo "✓ Всего строк: $total_lines"
    echo "✓ Файл создан: $OUTPUT_FILE"
else
    echo ""
    echo "✗ Ошибка при объединении модулей"
    exit 1
fi
