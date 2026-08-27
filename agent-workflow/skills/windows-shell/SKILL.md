---
name: agent-windows-shell
description: Выполняет команды репозитория в Windows по политике native-shell-first с явным fallback на Git Bash.
---

# Windows shell

Перед обработкой ошибок запуска Windows shell прочитайте `../../layers/environment-windows.md`.

Начинайте с shell, указанного окружением. При ошибке запуска `CreateProcess`, `helper` или эквивалентной ошибке прекратите повторять ту же команду, проверьте `C:\Program Files\Git\bin\bash.exe` и повторите ту же безопасную операцию через явный wrapper. Никогда не используйте bare `bash.exe`, WSL или WindowsApps aliases. Сохраняйте исходную ошибку и сообщайте verification mode.
