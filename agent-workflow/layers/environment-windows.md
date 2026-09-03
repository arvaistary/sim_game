# Адаптер окружения Windows

Сначала используйте shell, указанный текущим окружением.

Если запуск shell завершается ошибкой `CreateProcess`, `helper` или эквивалентной ошибкой запуска процесса, прекратите повторять ту же команду. Проверьте и используйте явный Git Bash:

```powershell
$gitBash = 'C:\Program Files\Git\bin\bash.exe'
& $gitBash -lc '<same safe command>'
```

Никогда не используйте bare `bash.exe`, `C:\Windows\System32\bash.exe`, aliases из WindowsApps или WSL как fallback Git Bash. Не смешивайте синтаксис путей Windows и POSIX внутри одной команды.

Fallback-команда должна подтвердить и identity shell, и context репозитория. Сохраняйте исходную ошибку native shell в отчёте по задаче.

## Граница подтверждения

Если Codex запрашивает подтверждение elevated shell, принимайте его только для текущей операции в рамках scope, когда более безопасного пути нет. Если elevated native shell всё ещё не работает, используйте явный Git Bash и сообщите режим. Elevated approval не является общей авторизацией на несвязанные или destructive-действия.

## Режимы проверки

- `native-shell-ok` — native shell запущен, команда прошла;
- `fallback-required` — запуск native shell завершился ошибкой;
- `fallback-ok` — явный Git Bash выполнил команду после ошибки native shell без elevated fallback;
- `elevated-fallback` — использован подтверждённый пользователем elevated route, явная fallback-команда прошла;
- `fallback-failed` — явный Git Bash завершился ошибкой;
- `blocker` — безопасный executable или context репозитория недоступен.

Не считайте успешный fallback доказательством исправности native shell. Не используйте shell fallback молча для destructive-команд, работы с credentials или неоднозначных команд.
