# Teardown

Статический сайт без сборки: колесо мыши приближает камеру и разбирает устройство, при наведении на деталь справа появляется описание. Страница не прокручивается.

## Структура

```
public/
  index.html      разметка страницы
  css/style.css   оформление
  js/data.js      данные о гаджете и деталях (вместо БД)
  js/main.js      3D-сцена (Three.js), управление и анимация
wrangler.jsonc    настройки Cloudflare
```

## Локальный запуск

Откройте папку `public` любым статическим сервером, например `npx serve public`, и зайдите на показанный адрес.

## Деплой на Cloudflare

1. Положите все файлы в корень репозитория GitHub. Старые файлы Next.js (package.json, app/, prisma/ и т.д.) удалите.
2. В проекте Cloudflare откройте Settings → Build: поле Build command оставьте пустым, Deploy command: `npx wrangler deploy`.
3. Имя в `wrangler.jsonc` (`name`) должно совпадать с именем проекта в Cloudflare.

Three.js подключается с cdnjs.cloudflare.com, поэтому сайту нужен доступ в интернет.
