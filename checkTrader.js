const fs = require('fs').promises;
const path = require('path');
const convert = require('xml-js');

const readJsonFile = async (filePath) => {
  try {
    const data = await fs.readFile(filePath, 'utf8');

    return JSON.parse(data);
  } catch {
    console.log(` Произошла ошибка при чтении файла: '${filePath}'`);
  }

};

const processTraderConfig = async (traderPriceConfig = {}) => {
  const traderSet = new Set();
  const cyrRegex = /[^A-Za-z0-9_]/;

  traderPriceConfig?.TraderCategories?.forEach(priceItem => {
    priceItem.Products.forEach(product => {
      const item = product.split(',')[0];
      if (!cyrRegex.test(item)) {
        traderSet.add(item);
      }
    });
  });

  return Array.from(traderSet);
};

const processTypesFiles = async (typesFiles, missionPath) => {
  const typesList = new Set();
  const typesListSpawn = new Set();

  for (const file of typesFiles) {
    const filePath = path.resolve(missionPath, file);
    try {
      const fileContent = await fs.readFile(filePath, 'utf8');
      const fileContentJs = convert.xml2js(fileContent);

      if (fileContentJs.elements[0].elements) {
        fileContentJs.elements[0].elements.forEach(element => {
          if (element.type === 'element' && element.name === 'type') {
            const nominal = element.elements?.find(item => item.name === 'nominal');
            if (nominal && nominal.elements[0].text !== '0') {
              typesListSpawn.add(element.attributes.name);
            }
            typesList.add(element.attributes.name);
          }
        });
      } else {
        console.log(` ВНИМАНИЕ! Проверьте корректность файла ${file}. В начале файла не должно быть комментариев или других блоков, отличных от types`);
      }
    } catch (e) {
      console.log(e);
      console.log(` Файл ${filePath} не найден`);
    }
  }

  return {
    typesList: Array.from(typesList),
    typesListSpawn: Array.from(typesListSpawn)
  };
};

const compareListsAndGenerateOutput = (gameList, traderList, typesList, typesListSpawn) => {
  const gameListLC = gameList?.map(item => item.toLowerCase());
  const traderListLC = traderList.map(item => item.toLowerCase());
  const typesListLC = typesList.map(item => item.toLowerCase());
  const typesListSpawnLC = typesListSpawn.map(item => item.toLowerCase());

  const gameNotInTrader = [];
  const traderNotInGame = [];
  const typesNotInTrader = [];
  const typesNotInGame = [];
  const traderNotInTypes = [];
  const spawnNotInTrader = [];
  const gameNotInTypes = [];

  // Проверка наличия элементов из игры в трейдере
  gameList?.forEach(item => {
    if (!traderList.includes(item)) {
      const exact = traderListLC.includes(item.toLowerCase());
      const inSpawn = typesListSpawnLC.includes(item.toLowerCase());
      gameNotInTrader.push(`${Number(exact)}|${Number(inSpawn)}|${item}`);
    }
  });

  // Проверка наличия элементов из трейдера в игре
  traderList?.forEach(item => {
    if (!gameList.includes(item)) {
      const exact = gameListLC.includes(item.toLowerCase());
      traderNotInGame.push(`${Number(exact)}|${item}`);
    }
  });

  // Проверка наличия элементов из types в трейдере и игре
  typesList?.forEach(item => {
    if (!gameList?.includes(item)) {
      const exact = gameListLC?.includes(item.toLowerCase());
      typesNotInGame.push(`${Number(exact)}|${item}`);
    }
    if (!traderList?.includes(item)) {
      const exact = traderListLC?.includes(item.toLowerCase());
      typesNotInTrader.push(`${Number(exact)}|${item}`);
    }
  });

  // Проверка наличия элементов из спавна в трейдере
  typesListSpawn?.forEach(item => {
    if (!traderList?.includes(item)) {
      const exact = traderListLC?.includes(item.toLowerCase());
      spawnNotInTrader.push(`${Number(exact)}|${item}`);
    }
  });

  // Проверка наличия элементов из трейдера в типах
  traderList?.forEach(item => {
    if (!typesList.includes(item)) {
      const exact = typesListLC?.includes(item.toLowerCase());
      const inGame = gameListLC?.includes(item.toLowerCase());
      traderNotInTypes.push(`${Number(exact)}|${Number(inGame)}|${item}`);
    }
  });

  // Проверка наличия элементов из игры в типах
  gameList?.forEach(item => {
    if (
      !typesList.includes(item) &&
      !item.toLowerCase().endsWith('_hologram') &&
      !item.startsWith('Book') &&
      !item.startsWith('StaticObj_') &&
      !item.startsWith('Survivor')
    ) {
      const exact = typesListLC.includes(item.toLowerCase());
      gameNotInTypes.push(`${Number(exact)}|${item}`);
    }
  });

  return {
    gameNotInTrader,
    traderNotInGame,
    typesNotInTrader,
    typesNotInGame,
    traderNotInTypes,
    spawnNotInTrader,
    gameNotInTypes
  };
};

const printDuplicates = (duplicatesJson) => {
  console.log('\n  Найдены дубликаты трейдера:');
  console.log('  ===========================');

  for (const [category, duplicates] of Object.entries(duplicatesJson)) {
    console.log(' ', '-'.repeat(category.length + 11));
    console.log(`  Категория: ${category}`);
    console.log(' ', '-'.repeat(category.length + 11));

    duplicates.forEach(duplicate => {
      const [itemName, itemInfo] = Object.entries(duplicate)[0];
      console.log(`\n   Предмет: ${itemName}`);
      console.log('   Дубли:  ', itemInfo.count);
      console.log('   Записи:');
      itemInfo.items.forEach((item, index) => {
        console.log(`     ${index + 1}. ${item}`);
      });
    });
  }
};

const checkDuplicates = async (traderPriceConfig = {}) => {
  try {
    const duplicatesJson = {};

    for (const category of traderPriceConfig.TraderCategories) {
      const categoryName = category.CategoryName.replace(/\//g, '_');
      const products = category.Products;

      // Объект для хранения информации о продуктах
      const productInfo = {};

      // Собираем информацию о продуктах
      products.forEach(product => {
        const productName = product.split(',')[0];
        if (!productInfo[productName]) {
          productInfo[productName] = {
            count: 0,
            items: []
          };
        }
        productInfo[productName].count++;
        productInfo[productName].items.push(product);
      });

      // Фильтруем и форматируем дубликаты
      const duplicateEntries = Object.entries(productInfo)
        .filter(([_, info]) => info.count > 1)
        .map(([name, info]) => ({[name]: info}));

      if (duplicateEntries.length > 0) {
        duplicatesJson[categoryName] = duplicateEntries;
      }
    }

    return duplicatesJson;
  } catch (error) {
    console.error(' Проверка дубликатов не удалась.');
  }
};

const runCheckTrader = async (missionPath = '', profilePath = '') => {
    const gameListObject = await readJsonFile(path.resolve(profilePath, 'MPG_LootExtractor', 'Loot.json'));
    const gameList = gameListObject && Object.keys(gameListObject);

    const traderConfigPath = path.resolve(profilePath, 'TraderPlus', 'TraderPlusConfig', 'TraderPlusPriceConfig.json');
    const traderPlusPriceConfig = await readJsonFile(traderConfigPath);
    const traderList = await processTraderConfig(traderPlusPriceConfig);

    const cfgeconomycorePath = path.resolve(missionPath, 'cfgeconomycore.xml');
    const typesPath1 = path.resolve(missionPath, 'db', 'types.xml');

    const cfgeconomycoreFile = await fs.readFile(cfgeconomycorePath, 'utf8');
    const cfgeconomycoreJs = convert.xml2js(cfgeconomycoreFile);

    const ceElements = cfgeconomycoreJs.elements[0].elements.filter(element => element.name === 'ce');

    const typesFiles = [typesPath1, ...ceElements.flatMap(ceEl =>
      ceEl.elements
        .filter(item => item.type === 'element' && item?.attributes?.type === 'types')
        .map(item => `${ceEl.attributes.folder}/${item.attributes.name}`)
    )];

    const {
      typesList,
      typesListSpawn
    } = await processTypesFiles(typesFiles, missionPath);

    let duplicates;
    duplicates = await checkDuplicates(traderPlusPriceConfig);

    const {
      gameNotInTrader,
      traderNotInGame,
      typesNotInTrader,
      typesNotInGame,
      traderNotInTypes,
      spawnNotInTrader,
      gameNotInTypes
    } = compareListsAndGenerateOutput(gameList, traderList, typesList, typesListSpawn);

    // Формирование итогового объекта с результатами
    const typesOutput = {
      info: 'Если перед класснеймом написано 1 - значит найдено неточное совпадение, это значит, что класснейм в игре написан иначе, чем в конфиге трейдера или тайпсе',
      gameNotInTrader_INFO: gameNotInTrader.length + ' - Есть в игре, нет в трейде (дополнительная цифра - есть ли в спавне)',
      gameNotInTrader: gameNotInTrader.sort(),
      traderNotInGame_INFO: traderNotInGame.length + ' - Есть в трейде, нет в игре',
      traderNotInGame: traderNotInGame.sort(),
      typesNotInTrader_INFO: typesNotInTrader.length + ' - Есть в типах, нет в трейде',
      typesNotInTrader: typesNotInTrader.sort(),
      typesNotInGame_INFO: typesNotInGame.length + ' - Есть в типах, нет в игре',
      typesNotInGame: typesNotInGame.sort(),
      traderNotInTypes_INFO: traderNotInTypes.length + ' - Есть в трейде, нет в типах (дополнительная цифра - есть ли в игре)',
      traderNotInTypes: traderNotInTypes.sort(),
      gameNotInTypes_INFO: gameNotInTypes.length + ' - Есть в игре, нет в типах (голограммы, книги, выжившие, статические объекты не считаются)',
      gameNotInTypes: gameNotInTypes.sort(),
      spawnNotInTrader_INFO: spawnNotInTrader.length + ' - Есть в спавне, нет в трейде',
      spawnNotInTrader: spawnNotInTrader.sort(),
      duplicates
    };

    if (duplicates && Object.keys(duplicates).length > 0) {
      typesOutput.duplicates = duplicates;
    }

    // Вывод результатов в консоль

    console.log('\n =============================');
    console.log(' Результаты проверки конфигов:');

    const tableData = {
      'Есть в игре, нет в трейде': gameNotInTrader.length,
      'Есть в трейде, нет в игре': traderNotInGame.length,
      'Есть в типах, нет в трейде': typesNotInTrader.length,
      'Есть в типах, нет в игре': typesNotInGame.length,
      'Есть в трейде, нет в типах': traderNotInTypes.length,
      'Есть в игре, нет в типах': gameNotInTypes.length,
      'Есть в спавне, нет в трейде': spawnNotInTrader.length
    };

    console.table(tableData);

    if (typeof duplicates !== 'undefined') {
      console.log('\n Анализ дубликатов трейдера завершен!');
      console.log(' ====================================\n');

      if (duplicates && Object.keys(duplicates).length > 0) {
        printDuplicates(duplicates);
      } else {
        console.log('\n Дубликаты трейдера не найдены');
      }
    }

    // Запись результатов в файл
    try {
      await fs.writeFile(path.resolve(__dirname, 'checkTrader.json'), JSON.stringify(typesOutput, null, 2));
      console.log('\n ====================================');
      console.log('\tФайл checkTrader.json создан');
    } catch (e) {
      console.log(' ОШИБКА! Файл checkTrader.json НЕ создан');
    }

    console.log(' ====================================');
    console.log('\tПроцесс проверки завершен');
  }
;

module.exports = runCheckTrader;