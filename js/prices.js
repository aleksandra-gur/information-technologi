/* prices.js — цены мастерской (раздел 2 ТЗ) и формула цены кольца.
   Используется конструктором и формой заявки. */
window.ogrankaPrices = (function () {
  'use strict';

  var GRAM = { silver: 180, gold585: 7600 };            // ₽ за грамм
  var WEIGHT = { 2: 2, 3: 3, 4: 4, 5: 5.5, 6: 7 };       // ширина, мм → вес, г
  var STONE = { none: 0, cz: 900, diamond: 18000 };     // нет, фианит, бриллиант 0,05 карата
  var WORK = 3500;                                      // работа за кольцо
  var ENGRAVING = 1200;                                 // гравировка

  // Цена = вес × цена грамма + работа + камень + гравировка
  function calc(metal, width, stone, engraving) {
    var weight = WEIGHT[width];
    var metalCost = Math.round(weight * GRAM[metal]);
    var stoneCost = STONE[stone] || 0;
    var engravingCost = engraving ? ENGRAVING : 0;
    var ring = metalCost + WORK + stoneCost + engravingCost;
    return {
      weight: weight, gramPrice: GRAM[metal], metalCost: metalCost, work: WORK,
      stoneCost: stoneCost, engravingCost: engravingCost, ring: ring, pair: ring * 2
    };
  }

  // 27500 → «27 500 ₽»
  function rub(value) {
    return value.toLocaleString('ru-RU') + ' ₽';
  }

  return { GRAM: GRAM, WEIGHT: WEIGHT, STONE: STONE, WORKSHOP_PERSON: 6900, calc: calc, rub: rub };
})();
