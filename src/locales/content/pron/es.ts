/* Pronunciación — consignas para el tutor. Las palabras, pares y frases de práctica siguen en inglés. */

import { Dict } from '../../../i18n/dict'

const pron: Dict = {
  th: {
    title: 'Los sonidos TH (think / this)',
    why: 'TH es raro en muchas lenguas, así que se sustituye por /s/, /z/, /t/, /d/ o /f/, y eso cambia la palabra (think → sink).',
    howTo: 'Pon la punta de la lengua suavemente entre los dientes y saca aire. Sordo en «think», sonoro en «this».',
    tutorNotes: 'Que se mire al espejo para ver la lengua entre los dientes. Exagera primero y luego vuelve a la velocidad normal.',
    connectedSpeech:
      'En habla rápida, «the» y «them» se reducen casi a un zumbido. Un TH nítido en cada palabra funcional suena de hecho menos natural que uno ligero.',
    recording: {
      baseline: 'Grábale diciendo «I think this is the third thing» antes de practicar nada.',
      practice: 'Graba el par mínimo «think / sink», tres veces cada uno.',
      improved: 'Graba la misma frase inicial al final y ponedlas seguidas.',
    },
    l1: { es: 'Los hispanohablantes de América suelen usar /t/ o /d/; el español peninsular ya tiene el TH sordo.' },
  },
  r: {
    title: 'La R americana',
    why: 'Una R vibrante o de tipo francés hace que el inglés americano se entienda peor. La R americana no lleva ningún golpe de lengua.',
    howTo: 'Echa la lengua atrás y un poco arriba sin tocar el paladar; redondea algo los labios. La lengua no toca nada.',
    tutorNotes: 'Pista: «sin golpe de lengua, échala atrás como un gruñido suave». Contrástalo directamente con la L, que sí toca el paladar.',
    connectedSpeech:
      'Entre vocales, los americanos convierten T y D en un golpecito («water» → «wadder»), que queda justo al lado de la R. Practicadlos juntos.',
    recording: {
      baseline: 'Graba «Robert really wanted to write it right» en frío.',
      practice: 'Graba «right / light» y «red / led» como pares.',
      improved: 'Vuelve a grabar la misma frase y pregunta cuál se entiende mejor.',
    },
    l1: { es: 'El español tiene golpe y vibrante múltiple; lo difícil es abandonar la vibrante.' },
  },
  l: {
    title: 'Las dos L (clara y oscura)',
    why: 'El inglés tiene una L clara al principio de palabra («light») y una L pesada y trasera al final («full», «cold»). Usar siempre la clara suena extranjero; perder del todo la final convierte «cold» en «code».',
    howTo: 'L clara: punta de la lengua firme en la cresta detrás de los dientes de arriba. L oscura: la punta sigue tocando, pero el dorso de la lengua sube y suena casi como «oo».',
    tutorNotes:
      'Que mantenga la L final dos segundos para notar dónde aterriza la lengua. Luego la palabra a velocidad normal. El contraste con la R importa tanto como la L en sí.',
    connectedSpeech: 'Cuando tras una L oscura viene una vocal («feel it»), se enlaza y se aclara: «fee-lit». Ese enlace aporta muchísima claridad.',
    recording: {
      baseline: 'Graba «I still feel a little cold» antes de trabajarlo.',
      practice: 'Graba «cold / code» y «feel / fee» como contrastes.',
      improved: 'Vuelve a grabar la frase y escuchad específicamente los finales de palabra.',
    },
    l1: { es: 'La L española es siempre clara; las L finales tienden a desaparecer.' },
  },
  vw: {
    title: 'V frente a W',
    why: 'Mucha gente funde V y W, y entonces «vest» y «west», o «very» y «wery», se vuelven confusos.',
    howTo: 'V: los dientes de arriba tocan el labio de abajo (un sonido que vibra). W: redondea los dos labios, sin dientes, como el comienzo de «oo».',
    tutorNotes: 'Que note los dientes en la V y los labios redondos en la W. Que se toque el labio para comprobarlo.',
    connectedSpeech: 'En «we were very» hay tres de estos seguidos a velocidad: esa frase es la prueba real, no la palabra suelta.',
    recording: {
      baseline: 'Graba «We were very well in the west village» en frío.',
      practice: 'Graba «vest / west» y «vine / wine».',
      improved: 'Vuelve a grabar la frase; la diferencia suele ser espectacular y motiva mucho.',
    },
    l1: { es: 'En español B y V son el mismo sonido, y ninguno es la V inglesa.' },
  },
  finalConsonants: {
    title: 'Terminar la palabra (consonantes finales)',
    why: 'Perder la última consonante borra gramática además de vocabulario: «walked» pasa a «walk», «cats» a «cat», «I need» a «I knee». Es uno de los arreglos de inteligibilidad más rentables a cualquier nivel.',
    howTo: 'Termina la palabra. El sonido final no tiene que ser fuerte: tiene que existir. Al practicar, mantenlo un instante y luego acórtalo.',
    tutorNotes:
      'Muchas veces se oye como un fallo de gramática cuando es de pronunciación: sabe el pasado y lo dice, pero el -ed no llega. Compruébalo pidiéndole que escriba la frase: si el -ed está en el papel, es un problema de sonido.',
    connectedSpeech: 'Una consonante final delante de vocal se enlaza y sale sola: «asked_all», «helped_us». Enseña el enlace y la terminación aparece gratis.',
    recording: {
      baseline: 'Graba «I asked my friends last month» y cuenta cuántas terminaciones sobreviven.',
      practice: 'Graba «walk / walked» y «cat / cats» como pares.',
      improved: 'Vuelve a grabar la frase y contad juntos las terminaciones otra vez.',
    },
    l1: { es: 'Las palabras españolas rara vez acaban en estas consonantes, así que los finales desaparecen sin más.' },
  },
  consonantClusters: {
    title: 'Grupos consonánticos (street, asked, sixths)',
    why: 'El inglés apila consonantes como muchas lenguas no hacen nunca. O se mete una vocal («estreet») o se elimina un sonido («ast» por «asked»). Las dos cosas se notan.',
    howTo: 'Di el grupo despacio, sin vocal entre las consonantes, y luego acelera. Nunca añadas una vocal delante de un grupo que empieza por /s/.',
    tutorNotes:
      'Construye el grupo del revés: «eet → treet → street». Es mucho más fácil que atacarlo entero. También los nativos eliden algo: «clothes» suena de verdad como «close».',
    connectedSpeech: 'Entre palabras los grupos se ponen aún más pesados («last spring»). Los nativos también simplifican, así que apunta a natural, no a máximo.',
    recording: {
      baseline: 'Graba «She asked about the street last spring» en frío.',
      practice: 'Graba la construcción del revés: «eet, treet, street».',
      improved: 'Vuelve a grabar la frase a velocidad de conversación.',
    },
    l1: { es: 'Los hispanohablantes añaden una /e/ delante de los grupos con /s/ inicial: «eschool», «estreet».' },
  },
  vowels: {
    title: 'Las vocales que cambian el significado (ship / sheep, bad / bed)',
    why: 'El inglés tiene muchísimas más vocales que la mayoría de las lenguas. Fundir las parejas larga y corta convierte «sheep» en «ship» y «beach» en algo que no se dice en el trabajo.',
    howTo:
      '/iː/ larga (sheep): labios muy estirados, sonido sostenido. /ɪ/ corta (ship): relajada y rápida. Igual con /æ/ (bad, mandíbula abierta) y /e/ (bed, mandíbula casi cerrada). Cambian la duración Y la forma de la boca.',
    tutorNotes:
      'Que se ponga la mano bajo la barbilla para notar cómo baja la mandíbula en /æ/. No persigas todas las vocales: elige LA pareja que de verdad confunde a este alumno y quédate ahí.',
    connectedSpeech: 'En sílabas átonas casi todas estas vocales se reducen a schwa igualmente, así que la precisión importa sobre todo en las tónicas. Merece la pena decírselo: es un alivio.',
    recording: {
      baseline: 'Graba «I live here but I leave at six» antes de practicar nada.',
      practice: 'Graba solo la pareja problemática, cuatro veces cada una, alternando.',
      improved: 'Vuelve a grabar la frase y pregúntale en qué palabra oye ya la diferencia.',
    },
    l1: { es: 'El español tiene cinco vocales; las parejas larga/corta del inglés se le juntan todas en una.' },
  },
  americanR: {
    title: 'Vocales con R (bird, work, car, more)',
    why: 'El inglés americano pronuncia la R detrás de vocal: «car», «work», «bird», «here». Perderla suena británico; hacerla vibrar suena extranjero. Este solo rasgo carga con buena parte de lo que la gente llama «acento americano».',
    howTo: 'La vocal y la R se funden en un único sonido. No digas una vocal y luego le añadas una R: empieza a echar la lengua atrás dentro de la propia vocal.',
    tutorNotes:
      'El «er» de «water», «never», «better» es átono y muy corto: un schwa rápido con color de R, no un «ER» completo. Pasarse con él es la hipercorrección más común.',
    connectedSpeech: 'Los americanos enlazan la R final con la vocal siguiente («far away» → «fa-raway»). Ese enlace es una marca fuerte de habla natural.',
    recording: {
      baseline: 'Graba «The first word was hard to learn» en frío.',
      practice: 'Graba «work, first, world, learn» como serie.',
      improved: 'Vuelve a grabar y compara directamente con la grabación inicial en el mismo panel.',
    },
    l1: { es: 'Los hispanohablantes tienden a darle un golpecito, y eso separa la vocal de la R.' },
  },
  wordStress: {
    title: 'El acento de la palabra',
    why: 'Cada palabra inglesa tiene una sílaba fuerte. Un acento mal puesto (PHOto-graph frente a pho-TO-gra-pher) puede volver la palabra irreconocible aunque todos los sonidos estén bien.',
    howTo: 'Di la palabra entera y luego haz UNA sílaba más larga, más fuerte y más aguda. Las demás se acortan y bajan.',
    tutorNotes: 'Da un golpecito en la mesa en la sílaba tónica. Que tararee el ritmo antes de decir la palabra.',
    connectedSpeech: 'El acento es lo que usa quien escucha para encontrar dónde empieza y acaba cada palabra. Con el acento bien puesto, se entiende incluso con sonidos imperfectos.',
    recording: {
      baseline: 'Graba cinco palabras largas de su propio campo, en frío.',
      practice: 'Graba esas mismas palabras marcando con golpecitos la sílaba tónica.',
      improved: 'Graba una frase que contenga tres de ellas.',
    },
    l1: { es: 'El acento español es regular y se marca por escrito; el inglés hay que aprenderlo palabra a palabra.' },
  },
  sentenceStress: {
    title: 'El acento de la frase',
    why: 'El inglés acentúa las palabras con contenido (sustantivos, verbos principales, adjetivos) y reduce las pequeñas. Un acento plano y parejo suena robótico y de hecho cuesta más seguirlo.',
    howTo: 'Acentúa las palabras importantes; las pequeñas (a, the, to, of) dilas rápido y flojo.',
    tutorNotes: 'Da palmadas solo en las palabras acentuadas. Que diga una frase golpeando la mesa en las fuertes: la reducción sale sola.',
    connectedSpeech:
      'Mover el acento cambia el significado: «I didn’t say HE stole it» no es lo mismo que «I didn’t say he STOLE it.» Demuéstralo: entra al instante.',
    recording: {
      baseline: 'Graba «I’d like a cup of coffee» en frío.',
      practice: 'Grábalo acentuando solo LIKE, CUP y COFFEE.',
      improved: 'Graba una frase seis veces moviendo el acento cada vez y comentad cómo cambia el sentido.',
    },
    l1: { es: 'El español también va por sílabas: para un hispanohablante esto suele ser un cambio grande.' },
  },
  rhythm: {
    title: 'El compás del inglés',
    why: 'El inglés marca el tiempo por acentos: los golpes fuertes caen a intervalos más o menos iguales y todo lo que va entre medias se comprime. Decir todas las sílabas igual de largas es lo que más hace que una gramática fluida siga sonando extranjera.',
    howTo: 'Mantén un compás fijo —márcalo con golpecitos— y encaja las palabras pequeñas en los huecos. «The BOY is in the GARden» tiene dos golpes, no seis.',
    tutorNotes: 'Di las dos frases al mismo tempo para que oiga que añadir palabras no añadió tiempo. Esa demostración es toda la clase; lo demás es repetición.',
    connectedSpeech: 'En el ritmo se juntan acento, reducción y enlace. Si un alumno solo va a arreglar una cosa por encima de los sonidos sueltos, que sea esta.',
    recording: {
      baseline: 'Graba en frío la frase de cuatro golpes.',
      practice: 'Grábala otra vez marcando los golpes en voz alta.',
      improved: 'Graba treinta segundos de habla libre y escucha si el compás aguanta.',
    },
    l1: { es: 'Silábico: comprimir las palabras funcionales le parecerá al principio que es hablar mal. Dile que es lo correcto.' },
  },
  reducedVowels: {
    title: 'Vocales reducidas (el schwa)',
    why: 'Las sílabas átonas se reducen a una «uh» rápida. Pronunciar todas las vocales enteras suena poco natural, frena al hablante y, paradójicamente, hace que cueste más seguirle.',
    howTo: 'En las sílabas átonas, relaja la vocal a una «uh» corta: banana → «bə-NA-nə».',
    tutorNotes:
      'Rodead en el papel las sílabas con schwa. La pareja «can / can’t» merece su propio minuto: en habla americana la diferencia está en la vocal, no en la T, que apenas se suelta.',
    connectedSpeech: 'La reducción es lo que deja sitio para el compás. Practícala con el ritmo, nunca como un sonido suelto.',
    recording: {
      baseline: 'Graba «It was about an hour ago» en frío.',
      practice: 'Graba parejas «can / can’t» dentro de frases enteras.',
      improved: 'Vuelve a grabar la frase y contad cuántas vocales enteras han sobrevivido.',
    },
    l1: { es: 'Las vocales españolas son siempre plenas: reducir le parecerá descuidado. Dilo explícitamente.' },
  },
  linking: {
    title: 'Enlace y habla encadenada',
    why: 'El habla nativa enlaza las palabras (an apple → «anapple»). Quien separa cada palabra suena entrecortado y, más importante, no consigue seguir el habla natural que le devuelven.',
    howTo: 'Une la consonante final con la vocal siguiente; funde las palabras en grupos, no una a una.',
    tutorNotes:
      'Marca los enlaces con un boli. Practicad una frase a velocidad natural, no palabra por palabra. El enlace mejora también la comprensión oral, y conviene decirlo en voz alta: no es solo cuestión de hablar.',
    connectedSpeech: 'Esto ES el habla encadenada. Compruébalo: que escuche una frase a velocidad natural y escriba cuántas palabras ha oído.',
    recording: {
      baseline: 'Graba «I worked there for about three years» palabra por palabra.',
      practice: 'Graba la misma frase como un solo grupo enlazado.',
      improved: 'Graba una respuesta a velocidad natural a una pregunta real y escucha la fusión.',
    },
    l1: { es: 'El español enlaza vocal con vocal con facilidad; lo nuevo es enlazar consonante con vocal.' },
  },
  intonation: {
    title: 'Entonación (subir y bajar)',
    why: 'La melodía lleva significado y actitud: baja en afirmaciones y preguntas con wh-, sube en preguntas de sí/no y para sonar cortés o inacabado. Una entonación plana se oye a menudo como brusquedad o aburrimiento, y eso tiene un coste social real.',
    howTo: 'Deja caer la voz al final de una afirmación. Súbela en las preguntas de sí/no y para indicar «aún hay más».',
    tutorNotes:
      'Dibuja la línea melódica en el aire. Exagera primero y luego normaliza. Señala el significado social: muchos alumnos no saben que una entrega plana se lee como antipatía.',
    connectedSpeech: 'En un turno largo, la entonación es lo que le dice al otro que aún no has terminado. Practicad una lista de tres: sube, sube, baja.',
    recording: {
      baseline: 'Graba tres preguntas y tres afirmaciones leídas en plano.',
      practice: 'Graba esas seis líneas con la melodía exagerada.',
      improved: 'Graba una pequeña dramatización y escucha si la melodía sobrevive al contenido real.',
    },
    l1: { es: 'La entonación española de las preguntas se parece lo bastante como para transferirse bien.' },
  },
}

export default pron
