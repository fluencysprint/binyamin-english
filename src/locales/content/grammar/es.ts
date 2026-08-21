/* Gramática — consignas para el tutor. Los ejemplos y ejercicios siguen en inglés. */

import { Dict } from '../../../i18n/dict'

const grammar: Dict = {
  g_present_be: {
    title: 'El verbo «to be» (am / is / are)',
    tutorExplanation:
      'Formas de presente de «be»: I am, you/we/they are, he/she/it is. Une el sujeto con una descripción o una identidad. Es el verbo más frecuente del inglés.',
    studentExplanation: 'Usa am / is / are para decir qué es algo o cómo se siente.',
    meaningFirst:
      'Señálate a ti: «I am Binyamin.» Señálale a él: «You are ___.» Señala un objeto: «It is a cup.» El significado viene del gesto, no de una explicación.',
    correctionMethod: 'Señala el sujeto y elegid juntos la forma que le toca. Que repita la frase entera bien.',
    fallback: 'Baja solo a «I am ___». Una sola forma, sobre sí mismo, diez veces, ya es progreso real.',
    extension: 'Añade la negación («I’m not…») y la pregunta («Are you…?»), y luego deja que te entreviste.',
    jargon: ['la persona o cosa que hace la acción: la palabra que va antes del verbo.'],
  },
  g_pronouns_possessives: {
    title: 'Palabras para las personas (I / my, you / your, he / his…)',
    tutorExplanation:
      'Pronombres sujeto (I, you, he, she, it, we, they) y sus posesivos (my, your, his, her, its, our, their). Quien tiene el género organizado de otra forma en su lengua confunde his y her todo el rato.',
    studentExplanation: 'Usa «I / you / he / she» para la persona y «my / your / his / her» para lo que es suyo.',
    meaningFirst:
      'Levanta tu bolígrafo: «my pen». Dáselo: «your pen». Señala a una tercera persona o una foto: «his pen» / «her pen». No se explica nada; trabajan los objetos.',
    correctionMethod:
      'Pregunta «¿De quién es, de un hombre o de una mujer?», dale luego la palabra correcta y que repita la frase entera.',
    fallback: 'Solo «my» y «your», con objetos reales que os vais pasando.',
    extension: 'Añade «mine / yours / hers» («That book is mine») y los pronombres de objeto («I saw him»).',
  },
  g_plurals: {
    title: 'Uno y más de uno (el plural)',
    tutorExplanation:
      'El plural regular añade -s (suena /s/, /z/ o /ɪz/ según el sonido anterior). Hay una lista corta de irregulares: man→men, woman→women, child→children, foot→feet, person→people. En las lenguas sin esa -s, simplemente se olvida.',
    studentExplanation: 'Para más de una cosa, se añade «s» al final de la palabra.',
    meaningFirst:
      'Pon un bolígrafo en la mesa: «a pen». Añade dos más: «three pens». Hazlo con tres objetos distintos antes de decir una palabra sobre la letra s.',
    correctionMethod: 'Levanta tantos dedos como haga falta y di la palabra con la -s bien marcada. Que repita la frase entera, no solo la palabra.',
    fallback: 'Contad juntos objetos reales, del uno al tres, y deja que se limite a copiar tu frase.',
    extension: 'Contrasta los tres sonidos del plural (cats /s/, dogs /z/, boxes /ɪz/): de paso, una victoria de pronunciación.',
  },
  g_have_got: {
    title: 'Decir lo que tienes',
    tutorExplanation:
      '«I have a car» (americano, neutro) y «I have got a car» (más británico y oral). Enseña «have/has»: en tercera persona es «has». Las preguntas y negaciones en inglés americano usan do/does: «Do you have…?», «I don’t have…».',
    studentExplanation: 'Usa «have» para decir lo que tienes. Con he, she e it se dice «has».',
    meaningFirst:
      'Levanta tu móvil: «I have a phone.» Señala el suyo: «You have a phone.» Enseña la mano vacía: «I don’t have a pen.»',
    correctionMethod: 'He/she/it → «has». En negación o pregunta entra do/does y el verbo vuelve a «have».',
    fallback: 'Solo «I have ___» con objetos que los dos veáis y podáis tocar.',
    extension: 'Pasad a «How many … do you have?» y a las respuestas cortas («Yes, I do.»).',
  },
  g_there_is_are: {
    title: 'There is / There are',
    tutorExplanation:
      'Sirve para decir que algo existe o está: «There is a problem», «There are two chairs». Singular → is, plural → are. Muchas lenguas lo expresan con un verbo tipo «tener», y de ahí sale «Here have a chair».',
    studentExplanation: 'Usa «There is» para una cosa y «There are» para más de una.',
    meaningFirst:
      'Haz un gesto abarcando la sala mientras nombras lo que hay: «There is a window. There are two chairs.» Que el gesto lleve el significado.',
    correctionMethod: 'Pregunta «¿Una o más de una?» y deja que elija él mismo is o are antes de repetir la frase.',
    fallback: 'Solo «There is a ___» señalando objetos sueltos.',
    extension: 'Añade el pasado («There was / There were») y la negación («There isn’t any…»).',
  },
  g_present_simple: {
    title: 'Presente simple',
    tutorExplanation:
      'Para hábitos, rutinas y hechos. En tercera persona del singular (he/she/it) se añade -s. En preguntas y negaciones entra do/does y el verbo principal vuelve a su forma base.',
    studentExplanation: 'El presente simple es para lo que haces a menudo o lo que siempre es verdad.',
    meaningFirst:
      'Mima tu propia mañana en orden —despertarte, café, trabajo— narrándola: «I wake up. I drink coffee. I go to work.» Luego pregunta por la suya.',
    correctionMethod: 'Marca que tras he/she/it el verbo necesita -s. En la pregunta esa -s se muda a «does».',
    fallback: 'Quedaos solo en «I» y «you» —ahí no hay -s— y cread soltura ahí primero.',
    extension: 'Añade palabras de frecuencia («usually», «hardly ever») y preguntas en tercera persona sobre otra gente.',
    jargon: ['simplemente he, she o it: las formas que llevan una -s de más.'],
  },
  g_wh_questions: {
    title: 'Palabras de pregunta (what / where / when / who / why / how)',
    tutorExplanation:
      'En las preguntas con wh-, la palabra interrogativa va primera y luego viene la misma estructura con do/does o be: «Where do you live?», «Who is she?». Lo que se pierde es el cambio de orden.',
    studentExplanation: 'Empieza por la palabra de pregunta y luego pregunta como siempre.',
    meaningFirst:
      'Primero la respuesta, después la pregunta: di «I live in Haifa,» y luego pregunta «Where do you live?» El patrón se ve antes de nombrarlo.',
    correctionMethod:
      'Di la pregunta correcta a velocidad normal y luego despacio, dando un golpecito por palabra para que oiga el orden. Que te la haga él a ti.',
    fallback: 'Dale la pregunta entera como un bloque para copiar («Where do you live?») y cambiad solo la última palabra.',
    extension: 'Añade «How long / How often / What kind of…» y preguntas que se apoyen en la respuesta anterior.',
  },
  g_can_ability: {
    title: 'Can: capacidad, peticiones y permiso',
    tutorExplanation:
      '«Can» nunca lleva -s y siempre va seguido del verbo en forma base: «She can swim». En pregunta se invierte: «Can you help?». Cubre capacidad, petición y permiso a la vez, así que rinde muchísimo desde el principio.',
    studentExplanation: 'Usa «can» para decir lo que sabes hacer y para pedir cosas.',
    meaningFirst:
      'Mima que nadas y di «I can swim.» Mima que no puedes levantar algo pesado: «I can’t lift it.» Luego pregunta qué sabe hacer él.',
    correctionMethod: 'A «can» no se le añade nada, y al verbo que va detrás tampoco. Modela la pareja desnuda.',
    fallback: 'Solo «I can ___» con acciones mimadas.',
    extension: 'Contrasta «can» con «could» para peticiones corteses y con «be able to» en otros tiempos.',
  },
  g_present_continuous: {
    title: 'Presente continuo',
    tutorExplanation:
      'am/is/are + verbo en -ing para acciones de ahora mismo o de estos días. Tiene DOS partes y se cae una: o el «be» o el -ing.',
    studentExplanation: 'Usa am/is/are + -ing para lo que está pasando justo ahora.',
    meaningFirst:
      'Narra la acción en directo: levántate y di «I am standing.» Siéntate: «Now I am sitting.» Pídele que haga algo y nárralo tú.',
    correctionMethod: 'Comprueba las dos partes: el verbo «be» Y el -ing. Si falta una, añadidla juntos.',
    fallback: 'Solo «I am ___ing» mientras hace de verdad la acción.',
    extension: 'Contrasta con el presente simple: «I work in a bank» frente a «I’m working from home this week.»',
  },
  g_prepositions_place: {
    title: 'Dónde están las cosas (in / on / at / under / next to)',
    tutorExplanation:
      'in = dentro de un espacio, on = tocando una superficie, at = un punto o un sitio al que vas. Las preposiciones casi nunca se corresponden una a una entre lenguas, así que se memorizan en frases, no se deducen de una regla.',
    studentExplanation: 'Palabritas que dicen dónde está algo: in the box, on the table, at home.',
    meaningFirst:
      'Mueve un solo objeto de sitio en sitio nombrando cada posición: «in the cup», «on the cup», «under the cup», «next to the cup». Y nada más.',
    correctionMethod: 'No expliques: vuelve a demostrarlo con el objeto y deja que repita la frase. Esto se aprende por tacto y repetición.',
    fallback: 'Solo dos preposiciones —in y on— con un único objeto.',
    extension: 'Añade preposiciones de movimiento (into, out of, through, across) representándolas.',
  },
  g_adverbs_frequency: {
    title: 'Con qué frecuencia (always / usually / sometimes / never)',
    tutorExplanation:
      'Los adverbios de frecuencia van normalmente ANTES del verbo principal («I always eat breakfast») pero DESPUÉS de «be» («I am always late»). Toda la dificultad está en esa división.',
    studentExplanation: 'always, usually, sometimes y never dicen con qué frecuencia haces algo.',
    meaningFirst:
      'Dibuja una línea: never en un extremo, always en el otro. Coloca en voz alta un par de costumbres tuyas antes de preguntar por las suyas.',
    correctionMethod: 'El adverbio va justo antes de la palabra de acción, salvo con am/is/are, donde va detrás. Modela los dos casos.',
    fallback: 'Solo «always» y «never» con dos costumbres muy concretas.',
    extension: 'Añade «hardly ever», «once a week», «every other day» y pide motivos.',
  },
  g_articles: {
    title: 'Artículos (a / an / the)',
    tutorExplanation:
      'a/an = uno, no concreto (an ante SONIDO vocálico). the = concreto, o ya conocido por los dos. Sin artículo en plurales generales e incontables. Quien viene de una lengua sin artículos (ruso, hebreo) simplemente los omite.',
    studentExplanation: 'Usa «a/an» para una cosa nueva y «the» cuando los dos sabemos de cuál hablamos.',
    meaningFirst:
      'Cuenta una historia de dos líneas con el mismo sustantivo: «I saw a dog. The dog was huge.» Dilo dos veces y deja que el cambio aterrice antes de nombrarlo.',
    correctionMethod: 'Pregunta: «¿Una cosa, por primera vez?» → a/an. «¿Sabemos los dos cuál?» → the. Modela y que lo intente otra vez.',
    fallback: 'Practicad solo «a/an» con oficios y objetos. Deja «the» entero para otra clase.',
    extension: 'Trabaja el artículo cero con sustantivos abstractos y generalizaciones («Life is short», «I love dogs»).',
    jargon: ['simplemente las palabras a, an y the.', 'lo que no se puede contar de uno en uno: agua, música, información.'],
  },
  g_past_simple: {
    title: 'Pasado simple',
    tutorExplanation:
      'Acciones terminadas en el pasado. Los verbos regulares añaden -ed; muchos de los más frecuentes son irregulares (go→went, buy→bought). En preguntas y negaciones entra «did», y el verbo principal vuelve a su forma base.',
    studentExplanation: 'El pasado simple es para lo que ya terminó. Muchos verbos cambian: go → went.',
    meaningFirst:
      'Dibuja una línea del tiempo, marca «now», señala hacia atrás y cuenta veinte segundos de tu ayer real. Luego pregunta por el suyo.',
    correctionMethod: 'Fíjate en la palabra de tiempo (yesterday, last…). Pasa el verbo al pasado. Después de «did», el verbo vuelve a la forma base.',
    fallback: 'Dale cinco verbos irregulares en papel y deja que cuente la historia leyendo de la lista. Primero la soltura, luego la memoria.',
    extension: 'Añade «ago», negaciones y preguntas de seguimiento para que sea una conversación y no un recitado.',
    jargon: ['un verbo que no se limita a añadir -ed: hay que aprenderse su forma de pasado.'],
  },
  g_countable_quantifiers: {
    title: 'Cuánto y cuántos (some, any, a lot of)',
    tutorExplanation:
      'Los contables llevan many / a few / How many. Los incontables (water, money, time, information, advice) llevan much / a little / How much. «A lot of» vale para los dos, así que es un comodín seguro.',
    studentExplanation: 'Lo que se puede contar lleva «many»; lo que no se puede contar lleva «much».',
    meaningFirst:
      'Pon tres monedas y un vaso de agua en la mesa. Cuenta las monedas en voz alta; intenta contar el agua y encógete de hombros. La distinción entra sin una palabra de explicación.',
    correctionMethod: 'Pregunta «¿Se pueden contar, uno, dos, tres?» Deja que responda y luego dale much o many.',
    fallback: 'Usad solo «a lot of», que vale con todo, y cread confianza primero.',
    extension: 'Añade «too much / too many / not enough» y deja que se queje de algo de verdad.',
  },
  g_comparatives: {
    title: 'Comparativos y superlativos',
    tutorExplanation:
      'Adjetivos cortos: -er / -est (big→bigger→biggest). Largos: more/most (interesting). Irregulares: good→better→best, bad→worse→worst. La comparación lleva «than».',
    studentExplanation: 'Compara dos cosas con -er o «more». Para la primera de todas, -est o «most».',
    meaningFirst:
      'Coge dos objetos de tamaño claramente distinto: «This one is bigger.» Añade un tercero: «And this is the biggest.» Primero físico, después verbal.',
    correctionMethod: 'Cuenta las sílabas: corto → -er; largo → more. Nunca «more» y -er a la vez.',
    fallback: 'Dos objetos delante, un adjetivo, y lo decís juntos en voz alta.',
    extension: 'Añade «as … as», «not as … as» y «the more … the more …».',
    jargon: ['un golpe de voz: «big» tiene uno, «in-te-res-ting» tiene cuatro.'],
  },
  g_going_to: {
    title: 'Planes con «going to»',
    tutorExplanation:
      '«be going to» + verbo para planes ya decididos y para predicciones con pruebas a la vista: «Look at those clouds — it’s going to rain.» Se cae el «be» o se usa el presente simple en su lugar.',
    studentExplanation: 'Usa «going to» para lo que ya has decidido hacer.',
    meaningFirst:
      'Enseña un calendario o una agenda —real o dibujada—, señala un día futuro y di qué vas a hacer. Luego señala el suyo.',
    correctionMethod: 'Comprueba que está el «be» y que tras «to» va el verbo en forma base. Si el plan ya estaba decidido, «going to» es lo natural.',
    fallback: 'Una sola plantilla: «I’m going to ___ tomorrow.»',
    extension: 'Contrasta con «will» para decisiones del momento y con el presente continuo para citas ya cerradas.',
  },
  g_will_future: {
    title: '«Will»: decisiones, ofrecimientos y predicciones',
    tutorExplanation:
      '«will» + verbo en forma base. Para decisiones tomadas al hablar («I’ll get it»), ofrecimientos, promesas y predicciones sin pruebas. Nunca lleva -s y nunca lleva «to».',
    studentExplanation: 'Usa «will» cuando decides algo ahora mismo o cuando crees que algo va a pasar.',
    meaningFirst:
      'Deja caer algo (o mímalo) y di enseguida «I’ll get it.» La decisión ocurre delante de él, y ese es todo el significado.',
    correctionMethod: 'Después de «will», solo el verbo en forma base. Si el plan ya estaba hecho, cambia a «going to».',
    fallback: 'Practicad solo ofrecimientos: «I’ll ___.» con tres situaciones mimadas.',
    extension: 'Añade «might / probably / definitely» para graduar la seguridad de una predicción.',
  },
  g_past_continuous: {
    title: 'Pasado continuo (el fondo de una historia)',
    tutorExplanation:
      'was/were + -ing para una acción que ya estaba en marcha cuando pasó otra: «I was cooking when he called.» La acción larga va en continuo y la que interrumpe en pasado simple.',
    studentExplanation: 'Usa «was/were + -ing» para lo que ya estaba pasando cuando ocurrió otra cosa.',
    meaningFirst:
      'Representadlo: empieza a mimar que cocinas y que él «llame». Congélate y nárralo: «I was cooking when you called.»',
    correctionMethod: 'Dibuja la acción larga como una línea y la corta como una cruz encima. Que explique el dibujo y luego repita la frase.',
    fallback: 'Pregunta solo «What were you doing at 8 o’clock?» y acepta una sola oración.',
    extension: 'Construid una anécdota entera alternando fondo (continuo) y sucesos (simple).',
  },
  g_must_have_to: {
    title: 'Normas y necesidad (have to / must / don’t have to)',
    tutorExplanation:
      '«have to» = necesidad externa (una norma, un trabajo). «must» = fuerte, a menudo personal o de normas escritas. La trampa está en la negación: «mustn’t» = está prohibido, «don’t have to» = es opcional. Son contrarios.',
    studentExplanation: '«Have to» significa que es obligatorio. «Don’t have to» significa que tú eliges.',
    meaningFirst:
      'Coge dos normas reales de su vida —una obligación y una elección libre— y enuncia cada una como un hecho antes de compararlas.',
    correctionMethod: 'Pregunta «¿Está prohibido o simplemente es opcional?» La respuesta elige la forma. Repite las dos versiones para que se oiga el contraste.',
    fallback: 'Solo «I have to ___» sobre su día real.',
    extension: 'Añade la necesidad en pasado («had to») y «should» para consejos, y que compare la fuerza de cada uno.',
  },
  g_prepositions_time: {
    title: 'Cuándo pasan las cosas (in / on / at)',
    tutorExplanation:
      'at + hora del reloj y «night»; on + días y fechas; in + meses, años, estaciones y partes del día. Conjunto pequeño, frecuencia altísima, y mal usado en casi todo principiante.',
    studentExplanation: 'at 7 o’clock, on Monday, in July: tres palabritas para tres tamaños de tiempo.',
    meaningFirst: 'Escribe un horario real: una hora, un día, un mes. Lee cada uno en voz alta con su preposición antes de compararlos.',
    correctionMethod: 'De lo pequeño a lo grande: at (hora) → on (día) → in (mes/año). Di la escalera y luego la frase.',
    fallback: 'Practica solo horas del reloj con «at».',
    extension: 'Añade «during / for / since / until / by» con una línea del tiempo dibujada entre los dos.',
  },
  g_present_perfect: {
    title: 'Presente perfecto',
    tutorExplanation:
      'have/has + participio. Une el pasado con el ahora: experiencias (ever/never), tiempo no terminado (for/since), resultados recientes. Si hay una palabra de tiempo cerrado (yesterday, in 2019), el inglés usa el pasado simple.',
    studentExplanation: 'have/has + verbo para experiencias de vida o para cosas que aún importan ahora. Sin una hora exacta del pasado.',
    meaningFirst:
      'Pregunta por experiencias, no por sucesos: «Have you ever eaten sushi?» Tras un sí, di «When?» y observa cómo el tiempo cambia solo a pasado simple.',
    correctionMethod: 'Si hay palabra de tiempo cerrado (yesterday, in 2019), pasado simple. Si no, presente perfecto para lo «hasta ahora».',
    fallback: 'Quedaos con el bloque fijo «Have you ever…?» y deja que responda en pasado simple. Solo la pregunta ya vale la clase.',
    extension: 'Contrasta presente perfecto y pasado simple dentro de la misma historia, y añade «just / already / yet».',
    jargon: ['la tercera forma del verbo: go – went – GONE, see – saw – SEEN.'],
  },
  g_used_to: {
    title: '«Used to»: cómo eran las cosas antes',
    tutorExplanation:
      '«used to» + verbo en forma base para hábitos y estados del pasado que ya no son ciertos. En preguntas y negaciones desaparece la «d»: «Did you use to…?», «I didn’t use to…».',
    studentExplanation: 'Usa «used to» para cosas que antes eran verdad y ya no lo son.',
    meaningFirst:
      'Cuenta un antes y un después reales sobre ti: «I used to live in the States. Now I live here.» El contraste lleva el significado.',
    correctionMethod: 'Comprueba que sea un hábito repetido y no un solo suceso. En la pregunta, «did» ya carga el pasado, así que la «d» cae.',
    fallback: 'Una sola plantilla: «I used to ___.» sobre la infancia.',
    extension: 'Añade «would» para acciones repetidas al narrar, y «be used to» (que es otra cosa completamente distinta).',
  },
  g_should_advice: {
    title: 'Dar consejos (should / ought to / why don’t you)',
    tutorExplanation:
      '«should» + verbo en forma base. Más suave que «must». Rinde muchísimo en conversación, porque aconsejar es de lo que más ganas tienen los alumnos y lo que más a menudo formulan como una orden.',
    studentExplanation: 'Usa «should» para decir lo que te parece buena idea.',
    meaningFirst:
      'Cuenta un problemilla real tuyo y pide consejo. Irá a por la estructura solo, porque de verdad quiere responder.',
    correctionMethod: 'Después de «should» no va «to». Si tiene que sonar a amigo y no a jefe, «should» antes que «must».',
    fallback: 'Una plantilla: «You should ___.» con tres problemas obvios.',
    extension: 'Gradúa la fuerza: «You might want to… / I’d suggest… / You really ought to…».',
  },
  g_gerund_infinitive: {
    title: 'Verbo + -ing o verbo + to',
    tutorExplanation:
      'A algunos verbos les sigue -ing (enjoy, finish, avoid, mind, keep) y a otros «to» + verbo (want, need, decide, hope, promise). Unos pocos admiten ambos. No hay regla fiable: se aprende verbo a verbo, en bloques.',
    studentExplanation: 'A unos verbos les sigue «-ing» y a otros «to». Apréndetelos por parejas.',
    meaningFirst:
      'Di cuatro frases verdaderas sobre ti con esos verbos, para que el patrón llegue dentro de contenido real: «I enjoy cooking. I want to travel.»',
    correctionMethod:
      'No expliques una regla: no la hay. Di el bloque correcto de dos palabras («enjoy cooking») y que repita la pareja y luego la frase entera.',
    fallback: 'Practicad solo «I like ___ing» y «I want to ___». Dos bloques, bien machacados.',
    extension: 'Añade verbos que cambian de significado según la forma: «stop smoking» frente a «stop to smoke», «remember to» frente a «remember -ing».',
    jargon: ['un verbo que funciona como sustantivo: la forma en -ing, como en «I like swimming».', 'la forma «to + verbo»: to go, to eat.'],
  },
  g_conditionals: {
    title: 'Condicionales (cero, primero y segundo)',
    tutorExplanation:
      'Cero: verdades generales («If you heat ice, it melts»). Primero: futuro real («If it rains, I will stay»). Segundo: irreal o hipotético («If I had time, I would travel»). El error universal es meter will/would en la mitad del «if».',
    studentExplanation: 'Usa «if» para hablar de resultados. Para el futuro real, «will»; para lo imaginado, «would».',
    meaningFirst:
      'Empieza por algo real e inmediato: «If it rains tomorrow, I’ll stay home.» Y luego por algo imposible: «If I had a million dollars…» Que lo segundo sea divertido antes de ser gramática.',
    correctionMethod: 'No pongas «will/would» en la parte del «if». Futuro real = if + presente, … will. Imaginado = if + pasado, … would.',
    fallback: 'Solo el primer condicional, sobre el tiempo de mañana. Una estructura, muchas frases.',
    extension: 'Añade el tercer condicional para los arrepentimientos y los condicionales mixtos para consecuencias que llegan hasta hoy.',
  },
  g_reported_speech: {
    title: 'Contar lo que alguien dijo',
    tutorExplanation:
      'Al contarlo, el tiempo retrocede un paso («I’m tired» → «he said he WAS tired») y se ajustan pronombres y palabras de tiempo. «Say» no lleva persona («he said that…»); «tell» la exige («he told ME…»).',
    studentExplanation: 'Cuando repites lo que dijo alguien, mueve el verbo un paso hacia el pasado.',
    meaningFirst: 'Que te susurre una frase; luego cuéntala en voz alta. Hacerlo es más rápido que describirlo.',
    correctionMethod: 'Dos comprobaciones: «say» o «tell», y luego retroceder el verbo. En las preguntas contadas, el orden vuelve al de una frase normal.',
    fallback: 'Contad solo con «He said…», de presente a pasado, sin tocar las preguntas.',
    extension: 'Añade verbos de habla con actitud: admitted, insisted, denied, suggested, warned.',
  },
  g_passive: {
    title: 'La voz pasiva',
    tutorExplanation:
      'be + participio, cuando importa más la acción que quién la hizo. El tiempo lo lleva «be» (is made, was built, has been sold). Se cae el «be» o se usa el pasado simple en lugar del participio.',
    studentExplanation: 'Usa la pasiva cuando no sabemos, o no nos importa, quién hizo la acción.',
    meaningFirst:
      'Señala algo fabricado y pregunta «Who made this?» No lo sabrá, y ahí es exactamente donde el inglés echa mano de la pasiva: «It was made in China.»',
    correctionMethod: 'Comprueba las dos partes: la forma correcta de «be» + el participio (la tercera forma del verbo).',
    fallback: 'Solo pasiva en presente, con objetos que los dos veáis: «It’s made of wood.»',
    extension: 'Añade la pasiva con «get», la pasiva de rumor («It is believed that…») y los casos en que la pasiva sirve para suavizar.',
  },
  g_relative_clauses: {
    title: 'Oraciones de relativo (who / which / that)',
    tutorExplanation:
      'Añaden información sobre un sustantivo: who (personas), which (cosas), that (ambas). Las especificativas no llevan comas; las explicativas sí, y no admiten «that». «What» no es nunca un relativo.',
    studentExplanation: 'Usa who/which/that para unir dos ideas y describir a una persona o una cosa.',
    meaningFirst:
      'Di dos frases cortas sobre la misma persona y únelas en voz alta. La unión es la clase: «I have a friend. She lives in Rome. → I have a friend who lives in Rome.»',
    correctionMethod: 'Personas → who; cosas → which/that. Nunca «what». Y nunca repitas el sujeto después de who/that.',
    fallback: 'Unid dos frases dadas solo con «who», en voz alta, cinco veces.',
    extension: 'Añade explicativas con comas, «whose» y relativos reducidos («the man standing there»).',
    jargon: ['la persona o cosa que hace la acción: la palabra que va antes del verbo.'],
  },
  g_modals_deduction: {
    title: 'Suponer con más o menos seguridad (must / might / can’t)',
    tutorExplanation:
      'Deducción sobre el presente: «must be» (seguro que sí), «might/could be» (posible), «can’t be» (seguro que no). Ojo: lo contrario de «must be» es «can’t be», nunca «mustn’t be».',
    studentExplanation: 'Usa «must» cuando estás seguro, «might» cuando no, y «can’t» cuando seguro que no es.',
    meaningFirst:
      'Esconde algo en la mano y déjale adivinar. Sus conjeturas van a necesitar justo esta lengua, así que dásela cuando la esté buscando.',
    correctionMethod: 'Pregunta «¿Cómo de seguro estás: 100 %, 50 %, o seguro que no?» y deja que elija él el modal.',
    fallback: 'Solo dos opciones —«must be» y «might be»— con imágenes evidentes.',
    extension: 'Pasad a la deducción sobre el pasado: «must have been», «can’t have known», «might have left».',
  },
  g_third_conditional: {
    title: 'Hablar de lo que no pasó',
    tutorExplanation:
      'Tercer condicional: if + had + participio, … would have + participio. Para arrepentimientos y pasados alternativos. Los condicionales mixtos unen una causa pasada con un resultado presente: «If I had studied, I would have a better job now.»',
    studentExplanation: 'Sirve para hablar de un pasado que no ocurrió y de lo que habría sido distinto.',
    meaningFirst:
      'Cuenta un pequeño arrepentimiento real tuyo, sin adornos: «I didn’t take that job. If I had taken it, I would have moved.» El arrepentimiento lleva la gramática.',
    correctionMethod: 'Aquí tampoco entra «would» en la mitad del «if». Después comprueba el participio tras «have». Modela la frase entera a velocidad normal.',
    fallback: 'Baja al segundo condicional sobre el presente; el tercero puede esperar una clase.',
    extension: 'Añade «I wish I had…» y «If only…» para lo mismo, pero con más sentimiento.',
  },
  g_wish_regret: {
    title: 'Deseos y arrepentimientos (I wish / if only)',
    tutorExplanation:
      '«I wish» + pasado para un presente irreal («I wish I had more time»), + pasado perfecto para un arrepentimiento («I wish I had said something»), + «would» para quejarse de lo que hace otro («I wish he would listen»).',
    studentExplanation: 'Usa «I wish» para algo que querrías que fuera distinto, ahora o en el pasado.',
    meaningFirst: 'Ofrece un deseo pequeño y sincero tuyo sobre hoy. Es una estructura personal y funciona mejor si empieza el tutor.',
    correctionMethod: 'Un paso atrás desde la realidad: presente → pasado, pasado → pasado perfecto. Di la versión real y el deseo, una al lado de la otra.',
    fallback: 'Solo deseos en presente: «I wish I had more ___.»',
    extension: 'Contrasta «I wish» con «I hope»: la diferencia entre lo irreal y lo todavía posible.',
  },
  g_causative: {
    title: 'Cuando el trabajo lo hace otro',
    tutorExplanation:
      '«have/get + objeto + participio»: «I had my hair cut», «We’re getting the kitchen painted». El alumno dice «I cut my hair» y afirma sin querer que se lo cortó él mismo.',
    studentExplanation: 'Usa «have something done» cuando el trabajo te lo hace otra persona.',
    meaningFirst: 'Pregunta «Did you cut your own hair?» La risa es la clase: «No — you HAD it cut.»',
    correctionMethod: 'Primero el objeto y después la tercera forma del verbo. Di la pareja «my car repaired» antes de la frase entera.',
    fallback: 'Una plantilla: «I had my hair cut.» con tres servicios.',
    extension: 'Añade «have someone do something» y el fastidiado «I had my phone stolen».',
  },
  g_advanced_cohesion: {
    title: 'Conectores y cohesión avanzada',
    tutorExplanation:
      'Marcadores del discurso y atenuadores para argumentar con precisión y naturalidad: however, nevertheless, whereas, arguably, to some extent, having said that. A este nivel el problema casi nunca es la corrección, sino la combinación de palabras y el registro.',
    studentExplanation: 'Usa conectores naturales para enlazar ideas con fluidez y sonar preciso.',
    meaningFirst:
      'Da el mismo argumento breve dos veces —una solo con «and/but» y otra con conectores de verdad— y pregunta cuál sonó profesional.',
    correctionMethod: 'En C1 trabaja la combinación natural de palabras y el registro, no las reglas. Ofrece una versión más idiomática y que la repita.',
    fallback: 'Trabaja solo con tres conectores —«however», «although», «on the other hand»— hasta que le salgan solos.',
    extension: 'Pasa a la forma del párrafo entero: anunciar, conceder y dejar el argumento más fuerte para el final.',
  },
  g_inversion_emphasis: {
    title: 'Énfasis e inversión',
    tutorExplanation:
      'Adelantar una expresión negativa o restrictiva obliga al orden de pregunta: «Never have I seen…», «Not only did she…». Las frases escindidas hacen lo mismo de forma más conversacional: «What I really meant was…», «It was the timing that worried me.»',
    studentExplanation: 'Mueve una expresión al principio para darle peso: entonces la frase se da la vuelta como una pregunta.',
    meaningFirst:
      'Di una frase plana y luego la versión enfática, y pregunta cuál sonó más importante. El énfasis se oye antes de analizarse.',
    correctionMethod:
      'Señala que el giro es toda la señal: sin él, el énfasis se lee como un error y no como una elección. Y que lo diga a buen ritmo, porque una inversión dubitativa suena peor que ninguna.',
    fallback: 'Quédate en las frases escindidas («What I mean is…»): mismo efecto, sin inversión.',
    extension: 'Añade «Only when…», «Little did I know…» y la repetición retórica, y que lo suelte como un pequeño discurso.',
  },
  g_hedging_register: {
    title: 'Registro, atenuación e inglés diplomático',
    tutorExplanation:
      'El mismo contenido suena brusco o diplomático según los atenuadores («it seems», «I’d suggest», «that may not be quite right»), los modales prudentes y las negaciones suavizadas («not ideal» en vez de «bad»). Aquí es donde se juzga profesionalmente a un hablante de C1.',
    studentExplanation: 'Puedes decir lo mismo más suave o más directo, según con quién hables.',
    meaningFirst:
      'Suelta una frase brusca y pídele que se imagine diciéndosela a su jefe. La incomodidad es el objetivo, y entonces le das la versión diplomática.',
    correctionMethod: 'No lo marques nunca como error: es una elección. Ofrece el otro registro, di a qué situación le va y deja que elija.',
    fallback: 'Trabaja solo con tres atenuadores: «I think», «maybe», «it seems».',
    extension: 'Añade la dimensión cultural: en qué se diferencia la franqueza de su lengua y la del inglés americano, y cuándo ser directo es lo correcto.',
  },
}

export default grammar
