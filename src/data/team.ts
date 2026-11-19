export type Member = {
  id: string;
  name: string;
  role: string;
  focus: string[];
  home: string;
  image: 'team-viktoriia' | 'team-vlada' | 'team-olha' | 'team-stepan';
  tone: 'orange' | 'wine' | 'ink';
  doctor: boolean;
};

export const team: Member[] = [
  {
    id: 'viktoriia-tokarska',
    name: 'Вікторія Токарська',
    role: 'Засновниця Petman, ветеринарна лікарка',
    focus: ['Терапія'],
    home: 'Вдома на Вікторію чекають собака Уна та четверо котів.',
    image: 'team-viktoriia',
    tone: 'orange',
    doctor: true,
  },
  {
    id: 'olha-nahorna',
    name: 'Ольга Нагорна',
    role: 'Ветеринарна лікарка',
    focus: ['Терапія', 'Анестезіологія'],
    home: 'Вдома на Ольгу чекає стафф Луна.',
    image: 'team-olha',
    tone: 'ink',
    doctor: true,
  },
  {
    id: 'stepan-bailiak',
    name: 'Степан Байляк',
    role: 'Ветеринарний лікар',
    focus: ['Хірургія'],
    home: 'Поза роботою Степан — турботливий кототато.',
    image: 'team-stepan',
    tone: 'orange',
    doctor: true,
  },
  {
    id: 'vlada-lukianytsia',
    name: 'Влада Лук’яниця',
    role: 'Заступниця керівника, адміністраторка',
    focus: ['Запис і супровід'],
    home: 'Вдома Владу зустрічає лабрадор Клаус.',
    image: 'team-vlada',
    tone: 'ink',
    doctor: false,
  },
];

export const reviews = [
  {
    author: 'Катерина С.',
    meta: 'мама Абі',
    text: 'Це не просто чудовий ветеринар, а людина із золотим серцем. Вікторія ставиться до кожного пацієнта так, ніби це її власний улюбленець.',
  },
  {
    author: 'Pavlo V.',
    meta: 'другий рік у клініці',
    text: 'Максимально ввічливий персонал, професійний підхід до деталей. Зацікавленість у правильному догляді за улюбленцем. Другий рік відвідую цю клініку, дуже рекомендую.',
  },
  {
    author: 'Karina F.',
    meta: 'кіт і пес',
    text: 'Приводимо неодноразово наших і котика, і песика на огляд у клініку Petman, завжди залишаємось задоволені. Лікар уважний, привітний, все чітко пояснює та призначає лікування.',
  },
];
