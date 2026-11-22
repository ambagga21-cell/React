const fs = require('fs');
const path = require('path');
const Babel = require('./public/js/babel.min.js');

function bundle() {
  console.log('[Build] Сборка React-компонентов...');

  const srcDir = path.join(__dirname, 'src');
  const apiDir = path.join(srcDir, 'api');
  const compDir = path.join(srcDir, 'components');
  const outFile = path.join(__dirname, 'public', 'js', 'app.bundle.js');

  let combinedCode = `
// Скомпилированный бандл React 18 приложения «Эстетика & Сервис»
(function() {
  const { useState, useEffect, useCallback, useMemo, useRef } = React;
  window.React = React;
  window.ReactDOM = ReactDOM;

  // Общая функция заголовков с токеном авторизации
  function getHeaders() {
    const token = localStorage.getItem('token');
    const headers = { 'Content-Type': 'application/json' };
    if (token) {
      headers['Authorization'] = 'Bearer ' + token;
    }
    return headers;
  }

  // Общая функция форматирования времени (часы и минуты)
  function formatDuration(totalMinutes) {
    const mins = parseInt(totalMinutes, 10) || 0;
    if (mins <= 0) return '0 мин';
    const hours = Math.floor(mins / 60);
    const remainderMinutes = mins % 60;
    if (hours === 0) return remainderMinutes + ' мин';
    let hourStr = 'часов';
    const lastH = hours % 10;
    const last10H = hours % 100;
    if (lastH === 1 && last10H !== 11) {
      hourStr = 'час';
    } else if ([2, 3, 4].includes(lastH) && ![12, 13, 14].includes(last10H)) {
      hourStr = 'часа';
    }
    if (remainderMinutes === 0) return hours + ' ' + hourStr;
    return hours + ' ' + hourStr + ' ' + remainderMinutes + ' мин';
  }

  // Расчет итоговой цены со скидкой (с точностью до копеек)
  function calculateFinalPrice(price, discountPercent) {
    const p = Number(price) || 0;
    const d = Number(discountPercent) || 0;
    if (d <= 0) return p;
    return Math.round(p * (1 - d / 100) * 100) / 100;
  }

  // Форматирование цены в рублях (целые числа без дробной части, копейки с 2 знаками)
  function formatPrice(value) {
    const num = Number(value);
    if (isNaN(num)) return '0 ₽';
    const hasFractions = num % 1 !== 0;
    if (hasFractions) {
      return num.toLocaleString('ru-RU', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }) + ' ₽';
    }
    return num.toLocaleString('ru-RU') + ' ₽';
  }
`;

  // 0. Считываем утилиты из src/utils
  const utilsDir = path.join(srcDir, 'utils');
  if (fs.existsSync(utilsDir)) {
    const utilFiles = fs.readdirSync(utilsDir);
    for (const file of utilFiles) {
      if (file.endsWith('.js')) {
        let content = fs.readFileSync(path.join(utilsDir, file), 'utf8');
        content = content.replace(/export function (\w+)/g, 'function $1');
        content = content.replace(/export async function (\w+)/g, 'async function $1');
        combinedCode += `\n// Util: ${file}\n` + content + '\n';
      }
    }
  }

  // 1. Считываем API файлы
  const apiFiles = ['auth.js', 'services.js', 'categories.js', 'cart.js', 'orders.js', 'reviews.js', 'admin.js'];
  for (const file of apiFiles) {
    const fPath = path.join(apiDir, file);
    if (fs.existsSync(fPath)) {
      let content = fs.readFileSync(fPath, 'utf8');
      const prefix = file.replace('.js', '').toUpperCase();

      // Убираем дублирование getHeaders
      content = content.replace(/function getHeaders\(\)\s*\{[\s\S]*?return headers;\s*\}/g, '');

      // Уникализируем API_URL / BASE_URL
      content = content.replace(/const API_URL =/g, `const ${prefix}_API_URL =`);
      content = content.replace(/const BASE_URL =/g, `const ${prefix}_API_URL =`);
      content = content.replace(/\bAPI_URL\b/g, `${prefix}_API_URL`);
      content = content.replace(/\bBASE_URL\b/g, `${prefix}_API_URL`);

      // Убираем export
      content = content.replace(/export async function (\w+)/g, 'async function $1');
      content = content.replace(/export function (\w+)/g, 'function $1');

      combinedCode += `\n// API: ${file}\n` + content + '\n';
    }
  }

  // 2. Считываем компоненты
  const compFiles = [
    'Navbar.jsx',
    'ServiceCard.jsx',
    'Catalog.jsx',
    'ReviewsModal.jsx',
    'CartModal.jsx',
    'CheckoutModal.jsx',
    'AuthModal.jsx',
    'ForgotPasswordModal.jsx',
    'ProfileModal.jsx',
    'AdminPanel.jsx'
  ];

  for (const file of compFiles) {
    const fPath = path.join(compDir, file);
    if (fs.existsSync(fPath)) {
      let content = fs.readFileSync(fPath, 'utf8');

      // Надежное удаление всех вариантов import (однострочных и многострочных)
      content = content.replace(/import\s+[\s\S]*?from\s+['"].*?['"];?/g, '');
      content = content.replace(/import\s+['"].*?['"];?/g, '');

      // Убираем export default function Foo
      const compName = file.replace('.jsx', '');
      content = content.replace(/export default function (\w+)/, 'function $1');
      content = content.replace(/export default function\s*\(/, `function ${compName}(`);

      // Транспилируем JSX
      const transformed = Babel.transform(content, {
        presets: ['react']
      }).code;

      combinedCode += `\n// Component: ${file}\n` + transformed + '\n';
    }
  }

  // 3. Считываем App.jsx
  const appPath = path.join(srcDir, 'App.jsx');
  let appContent = fs.readFileSync(appPath, 'utf8');
  appContent = appContent.replace(/import\s+[\s\S]*?from\s+['"].*?['"];?/g, '');
  appContent = appContent.replace(/import\s+['"].*?['"];?/g, '');
  appContent = appContent.replace(/export default function App/, 'function App');

  const appTransformed = Babel.transform(appContent, {
    presets: ['react']
  }).code;

  combinedCode += '\n// App.jsx\n' + appTransformed + '\n';

  // 4. Гарантированное монтирование React 18 в DOM
  combinedCode += `
  function mountApp() {
    const rootEl = document.getElementById('root');
    if (rootEl) {
      const root = ReactDOM.createRoot(rootEl);
      root.render(React.createElement(App));
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mountApp);
  } else {
    mountApp();
  }
})();
`;

  fs.writeFileSync(outFile, combinedCode, 'utf8');
  console.log('[Build] app.bundle.js успешно сгенерирован (' + Math.round(combinedCode.length / 1024) + ' KB)');
}

if (require.main === module) {
  bundle();
}

module.exports = bundle;
