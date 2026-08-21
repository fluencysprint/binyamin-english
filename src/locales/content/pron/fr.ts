/* Prononciation — consignes pour le tuteur. Les mots, paires et phrases d’entraînement restent en anglais. */

import { Dict } from '../../../i18n/dict'

const pron: Dict = {
  th: {
    title: 'Les sons TH (think / this)',
    why: 'Le TH est rare dans beaucoup de langues : on le remplace par /s/, /z/, /t/, /d/ ou /f/, et cela change le mot (think → sink).',
    howTo: 'Pose la pointe de la langue légèrement entre les dents et pousse l’air. Sourd dans « think », sonore dans « this ».',
    tutorNotes: 'Fais-le regarder dans un miroir pour voir la langue entre les dents. Exagère d’abord, puis reviens à la vitesse normale.',
    connectedSpeech:
      'Dans le débit rapide, « the » et « them » se réduisent presque à un bourdonnement. Un TH net sur chaque mot-outil sonne en fait moins naturel qu’un TH léger.',
    recording: {
      baseline: 'Enregistre-le disant « I think this is the third thing » avant tout entraînement.',
      practice: 'Enregistre la paire minimale « think / sink », trois fois chacune.',
      improved: 'Enregistre la même phrase de départ à la fin et passe les deux à la suite.',
    },
    l1: { fr: 'Les francophones substituent en général /s/ et /z/, parfois /f/ et /v/.' },
  },
  r: {
    title: 'Le R américain',
    why: 'Un R roulé ou un R à la française rend l’anglais américain moins clair. Le R américain ne comporte aucun battement de langue.',
    howTo: 'Recule la langue et remonte-la un peu sans toucher le palais ; arrondis légèrement les lèvres. La langue ne touche rien.',
    tutorNotes: 'Repère : « aucun battement — recule la langue comme un grognement doux ». Oppose-le directement au L, qui, lui, touche le palais.',
    connectedSpeech:
      'Entre voyelles, les Américains battent souvent le T et le D (« water » → « wadder »), juste à côté du R. Travaillez-les ensemble.',
    recording: {
      baseline: 'Enregistre « Robert really wanted to write it right » à froid.',
      practice: 'Enregistre « right / light » et « red / led » en paires.',
      improved: 'Réenregistre la même phrase et demande laquelle se comprend le plus facilement.',
    },
    l1: { fr: 'Le R français est uvulaire (au fond de la gorge) : il sonne guttural plutôt qu’américain.' },
  },
  l: {
    title: 'Les deux L (clair et sombre)',
    why: 'L’anglais a un L clair en début de mot (« light ») et un L lourd, arrière, en fin de mot (« full », « cold »). Le clair partout sonne étranger ; perdre complètement le final transforme « cold » en « code ».',
    howTo: 'L clair : pointe de la langue fermement sur la crête derrière les dents du haut. L sombre : la pointe touche toujours, mais l’arrière de la langue se soulève — cela ressemble presque à « oo ».',
    tutorNotes:
      'Fais-lui tenir le L final deux secondes pour sentir où la langue se pose. Puis le mot à vitesse normale. Le contraste avec le R compte autant que le L lui-même.',
    connectedSpeech: 'Quand un L sombre est suivi d’une voyelle (« feel it »), il s’enchaîne et s’éclaircit : « fee-lit ». Cet enchaînement fait gagner beaucoup en intelligibilité.',
    recording: {
      baseline: 'Enregistre « I still feel a little cold » avant tout travail dessus.',
      practice: 'Enregistre « cold / code » et « feel / fee » en contraste.',
      improved: 'Réenregistre la phrase et écoutez précisément les fins de mots.',
    },
    l1: { fr: 'Le L français est clair ; le L final sombre de l’anglais lui est inconnu.' },
  },
  vw: {
    title: 'V contre W',
    why: 'Beaucoup d’apprenants fusionnent V et W : « vest » et « west », ou « very » et « wery », deviennent alors confus.',
    howTo: 'V : les dents du haut touchent la lèvre du bas (un son qui vibre). W : arrondis les deux lèvres, sans les dents, comme le début de « oo ».',
    tutorNotes: 'Fais-lui sentir les dents pour le V et l’arrondi des lèvres pour le W. Qu’il touche sa propre lèvre pour vérifier.',
    connectedSpeech: 'Dans « we were very », trois de ces sons se suivent à vitesse : c’est cette expression le vrai test, pas le mot isolé.',
    recording: {
      baseline: 'Enregistre « We were very well in the west village » à froid.',
      practice: 'Enregistre « vest / west » et « vine / wine ».',
      improved: 'Réenregistre la phrase ; la différence est en général spectaculaire et très motivante.',
    },
    l1: { fr: 'Le français a les deux, donc c’est en général un gain facile pour un francophone.' },
  },
  finalConsonants: {
    title: 'Finir le mot (les consonnes finales)',
    why: 'Perdre la dernière consonne efface autant la grammaire que le vocabulaire : « walked » devient « walk », « cats » devient « cat », « I need » devient « I knee ». C’est l’un des correctifs les plus rentables pour l’intelligibilité, à tous les niveaux.',
    howTo: 'Va au bout du mot. Le son final n’a pas besoin d’être fort — il a besoin d’exister. À l’entraînement, tiens-le un temps, puis raccourcis.',
    tutorNotes:
      'On l’entend souvent comme une faute de grammaire alors que c’en est une de prononciation : il connaît le prétérit et le dit, mais le -ed n’atterrit pas. Vérifie en lui faisant écrire la phrase : si le -ed est sur le papier, c’est un problème de son.',
    connectedSpeech: 'Une consonne finale devant une voyelle s’enchaîne et devient facile : « asked_all », « helped_us ». Enseigne l’enchaînement et la terminaison arrive toute seule.',
    recording: {
      baseline: 'Enregistre « I asked my friends last month » et compte combien de terminaisons survivent.',
      practice: 'Enregistre « walk / walked » et « cat / cats » en paires.',
      improved: 'Réenregistre la phrase et recomptez ensemble les terminaisons.',
    },
    l1: { fr: 'Le français ne prononce pas la plupart des consonnes finales écrites, et l’habitude se transfère directement.' },
  },
  consonantClusters: {
    title: 'Groupes de consonnes (street, asked, sixths)',
    why: 'L’anglais empile les consonnes comme beaucoup de langues ne le font jamais. On insère une voyelle (« estreet ») ou on supprime un son (« ast » pour « asked »). Les deux s’entendent.',
    howTo: 'Dis le groupe lentement, sans voyelle entre les consonnes, puis accélère. N’ajoute jamais de voyelle devant un groupe initial en /s/.',
    tutorNotes:
      'Construis le groupe à l’envers : « eet → treet → street ». C’est bien plus facile que de l’attaquer d’un bloc. Les natifs en simplifient aussi : « clothes » sonne vraiment comme « close ».',
    connectedSpeech: 'À la jonction des mots, les groupes deviennent encore plus lourds (« last spring »). Les natifs en allègent une partie : vise le naturel, pas le maximal.',
    recording: {
      baseline: 'Enregistre « She asked about the street last spring » à froid.',
      practice: 'Enregistre la construction à l’envers : « eet, treet, street ».',
      improved: 'Réenregistre la phrase à vitesse de conversation.',
    },
    l1: { fr: 'Un francophone peut glisser une petite voyelle entre les consonnes empilées.' },
  },
  vowels: {
    title: 'Les voyelles qui changent le sens (ship / sheep, bad / bed)',
    why: 'L’anglais a bien plus de voyelles que la plupart des langues. Fusionner les paires longue/brève transforme « sheep » en « ship » et « beach » en un mot qu’on ne dit pas au travail.',
    howTo:
      '/iː/ long (sheep) : lèvres bien étirées, son tenu. /ɪ/ bref (ship) : relâché, rapide. Pareil pour /æ/ (bad, mâchoire ouverte) et /e/ (bed, mâchoire presque fermée). La durée ET la forme de la bouche changent.',
    tutorNotes:
      'Fais-lui poser une main sous le menton pour sentir la mâchoire descendre sur /æ/. Ne cours pas après toutes les voyelles : prends LA paire qui gêne vraiment cet apprenant et restes-y.',
    connectedSpeech: 'Dans les syllabes inaccentuées, la plupart de ces voyelles se réduisent de toute façon en schwa : la précision compte surtout sur les syllabes accentuées. Cela vaut la peine de le dire — c’est un soulagement.',
    recording: {
      baseline: 'Enregistre « I live here but I leave at six » avant tout entraînement.',
      practice: 'Enregistre uniquement la paire qui pose problème, quatre fois chacune, en alternance.',
      improved: 'Réenregistre la phrase et demande-lui dans quel mot il entend maintenant la différence.',
    },
    l1: { fr: 'Un francophone gère en général /iː/ mais bute sur /ɪ/ et /æ/.' },
  },
  americanR: {
    title: 'Voyelles colorées par le R (bird, work, car, more)',
    why: 'L’anglais américain prononce le R après une voyelle : « car », « work », « bird », « here ». Le supprimer sonne britannique ; le rouler sonne étranger. À elle seule, cette caractéristique porte une grande part de ce qu’on appelle « l’accent américain ».',
    howTo: 'La voyelle et le R fusionnent en un seul son. Ne dis pas une voyelle puis un R : commence à reculer la langue pendant la voyelle elle-même.',
    tutorNotes:
      'Le « er » de « water », « never », « better » est inaccentué et très bref — un schwa rapide coloré en R, pas un « ER » complet. Le surprononcer est l’hypercorrection la plus fréquente.',
    connectedSpeech: 'Les Américains enchaînent un R final sur la voyelle suivante (« far away » → « fa-raway »). Cet enchaînement est un marqueur fort de parole naturelle.',
    recording: {
      baseline: 'Enregistre « The first word was hard to learn » à froid.',
      practice: 'Enregistre « work, first, world, learn » d’affilée.',
      improved: 'Réenregistre et compare directement avec la première prise dans le même panneau.',
    },
    l1: { fr: 'Un francophone a tendance à simplement le supprimer, ce qui sonne britannique plutôt qu’américain.' },
  },
  wordStress: {
    title: 'L’accent du mot',
    why: 'Un mot anglais a une syllabe forte. Un accent mal placé (PHOto-graph et pho-TO-gra-pher) peut rendre le mot méconnaissable même si tous les sons sont justes.',
    howTo: 'Dis le mot entier, puis fais UNE syllabe plus longue, plus forte et plus haute. Les autres deviennent plus courtes et plus discrètes.',
    tutorNotes: 'Tape sur la table sur la syllabe accentuée. Fais-lui fredonner le rythme avant de dire le mot.',
    connectedSpeech: 'C’est par l’accent que l’auditeur repère les frontières de mots. Avec le bon accent, des sons imparfaits passent quand même.',
    recording: {
      baseline: 'Enregistre cinq mots longs de son domaine, à froid.',
      practice: 'Enregistre les mêmes mots en tapant la syllabe accentuée.',
      improved: 'Enregistre une phrase qui en contient trois.',
    },
    l1: { fr: 'Le français accentue la dernière syllabe du groupe, donc la place de l’accent anglais paraît arbitraire.' },
  },
  sentenceStress: {
    title: 'L’accent de la phrase',
    why: 'L’anglais accentue les mots pleins (noms, verbes principaux, adjectifs) et réduit les petits. Un accent plat et régulier sonne robotique et se suit vraiment moins bien.',
    howTo: 'Accentue les mots importants ; dis les petits (a, the, to, of) vite et doucement.',
    tutorNotes: 'Frappe dans les mains uniquement sur les mots accentués. Fais-lui dire une phrase en tapant la table sur les mots forts : la réduction se fait toute seule.',
    connectedSpeech:
      'Déplacer l’accent change le sens : « I didn’t say HE stole it » ne veut pas dire la même chose que « I didn’t say he STOLE it. » Montre-le : ça passe immédiatement.',
    recording: {
      baseline: 'Enregistre « I’d like a cup of coffee » à froid.',
      practice: 'Enregistre-le en n’accentuant que LIKE, CUP et COFFEE.',
      improved: 'Enregistre une phrase six fois en déplaçant l’accent à chaque fois, et commentez le glissement de sens.',
    },
    l1: { fr: 'Le français est à isochronie syllabique : chaque syllabe sort avec la même force.' },
  },
  rhythm: {
    title: 'Le tempo de l’anglais',
    why: 'L’anglais est rythmé par les accents : les temps forts tombent à intervalles à peu près réguliers et tout ce qui est entre eux se comprime. Donner à chaque syllabe la même longueur est ce qui fait le plus qu’une grammaire fluide sonne encore étrangère.',
    howTo: 'Garde un tempo régulier — tape-le — et cale les petits mots dans les creux. « The BOY is in the GARden » a deux temps, pas six.',
    tutorNotes: 'Dis les deux phrases au même tempo pour qu’il entende qu’ajouter des mots n’a pas ajouté de temps. Cette démonstration est tout le cours ; le reste n’est que répétition.',
    connectedSpeech: 'Le rythme, c’est là que se rejoignent accent, réduction et enchaînement. Si un apprenant ne corrige qu’une seule chose au-dessus des sons isolés, que ce soit celle-là.',
    recording: {
      baseline: 'Enregistre à froid la phrase à quatre temps.',
      practice: 'Réenregistre-la en tapant les temps à voix haute.',
      improved: 'Enregistre trente secondes de parole libre et écoute si le tempo tient.',
    },
    l1: { fr: 'À isochronie syllabique — c’est ce qui demande le plus de travail et rapporte le plus.' },
  },
  reducedVowels: {
    title: 'Voyelles réduites (le schwa)',
    why: 'Les syllabes inaccentuées se réduisent à un « euh » rapide. Prononcer chaque voyelle pleinement sonne artificiel, ralentit celui qui parle et, paradoxalement, le rend plus difficile à suivre.',
    howTo: 'Dans les syllabes inaccentuées, relâche la voyelle en un « euh » bref : banana → « bə-NA-nə ».',
    tutorNotes:
      'Entourez sur le papier les syllabes en schwa. La paire « can / can’t » mérite sa minute : en anglais américain la différence tient à la voyelle, pas au T, qui est souvent à peine relâché.',
    connectedSpeech: 'C’est la réduction qui fait de la place pour le temps fort. Travaille-la avec le rythme, jamais comme un son isolé.',
    recording: {
      baseline: 'Enregistre « It was about an hour ago » à froid.',
      practice: 'Enregistre des paires « can / can’t » dans des phrases entières.',
      improved: 'Réenregistre la phrase et comptez combien de voyelles pleines ont survécu.',
    },
    l1: { fr: 'Le français a un schwa mais l’emploie autrement ; il faut apprendre la distribution anglaise.' },
  },
  linking: {
    title: 'Enchaînement et parole liée',
    why: 'La parole native lie les mots (an apple → « anapple »). Celui qui détache chaque mot sonne haché et — surtout — n’arrive pas à suivre la parole naturelle qu’on lui renvoie.',
    howTo: 'Relie la consonne finale à la voyelle suivante ; fonds les mots en groupes plutôt que de les dire un par un.',
    tutorNotes:
      'Marque les liaisons au stylo. Travaillez une expression à vitesse naturelle, pas mot à mot. L’enchaînement améliore aussi la compréhension orale, et cela vaut la peine de le dire : il ne s’agit pas que de production.',
    connectedSpeech: 'C’EST cela, la parole liée. Teste-le : fais-lui écouter une phrase à vitesse naturelle et écrire combien de mots il a entendus.',
    recording: {
      baseline: 'Enregistre « I worked there for about three years » mot à mot.',
      practice: 'Enregistre la même expression comme un seul groupe lié.',
      improved: 'Enregistre une réponse à vitesse naturelle à une vraie question et écoute la fusion.',
    },
    l1: { fr: 'Le français fait déjà des liaisons, donc la notion est familière même si les règles diffèrent.' },
  },
  intonation: {
    title: 'Intonation (montante et descendante)',
    why: 'La mélodie porte le sens et l’attitude : descendante pour les affirmations et les questions en wh-, montante pour les questions en oui/non et pour paraître poli ou inachevé. Une intonation plate s’entend souvent comme sèche ou ennuyée, et c’est un vrai coût social.',
    howTo: 'Laisse la voix descendre en fin d’affirmation. Fais-la monter pour les questions en oui/non et pour signaler « il y a une suite ».',
    tutorNotes:
      'Dessine la ligne mélodique en l’air. Exagère d’abord, puis reviens à la normale. Signale la portée sociale : beaucoup ne savent pas qu’un débit plat se lit comme de la froideur.',
    connectedSpeech: 'Dans un long tour de parole, c’est l’intonation qui dit à l’autre que tu n’as pas fini. Travaillez une énumération en trois temps : montée, montée, descente.',
    recording: {
      baseline: 'Enregistre trois questions et trois affirmations lues à plat.',
      practice: 'Enregistre les six mêmes lignes avec la mélodie exagérée.',
      improved: 'Enregistre un court jeu de rôle et écoute si la mélodie tient dans du contenu réel.',
    },
    l1: { fr: 'La montée française en fin de groupe se transfère bizarrement sur les affirmations anglaises.' },
  },
}

export default pron
