export type PartData = {
  slug: string;
  name: string;
  function: string;
  description: string | null;
  accentColor: string;
  explodeX: number;
  explodeY: number;
  explodeZ: number;
  animStart: number;
  animEnd: number;
  hoverScale: number;
  specs: { label: string; value: string }[];
};

export type GadgetData = {
  slug: string;
  name: string;
  category: string;
  summary: string | null;
  parts: PartData[];
};

export const demoPhone = {
  slug: "demo-phone",
  name: "Demo Phone",
  category: "smartphone",
  summary: "Из чего собран современный смартфон.",
  published: true,
  parts: [
    {
      slug: "back", name: "Задняя крышка", accentColor: "#6f8fd8",
      function: "Закрывает корпус от пыли и воды и пропускает сигнал антенн.",
      description: "Стеклянная панель, под которой лежит катушка беспроводной зарядки.",
      explodeX: 0, explodeY: 0, explodeZ: -2.2, animStart: 0, animEnd: 0.55, hoverScale: 1.03,
      specs: [{ label: "Материал", value: "Закалённое стекло" }, { label: "Защита", value: "IP68" }],
    },
    {
      slug: "frame", name: "Рамка корпуса", accentColor: "#e0912f",
      function: "Несущий каркас: держит модули и отводит тепло.",
      description: "Вставки между сегментами рамки работают как антенны сотовой связи и Wi‑Fi.",
      explodeX: 0, explodeY: 0, explodeZ: -1.4, animStart: 0.08, animEnd: 0.6, hoverScale: 1.03,
      specs: [{ label: "Материал", value: "Алюминий" }, { label: "Вес", value: "24 г" }],
    },
    {
      slug: "battery", name: "Аккумулятор", accentColor: "#1fa874",
      function: "Накапливает энергию и питает все компоненты.",
      description: "Литий-ионная ячейка с контроллером, который защищает от перегрева и перезаряда.",
      explodeX: 0, explodeY: -0.35, explodeZ: -0.8, animStart: 0.18, animEnd: 0.7, hoverScale: 1.07,
      specs: [{ label: "Ёмкость", value: "4500 мА·ч" }, { label: "Напряжение", value: "3,87 В" }, { label: "Тип", value: "Li‑Ion" }],
    },
    {
      slug: "board", name: "Материнская плата", accentColor: "#8a5cf0",
      function: "Соединяет процессор, память и модемы в единую систему.",
      description: "Многослойная плата: на ней однокристальная система, память и радиомодули.",
      explodeX: 0, explodeY: 0.35, explodeZ: -0.1, animStart: 0.28, animEnd: 0.8, hoverScale: 1.08,
      specs: [{ label: "Процессор", value: "8 ядер, 4 нм" }, { label: "Память", value: "8 ГБ" }, { label: "Накопитель", value: "256 ГБ" }],
    },
    {
      slug: "camera", name: "Модуль камеры", accentColor: "#e0455f",
      function: "Превращает свет в изображение: основная и широкоугольная камеры.",
      description: "Оптическая стабилизация сдвигает матрицу при дрожании рук.",
      explodeX: 0.55, explodeY: 0.6, explodeZ: 0.8, animStart: 0.38, animEnd: 0.9, hoverScale: 1.12,
      specs: [{ label: "Основная", value: "50 Мп, f/1.8" }, { label: "Широкоугольная", value: "12 Мп, 120°" }],
    },
    {
      slug: "display", name: "Дисплей", accentColor: "#2b8fd6",
      function: "Показывает изображение и принимает касания.",
      description: "OLED-панель с сенсорным слоем и защитным стеклом.",
      explodeX: 0, explodeY: 0, explodeZ: 1.9, animStart: 0.48, animEnd: 1, hoverScale: 1.04,
      specs: [{ label: "Диагональ", value: "6,7″" }, { label: "Разрешение", value: "2780×1284" }, { label: "Частота", value: "120 Гц" }],
    },
  ],
} satisfies GadgetData & { published: boolean };
