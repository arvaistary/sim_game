#!/bin/bash
# Скрипт для проверки целостности модулей GDD

echo "Проверка целостности модулей GDD..."
echo "======================================"
echo ""

# Ожидаемое количество строк в каждом модуле
expected_lines=(
    "01_general.md:114"
    "02_implementation.md:80"
    "03_core_mechanics.md:428"
    "04_balance.md:102"
    "05_save_system.md:252"
    "06_death_system.md:146"
    "07_random_events.md:74"
    "08_family.md:50"
    "09_hobbies.md:32"
    "10_achievements.md:47"
    "11_seasonal.md:34"
    "12_technical.md:61"
    "13_roadmap.md:47"
    "14_conclusion.md:12"
)

total_errors=0

# Проверка количества строк в каждом модуле
for entry in "${expected_lines[@]}"; do
    IFS=':' read -r module expected <<< "$entry"
    
    if [ -f "$module" ]; then
        actual=$(wc -l < "$module")
        if [ "$actual" -eq "$expected" ]; then
            echo "✓ $module: $actual строк (ожидается $expected)"
        else
            echo "✗ $module: $actual строк (ожидается $expected)"
            total_errors=$((total_errors + 1))
        fi
    else
        echo "✗ $module: файл не найден"
        total_errors=$((total_errors + 1))
    fi
done

echo ""
echo "======================================"

if [ $total_errors -eq 0 ]; then
    echo "✓ Все модули в порядке!"
    echo "✓ Всего модулей: ${#expected_lines[@]}"
    echo "✓ Всего строк (сумма): 1447"
else
    echo "✗ Обнаружено ошибок: $total_errors"
    exit 1
fi
