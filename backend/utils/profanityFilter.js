// Универсальный фильтр нецензурной лексики с защитой от транслита и обхода символами
function normalizeVariations(input) {
  if (!input || typeof input !== 'string') return [];

  let text = input.toLowerCase();

  // Удаляем пробелы и разделители между одиночными символами (например: "х у й", "п.и.з.д.а")
  const noSeparators = text.replace(/[\s\.\,\-\_\*\~\+\=\#\@\$\%\^\&\!\?\/\\\|\(\)\[\]\{\}\<\>]/g, '');

  // 1) Вариант где u -> у, y -> й, w -> в
  const map1 = {
    'a': 'а', '@': 'а', '4': 'ч',
    'b': 'б', '6': 'б',
    'v': 'в', 'w': 'в',
    'g': 'г',
    'd': 'д',
    'e': 'е', 'ё': 'е', '3': 'з',
    'z': 'з',
    'i': 'и', '1': 'и', '!': 'и', '|': 'и', 'j': 'й',
    'k': 'к',
    'l': 'л',
    'm': 'м',
    'n': 'н', 'h': 'н',
    'o': 'о', '0': 'о',
    'p': 'п',
    'r': 'р',
    's': 'с', 'c': 'с', '$': 'с',
    't': 'т',
    'u': 'у',
    'y': 'й',
    'f': 'ф',
    'x': 'х'
  };

  // 2) Вариант где y -> у (как часто пишут xuy)
  const map2 = { ...map1, 'y': 'у', 'u': 'у', 'j': 'й', 'i': 'й' };

  // 3) Вариант где ya -> я, ch -> ч, sh -> ш, zh -> ж
  function applyMap(str, m) {
    let s = str
      .replace(/ch/g, 'ч')
      .replace(/sh/g, 'ш')
      .replace(/zh/g, 'ж')
      .replace(/ya/g, 'я')
      .replace(/yu/g, 'ю')
      .replace(/yo/g, 'ё');
    let res = '';
    for (let ch of s) {
      res += m[ch] !== undefined ? m[ch] : ch;
    }
    // Схлопываем повторяющиеся буквы (хххуууййй -> хуй)
    return res.replace(/(.)\1+/g, '$1');
  }

  const v1 = applyMap(text, map1);
  const v1Compact = applyMap(noSeparators, map1);
  const v2 = applyMap(text, map2);
  const v2Compact = applyMap(noSeparators, map2);

  return [text, noSeparators, v1, v1Compact, v2, v2Compact];
}

const PROFANITY_PATTERNS = [
  /х[\*уy0-9_\-\.]*[йjяеиёю]/i,
  /х[йj]/i,
  /ху[йеяи]/i,
  /xuy/i,
  /x[\.\_\-\*]?u[\.\_\-\*]?y/i,
  /п[\*иeе1!\_]?[зz3]д/i,
  /п[зz3]д/i,
  /[еe][бb][аaеeиiуyлlоo\*]/i,
  /[еe][бb][аa\*]/i,
  /[бb][\*лl][яy][дdтt]?/i,
  /бля/i,
  /б[лl][яy]/i,
  /с[\*уy][кk][аaеeиi]?/i,
  /сук[аеи]/i,
  /cyk/i,
  /suka/i,
  /м[уy\*][дd][аa][кkк]/i,
  /г[аaоo\*][нn][дd][оo\*][нn]/i,
  /г[оo\*][вb][нn][оo]/i,
  /з[аa\*][лl][уy\*][пp]/i,
  /д[рr][оo\*][чch]/i,
  /ш[лl][юy\*][хx]/i,
  /ч[мm][оo\*]/i,
  /о[тt]сос/i
];

function checkProfanity(text) {
  if (!text) return { hasProfanity: false };

  const variations = normalizeVariations(text);

  for (let v of variations) {
    for (let pattern of PROFANITY_PATTERNS) {
      if (pattern.test(v)) {
        return {
          hasProfanity: true,
          error: 'Отзыв содержит недопустимую лексику (в том числе при попытке обхода латиницей или спецсимволами).'
        };
      }
    }
  }

  return { hasProfanity: false };
}

module.exports = { checkProfanity };
