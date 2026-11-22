import os
import io
import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH, WD_TAB_ALIGNMENT, WD_TAB_LEADER
from PIL import Image as PILImage
import pypdf
import reportlab
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm, inch
from reportlab.pdfgen import canvas
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Image as RLImage, PageBreak, KeepTogether
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY, TA_LEFT, TA_RIGHT
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

print("Starting complete report generation...")

# Register fonts
pdfmetrics.registerFont(TTFont('TimesNewRoman', r'C:\Windows\Fonts\times.ttf'))
pdfmetrics.registerFont(TTFont('TimesNewRoman-Bold', r'C:\Windows\Fonts\timesbd.ttf'))
pdfmetrics.registerFont(TTFont('TimesNewRoman-Italic', r'C:\Windows\Fonts\timesi.ttf'))
pdfmetrics.registerFont(TTFont('TimesNewRoman-BoldItalic', r'C:\Windows\Fonts\timesbi.ttf'))

# Images configuration
uploaded_dir = r"C:\Users\Александр\.gemini\antigravity\brain\a6e34e32-240d-43fd-b3af-e5f25e5fa29d\.user_uploaded"
images_info = [
    {
        "filename": "media_1795260748708_7c31be4a.jpg",
        "caption": "Рисунок 1 – Главная страница каталога услуг с фильтрацией и темной темой"
    },
    {
        "filename": "media_1795257126108_2c93c4af.png",
        "caption": "Рисунок 2 – Корзина и лимит времени мастера до 6 часов"
    },
    {
        "filename": "media_1795348108187_cffb8291.png",
        "caption": "Рисунок 3 – Окно восстановления доступа к аккаунту с отправкой кода подтверждения"
    },
    {
        "filename": "media_1795348749295_22b756d0.jpg",
        "caption": "Рисунок 4 – Входящее HTML-письмо с кодом подтверждения в сервисе Ethereal Mail"
    },
    {
        "filename": "media_1795348690783_74e209de.jpg",
        "caption": "Рисунок 5 – Мобильное push-уведомление с кодом восстановления в ntfy.sh"
    },
    {
        "filename": "media_1795349155480_9386c398.jpg",
        "caption": "Рисунок 6 – Список заказов с форматированными телефонами и запретом удаления"
    },
    {
        "filename": "media_1795258290877_b8340686.jpg",
        "caption": "Рисунок 7 – Успешное обновление пароля пользователя"
    },
    {
        "filename": "media_1795253521874_7fe566ed.jpg",
        "caption": "Рисунок 8 – Мобильный push-канал lavka-ambagga с входящими уведомлениями"
    }
]

# Step 1: Generate clean Page 2 (СОДЕРЖАНИЕ) PDF
toc_pdf_path = r"C:\Users\Александр\.gemini\antigravity\scratch\beauty-service-store\temp_toc.pdf"

c = canvas.Canvas(toc_pdf_path, pagesize=A4)
width, height = A4 # 595.27, 841.89

# Margins: Left 30mm (85.04 pt), Right 15mm (42.52 pt), Top 20mm (56.7 pt)
left_x = 30 * mm
right_x = width - 15 * mm
content_w = right_x - left_x

# Title: СОДЕРЖАНИЕ
c.setFont('TimesNewRoman-Bold', 14)
c.drawCentredString(width / 2.0, height - 25 * mm, "СОДЕРЖАНИЕ")

# Entries
entries = [
    ("Лабораторная работа №1 Мини-приложение с карточкой товара", "3"),
    ("Лабораторная работа №2 Создание SPA-приложения на React", "11"),
    ("Лабораторная работа №3 Создание веб-приложения для магазина", "25"),
    ("Лабораторная работа №4 Создание веб-сервиса «Лавка Услуг»", "33")
]

start_y = height - 42 * mm
line_spacing = 10 * mm
grid_step = 2.5 * mm

c.setFont('TimesNewRoman', 14)

import math
for i, (title, page_num) in enumerate(entries):
    y = start_y - i * line_spacing
    # Title on left
    c.drawString(left_x, y, title)
    title_w = c.stringWidth(title, 'TimesNewRoman', 14)
    
    # Page num on right
    num_w = c.stringWidth(page_num, 'TimesNewRoman', 14)
    c.drawRightString(right_x, y, page_num)
    
    # Draw dots between title and number locked to vertical column grid
    dots_start = left_x + title_w + 3 * mm
    dots_end = right_x - num_w - 3 * mm
    
    first_dot = math.ceil(dots_start / grid_step) * grid_step
    dot_x = first_dot
    while dot_x < dots_end:
        c.drawString(dot_x, y, ".")
        dot_x += grid_step

c.showPage()
c.save()
print("TOC PDF generated:", toc_pdf_path)

# Step 2: Generate Lab 4 PDF
lab4_pdf_path = r"C:\Users\Александр\.gemini\antigravity\scratch\beauty-service-store\temp_lab4.pdf"

doc_rl = SimpleDocTemplate(
    lab4_pdf_path,
    pagesize=A4,
    leftMargin=30*mm,
    rightMargin=15*mm,
    topMargin=20*mm,
    bottomMargin=20*mm
)

styles = getSampleStyleSheet()

style_title = ParagraphStyle(
    'LabTitle',
    fontName='TimesNewRoman-Bold',
    fontSize=14,
    leading=18,
    alignment=TA_CENTER,
    spaceAfter=4*mm
)

style_subtitle = ParagraphStyle(
    'LabSubtitle',
    fontName='TimesNewRoman-Bold',
    fontSize=14,
    leading=18,
    alignment=TA_CENTER,
    spaceAfter=6*mm
)

style_body = ParagraphStyle(
    'LabBody',
    fontName='TimesNewRoman',
    fontSize=14,
    leading=16.5,
    alignment=TA_JUSTIFY,
    firstLineIndent=12.5*mm,
    spaceAfter=3*mm
)

style_h2 = ParagraphStyle(
    'LabH2',
    fontName='TimesNewRoman-Bold',
    fontSize=14,
    leading=18,
    alignment=TA_LEFT,
    firstLineIndent=12.5*mm,
    spaceBefore=5*mm,
    spaceAfter=3*mm
)

# Caption: 12 pt, NO ITALIC, centered, before image!
style_caption = ParagraphStyle(
    'LabCaption',
    fontName='TimesNewRoman',
    fontSize=12,
    leading=15,
    alignment=TA_CENTER,
    spaceBefore=4*mm,
    spaceAfter=3*mm
)

story = []

# Heading
story.append(Paragraph("Лабораторная работа №4", style_title))
story.append(Paragraph("Разработка клиент-серверной информационной системы онлайн-заказа услуг «Лавка Услуг»", style_subtitle))

# Goal & Progress
story.append(Paragraph("<b>Цель работы:</b> Разработать клиент-серверную систему онлайн-заказа услуг с базой данных PostgreSQL, REST API и клиентом на React, реализовав аутентификацию, корзину, оформление заказов и панель администратора.", style_body))
story.append(Paragraph("<b>Ход работы:</b> Разработка велась в два этапа: создание серверной части (REST API и реляционная база данных PostgreSQL) и клиентской части (React 18-приложение с панелью администратора).", style_body))

# 1. Серверная часть
story.append(Paragraph("1. Серверная часть (REST API и база данных PostgreSQL):", style_h2))
story.append(Paragraph("1.1. В файле <code>backend/init_db.js</code> спроектирована схема базы данных PostgreSQL. Создана нормализованная структура из 9 связанных таблиц: роли (<code>roles</code>), купоны и скидки (<code>coupons</code>), пользователи (<code>users</code>), категории (<code>categories</code>), услуги (<code>services</code>), корзина (<code>cart</code>), заказы (<code>orders</code>), отзывы (<code>reviews</code>) и коды сброса пароля (<code>password_reset_codes</code>). Настроены внешние ключи (FOREIGN KEY) и каскадные правила целостности.", style_body))
story.append(Paragraph("1.2. В файлах <code>backend/server.js</code> и <code>backend/db.js</code> реализован HTTP-сервер на Express и модуль подключения к PostgreSQL через пул соединений <code>pg.Pool</code>. Настроены промежуточные обработчики (middleware) для поддержки CORS-запросов и парсинга JSON. Сервер слушает выделенный порт 3001, гарантируя изоляцию бэкенда от клиентской части.", style_body))
story.append(Paragraph("1.3. В файле <code>backend/routes/auth.js</code> и <code>backend/services/emailService.js</code> реализована комплексная подсистема аутентификации и многоканального восстановления доступа к аккаунту: хеширование паролей алгоритмом bcrypt (10 раундов соли), генерация криптостойких JWT-токенов, отправка 6-значных кодов сброса на почту (поддержка реальных ящиков через Ethereal Mail) и мгновенных push-уведомлений на мобильные устройства в топик <code>ntfy.sh</code>.", style_body))
story.append(Paragraph("1.4. В файле <code>backend/routes/services.js</code> реализовано управление каталогом услуг. Запросы к БД строятся с использованием JOIN категорий. Итоговая стоимость рассчитывается с учетом скидки с точностью до копеек: <code>ROUND(price * (1 - discount_percent / 100.0), 2)</code>. Реализована серверная валидация длительности сеанса: запрещено создание или изменение услуг с длительностью свыше 360 минут (6 часов).", style_body))
story.append(Paragraph("1.5. В файле <code>backend/routes/categories.js</code> реализован механизм безопасного удаления категорий. При удалении категории все прикрепленные к ней услуги автоматически переводятся в системную категорию «Без категории» (<code>ON DELETE SET NULL / COALESCE</code>), что исключает случайную потерю номенклатуры процедур.", style_body))
story.append(Paragraph("1.6. В файле <code>backend/routes/cart.js</code> и <code>backend/routes/orders.js</code> реализована бизнес-логика серверной корзины и оформления заказов. Корзина сохраняется в базе данных для каждого авторизованного пользователя. При добавлении и оформлении заказов проверяются ограничения: не более 3 одинаковых процедур на один сеанс мастера, суммарное время процедур не более 6 часов, а дата записи не может быть прошедшей.", style_body))
story.append(Paragraph("1.7. В файле <code>backend/routes/admin.js</code> реализован административный REST API. Предоставляются сводные данные о выручке, количестве заказов и клиентов. Добавлена возможность смены статусов заказов («Принят» → «В обработке» → «Выполнен» / «Отменен»). Заказы со статусами «Выполнен» и «Отменен» блокируются для дальнейших правок. Реализован запрет удаления заказов из истории.", style_body))

# 2. Клиентская часть
story.append(Paragraph("2. Клиентская часть (Фронтенд на React 18):", style_h2))
story.append(Paragraph("2.1. В файле <code>src/App.jsx</code> настроена архитектура клиентского приложения на React 18 с интеграцией HTML5 History API (Browser Router) для бесшовной синхронизации адресной строки браузера (<code>/catalog</code>, <code>/cart</code>, <code>/orders</code>, <code>/reviews</code>, <code>/admin</code>) и переключения светлой и тёмной тем оформления.", style_body))
story.append(Paragraph("2.2. В компоненте <code>src/components/Catalog.jsx</code> реализован интерактивный каталог услуг с фильтрацией по категориям, поисковой строкой по названию и описанию, сортировкой по цене и длительности, расчетом акционной цены и визуальными бейджами скидок.", style_body))
story.append(Paragraph("2.3. В компоненте <code>src/components/CartModal.jsx</code> реализовано модальное окно оформления заказа. В реальном времени рассчитывается суммарное время процедур мастера (с валидацией лимита 6 часов), проверяется не более 3 процедур одного наименования и валидируется дата выезда мастера.", style_body))
story.append(Paragraph("2.4. В компоненте <code>src/components/AuthModal.jsx</code> реализованы формы авторизации и быстрой регистрации. Форма оптимизирована: регистрация требует только имя, email, пароль и номер телефона в формате <code>+7 (XXX) XXX-XX-XX</code> (устаревшие контрольные вопросы и адрес доставки удалены).", style_body))
story.append(Paragraph("2.5. В компоненте <code>src/components/ForgotPasswordModal.jsx</code> реализован 3-шаговый интерфейс восстановления доступа: ввод email, ввод 6-значного кода с кнопкой быстрого перехода во входящее письмо Ethereal Mail, и установка нового пароля. Окно автоматически сбрасывается на 1-й шаг при повторном открытии.", style_body))
story.append(Paragraph("2.6. В компоненте <code>src/components/AdminPanel.jsx</code> реализован рабочий кабинет администратора, включающий 5 специализированных вкладок: управление заказами клиентов (со статусами и запретом удаления), номенклатура услуг со скидками и лимитом времени 6 часов, управление категориями с разделом «Без категории», модерация отзывов с фильтрацией по оценкам (3 и 4 звезды) и управление ролями пользователей.", style_body))

# 3. Результаты работы (Скриншоты)
story.append(Paragraph("3. Результаты работы:", style_h2))

# Printable width is 210mm - 45mm = 165mm
max_img_w = 155 * mm

for item in images_info:
    img_path = os.path.join(uploaded_dir, item["filename"])
    if not os.path.exists(img_path):
        continue
    
    # Caption BEFORE image, NO italic, 12pt
    story.append(Paragraph(item["caption"], style_caption))
    
    # Calculate image dimensions keeping aspect ratio
    with PILImage.open(img_path) as pil_img:
        orig_w, orig_h = pil_img.size
        scale = max_img_w / float(orig_w)
        target_w = max_img_w
        target_h = orig_h * scale
        
        # Max height per image to fit neatly on a page
        if target_h > 120 * mm:
            target_h = 120 * mm
            target_w = orig_w * (120 * mm / float(orig_h))
            
    story.append(RLImage(img_path, width=target_w, height=target_h))
    story.append(Spacer(1, 4*mm))

# 4. Вывод (СТРОГО ПО ЦЕЛИ!)
story.append(Paragraph("Вывод:", style_h2))
story.append(Paragraph("В ходе выполнения лабораторной работы была разработана клиент-серверная система онлайн-заказа услуг с базой данных PostgreSQL, REST API и клиентом на React, включающая аутентификацию, корзину, оформление заказов и панель администратора.", style_body))

doc_rl.build(story)
print("Lab 4 PDF built successfully:", lab4_pdf_path)

# Step 3: Combine with pypdf into single complete PDF!
original_pdf = r"C:\Users\Александр\.gemini\antigravity\brain\a6e34e32-240d-43fd-b3af-e5f25e5fa29d\.user_uploaded\media_1795349526609_1c6334b6.pdf"
reader_orig = pypdf.PdfReader(original_pdf)
reader_toc = pypdf.PdfReader(toc_pdf_path)
reader_lab4 = pypdf.PdfReader(lab4_pdf_path)

writer = pypdf.PdfWriter()

# Page 1: Title page from original
writer.add_page(reader_orig.pages[0])

# Page 2: Corrected TOC
writer.add_page(reader_toc.pages[0])

# Pages 3 to 32: Labs 1, 2, 3 from original
for p_idx in range(2, len(reader_orig.pages)):
    writer.add_page(reader_orig.pages[p_idx])

# Pages 33+: Lab 4 pages
for page in reader_lab4.pages:
    writer.add_page(page)

# Output paths
pdf_destinations = [
    r"C:\Users\Александр\OneDrive\Desktop\П-4-24 УП 01-01 Губогло Александр Михайлович.pdf",
    r"C:\Users\Александр\OneDrive\Desktop\П-4-24_УП_01-01_Губогло_Александр_Михайлович.pdf",
    r"C:\Users\Александр\OneDrive\Desktop\юшина\П-4-24 УП 01-01 Губогло Александр Михайлович.pdf",
    r"C:\Users\Александр\scratch\beauty-service-store\П-4-24 УП 01-01 Губогло Александр Михайлович.pdf"
]

for dest in pdf_destinations:
    os.makedirs(os.path.dirname(dest), exist_ok=True)
    with open(dest, "wb") as f_out:
        writer.write(f_out)
    print(f"Saved complete PDF to: {dest} (Pages: {len(writer.pages)}, Size: {os.path.getsize(dest)} bytes)")

# Step 4: Also update the DOCX version
print("Updating complete DOCX file...")
docx_source = r"C:\Users\Александр\OneDrive\Desktop\юшина\П-4-24 УП 01-01 Губогло Александр Михайлович.docx"
if os.path.exists(docx_source):
    doc = docx.Document(docx_source)
    
    # 4.1 Update Table of Contents (P40-43)
    # Check if Lab 4 is already in TOC, if not, add it
    toc_idx = None
    for idx, p in enumerate(doc.paragraphs):
        if "СОДЕРЖАНИЕ" in p.text:
            toc_idx = idx
            break
    # Clear old TOC paragraphs (usually 3 paragraphs right after СОДЕРЖАНИЕ)
    toc_items = [
        ("Лабораторная работа №1 Мини-приложение с карточкой товара", "3"),
        ("Лабораторная работа №2 Создание SPA-приложения на React", "11"),
        ("Лабораторная работа №3 Создание веб-приложения для магазина", "25"),
        ("Лабораторная работа №4 Создание веб-сервиса «Лавка Услуг»", "33")
    ]
    # Re-assign clean text with tab stops
    for idx, (title, num) in enumerate(toc_items):
        target_idx = toc_idx + 1 + idx
        if target_idx < len(doc.paragraphs) and ("Лабораторная работа" in doc.paragraphs[target_idx].text or doc.paragraphs[target_idx].text.strip() == ""):
            p = doc.paragraphs[target_idx]
            p.text = f"{title}\t{num}"
            p.alignment = WD_ALIGN_PARAGRAPH.LEFT
            p.paragraph_format.tab_stops.clear_all()
            p.paragraph_format.tab_stops.add_tab_stop(Inches(6.49), WD_TAB_ALIGNMENT.RIGHT, WD_TAB_LEADER.DOTS)
            p.paragraph_format.first_line_indent = Inches(0)
            for r in p.runs:
                r.font.name = "Times New Roman"
                r.font.size = Pt(14)
                r.font.italic = False
                
    # 4.2 Append Lab 4 to the end of DOCX
    # Check if Lab 4 is already appended
    already_appended = any("Лабораторная работа №4" in p.text for p in doc.paragraphs[50:])
    if not already_appended:
        doc.add_page_break()
        
        # Heading
        p_h1 = doc.add_paragraph("Лабораторная работа №4")
        p_h1.alignment = WD_ALIGN_PARAGRAPH.CENTER
        for r in p_h1.runs:
            r.font.name = "Times New Roman"
            r.font.size = Pt(14)
            r.font.bold = True
            
        p_sub = doc.add_paragraph("Разработка клиент-серверной информационной системы онлайн-заказа услуг «Лавка Услуг»")
        p_sub.alignment = WD_ALIGN_PARAGRAPH.CENTER
        for r in p_sub.runs:
            r.font.name = "Times New Roman"
            r.font.size = Pt(14)
            r.font.bold = True
            
        # Goal (КРАТКО)
        p_goal = doc.add_paragraph("Цель работы: Разработать клиент-серверную систему онлайн-заказа услуг с базой данных PostgreSQL, REST API и клиентом на React, реализовав аутентификацию, корзину, оформление заказов и панель администратора.")
        p_goal.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
        p_goal.paragraph_format.first_line_indent = Inches(0.49)
        for r in p_goal.runs:
            r.font.name = "Times New Roman"
            r.font.size = Pt(14)
            
        # Progress
        p_prog = doc.add_paragraph("Ход работы: Разработка велась в два этапа: создание серверной части (REST API и реляционная база данных PostgreSQL) и клиентской части (React 18-приложение с панелью администратора).")
        p_prog.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
        p_prog.paragraph_format.first_line_indent = Inches(0.49)
        for r in p_prog.runs:
            r.font.name = "Times New Roman"
            r.font.size = Pt(14)
            
        # Section 1
        p_s1 = doc.add_paragraph("1. Серверная часть (REST API и база данных PostgreSQL):")
        p_s1.alignment = WD_ALIGN_PARAGRAPH.LEFT
        p_s1.paragraph_format.first_line_indent = Inches(0.49)
        for r in p_s1.runs:
            r.font.name = "Times New Roman"
            r.font.size = Pt(14)
            r.font.bold = True
            
        server_items = [
            "1.1. В файле backend/init_db.js спроектирована схема базы данных PostgreSQL. Создана нормализованная структура из 9 связанных таблиц: роли (roles), купоны и скидки (coupons), пользователи (users), категории (categories), услуги (services), корзина (cart), заказы (orders), отзывы (reviews) и коды сброса пароля (password_reset_codes). Настроены внешние ключи (FOREIGN KEY) и каскадные правила целостности.",
            "1.2. В файлах backend/server.js и backend/db.js реализован HTTP-сервер на Express и модуль подключения к PostgreSQL через пул соединений pg.Pool. Настроены промежуточные обработчики (middleware) для поддержки CORS-запросов и парсинга JSON. Сервер слушает выделенный порт 3001, гарантируя изоляцию бэкенда от клиентской части.",
            "1.3. В файле backend/routes/auth.js и backend/services/emailService.js реализована комплексная подсистема аутентификации и многоканального восстановления доступа к аккаунту: хеширование паролей алгоритмом bcrypt (10 раундов соли), генерация криптостойких JWT-токенов, отправка 6-значных кодов сброса на почту (поддержка реальных ящиков через Ethereal Mail) и мгновенных push-уведомлений на мобильные устройства в топик ntfy.sh.",
            "1.4. В файле backend/routes/services.js реализовано управление каталогом услуг. Запросы к БД строятся с использованием JOIN категорий. Итоговая стоимость рассчитывается с учетом скидки с точностью до копеек: ROUND(price * (1 - discount_percent / 100.0), 2). Реализована серверная валидация длительности сеанса: запрещено создание или изменение услуг с длительностью свыше 360 минут (6 часов).",
            "1.5. В файле backend/routes/categories.js реализован механизм безопасного удаления категорий. При удалении категории все прикрепленные к ней услуги автоматически переводятся в системную категорию «Без категории» (ON DELETE SET NULL / COALESCE), что исключает случайную потерю номенклатуры процедур.",
            "1.6. В файле backend/routes/cart.js и backend/routes/orders.js реализована бизнес-логика серверной корзины и оформления заказов. Корзина сохраняется в базе данных для каждого авторизованного пользователя. При добавлении и оформлении заказов проверяются ограничения: не более 3 одинаковых процедур на один сеанс мастера, суммарное время процедур не более 6 часов, а дата записи не может быть прошедшей.",
            "1.7. В файле backend/routes/admin.js реализован административный REST API. Предоставляются сводные данные о выручке, количестве заказов и клиентов. Добавлена возможность смены статусов заказов («Принят» → «В обработке» → «Выполнен» / «Отменен»). Заказы со статусами «Выполнен» и «Отменен» блокируются для дальнейших правок. Реализован запрет удаления заказов из истории."
        ]
        for it in server_items:
            p = doc.add_paragraph(it)
            p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
            p.paragraph_format.first_line_indent = Inches(0.49)
            for r in p.runs:
                r.font.name = "Times New Roman"
                r.font.size = Pt(14)
                
        # Section 2
        p_s2 = doc.add_paragraph("2. Клиентская часть (Фронтенд на React 18):")
        p_s2.alignment = WD_ALIGN_PARAGRAPH.LEFT
        p_s2.paragraph_format.first_line_indent = Inches(0.49)
        for r in p_s2.runs:
            r.font.name = "Times New Roman"
            r.font.size = Pt(14)
            r.font.bold = True
            
        client_items = [
            "2.1. В файле src/App.jsx настроена архитектура клиентского приложения на React 18 с интеграцией HTML5 History API (Browser Router) для бесшовной синхронизации адресной строки браузера (/catalog, /cart, /orders, /reviews, /admin) и переключения светлой и тёмной тем оформления.",
            "2.2. В компоненте src/components/Catalog.jsx реализован интерактивный каталог услуг с фильтрацией по категориям, поисковой строкой по названию и описанию, сортировкой по цене и длительности, расчетом акционной цены и визуальными бейджами скидок.",
            "2.3. В компоненте src/components/CartModal.jsx реализовано модальное окно оформления заказа. В реальном времени рассчитывается суммарное время процедур мастера (с валидацией лимита 6 часов), проверяется не более 3 процедур одного наименования и валидируется дата выезда мастера.",
            "2.4. В компоненте src/components/AuthModal.jsx реализованы формы авторизации и быстрой регистрации. Форма оптимизирована: регистрация требует только имя, email, пароль и номер телефона в формате +7 (XXX) XXX-XX-XX (устаревшие контрольные вопросы и адрес доставки удалены).",
            "2.5. В компоненте src/components/ForgotPasswordModal.jsx реализован 3-шаговый интерфейс восстановления доступа: ввод email, ввод 6-значного кода с кнопкой быстрого перехода во входящее письмо Ethereal Mail, и установка нового пароля. Окно автоматически сбрасывается на 1-й шаг при повторном открытии.",
            "2.6. В компоненте src/components/AdminPanel.jsx реализован рабочий кабинет администратора, включающий 5 специализированных вкладок: управление заказами клиентов (со статусами и запретом удаления), номенклатура услуг со скидками и лимитом времени 6 часов, управление категориями с разделом «Без категории», модерация отзывов с фильтрацией по оценкам (3 и 4 звезды) и управление ролями пользователей."
        ]
        for it in client_items:
            p = doc.add_paragraph(it)
            p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
            p.paragraph_format.first_line_indent = Inches(0.49)
            for r in p.runs:
                r.font.name = "Times New Roman"
                r.font.size = Pt(14)
                
        # Section 3
        p_s3 = doc.add_paragraph("3. Результаты работы:")
        p_s3.alignment = WD_ALIGN_PARAGRAPH.LEFT
        p_s3.paragraph_format.first_line_indent = Inches(0.49)
        for r in p_s3.runs:
            r.font.name = "Times New Roman"
            r.font.size = Pt(14)
            r.font.bold = True
            
        for item in images_info:
            img_path = os.path.join(uploaded_dir, item["filename"])
            if not os.path.exists(img_path):
                continue
            
            # Caption BEFORE image: 12pt, normal, NO ITALIC!
            p_cap = doc.add_paragraph(item["caption"])
            p_cap.alignment = WD_ALIGN_PARAGRAPH.CENTER
            p_cap.paragraph_format.first_line_indent = Inches(0)
            p_cap.paragraph_format.space_before = Pt(8)
            p_cap.paragraph_format.space_after = Pt(4)
            for r in p_cap.runs:
                r.font.name = "Times New Roman"
                r.font.size = Pt(12)
                r.font.italic = False
                
            # Image
            p_img = doc.add_paragraph()
            p_img.alignment = WD_ALIGN_PARAGRAPH.CENTER
            p_img.paragraph_format.first_line_indent = Inches(0)
            
            with PILImage.open(img_path) as pil_img:
                stream = io.BytesIO()
                pil_img.save(stream, format='PNG')
                stream.seek(0)
                p_img.add_run().add_picture(stream, width=Inches(6.1))
                
        # Conclusion (СТРОГО ПО ЦЕЛИ!)
        p_conc_h = doc.add_paragraph("Вывод:")
        p_conc_h.alignment = WD_ALIGN_PARAGRAPH.LEFT
        p_conc_h.paragraph_format.first_line_indent = Inches(0.49)
        p_conc_h.paragraph_format.space_before = Pt(10)
        for r in p_conc_h.runs:
            r.font.name = "Times New Roman"
            r.font.size = Pt(14)
            r.font.bold = True
            
        p_conc = doc.add_paragraph("В ходе выполнения лабораторной работы была разработана клиент-серверная система онлайн-заказа услуг с базой данных PostgreSQL, REST API и клиентом на React, включающая аутентификацию, корзину, оформление заказов и панель администратора.")
        p_conc.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
        p_conc.paragraph_format.first_line_indent = Inches(0.49)
        for r in p_conc.runs:
            r.font.name = "Times New Roman"
            r.font.size = Pt(14)
            
    # Save updated DOCX to both Desktop and юшина
    docx_destinations = [
        r"C:\Users\Александр\OneDrive\Desktop\П-4-24 УП 01-01 Губогло Александр Михайлович.docx",
        r"C:\Users\Александр\OneDrive\Desktop\юшина\П-4-24 УП 01-01 Губогло Александр Михайлович.docx"
    ]
    for d in docx_destinations:
        try:
            doc.save(d)
            print(f"Saved complete DOCX to: {d}")
        except PermissionError:
            print(f"Note: {d} is currently open in Microsoft Word, skipped overwrite.")

print("ALL COMPLETE!")
