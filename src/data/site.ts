// Единый NAP: одно название, адрес и телефон везде (сайт, JSON-LD, Яндекс.Бизнес, 2ГИС)
export const site = {
  name: 'Берёзовая роща',
  legalName: 'ЭкоБаза «Берёзовая роща»',
  url: 'https://ecobr.ru',
  phone: '+7 (495) 120-20-08',
  phoneHref: 'tel:+74951202008',
  hours: 'Бронирование ежедневно с 9:00 до 24:00',
  address: 'Московская область, Солнечногорский район, деревня Васюково, КДЗ Новое Мишкино 1/5',
  geo: { lat: 56.110515, lon: 36.984035 },
  telegram: 'https://t.me/ecobazabr',
  yandexMaps: 'https://yandex.ru/maps/org/beryozovaya_roshcha/91160063546/',
  // В демо ведём на текущий модуль Bnovo; на проде — фасад виджета на странице
  booking: 'https://ecobr.ru/booking',
  email: 'BR.BP.House@yandex.ru',
} as const;

export const nav = [
  { href: '/doma', label: 'Дома' },
  { href: '/#banya', label: 'Баня и чан' },
  { href: '/#spa', label: 'SPA' },
  { href: '/#restoran', label: 'Ресторан' },
  { href: '/#vip', label: 'VIP-программы' },
  { href: '/#kontakty', label: 'Контакты' },
] as const;

export const rub = (n: number): string => `${n.toLocaleString('ru-RU')} ₽`;

// Внутренние ссылки с учётом base (демо живёт в подпапке GitHub Pages, прод — в корне)
export const link = (p: string): string => `${import.meta.env.BASE_URL.replace(/\/$/, '')}${p}`;
