/* דקדוק — הוראות למורה בעברית. הדוגמאות והתרגילים באנגלית נשארים באנגלית. */

import { Dict } from '../../../i18n/dict'

const grammar: Dict = {
  g_present_be: {
    title: 'הפועל “to be” (am / is / are)',
    tutorExplanation:
      'צורות ההווה של “be”: I am, you/we/they are, he/she/it is. הפועל מקשר בין הנושא לבין תיאור או זהות, וזה הפועל הנפוץ ביותר באנגלית.',
    studentExplanation: 'משתמשים ב־am / is / are כדי להגיד מה משהו הוא או איך מרגישים.',
    meaningFirst:
      'תצביע על עצמך: “I am Binyamin.” תצביע עליו: “You are ___.” תצביע על חפץ: “It is a cup.” המשמעות מגיעה מההצבעה, לא מהסבר.',
    correctionMethod: 'תצביע על הנושא, ואז תבחרו יחד את הצורה המתאימה. שיגיד את המשפט שוב נכון.',
    fallback: 'תרד ל“I am ___” בלבד. צורה אחת, על עצמו, עשר פעמים — זו התקדמות אמיתית.',
    extension: 'תוסיף שלילה (“I’m not…”) ושאלה (“Are you…?”), ואז תן לו לראיין אותך.',
    jargon: ['מי או מה מבצע את הפעולה — המילה שלפני הפועל.'],
  },
  g_pronouns_possessives: {
    title: 'מילות גוף ושייכות (I / my, you / your, he / his…)',
    tutorExplanation:
      'כינויי גוף (I, you, he, she, it, we, they) וצורות השייכות שלהם (my, your, his, her, its, our, their). לומדים ששפת האם שלהם מסמנת מין אחרת מתבלבלים כל הזמן בין his ל־her.',
    studentExplanation: 'משתמשים ב“I / you / he / she” בשביל האדם, וב“my / your / his / her” בשביל מה ששייך לו.',
    meaningFirst:
      'תרים את העט שלך: “my pen”. תעביר לו אותו: “your pen”. תצביע על אדם שלישי או על תמונה: “his pen” / “her pen”. לא מסבירים כלום; החפצים עושים את העבודה.',
    correctionMethod:
      'תשאל “למי זה שייך — לגבר או לאישה?”, ואז תספק את המילה הנכונה ושיגיד את כל המשפט מחדש.',
    fallback: 'רק “my” ו“your”, עם חפצים אמיתיים שעוברים ביניכם.',
    extension: 'תוסיף “mine / yours / hers” (“That book is mine”) וכינויי מושא (“I saw him”).',
  },
  g_plurals: {
    title: 'אחד ויותר מאחד (רבים)',
    tutorExplanation:
      'ברוב המילים מוסיפים ‎-s (נשמע /s/, /z/ או /ɪz/ לפי הצליל שלפניו). יש רשימה קצרה של יוצאי דופן: man→men, woman→women, child→children, foot→feet, person→people. בשפות שאין בהן ‎-s של רבים פשוט שוכחים אותו.',
    studentExplanation: 'ליותר מדבר אחד מוסיפים “s” בסוף המילה.',
    meaningFirst:
      'תשים עט אחד על השולחן: “a pen”. תוסיף עוד שניים: “three pens”. תעשה את זה עם שלושה חפצים שונים לפני שאתה אומר מילה על האות s.',
    correctionMethod: 'תרים את מספר האצבעות, ואז תגיד את המילה עם ה־s בבירור. שיחזור על כל הצירוף, לא רק על המילה.',
    fallback: 'תספרו יחד חפצים אמיתיים, מאחד עד שלוש, ותן לו פשוט לחקות את הצירוף שלך.',
    extension: 'תעמיד זו מול זו את שלוש צורות ההגייה של הרבים (cats /s/, dogs /z/, boxes /ɪz/) — גם רווח בהגייה.',
  },
  g_have_got: {
    title: 'להגיד מה יש לך',
    tutorExplanation:
      '“I have a car” (אמריקאי, ניטרלי) ו“I have got a car” (בריטי יותר, מדובר). תלמד “have/has” — בגוף שלישי זה “has”. שאלות ושלילה באנגלית אמריקאית עם do/does: “Do you have…?”, “I don’t have…”.',
    studentExplanation: 'משתמשים ב“have” כדי להגיד מה יש לך. אצל he, she ו־it אומרים “has”.',
    meaningFirst:
      'תרים את הטלפון שלך: “I have a phone.” תצביע על שלו: “You have a phone.” תראה כף יד ריקה: “I don’t have a pen.”',
    correctionMethod: 'He/she/it → “has”. בשלילה או בשאלה נכנס do/does, והפועל חוזר ל“have”.',
    fallback: 'רק “I have ___” עם חפצים ששניכם רואים ויכולים לגעת בהם.',
    extension: 'תעבור ל“How many … do you have?” ולתשובות קצרות (“Yes, I do.”).',
  },
  g_there_is_are: {
    title: 'There is / There are',
    tutorExplanation:
      'משמש כדי להגיד שמשהו קיים או נמצא: “There is a problem”, “There are two chairs”. יחיד → is, רבים → are. בהרבה שפות אומרים את זה עם פועל כמו “יש”, ומשם מגיע “Here have a chair”.',
    studentExplanation: 'משתמשים ב“There is” לדבר אחד וב“There are” ליותר מאחד.',
    meaningFirst:
      'תעשה תנועה סביב החדר ותשם מה יש בו: “There is a window. There are two chairs.” תן לתנועה לשאת את המשמעות.',
    correctionMethod: 'תשאל “אחד, או יותר מאחד?” ותן לו לבחור בעצמו is או are לפני שהוא חוזר על המשפט.',
    fallback: 'רק “There is a ___” תוך הצבעה על חפצים בודדים.',
    extension: 'תוסיף עבר (“There was / There were”) ושלילה (“There isn’t any…”).',
  },
  g_present_simple: {
    title: 'הווה פשוט (Present simple)',
    tutorExplanation:
      'להרגלים, לשגרה ולעובדות. בגוף שלישי יחיד (he/she/it) מוסיפים ‎-s. בשאלות ובשלילה נכנס do/does, והפועל העיקרי חוזר לצורת הבסיס.',
    studentExplanation: 'משתמשים בהווה הפשוט לדברים שעושים לעיתים קרובות או שנכונים תמיד.',
    meaningFirst:
      'תמחיז את הבוקר שלך לפי הסדר — קימה, קפה, עבודה — ותספר תוך כדי: “I wake up. I drink coffee. I go to work.” ואז תשאל על שלו.',
    correctionMethod: 'תדגיש: אחרי he/she/it הפועל צריך ‎-s. בשאלה ה־s עובר ל“does”.',
    fallback: 'תישאר רק ב“I” וב“you” — שם אין ‎-s בכלל — ותבנה שם קודם שטף.',
    extension: 'תוסיף מילות תדירות (“usually”, “hardly ever”) ושאלות בגוף שלישי על מישהו אחר.',
    jargon: ['פשוט he, she או it — הצורות שמקבלות ‎-s נוספת.'],
  },
  g_wh_questions: {
    title: 'מילות שאלה (what / where / when / who / why / how)',
    tutorExplanation:
      'בשאלות wh- מילת השאלה באה ראשונה, ואחריה אותו מבנה של do/does או be: “Where do you live?”, “Who is she?”. מה שנופל ללומדים הוא היפוך סדר המילים.',
    studentExplanation: 'מתחילים במילת השאלה, ואז שואלים את השאלה כרגיל.',
    meaningFirst:
      'קודם התשובה, אחר כך השאלה: תגיד “I live in Haifa,” ואז תשאל “Where do you live?” התבנית נראית לעין לפני שנותנים לה שם.',
    correctionMethod:
      'תגיד את השאלה הנכונה במהירות טבעית, ואז לאט, עם נקישה על כל מילה כדי שישמע את הסדר. שישאל אותה אותך בחזרה.',
    fallback: 'תן את השאלה כולה כיחידה אחת להעתקה (“Where do you live?”) ושיחליף רק את המילה האחרונה.',
    extension: 'תוסיף “How long / How often / What kind of…” ושאלות המשך שנבנות על התשובה.',
  },
  g_can_ability: {
    title: 'Can — יכולת, בקשות ורשות',
    tutorExplanation:
      '“Can” אף פעם לא מקבל ‎-s ותמיד בא אחריו פועל בצורת בסיס: “She can swim”. בשאלה יש היפוך: “Can you help?”. הוא מכסה יכולת, בקשה ורשות בבת אחת — ולכן הוא משתלם מאוד בשלב מוקדם.',
    studentExplanation: 'משתמשים ב“can” כדי להגיד מה אתה מסוגל לעשות, וגם כדי לבקש דברים.',
    meaningFirst:
      'תמחיז שחייה ותגיד “I can swim.” תמחיז ניסיון כושל להרים משהו כבד: “I can’t lift it.” ואז תשאל מה הוא יודע לעשות.',
    correctionMethod: 'לא מוסיפים כלום ל“can”, ולא מוסיפים כלום לפועל שאחריו. תדגים את הצמד החשוף.',
    fallback: 'רק “I can ___” עם פעולות בפנטומימה.',
    extension: 'תעמיד את “can” מול “could” לבקשות מנומסות, ומול “be able to” בזמנים אחרים.',
  },
  g_present_continuous: {
    title: 'הווה ממושך (Present continuous)',
    tutorExplanation:
      'am/is/are + פועל עם ‎-ing, לפעולות שקורות עכשיו או בערך עכשיו. יש כאן שני חלקים, ולומדים משמיטים אחד מהם — או את ה“be” או את ה־‎-ing.',
    studentExplanation: 'משתמשים ב־am/is/are + ‎-ing למה שקורה ממש עכשיו.',
    meaningFirst:
      'תספר פעולה חיה: תקום ותגיד “I am standing.” תשב: “Now I am sitting.” תבקש ממנו לעשות משהו ותתאר אותו תוך כדי.',
    correctionMethod: 'תבדוק שיש שני חלקים: פועל ה“be” וגם ה־‎-ing. אם אחד חסר, תוסיפו אותו יחד.',
    fallback: 'רק “I am ___ing” בזמן שהוא באמת מבצע את הפעולה.',
    extension: 'תעמיד מול ההווה הפשוט: “I work in a bank” מול “I’m working from home this week.”',
  },
  g_prepositions_place: {
    title: 'איפה דברים נמצאים (in / on / at / under / next to)',
    tutorExplanation:
      'in = בתוך מרחב, on = נוגע במשטח, at = נקודה או מקום שהולכים אליו. מילות יחס כמעט אף פעם לא מתאימות אחת לאחת בין שפות, ולכן לומדים אותן כצירופים ולא מתוך כלל.',
    studentExplanation: 'מילים קטנות שאומרות איפה משהו נמצא: in the box, on the table, at home.',
    meaningFirst:
      'תזיז חפץ אחד ממקום למקום ותשם כל מיקום: “in the cup”, “on the cup”, “under the cup”, “next to the cup”. בלי להוסיף כלום.',
    correctionMethod: 'אל תסביר — תדגים שוב עם החפץ ותן לו לחזור על הצירוף. את אלה לומדים בתחושה ובחזרה.',
    fallback: 'שתי מילות יחס בלבד — in ו־on — עם חפץ אחד.',
    extension: 'תוסיף מילות תנועה (into, out of, through, across) דרך המחזה שלהן.',
  },
  g_adverbs_frequency: {
    title: 'באיזו תדירות (always / usually / sometimes / never)',
    tutorExplanation:
      'מילות תדירות באות בדרך כלל לפני הפועל העיקרי (“I always eat breakfast”), אבל אחרי “be” (“I am always late”). הפיצול הזה הוא כל הקושי.',
    studentExplanation: 'מילים כמו always, usually, sometimes ו־never אומרות באיזו תדירות אתה עושה משהו.',
    meaningFirst:
      'תשרטט קו: never בקצה אחד, always בשני. תמקם עליו כמה הרגלים שלך בקול לפני שאתה שואל על שלו.',
    correctionMethod: 'מילת התדירות באה ממש לפני מילת הפעולה — חוץ מאשר עם am/is/are, שם היא באה אחרי. תדגים את שתי האפשרויות.',
    fallback: 'רק “always” ו“never”, עם שני הרגלים קונקרטיים מאוד.',
    extension: 'תוסיף “hardly ever”, “once a week”, “every other day” ותבקש נימוקים.',
  },
  g_articles: {
    title: 'תווית יידוע (a / an / the)',
    tutorExplanation:
      'a/an = אחד, לא מסוים (an לפני צליל של תנועה). the = מסוים, או משהו ששניכם כבר מכירים. בלי תווית ברבים כלליים ובשמות בלתי־ספירים. דוברי שפות בלי תוויות (רוסית, עברית) פשוט משמיטים אותן.',
    studentExplanation: 'משתמשים ב“a/an” לדבר אחד חדש, וב“the” כששנינו יודעים באיזה מדובר.',
    meaningFirst:
      'תספר סיפור בן שתי שורות עם אותו שם עצם: “I saw a dog. The dog was huge.” תגיד את זה פעמיים ותן להבדל לשקוע לפני שאתה נותן לו שם.',
    correctionMethod: 'תשאל: “דבר אחד, בפעם הראשונה?” → a/an. “שנינו יודעים באיזה?” → the. תדגים, ואז שינסה שוב.',
    fallback: 'תתרגל רק “a/an” עם מקצועות וחפצים. את “the” תשאיר לגמרי לשיעור אחר.',
    extension: 'תעבוד על היעדר תווית בשמות מופשטים ובהכללות (“Life is short”, “I love dogs”).',
    jargon: ['פשוט המילים a, an ו־the.', 'דברים שאי אפשר לספור אחד־אחד: מים, מוזיקה, מידע.'],
  },
  g_past_simple: {
    title: 'עבר פשוט (Past simple)',
    tutorExplanation:
      'פעולות שהסתיימו בעבר. פעלים רגילים מקבלים ‎-ed; רבים מהפעלים הנפוצים יוצאי דופן (go→went, buy→bought). בשאלה ובשלילה נכנס “did”, והפועל העיקרי חוזר לצורת הבסיס.',
    studentExplanation: 'משתמשים בעבר הפשוט לדברים שכבר נגמרו. הרבה פעלים משתנים: go → went.',
    meaningFirst:
      'תשרטט ציר זמן, תסמן “now”, תצביע אחורה ותספר סיפור אמיתי של עשרים שניות על אתמול שלך. ואז תשאל על שלו.',
    correctionMethod: 'שים לב למילת הזמן (yesterday, last…). תשנה את הפועל לעבר. אחרי “did” הפועל חוזר לצורת הבסיס.',
    fallback: 'תן לו חמישה פעלים יוצאי דופן על דף ושיספר את הסיפור תוך הסתכלות ברשימה. קודם שטף, אחר כך זיכרון.',
    extension: 'תוסיף “ago”, שלילה, ושאלות המשך — כך שזו תהיה שיחה אמיתית ולא דקלום.',
    jargon: ['פועל שלא רק מוסיף ‎-ed — צריך ללמוד את צורת העבר שלו.'],
  },
  g_countable_quantifiers: {
    title: 'כמה ומה הכמות (some, any, a lot of)',
    tutorExplanation:
      'שמות ספירים לוקחים many / a few / How many. שמות בלתי־ספירים (water, money, time, information, advice) לוקחים much / a little / How much. “A lot of” עובד עם שניהם, ולכן הוא ברירת מחדל בטוחה ושימושית.',
    studentExplanation: 'דברים שאפשר לספור לוקחים “many”; דברים שאי אפשר לספור לוקחים “much”.',
    meaningFirst:
      'תשים שלושה מטבעות וכוס מים על השולחן. תספור את המטבעות בקול; תנסה לספור את המים ותמשוך בכתפיים. ההבדל נוחת בלי מילה של הסבר.',
    correctionMethod: 'תשאל “אפשר לספור אותם אחת, שתיים, שלוש?” תן לו לענות, ואז תספק much או many.',
    fallback: 'תשתמש רק ב“a lot of”, שנכון עם הכול, ותבנה קודם ביטחון.',
    extension: 'תוסיף “too much / too many / not enough” ותן לו להתלונן על משהו אמיתי.',
  },
  g_comparatives: {
    title: 'דרגות השוואה והפלגה',
    tutorExplanation:
      'שמות תואר קצרים: ‎-er / ‎-est (big→bigger→biggest). ארוכים: more/most (interesting). יוצאי דופן: good→better→best, bad→worse→worst. בהשוואה נכנס “than”.',
    studentExplanation: 'משווים בין שניים עם ‎-er או “more”. לדבר העליון משתמשים ב־‎-est או “most”.',
    meaningFirst:
      'תרים שני חפצים בגודל שונה בבירור: “This one is bigger.” תוסיף שלישי: “And this is the biggest.” קודם פיזי, אחר כך מילולי.',
    correctionMethod: 'תספור הברות: קצר → ‎-er; ארוך → more. אף פעם לא “more” ו־‎-er ביחד.',
    fallback: 'שני חפצים מולו, שם תואר אחד, ואומרים את זה יחד בקול.',
    extension: 'תוסיף “as … as”, “not as … as” ו“the more … the more …”.',
    jargon: ['פעימה במילה — ל“big” יש אחת, ל“in-te-res-ting” יש ארבע.'],
  },
  g_going_to: {
    title: 'תוכניות עם “going to”',
    tutorExplanation:
      '“be going to” + פועל, לתוכניות שכבר הוחלטו ולתחזיות עם סימנים גלויים: “Look at those clouds — it’s going to rain.” לומדים משמיטים את ה“be” או משתמשים בהווה פשוט במקום.',
    studentExplanation: 'משתמשים ב“going to” לדברים שכבר החלטת לעשות.',
    meaningFirst:
      'תראה לוח שנה או יומן — אמיתי או מצויר — תצביע על יום עתידי ותגיד מה אתה עומד לעשות. ואז תצביע על שלו.',
    correctionMethod: 'תוודא שה“be” שם, ואז שהפועל אחרי “to” בצורת בסיס. אם התוכנית כבר הוחלטה, “going to” הוא הבחירה הטבעית.',
    fallback: 'תשתמש בשלד קבוע אחד: “I’m going to ___ tomorrow.”',
    extension: 'תעמיד מול “will” להחלטות ברגע, ומול ההווה הממושך לסידורים שנקבעו.',
  },
  g_will_future: {
    title: '“Will” — החלטות, הצעות ותחזיות',
    tutorExplanation:
      '“will” + פועל בצורת בסיס. משמש להחלטות שנופלות תוך כדי דיבור (“I’ll get it”), להצעות, להבטחות ולתחזיות בלי סימנים. אף פעם לא מקבל ‎-s ואף פעם לא “to”.',
    studentExplanation: 'משתמשים ב“will” כשמחליטים משהו ממש עכשיו, או כשחושבים שמשהו יקרה.',
    meaningFirst:
      'תפיל משהו (או תמחיז את זה), ומיד תגיד “I’ll get it.” ההחלטה קורית מול העיניים שלו, וזו כל המשמעות.',
    correctionMethod: 'אחרי “will” בא רק פועל בצורת בסיס. אם התוכנית כבר הייתה קיימת, תעבור ל“going to”.',
    fallback: 'תתרגל רק הצעות: “I’ll ___.” בשלושה מצבים בפנטומימה.',
    extension: 'תוסיף “might / probably / definitely” כדי לדרג את מידת הביטחון בתחזית.',
  },
  g_past_continuous: {
    title: 'עבר ממושך (רקע בסיפור)',
    tutorExplanation:
      'was/were + ‎-ing לפעולה שכבר הייתה בעיצומה כשמשהו אחר קרה: “I was cooking when he called.” הפעולה הארוכה ממושכת, והמפריעה בעבר פשוט.',
    studentExplanation: 'משתמשים ב“was/were + ‎-ing” למה שכבר קרה כשמשהו אחר קרה.',
    meaningFirst:
      'תמחיזו את זה: תתחיל לבשל בפנטומימה, ושהוא “יצלצל”. תקפא ותספר: “I was cooking when you called.”',
    correctionMethod: 'תשרטט את הפעולה הארוכה כקו ואת הקצרה כאיקס עליו. תן לציור להסביר, ואז שיגיד את המשפט שוב.',
    fallback: 'תשאל רק “What were you doing at 8 o’clock?” ותסתפק בפסוקית אחת.',
    extension: 'תבנו סיפור שלם שמתחלף בין רקע (ממושך) לאירועים (עבר פשוט).',
  },
  g_must_have_to: {
    title: 'כללים והכרח (have to / must / don’t have to)',
    tutorExplanation:
      '“have to” = הכרח חיצוני (כלל, עבודה). “must” = חזק, לרוב אישי או בכללים כתובים. המלכודת היא השלילה: “mustn’t” = אסור, “don’t have to” = לא חובה. אלה הפכים.',
    studentExplanation: '“Have to” אומר שזה הכרחי. “Don’t have to” אומר שזו הבחירה שלך.',
    meaningFirst:
      'קח שני כללים אמיתיים מהחיים שלו — אחד חובה ואחד בחירה חופשית — ותנסח כל אחד כעובדה לפני שאתם משווים ביניהם.',
    correctionMethod: 'תשאל “זה אסור, או פשוט לא חובה?” התשובה בוחרת את הצורה. תגיד את שתי הגרסאות בחזרה כדי שההבדל יישמע.',
    fallback: 'רק “I have to ___” על היום האמיתי שלו.',
    extension: 'תוסיף הכרח בעבר (“had to”) ו“should” לעצה, ותן לו להשוות את העוצמה של כל אחד.',
  },
  g_prepositions_time: {
    title: 'מתי דברים קורים (in / on / at)',
    tutorExplanation:
      'at + שעה ו“night”; on + ימים ותאריכים; in + חודשים, שנים, עונות וחלקי היום. קבוצה קטנה, שכיחות גבוהה, ושגויה כמעט בכל דיבור של מתחיל.',
    studentExplanation: 'at 7 o’clock, on Monday, in July — שלוש מילים קטנות לשלושה גדלים של זמן.',
    meaningFirst: 'תכתוב לוח זמנים אמיתי: שעה, יום, חודש. תקריא כל אחד עם מילת היחס שלו לפני שאתם משווים.',
    correctionMethod: 'מהקטן לגדול: at (שעה) → on (יום) → in (חודש/שנה). תגיד את הסולם, ואז את המשפט.',
    fallback: 'תתרגל רק שעות עם “at”.',
    extension: 'תוסיף “during / for / since / until / by” עם ציר זמן משורטט ביניכם.',
  },
  g_present_perfect: {
    title: 'הווה מושלם (Present perfect)',
    tutorExplanation:
      'have/has + צורת הפועל השלישית. מקשר בין העבר לעכשיו: חוויות (ever/never), זמן שעדיין נמשך (for/since), תוצאות טריות. אם יש מילת זמן סגורה (yesterday, in 2019) — האנגלית עוברת לעבר פשוט.',
    studentExplanation: 'משתמשים ב־have/has + פועל לחוויות חיים או לדברים שעדיין חשובים עכשיו. בלי ציון זמן מדויק בעבר.',
    meaningFirst:
      'תשאל על חוויה ולא על אירוע: “Have you ever eaten sushi?” אחרי “כן” תשאל “When?” — ותראה איך הזמן עובר לעבר פשוט מעצמו.',
    correctionMethod: 'אם יש מילת זמן סגורה (yesterday, in 2019) — עבר פשוט. אחרת הווה מושלם, בשביל “עד עכשיו”.',
    fallback: 'תישאר עם היחידה הקבועה “Have you ever…?” ותן לו לענות בעבר פשוט. צורת השאלה לבדה שווה את השיעור.',
    extension: 'תעמיד הווה מושלם מול עבר פשוט באותו סיפור, ותוסיף “just / already / yet”.',
    jargon: ['הצורה השלישית של הפועל: go – went – GONE, see – saw – SEEN.'],
  },
  g_used_to: {
    title: '“Used to” — איך זה היה פעם',
    tutorExplanation:
      '“used to” + פועל בצורת בסיס, להרגלים ולמצבים בעבר שכבר לא נכונים. בשאלה ובשלילה ה־d נעלם: “Did you use to…?”, “I didn’t use to…”.',
    studentExplanation: 'משתמשים ב“used to” לדברים שהיו נכונים פעם, ועכשיו כבר לא.',
    meaningFirst:
      'תספר עובדה אמיתית של לפני ואחרי על עצמך: “I used to live in the States. Now I live here.” הניגוד נושא את המשמעות.',
    correctionMethod: 'תוודא שמדובר בהרגל חוזר בעבר ולא באירוע אחד. בשאלה “did” כבר נושא את העבר, ולכן ה־d נופל.',
    fallback: 'שלד אחד בלבד: “I used to ___.” על הילדות.',
    extension: 'תוסיף “would” לפעולות חוזרות בסיפור, ואת “be used to” (שזה משהו אחר לגמרי).',
  },
  g_should_advice: {
    title: 'לתת עצה (should / ought to / why don’t you)',
    tutorExplanation:
      '“should” + פועל בצורת בסיס. רך יותר מ“must”. שווה המון בשיחה, כי עצה היא אחד הדברים שלומדים הכי רוצים לתת — ולרוב מנסחים כפקודה.',
    studentExplanation: 'משתמשים ב“should” כדי להגיד מה נראה לך רעיון טוב.',
    meaningFirst:
      'תתאר בעיה קטנה ואמיתית שלך ותזמין עצה. הוא יגיע למבנה מעצמו, כי הוא באמת רוצה לענות.',
    correctionMethod: 'אחרי “should” אין “to”. אם זה אמור להישמע כמו חבר ולא כמו בוס — “should” ולא “must”.',
    fallback: 'שלד אחד: “You should ___.” עם שלוש בעיות ברורות.',
    extension: 'תדרג את העוצמה: “You might want to… / I’d suggest… / You really ought to…”.',
  },
  g_gerund_infinitive: {
    title: 'פועל + ‎-ing או פועל + to',
    tutorExplanation:
      'אחרי חלק מהפעלים בא ‎-ing (enjoy, finish, avoid, mind, keep), ואחרי אחרים “to” + פועל (want, need, decide, hope, promise). לכמה מותר גם וגם. אין כלל אמין — לומדים את זה לפי פועל, כיחידות.',
    studentExplanation: 'אחרי חלק מהפעלים בא “-ing”, ואחרי חלק בא “to”. תלמד אותם בזוגות.',
    meaningFirst:
      'תגיד ארבעה משפטים אמיתיים על עצמך עם הפעלים הרלוונטיים, כך שהתבנית תגיע בתוך תוכן אמיתי: “I enjoy cooking. I want to travel.”',
    correctionMethod:
      'אל תסביר כלל — אין כזה. תגיד את הצמד הנכון (“enjoy cooking”) ושיחזור על הצמד, ואחר כך על כל המשפט.',
    fallback: 'תתרגל רק “I like ___ing” ו“I want to ___”. שני צמדים, מתורגלים היטב.',
    extension: 'תוסיף פעלים שהמשמעות שלהם משתנה לפי הצורה: “stop smoking” מול “stop to smoke”, “remember to” מול “remember -ing”.',
    jargon: ['פועל שמתפקד כשם עצם — צורת ה־‎-ing, כמו ב“I like swimming”.', 'הצורה “to + פועל”: to go, to eat.'],
  },
  g_conditionals: {
    title: 'משפטי תנאי (אפס, ראשון, שני)',
    tutorExplanation:
      'אפס: אמיתות כלליות (“If you heat ice, it melts”). ראשון: עתיד ממשי (“If it rains, I will stay”). שני: לא־ממשי או היפותטי (“If I had time, I would travel”). הטעות האוניברסלית היא לשים will/would בחלק של ה“if”.',
    studentExplanation: 'משתמשים ב“if” כדי לדבר על תוצאות. לעתיד ממשי — “will”; למצב מדומיין — “would”.',
    meaningFirst:
      'תתחיל ממשהו אמיתי ומיידי: “If it rains tomorrow, I’ll stay home.” ואז ממשהו בלתי אפשרי: “If I had a million dollars…” תן לשני להיות כיף לפני שהוא הופך לדקדוק.',
    correctionMethod: 'לא שמים “will/would” בחלק של ה“if”. עתיד ממשי = if + הווה, … will. מדומיין = if + עבר, … would.',
    fallback: 'רק תנאי ראשון, על מזג האוויר מחר. מבנה אחד, הרבה משפטים.',
    extension: 'תוסיף תנאי שלישי לחרטות, ותנאי מעורב לתוצאות שמגיעות עד ההווה.',
  },
  g_reported_speech: {
    title: 'לספר מה מישהו אמר',
    tutorExplanation:
      'בדיווח הזמן נסוג צעד אחד אחורה (“I’m tired” → “he said he WAS tired”), וכינויי הגוף ומילות הזמן מתאימים את עצמם. “Say” בלי אדם (“he said that…”), “tell” מחייב אדם (“he told ME…”).',
    studentExplanation: 'כשחוזרים על מה שמישהו אמר, מזיזים את הפועל צעד אחד אחורה לעבר.',
    meaningFirst: 'שילחש לך משפט; ואז תדווח אותו בקול לחדר. לעשות את זה מהיר יותר מלתאר את זה.',
    correctionMethod: 'שתי בדיקות: “say” או “tell”, ואז להזיז את הפועל אחורה. בשאלה מדווחת סדר המילים חוזר לסדר של משפט רגיל.',
    fallback: 'תדווח רק “He said…” עם הווה → עבר, ותתעלם משאלות לגמרי.',
    extension: 'תוסיף פעלי דיווח עם עמדה: admitted, insisted, denied, suggested, warned.',
  },
  g_passive: {
    title: 'סביל (The passive voice)',
    tutorExplanation:
      'be + צורת הפועל השלישית, כשהפעולה חשובה יותר ממי שביצע אותה. הזמן נישא על ידי “be” (is made, was built, has been sold). לומדים משמיטים את ה“be” או משתמשים בעבר פשוט במקום בצורה השלישית.',
    studentExplanation: 'משתמשים בסביל כשלא יודעים או לא אכפת לנו מי עשה את הפעולה.',
    meaningFirst:
      'תצביע על משהו מתועש ותשאל “Who made this?” הוא לא יידע — וזה בדיוק הרגע שבו האנגלית פונה לסביל: “It was made in China.”',
    correctionMethod: 'תבדוק את שני החלקים: הצורה הנכונה של “be” + צורת הפועל השלישית.',
    fallback: 'רק סביל בהווה, עם חפצים ששניכם רואים: “It’s made of wood.”',
    extension: 'תוסיף סביל עם “get”, דיווח סביל (“It is believed that…”), ומתי הסביל הוא דרך לרכך.',
  },
  g_relative_clauses: {
    title: 'פסוקיות זיקה (who / which / that)',
    tutorExplanation:
      'מוסיפות מידע על שם עצם: who (אנשים), which (דברים), that (שניהם). בפסוקית מזהה אין פסיקים; בפסוקית מוסיפה יש, ואי אפשר להשתמש בה ב“that”. “What” אף פעם אינו כינוי זיקה.',
    studentExplanation: 'משתמשים ב־who/which/that כדי לחבר שני רעיונות ולתאר אדם או דבר.',
    meaningFirst:
      'תגיד שני משפטים קצרים על אותו אדם, ואז תחבר אותם בקול. החיבור הוא השיעור: “I have a friend. She lives in Rome. → I have a friend who lives in Rome.”',
    correctionMethod: 'אנשים → who; דברים → which/that. אף פעם לא “what”. ואף פעם לא לחזור על הנושא אחרי who/that.',
    fallback: 'לחבר שני משפטים נתונים עם “who” בלבד, בקול, חמש פעמים.',
    extension: 'תוסיף פסוקיות מוסיפות עם פסיקים, “whose”, ופסוקיות מקוצרות (“the man standing there”).',
    jargon: ['מי או מה מבצע את הפעולה — המילה שלפני הפועל.'],
  },
  g_modals_deduction: {
    title: 'לנחש בביטחון (must / might / can’t)',
    tutorExplanation:
      'הסקה על ההווה: “must be” (בטוח שכן), “might/could be” (ייתכן), “can’t be” (בטוח שלא). שים לב שההפך של “must be” הוא “can’t be”, לעולם לא “mustn’t be”.',
    studentExplanation: 'משתמשים ב“must” כשאתה בטוח, ב“might” כשלא, וב“can’t” כשאתה בטוח שזה לא.',
    meaningFirst:
      'תחביא משהו ביד ותן לו לנחש. הניחושים שלו ידרשו בדיוק את השפה הזאת — אז תספק אותה בדיוק כשהוא מגשש אליה.',
    correctionMethod: 'תשאל “כמה אתה בטוח — 100%, 50%, או בטוח שלא?” ותן לו לבחור בעצמו את הפועל המודאלי.',
    fallback: 'שתי אפשרויות בלבד — “must be” ו“might be” — עם תמונות ברורות.',
    extension: 'תעבור להסקה על העבר: “must have been”, “can’t have known”, “might have left”.',
  },
  g_third_conditional: {
    title: 'לדבר על מה שלא קרה',
    tutorExplanation:
      'תנאי שלישי: if + had + צורה שלישית, … would have + צורה שלישית. משמש לחרטות ולעברים חלופיים. תנאי מעורב מחבר סיבה בעבר לתוצאה בהווה: “If I had studied, I would have a better job now.”',
    studentExplanation: 'זה משמש לדבר על עבר שלא קרה, ועל מה שהיה שונה אילו כן.',
    meaningFirst:
      'תספר חרטה קטנה ואמיתית שלך, בפשטות: “I didn’t take that job. If I had taken it, I would have moved.” החרטה נושאת את הדקדוק.',
    correctionMethod: 'גם כאן “would” לא נכנס לחלק של ה“if”. אחר כך תבדוק את הצורה השלישית אחרי “have”. תדגים את כל המשפט במהירות טבעית.',
    fallback: 'תרד לתנאי שני על ההווה; השלישי יכול לחכות שיעור.',
    extension: 'תוסיף “I wish I had…” ו“If only…” לאותה משמעות עם יותר רגש.',
  },
  g_wish_regret: {
    title: 'משאלות וחרטות (I wish / if only)',
    tutorExplanation:
      '“I wish” + עבר להווה לא־ממשי (“I wish I had more time”), + עבר מושלם לחרטה על העבר (“I wish I had said something”), + “would” כדי להתלונן על התנהגות של מישהו אחר (“I wish he would listen”).',
    studentExplanation: 'משתמשים ב“I wish” למשהו שהיית רוצה שיהיה אחרת — עכשיו או בעבר.',
    meaningFirst: 'תציע משאלה קטנה ואמיתית שלך על היום. זה מבנה אישי, והוא עובד הכי טוב כשהמורה מתחיל.',
    correctionMethod: 'צעד אחד אחורה מהמציאות: הווה → עבר, עבר → עבר מושלם. תגיד את הגרסה האמיתית ואת המשאלה זו לצד זו.',
    fallback: 'רק משאלות בהווה: “I wish I had more ___.”',
    extension: 'תעמיד את “I wish” מול “I hope” — ההבדל בין לא־ממשי לבין עדיין־אפשרי.',
  },
  g_causative: {
    title: 'כשמישהו אחר עושה בשבילך',
    tutorExplanation:
      '“have/get + מושא + צורה שלישית”: “I had my hair cut”, “We’re getting the kitchen painted”. לומדים אומרים “I cut my hair” ובלי כוונה טוענים שעשו את זה בעצמם.',
    studentExplanation: 'משתמשים ב“have something done” כשמישהו אחר עושה בשבילך את העבודה.',
    meaningFirst: 'תשאל “Did you cut your own hair?” הצחוק הוא השיעור: “No — you HAD it cut.”',
    correctionMethod: 'קודם המושא, אחר כך הצורה השלישית של הפועל. תגיד את הצמד “my car repaired” לפני המשפט השלם.',
    fallback: 'שלד אחד: “I had my hair cut.” עם שלושה שירותים.',
    extension: 'תוסיף “have someone do something” ואת הגרסה המתוסכלת “I had my phone stolen”.',
  },
  g_advanced_cohesion: {
    title: 'קישור ולכידות ברמה מתקדמת',
    tutorExplanation:
      'מילות קישור וריכוך לטיעון מדויק וטבעי: however, nevertheless, whereas, arguably, to some extent, having said that. ברמה הזאת הדיוק כבר כמעט אף פעם לא הבעיה — הצירופים והמשלב כן.',
    studentExplanation: 'משתמשים במילות קישור טבעיות כדי לחבר רעיונות בחלקות ולהישמע מדויק.',
    meaningFirst:
      'תגיד את אותו טיעון קצר פעמיים — פעם רק עם “and/but”, פעם עם מילות קישור אמיתיות — ותשאל איזו גרסה נשמעה מקצועית.',
    correctionMethod: 'ב־C1 תתמקד בצירופים טבעיים ובמשלב, לא בכללים. תציע ניסוח אידיומטי יותר ותן לו לומר אותו שוב.',
    fallback: 'תעבוד עם שלוש מילות קישור בלבד — “however”, “although”, “on the other hand” — עד שהן אוטומטיות.',
    extension: 'תעבור למבנה של פסקה שלמה: הצגת הכיוון, ויתור, והנקודה החזקה ביותר בסוף.',
  },
  g_inversion_emphasis: {
    title: 'הדגשה והיפוך',
    tutorExplanation:
      'הקדמת ביטוי שולל או מגביל מכריחה סדר מילים של שאלה: “Never have I seen…”, “Not only did she…”. משפטי שבירה עושים את אותה עבודה בצורה דיבורית יותר: “What I really meant was…”, “It was the timing that worried me.”',
    studentExplanation: 'מזיזים ביטוי להתחלה כדי להדגיש אותו — ואז המשפט מתהפך כמו שאלה.',
    meaningFirst:
      'תגיד משפט שטוח, ואז את הגרסה המודגשת, ותשאל איזו נשמעה חשובה יותר. הדגשה שומעים לפני שמנתחים.',
    correctionMethod:
      'תסביר שההיפוך הוא כל האות — בלעדיו ההדגשה נשמעת כמו טעות ולא כמו בחירה. ואז שיגיד את זה במהירות, כי היפוך מהוסס נשמע גרוע מכלום.',
    fallback: 'תישאר עם משפטי שבירה (“What I mean is…”) — אותו אפקט, בלי היפוך.',
    extension: 'תוסיף “Only when…”, “Little did I know…” וחזרה רטורית, ואז שינאם את זה בקצרה.',
  },
  g_hedging_register: {
    title: 'משלב, ריכוך ואנגלית דיפלומטית',
    tutorExplanation:
      'אותו תוכן נשמע בוטה או דיפלומטי לפי הריכוכים (“it seems”, “I’d suggest”, “that may not be quite right”), פעלים מודאליים זהירים ושלילה מרוככת (“not ideal” במקום “bad”). כאן שופטים דוברי C1 מקצועית.',
    studentExplanation: 'אפשר להגיד את אותו דבר רכות יותר או ישירות יותר, לפי מי שמולך.',
    meaningFirst:
      'תגיד משפט בוטה אחד ותבקש ממנו לדמיין שהוא אומר אותו למנהל שלו. אי הנוחות היא הפואנטה — ואז תספק את הגרסה הדיפלומטית.',
    correctionMethod: 'אף פעם אל תסמן את זה כטעות — זו בחירה. תציע את המשלב החלופי, תגיד לאיזה מצב הוא מתאים, ותן לו לבחור.',
    fallback: 'תעבוד עם שלושה ריכוכים בלבד: “I think”, “maybe”, “it seems”.',
    extension: 'תוסיף את ההיבט התרבותי — איך הישירות שונה בין שפת האם שלו לאנגלית אמריקאית, ומתי דווקא בוטות היא הבחירה הנכונה.',
  },
}

export default grammar
