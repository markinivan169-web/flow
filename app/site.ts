export const studio = {
  name: "Пять букетов",
  logo: null as { src: string; width: number; height: number } | null,
  address: "",
  phone: "",
  email: "",
  social: [] as { label: string; href: string }[],
  delivery: "",
  payment: "",
};

export const navigation = [
  { href: "#collection", label: "Коллекция" },
  { href: "#studio", label: "О мастерской" },
  { href: "#gallery", label: "Галерея" },
  { href: "#delivery", label: "Доставка" },
  { href: "#contacts", label: "Контакты" },
];

export const bouquets = [
  {
    id: "warm-light",
    name: "Тёплый свет",
    category: "Авторский букет",
    description: "Оранжевые и медовые оттенки на фоне густой зелени. Свободный силуэт подчёркивают тонкие синие акценты.",
    image: "/media/catalog/01.webp",
    alt: "Широкий букет с оранжевыми и жёлтыми цветами и зелёными шарами",
    glow: "235 122 59",
  },
  {
    id: "garden-in-bloom",
    name: "Сад в цвету",
    category: "Авторский букет",
    description: "Яркая фуксия в центре и мягкие персиковые оттенки по краям. Вытянутый силуэт придаёт букету лёгкость.",
    image: "/media/catalog/02.webp",
    alt: "Букет с цветком цвета фуксии в центре, персиковыми цветами и высокими белыми бутонами",
    glow: "221 64 135",
  },
  {
    id: "pink-expanse",
    name: "Розовый размах",
    category: "Композиция в корзине",
    description: "Объёмная композиция с коралловыми и малиновыми акцентами. Над цветами поднимаются длинные тонкие линии.",
    image: "/media/catalog/03.webp",
    alt: "Флорист держит плетёную корзину с крупной розовой композицией",
    glow: "231 99 145",
  },
  {
    id: "rose-cloud",
    name: "Розовое облако",
    category: "Букет роз",
    description: "Округлый букет с переходами от светло-розового к малиновому. Нежные оттенки соседствуют с яркими, почти коралловыми.",
    image: "/media/catalog/04.webp",
    alt: "Флорист держит большой округлый букет розовых и персиковых роз",
    glow: "231 83 129",
  },
  {
    id: "berry-season",
    name: "Ягодный сезон",
    category: "Авторский букет",
    description: "Тёплые персиковые и жёлтые тона в окружении тёмной зелени. Ягодные ветви добавляют цвет и ритм.",
    image: "/media/catalog/05.webp",
    alt: "Букет с персиковыми цветами, оранжевыми ягодными ветвями и зеленью",
    glow: "220 115 57",
  },
  {
    id: "coral-story",
    name: "Коралловый сюжет",
    category: "Авторский букет",
    description: "Коралловые и бордовые оттенки, длинные стебли и свободная асимметрия. Яркая лента повторяет цвет лепестков.",
    image: "/media/catalog/06.webp",
    alt: "Флорист с асимметричным коралловым букетом и яркой лентой",
    glow: "218 73 86",
  },
  {
    id: "first-light",
    name: "Первый луч",
    category: "Авторский букет",
    description: "Светлые, розовые и коралловые цветы образуют широкий силуэт. Прохладная зелень подчёркивает тёплые тона.",
    image: "/media/catalog/07.webp",
    alt: "Букет с коралловыми розами, розовыми лилиями и светлыми цветами",
    glow: "242 123 115",
  },
  {
    id: "winter-garden",
    name: "Зимний сад",
    category: "Композиция в коробке",
    description: "Глубокий бордовый оттенок встречается с золотисто-жёлтым. Яркие ягоды и ветви задают свободный силуэт.",
    image: "/media/catalog/08.webp",
    alt: "Композиция с бордовыми и жёлтыми цветами, ягодами и золотистой лентой в бархатной коробке",
    glow: "218 143 56",
  },
];

export const studioPhoto = bouquets[2];
export const bespokePhoto = bouquets[6];
export const gallery = [3, 0, 7, 4, 5, 1, 6, 2].map((index) => bouquets[index]);
