# WebView Navigation Test

Простое многостраничное приложение на vanilla JS для тестирования навигации и истории во `WebView` на iOS и Android.

## Структура

- `index.html` — страница 1 (точка входа)
- `page2.html` — страница 2
- `page3.html` — страница 3
- `page4.html` — страница 4
- `app.js` — общий скрипт для всех страниц
- `styles.css` — общие стили

Все три страницы имеют одинаковую структуру из четырёх блоков:

1. **Информационный блок**
   - Текущий `URL`, `pathname`, `referrer`
   - `history.length` и `history.state`
   - **Лог навигационных событий**, восстанавливаемый из `sessionStorage`:
     - `popstate`, `pageshow`, `pagehide`, `beforeunload`, `unload`, `visibilitychange`
     - действия пользователя: нажатия кнопок `history.*`, переходы `location.assign/replace`, клики по ссылкам, soft-навигация.

2. **Кнопки перемещения по истории**
   - `history.back()`
   - `history.forward()`
   - `location.reload()`
   - `history.go(-2)`
   - `history.go(2)`

3. **Hard-навигация**
   - Обычные ссылки `<a>` между страницами (`index.html`, `page2.html`, `page3.html`)
   - Кнопки с `location.assign()` на каждую из страниц
   - Кнопки с `location.replace()` на каждую из страниц

4. **Soft-навигация (History API)**
   - Кнопки `history.pushState()` со сменой query-параметра `?v=1` … `?v=4`
   - Кнопки `history.replaceState()` с такой же сменой URL
   - Текущее `history.state` отображается в первом блоке

## Логирование и sessionStorage

- Лог хранится в `sessionStorage` под ключом `webview-nav-log`.
- Каждая запись содержит:
  - время (`Date.now()`), форматированное для вывода
  - идентификатор страницы (`data-page-id` на `<body>`)
  - тип события (`init`, `action`, `popstate`, `pageshow`, `pagehide`, `beforeunload`, `unload`, `visibilitychange` и др.)
  - объект `details` (например, `event.state`, `event.persisted`, `url`, `target` и т.п.)
- При загрузке страницы лог считывается и отображается; затем дополняется по мере наступления событий.

## Деплой на GitHub Pages

1. Инициализируйте репозиторий (если ещё не инициализирован) и добавьте удалённый origin:

   ```bash
   git init
   git remote add origin git@github.com:vahrammer/web-native-test.git
   git add .
   git commit -m "Initial webview navigation test"
   git branch -M main
   git push -u origin main
   ```

2. Включите GitHub Pages:
   - Откройте настройки репозитория: `Settings → Pages`
   - В разделе **Source** выберите:
     - **Branch**: `main`
     - **Folder**: `/ (root)`

3. После сохранения GitHub выдаст URL вида:

   ```text
   https://vahrammer.github.io/web-native-test/
   ```

   На этом URL будут доступны:

   - `index.html` → `/web-native-test/`
   - `page2.html` → `/web-native-test/page2.html`
   - `page3.html` → `/web-native-test/page3.html`

## Использование во WebView

Откройте нужный URL в WebView вашего нативного приложения на iOS/Android и:

- Наблюдайте, какие события и URL фиксирует нативный слой при:
  - нажатии кнопок history (`back`, `forward`, `go`, `reload`);
  - переходах `location.assign/replace`;
  - обычных кликах по ссылкам `<a>`;
  - soft-навигации через `pushState/replaceState`.
- Сверяйте это с логом на странице, чтобы понять, каким событиям в браузере соответствует наблюдаемое поведение WebView.

