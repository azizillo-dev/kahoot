import type { L10n } from "./types";

type SeedQ = { text: L10n; uz: string[]; ru: string[]; correct: number; time?: number };
type SeedSection = { id: string; title: L10n; description: L10n; icon: string; color: number; questions: SeedQ[] };

/** test.docx dan olingan savollar — har bir kitob alohida bo'lim. */
export const SEED: SeedSection[] = [
  {
    id: "kecha-va-kunduz",
    title: { uz: "Kecha va kunduz", ru: "Ночь и день" },
    description: { uz: "Cho'lpon romani bo'yicha savollar", ru: "Вопросы по роману Чулпана" },
    icon: "dark_mode",
    color: 0,
    questions: [
      {
        text: { uz: "“Kecha va kunduz” romani bizga nimani o'rgatadi?", ru: "Чему учит нас роман «Ночь и день»?" },
        uz: ["Demokratiya va psixologiya", "Erkinlikning qadriga yetishga", "San'at va go'zallik qadriga yetishga", "Bu kitob asosan urush haqida"],
        ru: ["Демократии и психологии", "Понимать ценность свободы", "Ценить искусство и красоту", "Эта книга прежде всего о войне"],
        correct: 1,
      },
      {
        text: { uz: "Bosh qahramon Zebi taxminan necha yoshda?", ru: "Примерно сколько лет главной героине Зеби?" },
        uz: ["14–15", "17–18", "15–16", "16–17"],
        ru: ["14–15", "17–18", "15–16", "16–17"],
        correct: 2,
      },
      {
        text: { uz: "Zebining onasining ismi nima?", ru: "Как зовут мать Зеби?" },
        uz: ["Saltanat", "Poshshaxon", "Qurvonbibi", "Qumriniso"],
        ru: ["Салтанат", "Пошшахон", "Курвонбиби", "Кумринисо"],
        correct: 2,
      },
      {
        text: {
          uz: "Asarda kim “badjahl, qattiqqo'l, tayinli kasbi yo'q” deya tasvirlanadi?",
          ru: "Кто в произведении описан как «злой нравом, жёсткий и не имеющий постоянного ремесла»?",
        },
        uz: ["Razzoq so'fi", "Miryoqub", "O'lmasxon", "Akbarali"],
        ru: ["Раззок-суфи", "Мирякуб", "Ульмасхон", "Акбарали"],
        correct: 0,
      },
      {
        text: { uz: "Asar boshida Zebi kimni yoqtirib qoladi?", ru: "В кого влюбляется Зеби в начале произведения?" },
        uz: ["Jasur", "Otabek", "Jamshidbek", "O'lmasxon"],
        ru: ["Жасур", "Отабек", "Джамшидбек", "Ульмасхон"],
        correct: 3,
      },
      {
        text: {
          uz: "Zebi nima uchun qishloqdoshlari orasida mashhur edi?",
          ru: "Почему Зеби была известна среди односельчан?",
        },
        uz: [
          "U juda chiroyli kiyimlar tikardi",
          "U muallima edi",
          "Ovozi juda chiroyli edi, qo'shiqlarni ajoyib kuylardi",
          "Otasi mahallada katta mansabda edi",
        ],
        ru: [
          "Она шила очень красивую одежду",
          "Она была учительницей",
          "У неё был красивый голос, и она чудесно пела",
          "Её отец занимал высокую должность в махалле",
        ],
        correct: 2,
      },
      {
        text: {
          uz: "Zebi kimga kundosh bo'lib turmushga chiqadi?",
          ru: "За кого Зеби выходит замуж, становясь ещё одной женой?",
        },
        uz: ["Akbarali mingboshi", "Miryoqub", "Otabek", "Eshon"],
        ru: ["Акбарали-мингбаши", "Мирякуб", "Отабек", "Ишан"],
        correct: 0,
      },
      {
        text: { uz: "Nima sababdan Poshshaxon Zebini zaharlamoqchi bo'ladi?", ru: "Почему Пошшахон хочет отравить Зеби?" },
        uz: ["Rashk va manfaat tufayli", "Unga shunday buyurishadi", "Zebining boyligini qo'lga kiritish uchun", "U shunchaki aqldan ozgan edi"],
        ru: ["Из ревности и корысти", "Ей приказали это сделать", "Чтобы завладеть богатством Зеби", "Она просто лишилась рассудка"],
        correct: 0,
      },
      {
        text: { uz: "Akbarali asarda qanday tasvirlanadi?", ru: "Каким изображён Акбарали в произведении?" },
        uz: [
          "Oqil, kamtar, juda ishbilarmon",
          "Namoz o'qimaydigan, ichkilikboz, axloqan buzuq",
          "Kambag'al, jahldor, johil",
          "Adolatli, har doim yordam qo'lini cho'zuvchi mansabdor",
        ],
        ru: [
          "Мудрый, скромный и очень деловой",
          "Не молится, пьёт, морально разложившийся",
          "Бедный, вспыльчивый, невежественный",
          "Справедливый чиновник, всегда готовый помочь",
        ],
        correct: 1,
      },
      {
        text: {
          uz: "O'ta ayyor, manfaatparast, uddaburon va pulparast sifatida tasvirlangan personaj kim?",
          ru: "Какой персонаж изображён крайне хитрым, корыстным, ловким и алчным?",
        },
        uz: ["Akbarali", "Eshon", "Razzoq so'fi", "Miryoqub"],
        ru: ["Акбарали", "Ишан", "Раззок-суфи", "Мирякуб"],
        correct: 3,
      },
      {
        text: {
          uz: "Akbaralining o'limida ayblangan Zebiga qanday jazo beriladi?",
          ru: "Какое наказание получает Зеби, обвинённая в смерти Акбарали?",
        },
        uz: ["Qamoqqa olinadi", "Qatl etiladi", "Qo'llari kesiladi", "Surgun qilinadi"],
        ru: ["Её заключают в тюрьму", "Её казнят", "Ей отрубают руки", "Её отправляют в ссылку"],
        correct: 3,
      },
    ],
  },
  {
    id: "ikki-eshik-orasi",
    title: { uz: "Ikki eshik orasi", ru: "Между двух дверей" },
    description: { uz: "O'tkir Hoshimov romani bo'yicha savollar", ru: "Вопросы по роману Уткира Хашимова" },
    icon: "door_open",
    color: 2,
    questions: [
      {
        text: { uz: "“Ikki eshik orasi” romanining bosh g'oyasi nima?", ru: "Какова главная идея романа «Между двух дверей»?" },
        uz: [
          "Yangi bilimlarni o'rganish va kelajak yoshlari",
          "Bu asosan psixologik asar",
          "Og'ir damlarda ham mehr, vijdon va qadrni asrash",
          "Urushda bo'lib o'tgan barcha hodisalar",
        ],
        ru: [
          "Получение новых знаний и молодёжь будущего",
          "Это прежде всего психологическое произведение",
          "Сохранить доброту, совесть и достоинство даже в тяжёлые времена",
          "Все события, произошедшие на войне",
        ],
        correct: 2,
      },
      {
        text: { uz: "Asar asosan qanday usulda yozilgan?", ru: "В какой манере в основном написано произведение?" },
        uz: ["Har bir personajning bir voqeaga bo'lgan nigohi orqali", "She'r ko'rinishida", "Hajviy ko'rinishida", "Aniq ma'lumot yo'q"],
        ru: ["Через взгляд каждого персонажа на одни и те же события", "В стихотворной форме", "В юмористической форме", "Точных сведений нет"],
        correct: 0,
      },
      {
        text: {
          uz: "Muzaffar daraxtdan nimani olaman deb yiqilib, qo'lini sindirib oladi?",
          ru: "Что Музаффар хотел достать с дерева, когда упал и сломал руку?",
        },
        uz: ["Daraxt uchidagi olmani", "Shoxlarga ilinib qolgan varragini", "Yong'oq teraman deb", "Chumchuq bolasini"],
        ru: ["Яблоко на верхушке дерева", "Воздушного змея, застрявшего в ветвях", "Хотел собрать орехи", "Воробьиного птенца"],
        correct: 3,
      },
      {
        text: { uz: "Robiya nima uchun otasiz qoladi?", ru: "Почему Робия осталась без отца?" },
        uz: ["Otasi urushga ketgani uchun", "Otasi ochlikdan vafot etadi", "Uni militsiya olib ketadi va u qaytmaydi", "Otasini poyezd bosib ketadi"],
        ru: ["Потому что отец ушёл на войну", "Отец умер от голода", "Его забрала милиция, и он не вернулся", "Отца сбил поезд"],
        correct: 2,
      },
      {
        text: {
          uz: "Robiya kimning urushdan albatta qaytishiga qattiq ishonar edi?",
          ru: "В чьё возвращение с войны твёрдо верила Робия?",
        },
        uz: ["Kimsan akaning", "Otasining", "Husan Do'maning", "Ochilning"],
        ru: ["Кимсана", "Своего отца", "Хусана Думы", "Очила"],
        correct: 0,
      },
      {
        text: { uz: "Ra'no kim bilan qochib ketadi?", ru: "С кем сбегает Раъно?" },
        uz: ["Zakunchi bilan", "Husan Do'ma bilan", "Shomurod bilan", "Rustam bilan"],
        ru: ["С Закунчи", "С Хусаном Думой", "С Шомуродом", "С Рустамом"],
        correct: 0,
      },
      {
        text: { uz: "Nima uchun Muzaffar Munavvarga uylana olmas edi?", ru: "Почему Музаффар не мог жениться на Мунаввар?" },
        uz: ["Munavvarning onasi Muzaffarni yoqtirmasdi", "Munavvar juda kasal edi", "Ular ko'kaldosh edilar", "Muzaffar urushga ketishi kerak edi"],
        ru: ["Мать Мунаввар не любила Музаффара", "Мунаввар была тяжело больна", "Они были молочными братом и сестрой", "Музаффар должен был уйти на войну"],
        correct: 2,
      },
      {
        text: {
          uz: "Muzaffarning ukasi bormi? Bo'lsa, ismi nima?",
          ru: "Был ли у Музаффара младший брат? Если да, как его звали?",
        },
        uz: ["Yo'q", "Ha, lekin u go'dakligida vafot etgan", "Ha, ismi Olim edi", "Ha, ismi Omon edi"],
        ru: ["Нет", "Да, но он умер в младенчестве", "Да, его звали Олим", "Да, его звали Омон"],
        correct: 3,
      },
      {
        text: {
          uz: "Kimsan urushda halok bo'lgan bo'lsa-da, unga atab nima qo'yiladi?",
          ru: "Кимсан погиб на войне. Что было поставлено в его память?",
        },
        uz: ["Haykal", "Bog' barpo etiladi", "Hech narsa — uni hech kim eslamagan", "Kitob yoziladi"],
        ru: ["Памятник", "Разбит сад", "Ничего — его никто не вспомнил", "Написана книга"],
        correct: 0,
      },
      {
        text: { uz: "Munavvar nimadan vafot etadi?", ru: "Отчего умирает Мунаввар?" },
        uz: ["Uni devor bosib qoladi", "O'z joniga qasd qiladi", "Ko'p uyqu dori ichib", "Cho'kib o'ladi"],
        ru: ["Её придавило стеной", "Она покончила с собой", "Выпив много снотворного", "Она утонула"],
        correct: 0,
      },
    ],
  },
];
