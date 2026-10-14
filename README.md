# Teardown

Интерактивный гайд по устройствам: колесо мыши приближает камеру и «разбирает» устройство на детали, при наведении на деталь справа показывается описание из базы данных. Страница не прокручивается, колесо управляет только приближением и разлётом.

Стек: Next.js (App Router) · TypeScript · Tailwind CSS 4 · React Three Fiber · Prisma + PostgreSQL.

## Запуск

```bash
npm install
npm run dev
```

Открой http://localhost:3000. Без базы данных сайт работает на демо-данных из `data/demo-phone.ts`.

## Подключение PostgreSQL

```bash
cp .env.example .env
docker compose up -d
npm run db:push
npm run db:seed
```

После этого `getGadget()` в `lib/gadgets.ts` читает данные из БД.

## Управление

- Колесо мыши, стрелки, PageUp/PageDown, пробел: прогресс разбора.
- Кнопки «Собрать» и «Разобрать» внизу.
- Телефон: свайп вверх и вниз, тап по детали.

## Как добавить устройство

1. Добавь запись `Gadget` с `Part` и `PartSpec` (см. `data/demo-phone.ts`).
2. В `components/Viewer.tsx` в `SHAPES` добавь геометрию детали с ключом, равным `Part.slug`.
3. Потом `SHAPES` можно заменить на загрузку GLB (`useGLTF`), находя узлы по имени.
