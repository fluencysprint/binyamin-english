/* ==========================================================================
   Guía para el tutor — español.
   --------------------------------------------------------------------------
   Se traduce todo lo que el tutor lee COMO INSTRUCCIÓN. El inglés que el
   alumno tiene que oír y decir —ejemplos, palabras, pares mínimos, tareas—
   se queda en inglés en todos los idiomas.
   ========================================================================== */

import { Dict } from '../../i18n/dict'

const guide: Dict = {
  title: {
    patternFocus: 'Corrigiendo: «{{better}}»',
    plain: '{{title}}',
    focus: 'Foco: {{title}}',
    again: 'Otra vez: {{title}}',
    pronMoment: 'Momento de pronunciación',
    usefulWords: 'Palabras útiles',
    recurringReview: 'Repaso de errores que se repiten',
    langPronReview: 'Repaso de lengua y pronunciación',
    extendedTask: 'Tarea de conversación ampliada',
    deepConversation: 'Conversación a fondo',
    precisionCorrections: 'Correcciones de precisión',
    consolidation: 'Consolidación',
    vocabPronConsolidation: 'Consolidación de vocabulario y pronunciación',
    successRecap: 'Repaso de logros',
    recapOneWin: 'Repaso y un logro',
    phrase: {
      recall: 'Volvemos a lo de antes',
      meet: 'Nuevo: {{phrases}}',
      use: 'Cambiamos las palabras: {{phrases}}',
      exchange: 'Lo juntamos todo',
      realUse: 'Uso real',
      close: 'Lo que ya sabes decir',
    },
  },

  objective: {
    pattern:
      'Ha dicho «{{example}}» en {{lessons}} clases distintas. No hay ningún concepto en la biblioteca de gramática que lo enseñe, así que se trabaja como un hábito: contraste, práctica, uso.',
    recurringGrammar: 'Error de gramática que se repite: {{times}} veces (por ejemplo, «{{example}}»).',
    noticedOnce: 'Error de gramática visto una sola vez hasta ahora (por ejemplo, «{{example}}»).',
    pronunciation: 'La pronunciación de «{{title}}» dificulta entenderle: merece práctica específica.',
    spacedReview: 'Repaso espaciado: toca volver a «{{title}}» para que quede asentado.',
    naturalNext: 'El siguiente paso natural para un nivel cercano a {{level}}.',
    pronStaple: 'Una pronunciación clara siempre merece práctica.',
    firstLesson: 'Un foco acorde al nivel mientras descubres cómo habla de verdad.',
    c1: {
      title: 'Entrenamiento avanzado de comunicación',
      rationale: 'En un C1 sólido la clase pasa a conversación larga y precisa, con comentarios sobre matices.',
    },
    c1First:
      'A este nivel la clase es conversación larga y precisa con comentarios finos, no gramática de repaso.',
    beginner: {
      P0: {
        title: 'Primer inglés hablado: saludar, tu nombre, sí / no',
        rationale: 'Empezamos por la base: inglés hablado útil, escucha y pronunciación antes de leer nada.',
      },
      P1: {
        title: 'Primeras palabras y frases del día a día',
        rationale: 'Construimos un pequeño repertorio de palabras y frases frecuentes, con mucha escucha y repetición.',
      },
      P2: {
        title: 'Comunicación incipiente y primeras letras',
        rationale: 'Seguir instrucciones sencillas, intercambios cortos y reconocer los primeros sonidos y letras.',
      },
      P3: {
        title: 'Camino al A1: frases sencillas y primera lectura',
        rationale: 'Usar frases sencillas con apoyo y empezar a leer palabras muy conocidas.',
      },
    },
  },

  /* The ten phrase-curriculum units, and what each one buys the learner. */
  unit: {
    1: {
      title: 'Cuando conoces a alguien',
      can: 'Al final: saben saludar, dar las gracias y despedirse sin ayuda.',
    },
    2: {
      title: 'Cuando no entiendes',
      can: 'Al final: saben parar una conversación y pedir ayuda en vez de asentir sin más.',
    },
    3: {
      title: 'Presentarte',
      can: 'Al final: saben decir su nombre y de dónde son, y devolver la pregunta.',
    },
    4: {
      title: 'Hablar de ti',
      can: 'Al final: saben decir qué les gusta, qué tienen y a qué se dedican.',
    },
    5: {
      title: 'Pedir lo que necesitas',
      can: 'Al final: saben pedir algo con educación y también rechazarlo con educación.',
    },
    6: {
      title: 'Hacer preguntas',
      can: 'Al final: saben preguntar qué, dónde, quién, cuánto y qué hora es.',
    },
    7: {
      title: 'Acciones del día a día',
      can: 'Al final: saben decir qué están haciendo, qué pueden hacer y qué no.',
    },
    8: {
      title: 'Mantener la conversación',
      can: 'Al final: saben reaccionar, estar de acuerdo, discrepar y devolver la pregunta.',
    },
    9: {
      title: 'Fuera, en la vida real',
      can: 'Al final: saben comprar algo, preguntar el camino y decir que algo va mal.',
    },
    10: {
      title: 'Quedar con alguien',
      can: 'Al final: saben proponer una hora, aceptar un plan y rechazarlo con amabilidad.',
    },
  },

  defaults: {
    help: 'Dilo tú una vez y devuélvele el turno enseguida.',
    challenge: 'Pídele uno más, sobre algo personal suyo.',
    studentDoes: {
      warmup: 'Habla con soltura de algo fácil, sin presión de precisión.',
      speakingListening: 'Responde en voz alta, con frases completas cuando puede.',
      listening: 'Escucha y responde señalando, eligiendo o haciendo: no hace falta que hable.',
      reading: 'Lee en voz alta o en silencio y luego te cuenta qué decía.',
      writing: 'Escribe en papel mientras tú te callas.',
      microLesson: 'Mira y escucha, y luego prueba una vez la estructura nueva.',
      guidedPractice: 'Produce la estructura varias veces con tus indicaciones.',
      communication: 'Habla la mayor parte del tiempo. Tú eres el público, no el protagonista.',
      fluency: 'Habla sin parar durante un tiempo fijo y luego lo cuenta otra vez en menos tiempo.',
      pronunciation: 'Escucha, mira tu boca y repite en voz alta.',
      vocabulary: 'Usa la palabra nueva en una frase suya.',
      feedback: 'Escucha y repite una vez la versión mejorada.',
    },
    doneWhen: {
      warmup: 'Ha dicho unas cuantas frases y se le ve cómodo.',
      speakingListening: 'Ha respondido a tres o cuatro preguntas sin quedarse en blanco.',
      listening: 'Responde bien a lo que oye dos o tres veces seguidas.',
      reading: 'Sabe contarte la idea principal con sus palabras.',
      writing: 'Ha escrito algo que puede leerte en voz alta.',
      microLesson: 'Ha producido la estructura una vez, bien, con ayuda.',
      guidedPractice: 'La produce tres veces con muy poca ayuda.',
      communication: 'Ha hablado durante un buen rato y el tema está realmente agotado.',
      fluency: 'La última ronda suena claramente más fluida que la primera.',
      pronunciation: 'El sonido se oye claramente mejor que al empezar el paso.',
      vocabulary: 'Usa la palabra en una frase nueva sin que se lo pidas.',
      feedback: 'Ha oído un acierto concreto y un foco concreto para la próxima vez.',
    },
  },

  card: {
    pattern: {
      goal: 'Sustituir un hábito: que le salga «{{better}}» sin pensarlo.',
      explain:
        'No expliques una regla. Ha dicho «{{said}}»: di las dos versiones, deja que elija la inglesa y luego haz que produzca «{{better}}» hasta que le salga solo.',
      avoid: [
        'No expliques la gramática si no te la piden. Es un hábito, no un vacío de conocimiento.',
        'No corrijas cada vez durante la conversación: anótalo y vuelve a ello al final.',
      ],
    },
    grammar: {
      goal: 'Enseñar: {{title}}. {{explanation}}',
      stepBack: 'Baja un escalón a: {{title}}.',
      struggleDefault: 'Dale el esqueleto de una frase y modélalo despacio.',
      extend: 'Amplía hacia: {{title}}.',
      succeedDefault: 'Pídele que lo use en una frase sobre sí mismo.',
      avoid: 'Explicaciones largas de gramática: que lo note, dale el modelo y déjale usarlo.',
    },
    pron: {
      goal: 'Pronunciación: {{title}}. {{why}}',
      struggle: 'Baja el ritmo, exagera el sonido, usa un espejo y vuelve luego a velocidad normal.',
      succeed: 'Pasa de palabras sueltas a una frase entera y luego a conversación libre.',
      contrast: 'Contraste: {{a}} / {{b}}',
      avoid: 'Hablar de «puntuación»: fíate de tu oído y de una valoración con palabras.',
    },
    warmup: {
      '6-8': {
        goal: 'Romper el hielo, oír hablar al niño y mantenerlo en clave de juego.',
        listenFor: ['palabras sueltas claras', 'ganas de intentarlo', 'confianza'],
        ifStruggle: 'Señala, dilo con él y deja que te copie.',
        ifSucceed: 'Haz una sola pregunta de seguimiento sencilla.',
        howToExplain: 'Modela una frase corta que pueda copiar.',
        avoid: ['Instrucciones largas: corto y cálido.'],
      },
      '9-12': {
        goal: 'Entrar poco a poco y oír cómo habla en el día a día.',
        listenFor: ['longitud de las frases', 'marcadores de tiempo', 'formas verbales'],
        ifStruggle: 'Dale el principio de una frase para arrancar.',
        ifSucceed: 'Pregunta «¿Por qué?» una vez para alargar la respuesta.',
        howToExplain: 'Ofrece la forma natural y deja que la repita él.',
        avoid: ['Corregirlo todo: escucha y toma nota.'],
      },
      '13-17': {
        goal: 'Crear confianza a partir de intereses reales y oír su fluidez.',
        listenFor: ['amplitud de vocabulario', 'naturalidad', 'confianza'],
        ifStruggle: 'Ofrece dos opciones en vez de una pregunta abierta.',
        ifSucceed: 'Pregunta «What do you like about it?» para alargar.',
        howToExplain: 'Añade un motivo con «because».',
        avoid: ['Sonar a profesor examinándole.'],
      },
      adult: {
        goal: 'Arranque relajado; oír habla encadenada y natural.',
        listenFor: ['control de los tiempos verbales', 'fluidez', 'muletillas'],
        ifStruggle: 'Haz una pregunta concreta de una cosa o la otra.',
        ifSucceed: 'Pregunta por detalles y por su opinión.',
        howToExplain: 'Enlaza ideas con «and», «but», «so».',
        avoid: ['Ponerte a corregir desde el primer minuto.'],
      },
    },
    speaking: {
      goal: 'Habla y escucha adaptadas. Tantea presente, pasado, futuro, descripción y opinión.',
      listenFor: ['control de los tiempos', 'forma de las preguntas', 'variedad', 'sonidos que anotar para después'],
      ifStruggle: 'Simplifica a preguntas de sí/no; dale el principio de la frase.',
      ifSucceed: 'Pide motivos, detalles y una hipótesis («What would you…?»).',
      howToExplain: 'Sin términos de gramática: simplemente modela la forma correcta.',
      avoid: ['Hablar más que el alumno.'],
    },
    feedback: {
      goal: 'Dar comentarios concretos y alentadores y fijar el siguiente foco.',
      listenFor: [],
      ifStruggle: 'Quédate con una sola prioridad clara; termina con una virtud real.',
      ifSucceed: 'Di exactamente qué mejoró: «hoy el pasado te ha salido preciso».',
      howToExplain: 'Concreto y sincero, nunca un elogio genérico.',
      avoid: ['Elogios vagos tipo «muy bien» sin ningún detalle.'],
    },
    fluency: {
      goal: 'Fluidez, no precisión. El mismo contenido contado una y otra vez con menos tiempo, hasta que salga solo. Aquí no se enseña nada nuevo.',
      listenFor: [
        'Pausas largas en mitad de la frase: ¿hay menos en cada ronda?',
        'Reinicios y autocorrecciones: ¿desaparecen en la última ronda?',
        '¿La segunda ronda dice MÁS que la primera, en menos tiempo?',
      ],
      ifStruggle: 'Dale el mismo tiempo otra vez, no uno más corto. La medicina es la repetición, no la presión.',
      ifSucceed: 'Pon una restricción en la última ronda: nada de «and then», o un detalle nuevo.',
      howToExplain: 'Díselo claro: la misma historia cada vez, menos tiempo cada vez. Debe resultar más fácil, no más difícil.',
      avoid: [
        'Corregir nada a mitad de ronda. Interrumpir una ronda destruye el ejercicio.',
        'Cambiar de tema entre rondas: todo el beneficio viene de repetir la misma.',
      ],
      shape: 'Ronda 1: con calma. Ronda 2: lo mismo, algo más rápido. La última: fluida, sin parones.',
      rounds2: 'Dos rondas: la segunda más rápida y con un detalle más.',
      rounds3: 'Tres rondas: el mismo contenido, más apretado cada vez.',
    },
    c1Review: {
      goal: 'Asentar los puntos de lengua y pronunciación que se repiten.',
      listenFor: ['Cualquier desliz de las clases recientes.'],
      ifStruggle: 'Modélalo una vez más y sigue: que quede ligero.',
      ifSucceed: 'Anótalo como mejora y sube el listón.',
      howToExplain: 'Ofrece la versión más natural y deja que la repita él.',
      avoid: ['Convertir el repaso en una charla larga.'],
    },
    c1Communication: {
      goal: 'Conversación larga y con matices. Él lleva la voz; tú das forma.',
      listenFor: ['precisión', 'combinaciones naturales de palabras', 'registro', 'entonación para enfatizar'],
      ifStruggle: 'Dale un apoyo o un ángulo más afilado y hazte a un lado.',
      ifSucceed: 'Añade una restricción (tiempo, palabra prohibida, postura contraria).',
      howToExplain: 'Señala mejoras exactas: «aquí “significant” encaja mejor que “big”».',
      avoid: ['Volver a ejercicios de libro de texto a este nivel.'],
    },
    beginnerRecap: {
      goal: 'Asentar lo de hoy y terminar con un logro real.',
      listenFor: ['Si recuerda las palabras y frases del día'],
      ifStruggle: 'Repasa solo dos cosas, con imágenes.',
      ifSucceed: 'Pídele que te enseñe a ti una palabra.',
      howToExplain: 'Cálido, corto y concreto.',
      avoid: ['Elogios vagos: di qué salió bien exactamente.'],
    },
    phrase: {
      avoid: [
        'Explicar gramática. La frase es una sola pieza hasta mucho después de esta etapa.',
        'Corregir durante el minuto de uso real: es la única parte de la clase donde la fluidez manda sobre la precisión.',
        'Marcar «lo dijo solo» algo que dijiste tú antes. Esa sola costumbre volvería falso todo lo que el alumno ve en su pantalla.',
      ],
      recall: {
        goal: 'Averiguar qué ha sobrevivido a la semana antes de añadir nada.',
        howToExplain: '«Vamos a ver qué te queda. Yo doy el significado y tú das el inglés.»',
      },
      meet: {
        goal: 'Primer contacto: entienden la frase y la oyen dicha como es.',
        howToExplain: 'Muestra el momento en que se usa. La frase es una sola pieza: nunca expliques sus partes.',
      },
      use: {
        goal: 'Convertir una frase en una estructura que puedan rellenar con sus palabras.',
        howToExplain: '«El principio no cambia. Solo cambia el final.» Enséñalo, no le pongas nombre.',
      },
      exchange: {
        goal: 'Hacer que las frases de hoy funcionen como conversación, no como lista.',
        howToExplain: '«Yo digo esto, tú dices aquello.» Luego cambiad, para que lleven las dos mitades.',
      },
      realUse: {
        goal: 'Ver a qué frases recurren cuando nadie se lo pide.',
        howToExplain: 'Aquí no expliques nada. Haz una pregunta de verdad y deja que enseñe el silencio.',
      },
      close: {
        goal: 'Dejarles una cosa cierta que ya saben decir, y anotar lo que has visto.',
        howToExplain: '«La semana pasada no tenías nada de esto. Hoy has dicho estas.» Devuélveles las frases dichas.',
      },
    },
  },

  auto: {
    grammar: {
      do: 'Modélalo una vez y que lo pruebe él en una frase suya.',
      nextHarder: 'Le sale bien → pulsa Más difícil ({{title}})',
      nextHarderDefault: 'Le sale bien → que lo use en una frase sobre sí mismo',
      nextClose: 'Cerca pero inseguro → modélalo una vez más y vuelve a intentarlo',
      nextEasier: 'Sigue atascado → pulsa Más fácil ({{title}})',
      nextEasierDefault: 'Sigue atascado → dale el esqueleto de una frase y sigue adelante',
    },
    pron: {
      do: 'Dilo despacio y exagerado, luego a velocidad normal, y que copie las dos versiones.',
      lookForPair: '¿Oye la diferencia entre «{{a}}» y «{{b}}»?',
      next: [
        'Claro → pasa a una frase entera y luego a conversación libre',
        'Cerca → repite la palabra dos o tres veces más',
        'Todavía no → anótalo, sigue y vuelve en la próxima clase',
      ],
    },
    warmup: {
      followUps: 'Si la respuesta es corta: «{{a}}» o «{{b}}»',
      '6-8': {
        do: ['Sonríe, mantén el contacto visual y señala cosas mientras preguntas.'],
        lookFor: ['Cualquier intento de responder en inglés, aunque sea una palabra.'],
        next: [
          'Responde con soltura → pasa a la clase',
          'Necesita ayuda → señala o gesticula la respuesta con él',
          'Se queda callado → responde tú y sigue con calidez',
        ],
        teacherTip: 'Aquí importa el vínculo, no la corrección: mantenlo ligero.',
      },
      '9-12': {
        do: ['Escúchale hasta el final antes de responder; asiente mientras habla.'],
        lookFor: ['Longitud de las frases', 'si añade una segunda frase sin que se la pidas'],
        next: [
          'Habla con soltura → pasa a la clase',
          'Responde con una palabra → haz una pregunta fácil de seguimiento',
          'Se atasca → dale el principio de una frase y sigue',
        ],
      },
      '13-17': {
        do: ['Trátalo como una conversación de verdad, no como un examen.'],
        lookFor: ['Amplitud de vocabulario', 'confianza', 'frases naturales o traducidas'],
        next: [
          'Está metido y habla → pasa a la clase',
          'Respuestas cortas → ofrécele una elección («¿A o B?»)',
          'Se resiste → déjalo, sigue e inténtalo otro día',
        ],
      },
      adult: {
        do: ['Escucha buscando un hilo real del que tirar.'],
        lookFor: ['Control de los tiempos', 'fluidez', 'un detalle por el que valga la pena preguntar'],
        next: [
          'Habla con facilidad → pasa a la clase',
          'Contesta breve → haz una pregunta concreta de seguimiento',
          'Viene cansado o con prisa → hazlo corto y sigue',
        ],
      },
    },
    speaking: {
      do: ['Haz una pregunta y espera: no llenes tú el silencio.'],
      lookFor: ['control de los tiempos', 'forma de las preguntas', 'un sonido que anotar para después'],
      next: [
        'Responde con facilidad → pide un motivo o una hipótesis («What would you…?»)',
        'Le cuesta → simplifica a sí/no o dale el principio de la frase',
        'Se queda callado → responde tú como modelo y devuélvele el turno',
      ],
    },
    reading: {
      nonreader: {
        do: ['Señala la letra, di el sonido y señala el dibujo.'],
        lookFor: ['¿Asocia el sonido con el dibujo, aunque sea con ayuda?'],
        next: [
          'Acierta con seguridad → prueba una segunda letra',
          'Necesita ayuda → hazlo con él una vez más',
          'Está perdido → pasa solo a escuchar y deja la lectura para más adelante',
        ],
      },
      beginner: {
        do: ['Ve señalando debajo de cada palabra; si se atasca, dásela a los dos o tres segundos.'],
        lookFor: ['Si descifra sonido a sonido o reconoce de memoria', '¿se corrige solo?'],
        next: [
          'Lee con soltura → hazle la pregunta de comprensión',
          'Lento pero correcto → déjale terminar y elogia el esfuerzo',
          'Va adivinando → leedlo en voz alta juntos y que lo repita',
        ],
      },
      intermediate: {
        do: ['Déjale leer primero en silencio; no corrijas la pronunciación mientras lee.'],
        lookFor: ['¿Capta el sentido general, no solo palabras sueltas?'],
        next: [
          'Idea principal clara → haz una pregunta de detalle',
          'Vago → pregunta «What happens first?»',
          'No lo ha pillado → releed juntos una frase y volved a intentarlo',
        ],
      },
      advanced: {
        do: ['Déjale releer la frase clave si quiere.'],
        lookFor: ['Inferencia, no solo comprensión literal', '¿sabe señalar la pista?'],
        next: [
          'Capta lo implícito → pregúntale qué pista se lo indicó',
          'Cerca → señálale la frase clave y vuelve a preguntar',
          'No lo ve → explícale la inferencia y sigue',
        ],
      },
    },
    writing: {
      early: {
        do: ['Escríbele tú la plantilla si hace falta; que rellene él el hueco.'],
        lookFor: ['Trazo de las letras', '¿sabe qué pone después de escribirlo?'],
        next: [
          'Lo escribe → que te lo lea en voz alta',
          'Necesita un modelo → escribidlo juntos una vez y que lo copie',
        ],
      },
      beginner: {
        do: ['Dale un rato de silencio; no le vigiles letra a letra.'],
        lookFor: ['Estructura básica de la frase', 'ortografía de las palabras frecuentes'],
        next: [
          'Tres frases claras → elige una para decirla en voz alta',
          'Una o dos → está bien, elogia lo que hay',
          'Se atasca → dale el principio de una frase',
        ],
      },
      intermediate: {
        do: ['Recuérdale un conector (and / but / so) si se queda parado.'],
        lookFor: ['Conectores bien usados', 'una idea clara y bien enlazada'],
        next: [
          'Bien enlazado → pídele que añada un motivo más',
          'Frases sueltas → muéstrale dónde «and» o «so» unirían dos ideas',
        ],
      },
      advanced: {
        do: ['Déjale pensar un minuto en silencio antes de escribir.'],
        lookFor: ['Una postura clara', 'un contraargumento real, no más apoyo a lo mismo'],
        next: [
          'Postura clara y contraargumento real → anótalo como trabajo sólido',
          'Postura sin contraargumento → pregunta «What would someone who disagrees say?»',
        ],
      },
    },
    communication: {
      now: 'Conversación de verdad: habla él, tú escuchas y mantienes el hilo.',
      interest: 'Si encaja, lleva esto hacia {{interest}}: le importa de verdad.',
      do: [
        'Haz la pregunta y quédate callado: el silencio lo llena él, no tú.',
        'Preguntas listas para este tema: «{{follow1}}» · «{{follow2}}» · «{{follow3}}»',
      ],
      studentDoes: ['Habla la mayor parte del tiempo: varias frases seguidas, no respuestas de una palabra.'],
      lookFor: ['¿Desarrolla la idea o responde con una palabra?', '¿Se le acaba lo que decir?'],
      help: ['Da tú una respuesta corta como modelo y devuélvele el turno con «{{follow4}}»'],
      challenge: ['Pide más hondura: «{{generic}}»'],
      doneWhen: 'Ha hablado en tramos largos de verdad y el tema está realmente agotado.',
      next: [
        'Habla con facilidad → sigue tirando: «{{follow1}}»',
        'Se está apagando → «{{follow2}}»',
        'Atascado → «{{follow3}}», o da tú una respuesta corta como modelo',
      ],
    },
    fluency: {
      clock: 'Tienes {{seconds}} segundos. Empieza cuando quieras.',
      now: 'Sprint de fluidez: la misma historia, contada otra vez con menos tiempo en cada ronda.',
      do: [
        'Cronométralo en voz alta o con el móvil. Mientras habla, no digas absolutamente nada.',
        'Entre rondas, un elogio y cero correcciones.',
      ],
      studentDoes: ['Habla sin parar toda la ronda y luego lo repite en menos tiempo.'],
      lookFor: [
        'Menos pausas largas en cada ronda.',
        'Menos reinicios: «I went… no, I was going…» debería ir desapareciendo.',
        'Más contenido en menos tiempo al llegar a la última ronda.',
      ],
      help: ['Repite el mismo tiempo en vez de acortarlo, o déjale anotar unas palabras antes de la primera ronda.'],
      challenge: ['Última ronda en {{last}} segundos y sin muletillas.'],
      doneWhen: 'La última ronda ({{last}} s) suena claramente más fluida que la primera.',
      next: [
        'Más fluido en cada ronda → di exactamente qué ha mejorado y sigue',
        'Igual que la primera → haz otra ronda con el MISMO tiempo, no menos',
        'Se le ha acabado el material → acorta el tiempo y mantén el tema',
      ],
      teacherTip: 'No digas nada mientras habla. Tu silencio es el ejercicio.',
    },
    vocabulary: {
      do: ['Apuntadla juntos en cuanto salga: no esperes al final.'],
      lookFor: ['¿Sabe volver a usarla, por su cuenta, en otra frase?'],
      next: [
        'La usa bien → pulsa Añadir palabra para guardarla',
        'Insegura → decidla juntos una vez más y guárdala igual',
        'No se le ocurre nada → propón tú una de la conversación',
      ],
    },
    feedback: {
      do: ['Elige exactamente una cosa que salió bien y una para la próxima vez: nada de listas.'],
      lookFor: ['¿Se le nota que reconoce el ejemplo concreto que le has dado?'],
      next: ['Cierra la clase: sin ramificaciones. Dilo y pasa al cierre.'],
    },
    c1Review: {
      do: ['Ofrece una vez la versión más natural y que la repita él en una frase nueva.'],
      lookFor: ['Deslices que vienen arrastrándose de clases recientes.'],
      next: [
        'Lo corrige fácil → sigue y anótalo como mejora',
        'Sigue inseguro → un modelo más y déjalo por hoy',
        'Ahora mismo no se repite nada → pasa directo a la conversación',
      ],
    },
    c1Communication: {
      do: ['Interrumpe solo para subir el nivel: una palabra más precisa, un ángulo más duro, una restricción.'],
      lookFor: [
        'Precisión y registro (esta tarea es de tipo «{{category}}»), no solo corrección.',
        '¿Va a por la palabra fácil o a por la exacta?',
      ],
      next: [
        'Fluido y preciso → sube el listón: «{{follow1}}»',
        'Bien pero genérico → pide matiz: «{{follow2}}»',
        'Se apaga → «{{follow3}}», o añade una restricción (palabra prohibida, tiempo, postura contraria)',
      ],
    },
    c1Feedback: {
      do: ['Da dos o tres mejoras precisas, no una lista larga: a este nivel manda la calidad.'],
      lookFor: ['¿Ve enseguida por qué la alternativa es mejor?'],
      next: ['Cierra la clase: sin ramificaciones. Dilo y pasa a la consolidación.'],
    },
    c1Consolidation: {
      do: ['Elige dos o tres palabras o giros precisos de la conversación, más un punto de pronunciación.'],
      lookFor: ['¿Reproduce la versión precisa sin que se la recuerdes?'],
      next: [
        'La reproduce → anótala como aprendida',
        'Necesita el modelo otra vez → dilo una vez más y guárdala igual',
      ],
    },
    beginnerRecap: {
      child: {
        do: ['Celébralo con calidez. Repasa dos o tres palabras con imágenes.', 'Si hay un adulto delante, cuéntale un logro concreto.'],
        lookFor: ['¿Recuerda dos o tres cosas de hoy?', '¿Se va con sensación de haberlo conseguido?'],
        next: [
          'Recuerda con facilidad → la próxima clase puede avanzar de etapa',
          'Recuerda con ayuda → repite contenido parecido',
          'Recuerda muy poco → quédate con este contenido y ve más despacio',
        ],
        teacherTip: 'Termina cada clase de principiante con un logro real. La confianza también es programa.',
      },
      adult: {
        do: ['Nombra un logro concreto.', 'Anota una cosa para practicar la próxima vez.'],
        lookFor: ['¿Recuerda dos o tres cosas de hoy?', '¿Se va con sensación de haberlo conseguido?'],
        next: [
          'Recuerda con facilidad → la próxima clase puede avanzar de etapa',
          'Recuerda con ayuda → repite contenido parecido',
          'Recuerda muy poco → quédate con este contenido y ve más despacio',
        ],
        teacherTip: 'Termina cada clase de principiante con un logro real. La confianza también es programa.',
      },
    },
  },

  step: {
    pattern: {
      notice: {
        now: 'Dos versiones de la misma frase. Deja que descubra cuál es la inglesa.',
        say: 'Escucha: «{{said}}» … «{{better}}». ¿Cuál te suena bien?',
        do: [
          'Di las dos a la misma velocidad y con el mismo volumen. No marques la correcta.',
          'Luego espera. Deja que elija antes de decir nada más.',
        ],
        studentDoes: ['Escucha las dos, elige una y la dice en voz alta.'],
        lookFor: '¿Oye alguna diferencia? De eso depende cuánto va a durar esto.',
        help: ['Di la versión correcta dos veces sola y vuelve a preguntar.'],
        challenge: ['Pregúntale qué ha cambiado exactamente entre las dos.'],
        doneWhen: 'Elige la versión inglesa y la dice una vez.',
        next: 'A practicar: que diga la versión correcta y la use en una frase suya.',
      },
    },
    grammar: {
      meaning: {
        now: 'Enseña QUÉ significa «{{title}}»: todavía sin regla ni terminología.',
        studentDoes: ['Mira y escucha. Todavía no tiene que producir nada.'],
        lookFor: ['Un destello de reconocimiento: un gesto, una repetición, una respuesta en su idioma.'],
        help: ['Haz la situación más concreta: un objeto real, un dibujo, un gesto.'],
        challenge: ['Pídele un segundo ejemplo de la misma situación sacado de su vida.'],
        doneWhen: 'Demuestra que entiende la situación, en el idioma que sea.',
        next: 'Dar el modelo dos veces.',
      },
      model: {
        now: 'Da el modelo: dilo, no lo expliques.',
        do: [
          'Di cada ejemplo dos veces: una a velocidad normal y otra despacio.',
          'Todavía no le pidas que repita: deja que lo oiga.',
        ],
        studentDoes: ['Escucha. Repite solo si le apetece.'],
        lookFor: ['¿Está escuchando o ya intenta decirlo? Las dos cosas están bien.'],
        help: ['Quédate con un solo ejemplo y dilo cuatro veces.'],
        challenge: ['Añade un cuarto ejemplo más cercano a su vida real.'],
        doneWhen: 'Ha oído la estructura al menos tres veces.',
        next: 'Hacer la pregunta que le hace fijarse.',
      },
      notice: {
        now: 'Que descubra ÉL el patrón. No se lo digas.',
        do: [
          'Haz la pregunta y quédate callado. Cuenta hasta cinco por dentro.',
          'Si un término ayuda, que quepa en una frase sencilla.',
        ],
        studentDoes: ['Piensa y luego dice de qué se ha dado cuenta, en el idioma que sea.'],
        lookFor: ['¿Sabe señalar qué ha cambiado, aunque no sepa cómo se llama?'],
        help: 'Di dos ejemplos seguidos y pregunta qué cambia. O díselo sin más: {{explanation}}',
        challenge: ['Pídele que adivine un cuarto ejemplo antes de que lo digas tú.'],
        doneWhen: 'Sabe señalar qué es lo que cambia, lo formule como lo formule.',
        next: 'Pasar a la práctica guiada.',
      },
      guided: {
        now: 'Práctica guiada: produce él, tú vas dando pie.',
        do: ['Da una consigna cada vez.', 'Espera. Solo interviene si lleva más de unos cinco segundos parado.'],
        studentDoes: ['Dice cada respuesta en voz alta, con una frase completa.'],
        lookFor: ['Precisión en la estructura del día: lo demás ahora da igual.'],
        doneWhen: 'Acierta tres veces seguidas con muy poca ayuda.',
        next: 'Pasar al uso real: una pregunta que de verdad quiera responder.',
      },
      realUse: {
        now: 'Uso real: la misma estructura, pero sobre su vida.',
        do: ['Pregunta y escucha. No corrijas a mitad de frase.', 'Anota lo que merezca la pena ver en el paso de comentarios.'],
        studentDoes: ['Habla de algo real y usa la estructura nueva cuando encaja.'],
        lookFor: ['¿Aparece la estructura sola, sin que se la pidas?', '¿Está pensando en el contenido y no en la forma?'],
        help: ['Dale el principio de una frase y que la termine él.'],
        challenge: 'Pide un motivo y luego una hipótesis.',
        challengeHarder: 'Empuja hacia {{title}}.',
        doneWhen: 'Ha usado la estructura al menos una vez comunicando de verdad.',
        next: 'Dar un comentario concreto.',
      },
      feedback: {
        now: 'Una corrección. No una lista.',
        do: 'Elige el ÚNICO error que de verdad estorbaba. El resto, hoy no.',
        studentDoes: ['Dice una vez, bien, la versión mejorada.'],
        lookFor: ['¿La repite con precisión?', '¿Se le ve animado y no hundido?'],
        help: 'Déjalo pasar por hoy y anótalo.',
        helpEasier: 'Mejor bajar a {{title}} la próxima clase que insistir ahora.',
        challenge: ['Pídele que use la forma corregida enseguida en una frase nueva.'],
        doneWhen: 'Ha dicho la versión mejorada una vez, en voz alta.',
        next: 'Valorar cómo ha ido y pasar a la siguiente actividad.',
      },
    },
    pron: {
      meaning: {
        now: 'Enseña por qué {{title}} merece dos minutos.',
        forThisLearner: 'Para este alumno en concreto: {{note}}',
        studentDoes: ['Escucha buscando la diferencia. Todavía no dice nada.'],
        lookFor: ['¿Oye siquiera que son dos cosas distintas?'],
        help: ['Exagera las dos hasta que la diferencia sea imposible de no oír, y luego redúcela.'],
        challenge: ['Di una de las dos al azar y que te diga cuál era.'],
        doneWhen: 'Distingue las dos de oído tres veces seguidas.',
        next: 'Enseñarle cómo se hace el sonido.',
      },
      model: {
        now: 'Modela el sonido con la boca a la vista.',
        do: 'Ponte de frente. Exagera una vez y luego dilo normal.',
        studentDoes: ['Mira tu boca y luego copia en voz alta.'],
        lookFor: ['Primero la posición de la boca, después el sonido.', '¿Está dispuesto a hacer el ridículo? Eso ayuda.'],
        help: ['Usa un espejo para que vea su boca junto al modelo.'],
        challenge: ['Pasa directamente a la palabra dentro de una frase.'],
        doneWhen: 'Produce el sonido de forma reconocible aislado.',
        next: 'Contrastarlo con el sonido por el que lo suele sustituir.',
      },
      guided: {
        now: 'Contrastar y repetir: pares, luego palabras, luego una frase.',
        do: ['Alterna el par y luego déjale llevar a él.', 'Pasa a la frase entera solo cuando la palabra esté firme.'],
        studentDoes: ['Dice los pares, luego las palabras, luego una frase entera.'],
        help: ['Vuelve a palabras sueltas. Vale más una palabra clara que una frase turbia.'],
        doneWhen: 'El sonido es claro dentro de una frase entera, no solo aislado.',
        next: 'Grabar la versión mejorada como prueba.',
      },
      record: {
        now: 'Deja constancia: su propio antes y después.',
        do: 'Pon la grabación inicial y la nueva seguidas. Deja que las oiga y dile qué oyes TÚ.',
        studentDoes: ['Graba una muestra y luego escucha las dos.'],
        lookFor: ['¿Oye ÉL la diferencia? Eso importa más que si la oyes tú.'],
        help: ['Si grabar le corta, sáltatelo. Basta con decirle qué ha mejorado.'],
        challenge: ['Grabar una frase a velocidad natural en vez de una dicha con cuidado.'],
        doneWhen: 'Ha oído su propio antes y después.',
        next: 'Valorarlo de oído y seguir.',
      },
      realUse: {
        now: 'Usarlo en conversación real, que es donde cuenta.',
        do: ['Déjale hablar. Fíjate en el sonido en silencio: no interrumpas para corregirlo.'],
        studentDoes: ['Mantiene una conversación real y el sonido va apareciendo solo.'],
        lookFor: ['¿Aguanta el sonido a velocidad de conversación?', 'Que se le entienda importa más que la perfección.'],
        help: ['Redúcelo a una sola frase que controle.'],
        challenge: ['Sube el ritmo o mete un tema que distraiga para que no pueda pensar en el sonido.'],
        doneWhen: 'Ha hablado libremente un buen rato y el sonido se ha mantenido casi siempre.',
        next: 'Valorar el sonido y seguir.',
      },
    },
    fluency: {
      round: {
        now: 'Ronda {{round}} de {{count}}: {{seconds}} segundos, el mismo tema.',
        timer: 'Pon un cronómetro de {{seconds}} segundos donde él lo vea.',
        silence: 'No digas absolutamente nada mientras habla. Ni siquiera «ajá».',
        noteGood: 'Anota una cosa concreta que haya estado bien: se la dirás entre rondas.',
        betweenRounds: 'Entre rondas: una frase de elogio y cero correcciones.',
        studentDoes: 'Habla sin parar {{seconds}} segundos sobre el mismo tema.',
        lookForFirst: [
          '¿Cuánto contenido hay? Ese es el punto de partida para la ronda siguiente.',
          '¿Dónde caen las pausas largas?',
        ],
        lookForLater: ['¿Menos pausas largas que en la ronda anterior?', '¿Menos reinicios y autocorrecciones?'],
        lookForMiddle: '¿Ha aparecido algún detalle que antes no estaba?',
        lookForFinal: '¿Suena por fin cómodo al hablar?',
        helpFirst: 'Déjale apuntar antes tres palabras en papel. Notas sí; leer un texto en voz alta no.',
        helpLater: 'Repite el MISMO tiempo en vez de uno más corto. La medicina es la repetición, no la presión.',
        challenge: 'Pide un motivo o un ejemplo más dentro del mismo tiempo.',
        challengeFinal: 'Prohíbe una palabra en la que se apoya («and then», «like», «very») y repite la ronda.',
        doneWhen: 'Ha hablado los {{seconds}} segundos enteros sin que tú llenaras ninguna pausa.',
        next: 'Hacer la siguiente ronda: {{next}} segundos, el mismo tema.',
        nextFinal: 'Dile exactamente qué ha mejorado y sigue.',
      },
      recap: {
        now: 'Di qué ha mejorado de verdad. Este es el premio de todo el ejercicio.',
        do: [
          'Sé concreto: menos pausas, arranque más rápido, una frase más larga, menos traducir por dentro.',
          'NO corrijas gramática aquí. El trabajo de precisión va en otra parte de la clase.',
        ],
        studentDoes: ['Oye una cosa concreta que ha mejorado.'],
        lookFor: ['¿Reconoce él la mejora? Eso es lo que hará que lo repita en casa.'],
        help: ['Si no ha mejorado nada, dilo con tacto y guarda el mismo tema para la próxima clase.'],
        challenge: ['Pregúntale qué ronda le resultó más fácil y por qué.'],
        doneWhen: 'Ha oído una cosa concreta y cierta que ha mejorado.',
        next: 'Pasar a la conversación libre.',
      },
    },
    generic: {
      scoreAndMoveOn: 'Valora cómo ha ido y sigue.',
      handOver: 'Pasarle el turno para que lo intente.',
      turn: {
        now: 'Le toca: lo dice él, tú solo das pie.',
        do: [
          'Dilo una vez más y luego cállate y espera. Cuenta hasta cinco antes de ayudar.',
          'Elogia el intento antes de corregir nada de él.',
        ],
        studentDoes: ['Lo dice en voz alta varias veces, con menos ayuda cada vez.'],
        lookFor: ['¿Lo produce él o sigue repitiendo tus palabras una a una?'],
        doneWhen: 'Lo produce una vez sin que tú lo hayas dicho antes.',
      },
      deeper: {
        now: 'Profundiza en el mismo tema: todavía no cambies de asunto.',
        do: ['Sigue el hilo que más le interese.', 'Habla claramente menos que él.'],
        studentDoes: ['Desarrolla, da motivos y ejemplos, y te pregunta algo de vuelta.'],
        lookFor: ['Turnos más largos que al principio.', '¿Busca palabras nuevas o se queda en lo seguro?'],
        help: ['Da tú una respuesta corta como modelo y devuélvele el turno enseguida.'],
        challenge: ['Añade una restricción: un tiempo límite, una palabra prohibida o la postura contraria.'],
        doneWhen: 'La conversación se ha agotado de verdad, no cuando lo dice el reloj.',
        next: 'Recoger una palabra o expresión útil de lo que ha dicho.',
      },
    },
    fix: {
      now: 'Repaso de errores — los fallos que se repiten, dichos bien.',
      cue: 'Dijiste “{{said}}”. En inglés se dice “{{better}}”. Dilo conmigo.',
      do: [
        'De un par en un par. Que digan la versión correcta en voz alta, dos veces.',
        'Después pide una frase suya con eso: la corrección tiene que salir del ejercicio.',
        'No expliques la regla salvo que la pidan. Esto va de hábito, no de teoría.',
      ],
      studentDoes: ['Dice la versión correcta en voz alta y luego la usa en una frase suya.'],
      lookFor: [
        '¿Se corrigen solos antes de que digas nada? Eso es lo que cuenta.',
        '¿Aguanta en su propia frase o solo en la repetición?',
      ],
      help: ['Di la versión correcta y que la repitan. Repetir hoy es producir la semana que viene.'],
      challenge: ['Pide la misma forma tres veces dentro de una respuesta larga.'],
      doneWhen: 'Cada una se ha dicho bien al menos una vez, en una frase suya.',
      next: 'Apunta lo que corrigieron sin ayuda: eso va en el informe.',
    },
    retrieval: {
      now: 'Repaso rápido de cosas de clases anteriores que ya tocan.',
      cueMeaning: '¿Cómo se dice en inglés: {{meaning}}?',
      cueTerm: 'Usa «{{term}}» en una frase.',
      do: [
        'Pídele que saque cada una de memoria. No le enseñes antes la palabra.',
        'Si tarda más de unos segundos, dásela tú y sigue.',
      ],
      studentDoes: ['Recuerda cada una y la usa en una frase suya.'],
      lookForRecall: 'Lo que cuenta como prueba es recordar SIN pista.',
      lookForErrors: 'Atento a: {{errors}}',
      lookForSlips: 'Deslices antiguos que vuelven a asomar.',
      help: ['Dale el primer sonido y luego la palabra entera. Reconocerla también es avanzar.'],
      challenge: ['Pídele dos de ellas en la misma frase.'],
      doneWhen: 'Cada una se ha recordado o se ha vuelto a enseñar una vez.',
      next: 'Pasar al foco principal de la clase.',
    },
    phrase: {
      recall: {
        retrieval: {
          now: 'Pide las frases que ya conocen, antes de enseñar nada nuevo.',
          do: [
            'Da el significado en su idioma o señala la tarjeta de su pantalla.',
            'Luego espera. Cuenta hasta cinco por dentro antes de ayudar.',
            'Solo después de que lo intenten, di el inglés.',
          ],
          studentDoes: [
            'Intentan producir cada frase solo a partir del significado.',
          ],
          lookFor: [
            'Cuáles salen solas y cuáles necesitan que tú empieces.',
            'Una respuesta correcta pero lenta sigue siendo frágil: márcala así.',
          ],
          help: [
            'Di solo la primera palabra y para.',
            'Si aun así no sale, di la frase entera y que la repitan: eso es «lo dijo con ayuda».',
          ],
          challenge: [
            'Pídeles que usen una de ellas en una frase sobre hoy.',
          ],
          doneWhen: 'Se ha pedido una vez cada frase de la tarjeta.',
          next: 'Marca lo que has visto y empieza el grupo nuevo.',
        },
      },
      meet: {
        meaning: {
          now: 'Haz que el significado quede claro antes de decir el inglés.',
          do: [
            'Crea primero la situación: un gesto, un objeto, un momento que reconozcan.',
            'Di la frase dentro de esa situación, no como una palabra que estudiar.',
            'No traduzcas salvo que estén perdidos, y no expliques gramática en absoluto.',
          ],
          studentDoes: [
            'Te miran. Todavía no tienen que producir nada.',
          ],
          lookFor: [
            'Un gesto, una sonrisa, una respuesta en su idioma: cualquier señal de que lo han captado.',
          ],
          help: [
            'Hazlo más concreto: un objeto real, un dibujo, gesticula más.',
            'Una palabra en su idioma está bien. Después vuelve enseguida al inglés.',
          ],
          challenge: [
            'Pregunta dónde lo usarían: una tienda, una llamada, el trabajo.',
          ],
          doneWhen: 'Muestran que entienden para qué sirve, en el idioma que sea.',
          next: 'Dilo dos veces y deja que solo escuchen.',
        },
        model: {
          now: 'Dilo. No lo expliques.',
          do: [
            'Di cada frase dos veces: una a velocidad normal y otra despacio.',
            'Si tiene respuesta, di las dos mitades para que oigan el intercambio entero.',
            'Todavía no les pidas que repitan.',
          ],
          studentDoes: [
            'Escuchan. Repiten solo si les sale solo.',
          ],
          lookFor: [
            '¿Escuchan o ya intentan decirlo? Las dos cosas están bien.',
          ],
          help: [
            'Quédate con una sola frase y dila cuatro veces.',
          ],
          challenge: [
            'Dilo una vez a velocidad de conversación real y pregunta si lo han pillado.',
          ],
          doneWhen: 'Han oído cada frase al menos dos veces.',
          next: 'Pásales el turno: ahora lo dicen ellos.',
        },
        guided: {
          now: 'Les toca. La frase entera, no palabra por palabra.',
          do: [
            'Dilo, luego abre la mano hacia ellos y espera.',
            'Mantén la frase como una sola pieza. No la partas en palabras.',
            'Con tres intentos cada una basta; más se convierte en machaque.',
          ],
          studentDoes: [
            'Dicen cada frase en voz alta, copiando el ritmo.',
          ],
          lookFor: [
            '¿Sale como una pieza fluida o como palabras sueltas?',
            '¿Lo entiendes? Ese es el listón aquí, no la perfección.',
          ],
          help: [
            'Di las dos últimas palabras y luego la frase entera. Deja que se te unan.',
          ],
          challenge: [
            'Repíteselo más rápido y mira si te siguen.',
          ],
          doneWhen: 'Cada frase ha salido de su boca al menos una vez.',
          next: 'Ahora cambia las palabras de dentro.',
        },
      },
      use: {
        guided: {
          now: 'La misma frase, otras palabras en el hueco.',
          do: [
            'Di una versión, luego ofrece una palabra nueva y deja que construyan la siguiente.',
            'Mantén la estructura idéntica. Solo cambia el hueco.',
            'Usa palabras de SU vida: su trabajo, su familia, su calle.',
          ],
          studentDoes: [
            'Forman frases nuevas con la misma estructura.',
          ],
          lookFor: [
            '¿Mantienen la estructura firme mientras cambia la palabra?',
            'De eso se trata: aprenden un mecanismo, no una frase.',
          ],
          help: [
            'Vuelve a una versión fija y repítela dos veces antes de volver a cambiar.',
          ],
          challenge: [
            'Pide una palabra que no hayas ofrecido: algo de su propia vida.',
          ],
          doneWhen: 'Han formado al menos tres frases distintas con una estructura.',
          next: 'Ahora pídelo en frío, sin nada en la pantalla.',
        },
        retrieval: {
          now: 'Pídelo sin mostrar nada. Esta es la parte que cuenta.',
          do: [
            'Da solo el significado: en su idioma o representándolo.',
            'No digas nada en inglés antes. Si lo dices, copian en vez de recordar.',
            'Espera. El silencio es el trabajo.',
          ],
          studentDoes: [
            'Producen la frase solo a partir del significado.',
          ],
          lookFor: [
            '¿Salió sin que tú empezaras? Solo eso cuenta como «lo dijo solo».',
          ],
          help: [
            'Da el primer sonido, no la primera palabra.',
            'Si aun así no sale, dilo y que repitan: eso es «lo dijo con ayuda», y es honesto.',
          ],
          challenge: [
            'Pídelo dentro de una pregunta en vez de aislado.',
          ],
          doneWhen: 'Se ha pedido en frío una vez cada frase de este grupo.',
          next: 'Marca cada una y sigue.',
        },
      },
      exchange: {
        guided: {
          now: 'Dos líneas, ida y vuelta. Empiezas tú.',
          do: [
            'Tú dices la primera línea y ellos responden. Luego cambiáis de papel.',
            'Repítelo tres o cuatro veces hasta que la respuesta ya no requiera pensar.',
            'Di tu línea exactamente igual cada vez.',
          ],
          studentDoes: [
            'Hacen los dos papeles de un intercambio corto.',
          ],
          lookFor: [
            '¿Llega la respuesta sin pausa?',
            '¿Siguen contigo cuando cambiáis de papel?',
          ],
          help: [
            'Quédate tú con el papel difícil y déjales el fácil.',
          ],
          challenge: [
            'Cambia una palabra de tu línea sin avisar y mira si se adaptan.',
          ],
          doneWhen: 'Pueden hacer cualquiera de los dos papeles sin ayuda.',
          next: 'Deja el guion y hablad sin más.',
        },
      },
      realUse: {
        realUse: {
          now: 'Solo hablad. Sin guion, sin nada en la pantalla.',
          do: [
            'Haz una pregunta de verdad, con intención real.',
            'Deja que se estiren. Si se atascan, espera más de lo que resulta cómodo.',
            'Aquí no corrijas nada, salvo que de verdad no hayas entendido.',
          ],
          studentDoes: [
            'Hablan contigo tirando de todo el inglés que tengan.',
          ],
          lookFor: [
            'A qué frases recurren solos: la evidencia más fuerte de la clase.',
            'Dónde muere la conversación. Ahí está la próxima clase.',
          ],
          help: [
            'Pregunta algo más fácil y más cercano a ellos, y luego vuelve.',
          ],
          challenge: [
            'Da una respuesta corta tuya y espera a que te pregunten algo.',
          ],
          doneWhen: 'Han usado al menos una frase de hoy sin que se lo pidieras.',
          next: 'Cierra la clase y marca lo que has visto.',
        },
      },
      close: {
        recap: {
          now: 'Devuélveles lo que han conseguido hoy y luego márcalo con honestidad.',
          do: [
            'Lee las frases que han usado y deja que digan su favorita una vez más.',
            'Nombra una cosa concreta que ha mejorado. No «muy bien».',
            'Luego repasa la lista y marca lo que has visto de verdad.',
          ],
          studentDoes: [
            'Oyen lo que han logrado y dicen una frase por última vez.',
          ],
          lookFor: [
            'Cuáles todavía les iluminan la cara y sobre cuáles se han quedado callados.',
          ],
          help: [
            'Si la lista se hace larga, nombra las tres mejores y para ahí.',
          ],
          challenge: [
            'Pregunta cuál usarán antes de la próxima clase, y dónde.',
          ],
          doneWhen: 'Cada frase tiene una marca y el alumno ha oído algo concreto que hizo bien.',
          next: 'Termina la clase: los deberes se construyen solos a partir de estas marcas.',
        },
      },
    },
  },
}

export default guide
