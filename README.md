# xml-fixes

## Контактная информация:

- Дискорд: https://discord.gg/pww4zwz6rM
- Гитхаб: https://github.com/MPG-DayZ/xml-fixes

## Этот скрипт актуален для патча 1.26

Инструмент для лёгкого исправления ошибок в xml файлах сервера.

Предназначен в первую очередь для быстрого и массового исправления ошибок, допущенный как разработчиками DayZ, так и
админами сервера.

Этот скрипт имеет смысл запускать при больших изменениях в тайпсах или просто для проверки корректности.

## Что делает скрипт:

### 1. Исправляет ошибки в types.xml

- Некорректные названия класснеймов (16 штук) на корректные.
- Заменяет `count_in_map="0"` на `count_in_map="1"`.

### 2. Корректирует нулевые записи

- Находит записи в ванильном types.xml и в модовых тайпсах, которые прописаны в `cfgeconimycore.xml`, у которых nominal
  равен нулю и удаляет лишнее из этих записей.
- Прописывает `<nominal>`, `<restock>` и `<min>` равным нулю, если это не было сделано ранее.

### 3. Исправляет ошибки в mapgroupproto.xml

- Некорректные лимиты на спавн в некоторых местах.
- Увеличивает количество точек спавна лута до максимального во всех местах.

### 4. Исправляет ошибки в cfgeventgroups.xml

- Рудимент с некорректным двойным закрытием тега `/> />` который живёт уже много лет.

### 5. Корректирует другие ошибки

- Исправляет записи `<min>` там, где они больше, чем `<nominal>`
- Исправляет записи `<restock>` там, где они больше, чем `<nominal> * <lifetime>`

### 6. Бонус для тех, кто пользуется верстаком от COBA

- Помечает комментариями класснеймы в тайпсах, которые используются в крафте как ингридиенты и как результат крафта.

## Как пользоваться

> [!IMPORTANT]
> Для работы скрипта необходимо установить [NodeJS](https://nodejs.org)
> А так же перед первым запуском скрипта ОБЯЗАТЕЛЬНО сделать резервную копию файлов мисии

1. Поместить папку `xml-fixes` в корень сервера или рядом c папкой mpmissions.
2. Запустить файл `01.run.ps1` через powershell
3. Следовать инструкциям.