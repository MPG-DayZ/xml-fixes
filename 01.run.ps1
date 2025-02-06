# Установка кодировки для корректного отображения русского текста
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

function Show-ColoredMessage {
    param (
        [string]$Message,
        [string]$ForegroundColor = "White",
        [switch]$NoNewline
    )

    $params = @{
        Object = $Message
        ForegroundColor = $ForegroundColor
    }

    if ($NoNewline) {
        $params.Add("NoNewline", $true)
    }

    Write-Host @params
}

function Show-AsciiArt {
    $asciiArt = @"



             ###+                                                 +###
         ############+                                       +############
       +################      ###                 ###      ################
      #####        .###################     ###################.        #####
      ###.            #######################################            ####
     ###    ########   ####          #########          ####   #######.    ###
     ###   ##### .##                                           ##  #####   ####
    ###    ## ######                                           #########    ###
    ###    ##### .-.                                               #####     ##
    ###    #####                                                   #####    ###
    ####   #####                                                   #####   ####
     #####                                                               #####
      ######          ###                                 ###          ######
        ####          ######                           ######          ####
        ####          #########                     #########          ####
       +###            ##### ##       #######       ## #####            ###
       ###              #######    #############    #######              ###
      ###.                        ######   ######                        ###.
      ###                        ####         ####                        ###
      ##                        ####           ####                       +##
      ###                      #####################                      ###
      ###                     ### ############### ###                    ####
       ###                    #######         #######                    ###
       ####                   ## ### ###   ### ### ##                  ####
        ####                 ### ######## ######## ###                #####
         #####               ###  ####### #######  ###               ####
          #####              ##        ## ##        ##              ####
            #####            ##  ######## ########  ##            #####
             ######          ############ ############          ######
               ######        #########       #########        ######
                 ######       #######################       ######
                   #######       ####-#######.####        ######
                     #######     #################     #######
                        #######     .#########      .#######
                          #######  .-.       -#-  #######
                             ###########   ###########+
                               #####################
                                  ### ####### ###
              __  __  _____    _____          __  __             _
             |  \/  ||  __ \  / ____|        |  \/  |           | |
             | \  / || |__) || |  __         | \  / |  ___    __| | ___
             | |\/| ||  ___/ | | |_ |        | |\/| | / _ \  / _` |/ __|
             | |  | || |     | |__| |        | |  | || (_) || (_| |\__ \
             |_|  |_||_|      \_____|        |_|  |_| \___/  \__,_||___/
                                      ______
                                     |______|

"@

    Show-ColoredMessage $asciiArt "Cyan"
}

function Show-Header {
    param (
        [string]$Title
    )
    Show-ColoredMessage ("=" * 50) "Cyan"
    Show-ColoredMessage "    $Title" "Yellow"
    Show-ColoredMessage ("=" * 50) "Cyan"
    Write-Host
}

function Test-NodeJS {
    Show-Header "Проверка Node.js"

    $nodeVersion = node -v 2>$null
    if ($LASTEXITCODE -ne 0) {
        Show-ColoredMessage "ОШИБКА: Node.js не установлен." "Red"
        Show-ColoredMessage "Пожалуйста, установите Node.js с сайта https://nodejs.org/" "Yellow"
        exit 1
    }

    Show-ColoredMessage "Node.js версии $nodeVersion успешно обнаружен." "Green"
    Write-Host
}

function Install-Dependencies {
    Show-Header "Установка зависимостей"

    Show-ColoredMessage "Установка npm пакетов..." "Yellow"
    npm ci

    if ($LASTEXITCODE -eq 0) {
        Show-ColoredMessage "Зависимости успешно установлены!" "Green"
    } else {
        Show-ColoredMessage "ОШИБКА: Не удалось установить зависимости." "Red"
        exit 1
    }

    Write-Host
}

function Test-RequiredDirectories {
    Show-Header "Проверка необходимых директорий"

    $currentDir = Get-Location
    $parentDir = Split-Path -Parent $currentDir
    $mpmissionsDir = Join-Path $parentDir "mpmissions"

    Show-ColoredMessage "Текущая директория: $currentDir" "Yellow"
    Show-ColoredMessage "Родительская директория: $parentDir" "Yellow"
    Show-ColoredMessage "Ожидаемая директория mpmissions: $mpmissionsDir" "Yellow"

    if (Test-Path $mpmissionsDir) {
        Show-ColoredMessage "Директория mpmissions найдена." "Green"
    } else {
        Show-ColoredMessage "ОШИБКА: Директория mpmissions не найдена." "Red"
        Show-ColoredMessage "Убедитесь, что скрипт находится в правильной директории." "Yellow"
        exit 1
    }

    Write-Host
}

function Start-XMLFixes {
    Show-Header "Запуск скрипта исправления XML"
    Show-ColoredMessage "Выполняется скрипт исправления XML..." "Yellow"
    Show-ColoredMessage "Пожалуйста, следуйте инструкциям на экране." "Yellow"
    Write-Host

    try {
        # Запускаем npm start напрямую, чтобы сохранить интерактивность
        npm start

        if ($LASTEXITCODE -ne 0) {
            throw "Скрипт завершился с ошибкой (код $LASTEXITCODE)"
        }

        Write-Host
        Show-ColoredMessage "Процесс исправления XML завершен успешно." "Green"
    }
    catch {
        Show-ColoredMessage "ОШИБКА при выполнении скрипта:" "Red"
        Show-ColoredMessage $_.Exception.Message "Red"
        exit 1
    }
}

# Основной блок выполнения
try {
    # Отображение ASCII-арта
    Show-AsciiArt

    # Переход в директорию скрипта
    $scriptPath = $MyInvocation.MyCommand.Path
    $scriptDir = Split-Path -Parent $scriptPath
    Set-Location -Path $scriptDir

    # Проверка наличия Node.js
    Test-NodeJS

    # Установка зависимостей
    Install-Dependencies

    # Проверка необходимых директорий
    Test-RequiredDirectories

    # Запуск скрипта исправления XML
    Start-XMLFixes
}
catch {
    Show-ColoredMessage "Произошла ошибка при выполнении скрипта:" "Red"
    Show-ColoredMessage $_.Exception.Message "Red"
}
finally {
    Write-Host
    Show-ColoredMessage "Нажмите любую клавишу для выхода..." "Cyan"
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
}

