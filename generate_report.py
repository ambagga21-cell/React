# -*- coding: utf-8 -*-
import os
import docx
from docx import Document
from docx.shared import Inches, Pt, RGBColor, Cm
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn

import io
from PIL import Image

def set_cell_background(cell, fill_hex):
    tcPr = cell._tc.get_or_add_tcPr()
    shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{fill_hex}"/>')
    tcPr.append(shd)

def set_cell_margins(cell, top=100, bottom=100, left=150, right=150):
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = parse_xml(f'<w:tcMar {nsdecls("w")}><w:top w:w="{top}" w:type="dxa"/><w:bottom w:w="{bottom}" w:type="dxa"/><w:left w:w="{left}" w:type="dxa"/><w:right w:w="{right}" w:type="dxa"/></w:tcMar>')
    tcPr.append(tcMar)

def create_report():
    doc = Document()

    # 1. Настройка полей страницы по ГОСТ (Левое: 30 мм, Правое: 15 мм, Верхнее: 20 мм, Нижнее: 20 мм)
    sections = doc.sections
    for section in sections:
        section.top_margin = Cm(2.0)
        section.bottom_margin = Cm(2.0)
        section.left_margin = Cm(3.0)
        section.right_margin = Cm(1.5)

    # Базовый стиль шрифта
    normal_style = doc.styles['Normal']
    normal_style.font.name = 'Times New Roman'
    normal_style.font.size = Pt(14)
    normal_style.font.color.rgb = RGBColor(0, 0, 0)
    normal_style.paragraph_format.line_spacing = 1.15
    normal_style.paragraph_format.space_after = Pt(4)

    # Хелперы форматирования
    def add_p(text, bold=False, italic=False, align=WD_ALIGN_PARAGRAPH.JUSTIFY, indent=1.25, space_before=0, space_after=4, font_size=14):
        p = doc.add_paragraph()
        p.alignment = align
        p.paragraph_format.line_spacing = 1.15
        p.paragraph_format.space_before = Pt(space_before)
        p.paragraph_format.space_after = Pt(space_after)
        if indent > 0:
            p.paragraph_format.first_line_indent = Cm(indent)
        else:
            p.paragraph_format.first_line_indent = Cm(0)
        
        run = p.add_run(text)
        run.bold = bold
        run.italic = italic
        run.font.name = 'Times New Roman'
        run.font.size = Pt(font_size)
        return p

    def add_heading_1(text):
        p = doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p.paragraph_format.line_spacing = 1.15
        p.paragraph_format.space_before = Pt(14)
        p.paragraph_format.space_after = Pt(8)
        p.paragraph_format.first_line_indent = Cm(0)
        run = p.add_run(text)
        run.bold = True
        run.font.name = 'Times New Roman'
        run.font.size = Pt(16)
        return p

    def add_heading_2(text):
        p = doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.LEFT
        p.paragraph_format.line_spacing = 1.15
        p.paragraph_format.space_before = Pt(12)
        p.paragraph_format.space_after = Pt(6)
        p.paragraph_format.first_line_indent = Cm(1.25)
        run = p.add_run(text)
        run.bold = True
        run.font.name = 'Times New Roman'
        run.font.size = Pt(14)
        return p

    def add_heading_3(text):
        p = doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.LEFT
        p.paragraph_format.line_spacing = 1.15
        p.paragraph_format.space_before = Pt(8)
        p.paragraph_format.space_after = Pt(4)
        p.paragraph_format.first_line_indent = Cm(1.25)
        run = p.add_run(text)
        run.bold = True
        run.italic = True
        run.font.name = 'Times New Roman'
        run.font.size = Pt(13)
        return p

    def add_code_snippet(code_text):
        table = doc.add_table(rows=1, cols=1)
        table.alignment = WD_TABLE_ALIGNMENT.CENTER
        table.autofit = False
        table.columns[0].width = Cm(16.5)
        cell = table.cell(0, 0)
        set_cell_background(cell, "F8F9FA")
        set_cell_margins(cell, top=140, bottom=140, left=180, right=180)
        
        # Обводка рамки таблицы
        tcPr = cell._tc.get_or_add_tcPr()
        borders = parse_xml(f'<w:tcBorders {nsdecls("w")}><w:top w:val="single" w:sz="4" w:space="0" w:color="D1D5DB"/><w:left w:val="single" w:sz="18" w:space="0" w:color="0284C7"/><w:bottom w:val="single" w:sz="4" w:space="0" w:color="D1D5DB"/><w:right w:val="single" w:sz="4" w:space="0" w:color="D1D5DB"/></w:tcBorders>')
        tcPr.append(borders)
        
        p = cell.paragraphs[0]
        p.paragraph_format.line_spacing = 1.05
        p.paragraph_format.space_before = Pt(2)
        p.paragraph_format.space_after = Pt(2)
        p.paragraph_format.first_line_indent = Cm(0)
        run = p.add_run(code_text.strip())
        run.font.name = 'Consolas'
        run.font.size = Pt(9.5)
        run.font.color.rgb = RGBColor(30, 41, 59)
        
        # Пустой абзац после таблицы
        post_p = doc.add_paragraph()
        post_p.paragraph_format.space_before = Pt(0)
        post_p.paragraph_format.space_after = Pt(4)
        post_p.paragraph_format.first_line_indent = Cm(0)

    def add_img(img_path, caption_text, width_cm=15.0):
        if os.path.exists(img_path):
            try:
                im = Image.open(img_path)
                buf = io.BytesIO()
                im.convert('RGB').save(buf, format='PNG')
                buf.seek(0)

                p_img = doc.add_paragraph()
                p_img.alignment = WD_ALIGN_PARAGRAPH.CENTER
                p_img.paragraph_format.space_before = Pt(8)
                p_img.paragraph_format.space_after = Pt(2)
                p_img.paragraph_format.first_line_indent = Cm(0)
                run = p_img.add_run()
                run.add_picture(buf, width=Cm(width_cm))

                p_cap = doc.add_paragraph()
                p_cap.alignment = WD_ALIGN_PARAGRAPH.CENTER
                p_cap.paragraph_format.space_before = Pt(2)
                p_cap.paragraph_format.space_after = Pt(10)
                p_cap.paragraph_format.first_line_indent = Cm(0)
                run_cap = p_cap.add_run(caption_text)
                run_cap.font.name = 'Times New Roman'
                run_cap.font.size = Pt(12)
                run_cap.italic = True
            except Exception as e:
                add_p(f"[Ошибка вставки изображения {caption_text}: {e}]", italic=True, align=WD_ALIGN_PARAGRAPH.CENTER, indent=0)
        else:
            add_p(f"[Изображение не найдено: {caption_text}]", italic=True, align=WD_ALIGN_PARAGRAPH.CENTER, indent=0)

    # =========================================================================
    # 1. ТИТУЛЬНЫЙ ЛИСТ (Точно по образцу техникума РЭУ им. Г.В. Плеханова)
    # =========================================================================
    add_p("МИНИСТЕРСТВО НАУКИ И ВЫСШЕГО ОБРАЗОВАНИЯ РОССИЙСКОЙ ФЕДЕРАЦИИ", bold=True, align=WD_ALIGN_PARAGRAPH.CENTER, indent=0, font_size=11, space_after=2)
    add_p("федеральное государственное бюджетное образовательное учреждение высшего образования", align=WD_ALIGN_PARAGRAPH.CENTER, indent=0, font_size=11, space_after=2)
    add_p("«Российский экономический университет имени Г.В. Плеханова»", bold=True, align=WD_ALIGN_PARAGRAPH.CENTER, indent=0, font_size=12, space_after=2)
    add_p("Московский приборостроительный техникум", bold=True, align=WD_ALIGN_PARAGRAPH.CENTER, indent=0, font_size=13, space_after=40)

    add_p("ОТЧЕТ", bold=True, align=WD_ALIGN_PARAGRAPH.CENTER, indent=0, font_size=20, space_after=12)
    add_p("по учебной практике", align=WD_ALIGN_PARAGRAPH.CENTER, indent=0, font_size=14, space_after=20)

    add_p("УП 01.01 «Учебная практика»", bold=True, align=WD_ALIGN_PARAGRAPH.LEFT, indent=0, font_size=13, space_after=0)
    add_p("индекс по УП и наименование практики", italic=True, align=WD_ALIGN_PARAGRAPH.CENTER, indent=0, font_size=10, space_after=14)

    add_p("Профессионального модуля ПМ.01 «Разработка модулей программного обеспечения для компьютерных систем»", bold=True, align=WD_ALIGN_PARAGRAPH.LEFT, indent=0, font_size=13, space_after=0)
    add_p("индекс по УП и наименование профессионального модуля", italic=True, align=WD_ALIGN_PARAGRAPH.CENTER, indent=0, font_size=10, space_after=14)

    add_p("Специальность 09.02.07 «Информационные системы и программирование»", bold=True, align=WD_ALIGN_PARAGRAPH.LEFT, indent=0, font_size=13, space_after=0)
    add_p("код и наименование специальности", italic=True, align=WD_ALIGN_PARAGRAPH.CENTER, indent=0, font_size=10, space_after=24)

    p_stud = doc.add_paragraph()
    p_stud.paragraph_format.first_line_indent = Cm(0)
    p_stud.paragraph_format.space_after = Pt(2)
    r1 = p_stud.add_run("Студент    ")
    r1.font.name = 'Times New Roman'
    r1.font.size = Pt(13)
    r2 = p_stud.add_run("Губогло Александр Михайлович")
    r2.bold = True
    r2.underline = True
    r2.font.name = 'Times New Roman'
    r2.font.size = Pt(13)
    add_p("(фамилия, имя, отчество)", italic=True, align=WD_ALIGN_PARAGRAPH.CENTER, indent=0, font_size=10, space_after=10)

    p_grp = doc.add_paragraph()
    p_grp.paragraph_format.first_line_indent = Cm(0)
    p_grp.paragraph_format.space_after = Pt(20)
    r_g1 = p_grp.add_run("Группа     ")
    r_g1.font.name = 'Times New Roman'
    r_g1.font.size = Pt(13)
    r_g2 = p_grp.add_run("П-4-24")
    r_g2.bold = True
    r_g2.underline = True
    r_g2.font.name = 'Times New Roman'
    r_g2.font.size = Pt(13)

    add_p("Руководитель по практической подготовке от техникума", align=WD_ALIGN_PARAGRAPH.LEFT, indent=0, font_size=13, space_after=4)
    p_ruk = doc.add_paragraph()
    p_ruk.paragraph_format.first_line_indent = Cm(0)
    p_ruk.paragraph_format.space_after = Pt(2)
    r_r = p_ruk.add_run("Юшина Дарья Денисовна")
    r_r.bold = True
    r_r.underline = True
    r_r.font.name = 'Times New Roman'
    r_r.font.size = Pt(13)
    add_p("(фамилия, имя, отчество)", italic=True, align=WD_ALIGN_PARAGRAPH.CENTER, indent=0, font_size=10, space_after=40)

    add_p("«____» _________ 2026 года", align=WD_ALIGN_PARAGRAPH.RIGHT, indent=0, font_size=13, space_after=0)
    doc.add_page_break()

    # =========================================================================
    # 2. СОДЕРЖАНИЕ (Включает 4 лабораторные работы)
    # =========================================================================
    add_heading_1("СОДЕРЖАНИЕ")
    add_p("Лабораторная работа №1 Мини-приложение с карточкой товара .................................................... 3", indent=0, space_after=6)
    add_p("Лабораторная работа №2 Создание SPA-приложения на React ....................................................... 11", indent=0, space_after=6)
    add_p("Лабораторная работа №3 Создание веб-приложения для магазина ................................................ 25", indent=0, space_after=6)
    add_p("Лабораторная работа №4 Разработка клиент-серверной информационной системы онлайн-заказа услуг «Лавка Услуг» с СУБД PostgreSQL, Express REST API и React 18 ................................................................................................................................................. 33", bold=True, indent=0, space_after=6)
    doc.add_page_break()

    # =========================================================================
    # 3. ТЕКСТ ЛАБОРАТОРНОЙ РАБОТЫ №4
    # =========================================================================
    add_heading_1("Лабораторная работа №4")
    add_p("Разработка клиент-серверной информационной системы онлайн-заказа услуг и товаров «Лавка Услуг» с базой данных PostgreSQL, REST API и React 18", bold=True, align=WD_ALIGN_PARAGRAPH.CENTER, indent=0, font_size=15, space_after=12)

    add_p("Цель работы: Разработать полнофункциональное клиент-серверное веб-приложение для салона-магазина услуг «Лавка Услуг», включающее интерактивный каталог с фильтрацией по категориям и скидкам от 0 до 99%, корзину с валидацией лимитов сеанса мастера (не более 6 часов и 3 одинаковых процедур), личный кабинет клиента, многоканальное восстановление пароля по Email с 6-значным кодом подтверждения, систему модерации отзывов с рейтингами от 1 до 5 звезд, а также панель администратора для комплексного управления заказами, услугами, категориями и правами пользователей, интегрированное с реляционной базой данных PostgreSQL через REST API и HTML5 Browser Router.", bold=True)

    add_heading_2("Ход работы:")
    add_p("Разработка информационной системы велась по двухзвенной клиент-серверной архитектуре и разделена на два ключевых этапа: проектирование и реализация серверной части (реляционная СУБД PostgreSQL и RESTful API на базе Node.js/Express) и разработка клиентской части (SPA-приложение на React 18 с компонентным подходом).")

    # --- СЕРВЕРНАЯ ЧАСТЬ ---
    add_heading_2("1. Серверная часть (Бэкенд и База данных PostgreSQL):")
    
    add_p("1.1. В файле backend/init_db.js спроектирована схема базы данных PostgreSQL. Создана нормализованная структура из 9 связанных таблиц:")
    add_p("• roles — справочник системных ролей пользователей (admin, user);")
    add_p("• users — учетные записи пользователей с полями ФИО, email, хэш пароля, телефон, адрес по умолчанию и связь с ролью;")
    add_p("• categories — перечень категорий каталога услуг;")
    add_p("• services — номенклатура оказываемых услуг с указанием длительности сеанса (от 1 до 360 минут), базовой цены и скидки (от 0 до 99%);")
    add_p("• cart_items — корзина покупок авторизованных клиентов, хранимая в БД;")
    add_p("• orders — журнал оформленных заказов клиентов со статусами исполнения;")
    add_p("• order_items — состав каждого заказа с фиксацией цены на момент покупки;")
    add_p("• reviews — отзывы клиентов с оценками от 1 до 5 звезд и комментариями;")
    add_p("• password_reset_codes — временные 6-значные коды подтверждения для безопасного сброса пароля с ограниченным временем жизни (15 минут).")
    add_p("Для обеспечения ссылочной целостности настроены внешние ключи (FOREIGN KEY) и ограничения CHECK (discount_percent >= 0 AND discount_percent <= 99, duration > 0 AND duration <= 360).")

    add_code_snippet("""// Фрагмент схемы базы данных PostgreSQL (backend/init_db.js)
CREATE TABLE IF NOT EXISTS services (
  id SERIAL PRIMARY KEY,
  category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  duration INTEGER NOT NULL DEFAULT 60 CHECK (duration > 0 AND duration <= 360),
  price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
  discount_percent INTEGER NOT NULL DEFAULT 0 CHECK (discount_percent >= 0 AND discount_percent <= 99),
  image_url VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS password_reset_codes (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  code VARCHAR(10) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);""")

    add_p("1.2. В файлах backend/server.js и backend/db.js реализован HTTP-сервер на Express и модуль подключения к PostgreSQL через пул соединений pg.Pool. Настроены промежуточные обработчики (middleware) для поддержки CORS-запросов и парсинга JSON. Сервер слушает выделенный порт 3001, гарантируя изоляцию бэкенда от клиентской части.")

    add_p("1.3. В файле backend/routes/auth.js и backend/services/emailService.js реализована комплексная подсистема аутентификации и многоканального восстановления доступа к аккаунту:")
    add_p("• Регистрация и авторизация: пароли шифруются криптографическим алгоритмом bcrypt с генерацией соли (10 раундов). Сессионная безопасность обеспечивается выдачей подписанных JWT-токенов со сроком действия 7 дней. Из формы регистрации исключены устаревшие кодовые слова;")
    add_p("• Сброс пароля: при запросе сброса пароля генерируется случайный 6-значный криптографический код подтверждения, сохраняемый в таблице password_reset_codes. Письмо с кодом формируется библиотекой nodemailer и одновременно отправляется через несколько каналов: в реальный почтовый сервис Ethereal Mail с выдачей ссылки на входящее письмо в ящике, в канал мобильных push-уведомлений ntfy.sh (lavka-ambagga), а также выводится в защищенный системный лог консоли сервера;")
    add_p("• Проверка кода: эндпоинт POST /forgot-password/reset-with-code проверяет соответствие кода и срок его действия, после чего хеширует новый пароль и обновляет запись в БД.")

    add_code_snippet("""// Многоканальная отправка кода восстановления (backend/services/emailService.js)
async function sendPasswordResetEmail(targetEmail, code) {
  // 1. Отправка мобильного push-уведомления через ntfy.sh
  fetch('https://ntfy.sh', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      topic: 'lavka-ambagga',
      title: `Код восстановления: ${code} — Лавка Услуг`,
      message: `Здравствуйте! Ваш проверочный код: ${code}\\nОтправлен на: ${targetEmail}`,
      priority: 4,
      tags: ['envelope', 'key']
    })
  }).catch(() => {});

  // 2. Генерация реального HTML-письма в онлайн-ящике Ethereal Mail
  const testAccount = await nodemailer.createTestAccount();
  const testTransporter = nodemailer.createTransport({
    host: testAccount.smtp.host,
    port: testAccount.smtp.port,
    secure: testAccount.smtp.secure,
    auth: { user: testAccount.user, pass: testAccount.pass }
  });
  const info = await testTransporter.sendMail(mailOptions);
  return { success: true, previewUrl: nodemailer.getTestMessageUrl(info) };
}""")

    add_p("1.4. В файле backend/routes/services.js реализовано управление каталогом услуг. Запросы к БД строятся с использованием JOIN категорий (LEFT JOIN categories ON services.category_id = categories.id). Итоговая стоимость рассчитывается математически с точностью до копеек: ROUND(price * (1 - discount_percent / 100.0), 2). Реализована серверная валидация длительности сеанса: запрещено создание или изменение услуг с длительностью свыше 360 минут (6 часов).")

    add_p("1.5. В файле backend/routes/categories.js реализован механизм безопасного удаления категорий. При удалении категории все прикрепленные к ней услуги автоматически переводятся в системную категорию «Без категории» (ON DELETE SET NULL / COALESCE), что исключает случайную потерю номенклатуры процедур. В дальнейшем администратор может вернуть услуги в существующие или новые категории.")

    add_p("1.6. В файле backend/routes/cart.js и backend/routes/orders.js реализована бизнес-логика серверной корзины и оформления заказов. Корзина сохраняется в базе данных для каждого авторизованного пользователя. При добавлении и оформлении заказов проверяются ограничения: не более 3 одинаковых процедур на один сеанс мастера, суммарное время процедур не более 6 часов, а дата записи не может быть прошедшей.")

    add_p("1.7. В файле backend/routes/admin.js реализован административный REST API. Предоставляются сводные данные о выручке, количестве заказов и клиентов. Добавлена возможность смены статусов заказов («Принят» → «В обработке» → «Выполнен» / «Отменен»). Заказы со статусами «Выполнен» и «Отменен» блокируются для дальнейших правок. Реализован запрет удаления заказов из истории.")

    # --- КЛИЕНТСКАЯ ЧАСТЬ ---
    add_heading_2("2. Клиентская часть (React 18):")

    add_p("2.1. В файлах src/App.jsx, build.js и frontend.js реализована архитектура SPA-приложения на React 18. Для быстрой и независимой сборки создан сборщик на базе Babel Standalone, компилирующий JSX-компоненты в единый оптимизированный бандл public/js/app.bundle.js. Сервер frontend.js на порту 3000 проксирует запросы /api/ к бэкенду на порт 3001 и обеспечивает SPA Fallback для любого несуществующего пути.")

    add_p("2.2. В файле src/App.jsx настроена клиентская маршрутизация на базе HTML5 History API (Browser Router):")
    add_p("• Использование window.history.pushState и слушателя события popstate обеспечивает синхронизацию адреса страницы с открытыми окнами (/cart, /checkout, /login, /forgot-password, /profile, /admin);")
    add_p("• Поддерживается навигация кнопками браузера «Назад» и «Вперед», а также корректная работа при обновлении страницы по прямой ссылке;")
    add_p("• Настроена защита маршрутов (Route Guard): неавторизованные пользователи при попытке перехода в /profile или /admin перенаправляются на форму входа /login, а клиенты без прав администратора возвращаются на главную страницу.")

    add_code_snippet("""// Маршрутизация на базе Browser Router (src/App.jsx)
const [currentPath, setCurrentPath] = useState(() => window.location.pathname || '/');

const navigate = useCallback((path, replace = false) => {
  if (window.location.pathname !== path) {
    if (replace) window.history.replaceState({}, '', path);
    else window.history.pushState({}, '', path);
  }
  setCurrentPath(path);
}, []);

useEffect(() => {
  const handlePopState = () => setCurrentPath(window.location.pathname || '/');
  window.addEventListener('popstate', handlePopState);
  return () => window.removeEventListener('popstate', handlePopState);
}, []);""")

    add_p("2.3. В компонентах src/components/Catalog.jsx и src/components/ServiceCard.jsx реализована витрина услуг. Для каждой услуги выводятся бейдж категории, название, форматированная длительность («X ч Y мин»), базовая и акционная цена со скидкой (с точностью до копеек), кнопка добавления в корзину и вызов окна отзывов. Доступен «живой» поиск и фильтрация по категориям.")

    add_p("2.4. В компоненте src/components/CartModal.jsx реализован интерфейс корзины. В реальном времени рассчитывается суммарное время всех выбранных процедур. Если суммарная длительность превышает 360 минут или количество одной процедуры превышает 3 штуки, интерфейс блокирует превышение и выводит предупреждение о пределе рабочей смены мастера.")

    add_p("2.5. В компонентах src/components/AuthModal.jsx и src/components/ForgotPasswordModal.jsx реализован интерфейс безопасности. Регистрация содержит только актуальные поля (ФИО, Email, Пароль, Телефон). Окно восстановления пароля имеет 3 шага с автоматическим сбросом состояния при закрытии, валидацией 6 цифр кода и ссылкой на онлайн-просмотр письма в почтовом ящике Ethereal.")

    add_p("2.6. В компоненте src/components/AdminPanel.jsx реализован рабочий кабинет администратора, включающий 5 специализированных вкладок: управление заказами клиентов (со статусами и запретом удаления), номенклатура услуг со скидками от 0 до 99% и лимитом времени 6 часов, управление категориями с разделом «Без категории», модерация отзывов с фильтрацией по оценкам (3 и 4 звезды) и управление ролями пользователей.")

    # --- РЕЗУЛЬТАТЫ РАБОТЫ ---
    add_heading_2("3. Результаты работы:")
    add_p("В результате выполнения работы была создана и протестирована полнофункциональная информационная система онлайн-заказа услуг. Ниже представлены скриншоты разработанного интерфейса с описанием функционала:")

    # Рисунок 1: Каталог
    img_dir = r"C:\Users\Александр\.gemini\antigravity\brain\a6e34e32-240d-43fd-b3af-e5f25e5fa29d\.user_uploaded"
    
    add_p("1. На главной странице системы открыт каталог услуг в тёмной теме оформления. Пользователю доступны фильтры по категориям, поле поиска, сортировка и информационный баннер. В карточках услуг выводятся бейджи скидок, старая цена зачеркнута и рассчитана новая цена со скидкой, отображается форматированное время визита мастера.")
    add_img(os.path.join(img_dir, "media_1795253521874_7fe566ed.jpg"), "Рисунок 1 – Главная страница каталога услуг «Лавка Услуг» в тёмной теме")

    add_p("2. В модальном окне корзины отображаются выбранные процедуры с возможностью изменения количества и удаления. Система в реальном времени контролирует соблюдение лимитов рабочего времени мастера на один выезд (максимум 6 часов) и не более 3 одинаковых процедур, отображая общую продолжительность и итоговую стоимость.")
    add_img(os.path.join(img_dir, "media_1795258290877_b8340686.jpg"), "Рисунок 2 – Модальное окно корзины с контролем времени визита мастера")

    add_p("3. При переходе по ссылке «Забыли пароль?» открывается окно восстановления доступа. После ввода почты система отправляет проверочный 6-значный код и переходит ко второму шагу. Поле ввода кода защищено от некорректного ввода, а под формой доступна прямая ссылка для перехода во входящее письмо.")
    add_img(os.path.join(img_dir, "media_1795346280470_2531d248.png"), "Рисунок 3 – Модальное окно восстановления доступа к аккаунту с вводом проверочного кода")

    add_p("4. При переходе по ссылке онлайн-почты открывается сформированное входящее HTML-письмо в почтовом сервисе Ethereal Mail. В письме указаны тема, отправитель «Лавка Услуг», получатель ambagga21@gmail.com, срок действия и крупный 6-значный проверочный код.")
    add_img(os.path.join(img_dir, "media_1795348749295_22b756d0.jpg"), "Рисунок 4 – Входящее электронное письмо в почтовом сервисе Ethereal Mail")

    add_p("5. Одновременно с отправкой письма система отправляет звуковое push-уведомление в открытый канал ntfy.sh (lavka-ambagga), позволяя мгновенно получить код подтверждения на мобильном телефоне без необходимости ввода паролей приложений.")
    add_img(os.path.join(img_dir, "media_1795348690783_74e209de.jpg"), "Рисунок 5 – Канал push-уведомлений ntfy.sh (lavka-ambagga)")

    add_p("6. В панели управления администратора открыта вкладка «Заказы клиентов». В таблице представлены поступившие заказы с группировкой процедур (x2, x3), общей суммой, адресом, датой и федеральным номером телефона клиента. Администратор управляет статусом («Принят», «В обработке», «Выполнен», «Отменен»). Завершенные заказы фиксируются для отчетности, кнопка удаления исключена.")
    add_img(os.path.join(img_dir, "media_1795349155480_9386c398.jpg"), "Рисунок 6 – Панель администратора: журнал заказов клиентов")

    add_p("7. В разделе управления категориями отображается список текущих разделов каталога с количеством услуг в каждом. При удалении категории услуги сохраняются и автоматически перемещаются в раздел «Без категории», откуда администратор может переназначить их.")
    add_img(os.path.join(img_dir, "media_1795260891378_45fd38d1.jpg"), "Рисунок 7 – Управление категориями каталога и раздел «Без категории»")

    add_p("8. В модальном окне редактирования услуги администратор может изменить категорию, название, установить скидку от 0 до 99% с автоматическим пересчетом итоговой цены для клиентов (включая расчет копеек 0.01 ₽), а также настроить длительность услуги в часах и минутах с ограничением максимальной смены мастера до 6 часов.")
    add_img(os.path.join(img_dir, "media_1795260748708_7c31be4a.jpg"), "Рисунок 8 – Редактирование услуги: скидка от 0 до 99% и расчет цены")

    # --- ВЫВОД ---
    add_heading_2("Вывод:")
    add_p("В ходе выполнения лабораторной работы №4 была успешно спроектирована и реализована полнофункциональная клиент-серверная информационная система онлайн-заказа услуг и товаров «Лавка Услуг». В процессе работы:")
    add_p("1. Развернута реляционная база данных PostgreSQL со сложными связями, внешними ключами и ограничениями целостности для услуг, скидок, корзины, заказов, отзывов и кодов сброса пароля;")
    add_p("2. Реализован надежный REST API на Node.js/Express, включающий аутентификацию с шифрованием bcrypt и JWT-токенами, валидацию данных, ограничение длительности процедур (до 6 часов) и безопасную обработку ошибок;")
    add_p("3. Создан современный одностраничный интерфейс на React 18 с компонентной структурой, поддержкой светлой и темной тем оформления, многоканальным подтверждением по Email и push-уведомлениями, динамическим расчетом скидок и защищенной панелью администратора;")
    add_p("4. Внедрена маршрутизация на базе HTML5 Browser Router, обеспечивающая синхронизацию адресной строки браузера и полноценную навигацию кнопками «Назад»/«Вперед».")
    add_p("Разработанная система полностью соответствует всем предъявленным требованиям технического задания, демонстрирует высокую надежность и готова к практическому использованию.")

    out_path = r"C:\Users\Александр\.gemini\antigravity\scratch\beauty-service-store\Отчет_Лабораторная_работа_4_Губогло.docx"
    doc.save(out_path)
    print("SUCCESS: Report saved to", out_path)

if __name__ == '__main__':
    create_report()
