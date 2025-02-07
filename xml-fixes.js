/**
 * https://github.com/MPG-DayZ/xml-fixes
 * https://discord.gg/pww4zwz6rM
 */

const prompts = require('prompts');
const convert = require('xml-js');
const fs = require('fs');
const {resolve} = require('path');
const {runCheckTrader} = require('./scripts/checkTrader');

const getDirectories = (path) => {
  try {
    return fs.readdirSync(path).filter((file) => {
      return fs.statSync(path + '/' + file).isDirectory();
    });
  } catch (e) {
    console.log('  ОШИБКА! Разместите папку xml-fixes рядом с папкой mpmissions');
    console.log('  Нажмите любую кнопку для закрытия консоли');
    return [];
  }
};

const rootMissions = resolve(__dirname, '..', 'mpmissions');
const objectD = {
  type: 'select',
  name: 'mission',
  message: 'Выберите папку миссии для исправления',
  choices: getDirectories(rootMissions).map((object) => {
    return {value: object};
  }),
  hint: `
  Инструкция:
    ↑/↓: Навигация по пунктам
    [пробел]/enter: Выбор нужного пункта
  `
};

const objectP = {
  type: 'select',
  name: 'profileFolder',
  message: 'Выберите папку с профилем',
  choices: getDirectories(resolve(__dirname, '..')).map((object) => ({value: object}))
    .filter((item) => {
      return !item.value.match(/^(\.|@|addons|appcache|battleye|bliss|config|docs|dta|keys|logs|mpmissions|node_modules|server_manager|Statistics|steamapps)/);
    }),
  hint: `
  Инструкция:
    ↑/↓: Навигация по пунктам
    [пробел]/enter: Выбор нужного пункта
  `
};

const questions = [
  objectD,
  objectP,
  {
    type: 'multiselect',
    name: 'fixes',
    message: 'Выберите что исправлять',
    choices: [
      {
        value: 'types.xml',
        selected: true
      },
      {
        value: 'empty nominals',
        selected: true
      },
      {
        value: 'mapgroupproto.xml',
        selected: true
      },
      {
        value: 'cfgeventgroups.xml',
        selected: true
      }
    ]
  },
  {
    type: 'select',
    name: 'mapgroupprotoSetMaxLoot',
    message: 'Увеличить точки спавна лута в mapgroupproto.xml до максимума?',
    choices: [
      {
        value: false,
        title: 'Нет'
      },
      {
        value: true,
        title: 'Да'
      }
    ]
  },
  {
    type: 'select',
    name: 'checkTraderFiles',
    message: 'Проверить корректность конфигов трейдера?',
    choices: [
      {
        value: true,
        title: 'Да'
      },
      {
        value: false,
        title: 'Нет'
      }
    ]
  }
];

const runFixes = (config) => {

  if (config.mission) {

    const root = resolve(rootMissions, config.mission);
    const workbenchPath = resolve(__dirname, '..', config.profileFolder, 'COTZ_Workbench', 'Settings.json');
    let workbenchJson = [];
    try {
      const workbenchFile = fs.readFileSync(workbenchPath, 'utf8');
      workbenchJson = JSON.parse(workbenchFile);
    } catch (error) {
      console.log('Ошибка чтения файла с верстаком. Если у вас нет верстака - ничего страшного, забейте.');
    }

    let wbItemsTmp = [];
    let wbItems = [];
    let wbDictionaryTmp = {
      results: {},
      components: {}
    };
    let wbDictionary = {
      results: {},
      components: {}
    };

    workbenchJson?.m_CraftClasses?.CraftCategories?.forEach((item) => {
      item.CraftItems.forEach((receiptItem) => {
        wbItemsTmp.push(receiptItem.Result);

        wbDictionaryTmp.results[receiptItem.Result] ??= [];
        wbDictionaryTmp.results[receiptItem.Result].push(receiptItem.RecipeName);

        receiptItem.CraftComponents.forEach((componentItem) => {
          wbItemsTmp.push(componentItem.Classname);

          wbDictionaryTmp.components[componentItem.Classname] ??= [];
          wbDictionaryTmp.components[componentItem.Classname].push(receiptItem.RecipeName);
        });

      });
    });

    Object.keys(wbDictionaryTmp.results).forEach((key) => {
      wbDictionary.results[key] = [...new Set(wbDictionaryTmp.results[key])].join(', ');
    });

    Object.keys(wbDictionaryTmp.components).forEach((key) => {
      wbDictionary.components[key] = [...new Set(wbDictionaryTmp.components[key])].join(', ');
    });

    wbItems = [...new Set(wbItemsTmp)];

    if (config.fixes.includes('types.xml')) {
      const typesPath = resolve(root, 'db', 'types.xml');
      const typesFile = fs.readFileSync(typesPath, 'utf8');
      const replacedXml = typesFile
        .replace(/count_in_map="0"/g, 'count_in_map="1"')
        .replace(/WitchHood_Chainmail/g, 'WitchHoodCoif')
        .replace('Mag_CZ550_10Rnd', 'Mag_CZ550_10rnd')
        .replace('Bandana_Blackpattern', 'Bandana_BlackPattern')
        .replace('Bandana_Camopattern', 'Bandana_CamoPattern')
        .replace('Bandana_Polkapattern', 'Bandana_PolkaPattern')
        .replace('Bandana_Redpattern', 'Bandana_PolkaPattern')
        .replace('Camonet', 'CamoNet')
        .replace('Slingbag_Black', 'SlingBag_Black')
        .replace('Slingbag_Brown', 'SlingBag_Brown')
        .replace('Slingbag_Gray', 'SlingBag_Gray')
        .replace('Tshirt_10thAnniversary', 'TShirt_10thAnniversary')
        .replace('ZmbF_ShortSkirt_black', 'ZmbF_ShortSkirt_Black')
        .replace('Zmbm_Mummy', 'ZmbM_Mummy')
        .replace('Ammo_40mm_Chemgas', 'Ammo_40mm_ChemGas')
        .replace('Longhorn', 'LongHorn');

      try {
        fs.writeFileSync(typesPath, replacedXml);
        console.log(' Файл types.xml исправлен');
      } catch (e) {
        console.log(' ОШИБКА! Файл types.xml НЕ исправлен');
      }
    }
    if (config.fixes.includes('empty nominals')) {
      const addComments = (type) => {
        const returnArray = [];

        if (wbDictionary.results[type]) {
          returnArray.push({
            type: 'comment',
            comment: ` Используется в крафте как результат: ${wbDictionary.results[type]} `
          });
        }
        if (wbDictionary.components[type]) {
          returnArray.push({
            type: 'comment',
            comment: ` Используется в крафте как компонент: ${wbDictionary.components[type]} `
          });
        }

        return returnArray;
      };

      const emptyNominal = {
        type: 'element',
        name: 'nominal',
        elements: [
          {
            type: 'text',
            text: '0'
          }
        ]
      };
      const emptyMin = {
        type: 'element',
        name: 'min',
        elements: [
          {
            type: 'text',
            text: '0'
          }
        ]
      };
      const emptyRestock = {
        type: 'element',
        name: 'restock',
        elements: [
          {
            type: 'text',
            text: '0'
          }
        ]
      };
      const emptyTags = [
        emptyNominal,
        emptyMin,
        emptyRestock
      ];

      const cfgeconomycorePath = resolve(root, 'cfgeconomycore.xml');
      const typesPath1 = resolve(root, 'db', 'types.xml');
      const typesFile1 = fs.readFileSync(typesPath1, 'utf8');
      const typesJs = convert.xml2js(typesFile1);

      const cfgeconomycoreFile = fs.readFileSync(cfgeconomycorePath, 'utf8');
      const cfgeconomycoreJs = convert.xml2js(cfgeconomycoreFile);

      const ceElements = cfgeconomycoreJs.elements[0].elements.filter((element) => {
        return element.name === 'ce';
      });

      const typesFiles = [typesPath1];
      ceElements.forEach((ceEl) => {
        typesFiles.push(
          ...ceEl.elements.map((item) => {
            if (item.type === 'element' && item?.attributes?.type === 'types') {
              return `${ceEl.attributes.folder}/${item.attributes.name}`;
            }
            return null;
          }).filter(item => !!item)
        );
      });

      const zeroTypes = [];
      let totalModdedCount = 0;
      let totalTypesCount = 0;
      let totalFiles = -1;
      let incorrectMinCount = 0;
      let incorrectRestockCount = 0;

      const typesLog = {};

      typesFiles.forEach((file, index) => {
        const filePath = resolve(root, file);
        let count = 0;
        let incorrectData = false;

        try {
          const fileContent = fs.readFileSync(filePath, 'utf8');
          const fileContentJs = convert.xml2js(fileContent);

          totalFiles++;

          if (fileContentJs.elements[0].elements) {
            fileContentJs.elements[0].elements = fileContentJs.elements[0].elements.map((element) => {
              if (element.type === 'element' && element.name === 'type') {
                const nominal = element?.elements?.find((item) => {
                  return item.name === 'nominal';
                });
                if (element?.elements && element?.elements?.length && element?.elements[0]?.type === 'comment') {
                  element.elements = element.elements.filter((item) => {
                    return item.type !== 'comment';
                  });

                }
                if (nominal) {
                  if (nominal.elements[0].text === '0') {
                    zeroTypes.push(element.attributes.name);
                    count++;
                    element.elements = element.elements.map((element) => {
                      if (['flags', 'lifetime'].includes(element.name)) {
                        return element;
                      }
                      return null;
                    }).filter(el => !!el);
                    if (!element.elements.length) {
                      element.elements.push(...emptyTags);
                    }
                  } else {
                    const min = element?.elements?.find((item) => {
                      return item.name === 'min';
                    });

                    const restock = element?.elements?.find((item) => {
                      return item.name === 'restock';
                    });

                    // Проверяем, что номинал не меньше минимального
                    if (min) {
                      if (min.elements[0].text * 1 > nominal.elements[0].text * 1) {
                        element.elements = element.elements.map((el) => {
                          if (el.name === 'min') {
                            incorrectData = true;
                            incorrectMinCount++;
                            el = {
                              type: 'element',
                              name: 'min',
                              elements: [
                                {
                                  type: 'text',
                                  text: nominal.elements[0].text
                                }
                              ]
                            };
                          }
                          return el;
                        });
                      }
                    }

                    // Исправляем некорректные записи restock
                    if (restock) {
                      const lifetime = element?.elements?.find((item) => {
                        return item.name === 'lifetime';
                      });
                      const calculatedRestock = (lifetime.elements[0].text * 1) / (nominal.elements[0].text * 1);
                      const intRestock = restock.elements[0].text * 1;
                      if (intRestock > 1 && calculatedRestock > 1 && calculatedRestock <= intRestock) {
                        element.elements = element.elements.map((el) => {
                          if (el.name === 'restock') {
                            incorrectData = true;
                            incorrectRestockCount++;
                            el = {
                              type: 'element',
                              name: 'restock',
                              elements: [
                                {
                                  type: 'text',
                                  text: Math.round(calculatedRestock) - 1
                                }
                              ]
                            };
                          }
                          return el;
                        });
                      }
                    }
                  }

                  if (wbItems.includes(element.attributes.name)) {
                    const comments = addComments(element.attributes.name);
                    if (comments.length) {
                      element.elements.unshift(...addComments(element.attributes.name));
                    }
                  }
                } else {
                  // Если номинала нет, то просто записываем в список нулевых класснеймов
                  zeroTypes.push(element.attributes.name);
                }

                const lifetime = element?.elements?.find((item) => {
                  return item.name === 'lifetime';
                });

                if (lifetime) {
                  let min = element?.elements?.find((item) => {
                    return item.name === 'min';
                  });
                  let restock = element?.elements?.find((item) => {
                    return item.name === 'restock';
                  });
                  let nominal = element?.elements?.find((item) => {
                    return item.name === 'nominal';
                  });

                  if (!min) {
                    incorrectData = true;
                    element.elements.push(emptyMin);
                  }
                  if (!restock) {
                    incorrectData = true;
                    element.elements.push(emptyRestock);
                  }
                  if (!nominal) {
                    incorrectData = true;
                    element.elements.push(emptyNominal);
                  }
                }
              }

              return element;
            });
          } else {
            console.log(` ВНИМАНИЕ! Проверьте корректность файла ${file}. В начале файла не должно быть комментариев или других блоков, отличный от types`);
          }

          totalModdedCount += count;

          if (count > 0 || incorrectData) {
            const convertedData = convert.js2xml(fileContentJs, {
              spaces: '    ',
              compact: false
            });
            try {
              fs.writeFileSync(filePath, convertedData);
              if (index === 0) {
                typesLog['types.xml'] = count;
              } else {
                typesLog[file] = count;
              }
            } catch (e) {
              console.log(` ОШИБКА! Файл ${file} НЕ исправлен.`);
              typesLog[file] = 'Не исправлен';
            }
          } else {
            totalFiles--;
          }

        } catch (e) {
          totalFiles--;
          console.log(e);
          console.log(` Файл ${filePath} не найден`);
        }

      });

      console.log('\n Всего модовых файлов исправлено:', totalFiles, 'из', typesFiles.length - 1);

      console.table(typesLog);

      console.log(' Всего найдено нулевых записей исправлено:', zeroTypes.length, 'из', totalModdedCount);
      console.log(' Исправлено некорректных значений <min>:', incorrectMinCount);
      console.log(' Исправлено некорректных значений <restock>:', incorrectRestockCount, '\n');

      if (totalTypesCount > 0) {
        const convertedDataTypes = convert.js2xml(typesJs, {
          spaces: '\t\t',
          compact: false
        });

        try {
          fs.writeFileSync(typesPath1, convertedDataTypes);
          console.log(' Файл types.xml исправлены нулевые записи');
        } catch (e) {
          console.log(' ОШИБКА! Файл types.xml нулевые записи НЕ исправлены');
        }
      }
    }

    if (config.fixes.includes('mapgroupproto.xml')) {
      const mapgroupprotoPath = resolve(root, 'mapgroupproto.xml');
      const mapgroupprotoFile = fs.readFileSync(mapgroupprotoPath, 'utf8');

      const mapGroupJs = convert.xml2js(mapgroupprotoFile);

      mapGroupJs.elements[0].elements = mapGroupJs.elements[0].elements.map((element) => {
        if (element?.name === 'group') {
          let groupLootMax = element?.attributes?.lootmax || 0;
          let realCount = 0;

          if (groupLootMax) {
            const parsedContainers = element.elements.map((container) => {
              if (container.name === 'container') {
                container.elements.forEach((point) => {
                  if (point.name === 'point') {
                    realCount++;
                  }
                });

                if (realCount > 0 && container?.attributes?.lootmax) {
                  if (config.mapgroupprotoSetMaxLoot) {
                    container.attributes.lootmax = realCount;
                  } else {
                    if (container.attributes.lootmax > realCount) {

                      container.attributes.lootmax = realCount;
                    }
                  }
                }
              }

              return container;
            });

            if (realCount > 0) {
              if (config.mapgroupprotoSetMaxLoot) {
                element.attributes.lootmax = realCount;
              } else {
                if (groupLootMax > realCount) {
                  element.attributes.lootmax = realCount;
                }
              }
            }

            element.elements = parsedContainers;
          }
        }
        return element;
      });

      const xmlConverted = convert.js2xml(mapGroupJs, {
        spaces: '\t\t',
        compact: false
      });

      try {
        fs.writeFileSync(mapgroupprotoPath, xmlConverted);
        console.log(' Файл mapgroupproto.xml исправлен');
      } catch (e) {
        console.log('  ОШИБКА! Файл mapgroupproto.xml НЕ исправлен');
      }

    }

    if (config.fixes.includes('cfgeventgroups.xml')) {
      const cfgeventgroupsPath = resolve(root, 'cfgeventgroups.xml');
      const cfgeventgroupsFile = fs.readFileSync(cfgeventgroupsPath, 'utf8');
      const replacedCfgeventgroupsXml = cfgeventgroupsFile.replace('/> />', '/>');

      try {
        fs.writeFileSync(cfgeventgroupsPath, replacedCfgeventgroupsXml);
        console.log(' Файл cfgeventgroups.xml исправлен');
      } catch (e) {
        console.log(' ОШИБКА! Файл cfgeventgroups.xml НЕ исправлен');
      }
    }

    if (config.checkTraderFiles) {
      const profilePath = resolve(__dirname, '..', config.profileFolder);
      runCheckTrader(root, profilePath).catch(console.error);
    }
  }

};

(async () => {
  const response = await prompts(questions);
  runFixes(response);
})();