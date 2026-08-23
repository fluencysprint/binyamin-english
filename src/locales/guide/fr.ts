/* ==========================================================================
   Guide du tuteur — français.
   --------------------------------------------------------------------------
   Tout ce que le tuteur lit COMME UNE CONSIGNE est traduit. L'anglais que
   l'élève doit entendre et dire — exemples, mots, paires minimales, exercices
   — reste en anglais dans toutes les langues.
   ========================================================================== */

import { Dict } from '../../i18n/dict'

const guide: Dict = {
  title: {
    patternFocus: 'On corrige : « {{better}} »',
    plain: '{{title}}',
    focus: 'Objectif : {{title}}',
    again: 'Encore une fois : {{title}}',
    pronMoment: 'Minute prononciation',
    usefulWords: 'Mots utiles',
    recurringReview: 'Reprise des erreurs récurrentes',
    langPronReview: 'Reprise : langue et prononciation',
    extendedTask: 'Tâche de conversation approfondie',
    deepConversation: 'Conversation en profondeur',
    precisionCorrections: 'Corrections de précision',
    consolidation: 'Consolidation',
    vocabPronConsolidation: 'Consolidation du vocabulaire et de la prononciation',
    successRecap: 'Bilan des réussites',
    recapOneWin: 'Bilan et une réussite',
  },

  objective: {
    pattern:
      'A dit « {{example}} » dans {{lessons}} cours différents. Aucune notion de la bibliothèque de grammaire ne l’enseigne, donc on la traite comme une habitude : contraste, entraînement, emploi.',
    recurringGrammar: 'Erreur de grammaire récurrente — vue {{times}} fois (par exemple « {{example}} »).',
    noticedOnce: 'Erreur de grammaire repérée une seule fois pour l’instant (par exemple « {{example}} »).',
    pronunciation: 'La prononciation de « {{title}} » gêne la compréhension — elle mérite un travail ciblé.',
    spacedReview: 'Reprise espacée : il est temps de revenir à « {{title}} » pour l’ancrer.',
    naturalNext: 'La suite naturelle pour un niveau proche de {{level}}.',
    pronStaple: 'Une prononciation claire vaut toujours la peine d’être travaillée.',
    firstLesson: 'Un objectif adapté au niveau, le temps de découvrir comment il parle vraiment.',
    c1: {
      title: 'Coaching avancé de la communication',
      rationale: 'À un C1 solide, le cours devient une conversation longue et précise, avec un retour sur les nuances.',
    },
    c1First:
      'À ce niveau, le cours est une conversation longue et précise avec un retour fin — pas de la grammaire de rattrapage.',
    beginner: {
      P0: {
        title: 'Premier anglais oral : bonjour, ton prénom, oui / non',
        rationale: 'On part des fondations : de l’anglais oral utile, de l’écoute et de la prononciation avant toute lecture.',
      },
      P1: {
        title: 'Premiers mots et expressions du quotidien',
        rationale: 'On constitue un petit stock de mots et d’expressions fréquents, avec beaucoup d’écoute et de répétition.',
      },
      P2: {
        title: 'Débuts de la communication et de la lecture',
        rationale: 'Suivre des consignes simples, de courts échanges, et reconnaître les premiers sons et lettres.',
      },
      P3: {
        title: 'Vers le A1 : phrases simples et première lecture',
        rationale: 'Utiliser des phrases simples avec appui et commencer à lire des mots très familiers.',
      },
    },
  },

  defaults: {
    help: 'Dis-le toi-même une fois, puis rends-lui la main tout de suite.',
    challenge: 'Demande-lui-en un de plus, sur quelque chose de personnel.',
    studentDoes: {
      warmup: 'Parle librement de quelque chose de facile — aucune exigence de précision.',
      speakingListening: 'Répond à voix haute, en phrases complètes quand il le peut.',
      listening: 'Écoute et répond en montrant, en choisissant ou en faisant — parler n’est pas obligatoire.',
      reading: 'Lit à voix haute ou en silence, puis te dit ce que ça voulait dire.',
      writing: 'Écrit sur le papier pendant que tu restes silencieux.',
      microLesson: 'Regarde et écoute, puis essaie la nouvelle structure une fois.',
      guidedPractice: 'Produit la structure plusieurs fois avec tes relances.',
      communication: 'Parle la plupart du temps. Tu es le public, pas la vedette.',
      fluency: 'Parle sans s’arrêter pendant un temps donné, puis redit la même chose en moins de temps.',
      pronunciation: 'Écoute, regarde ta bouche et répète à voix haute.',
      vocabulary: 'Emploie le mot nouveau dans une phrase à lui.',
      feedback: 'Écoute, puis répète une fois la version améliorée.',
    },
    doneWhen: {
      warmup: 'Il a dit quelques phrases et il a l’air à l’aise.',
      speakingListening: 'Il a répondu à trois ou quatre questions sans caler.',
      listening: 'Il réagit correctement à ce qu’il entend, deux ou trois fois de suite.',
      reading: 'Il peut te dire l’idée principale avec ses mots.',
      writing: 'Il a écrit quelque chose qu’il peut te relire.',
      microLesson: 'Il a produit la structure une fois, correctement, avec de l’aide.',
      guidedPractice: 'Il la produit trois fois avec très peu de relances.',
      communication: 'Il a parlé longuement et le sujet est vraiment épuisé.',
      fluency: 'Le dernier tour est nettement plus fluide que le premier.',
      pronunciation: 'Le son est nettement plus net qu’au début de l’étape.',
      vocabulary: 'Il emploie le mot dans une phrase nouvelle, sans qu’on le lui demande.',
      feedback: 'Il a entendu une réussite précise et un objectif précis pour la suite.',
    },
  },

  card: {
    pattern: {
      goal: 'Remplacer une habitude : que « {{better}} » vienne tout seul, sans y penser.',
      explain:
        'N’explique pas de règle. Il a dit « {{said}} » : dis les deux versions, laisse-le choisir l’anglaise, puis fais-lui produire « {{better}} » jusqu’à ce que ça sorte tout seul.',
      avoid: [
        'N’explique pas la grammaire tant qu’on ne te le demande pas. C’est une habitude, pas une lacune.',
        'Ne corrige pas à chaque fois pendant la conversation : note-le et reviens dessus à la fin.',
      ],
    },
    grammar: {
      goal: 'Enseigner : {{title}}. {{explanation}}',
      stepBack: 'Redescends vers : {{title}}.',
      struggleDefault: 'Donne-lui une amorce de phrase et modèle-la lentement.',
      extend: 'Pousse vers : {{title}}.',
      succeedDefault: 'Demande-lui de l’employer dans une phrase qui le concerne.',
      avoid: 'Les longues explications de grammaire — fais remarquer, donne le modèle, puis laisse-le l’utiliser.',
    },
    pron: {
      goal: 'Prononciation : {{title}}. {{why}}',
      struggle: 'Ralentis, exagère le son, prends un miroir, puis reviens à la vitesse normale.',
      succeed: 'Passe des mots isolés à une phrase entière, puis à la conversation libre.',
      contrast: 'Contraste : {{a}} / {{b}}',
      avoid: 'Parler de « score » — fie-toi à ton oreille et à une appréciation en mots.',
    },
    warmup: {
      '6-8': {
        goal: 'Se poser, entendre l’enfant parler, garder le ton du jeu.',
        listenFor: ['des mots isolés bien articulés', 'l’envie d’essayer', 'la confiance'],
        ifStruggle: 'Montre du doigt, dites-le ensemble et laisse-le te copier.',
        ifSucceed: 'Pose une seule question de relance très simple.',
        howToExplain: 'Donne une phrase courte qu’il peut répéter.',
        avoid: ['Les consignes longues — court et chaleureux.'],
      },
      '9-12': {
        goal: 'Entrer en douceur et entendre sa langue de tous les jours.',
        listenFor: ['la longueur des phrases', 'les marqueurs de temps', 'les formes verbales'],
        ifStruggle: 'Donne une amorce de phrase pour le lancer.',
        ifSucceed: 'Demande « Pourquoi ? » une fois pour allonger la réponse.',
        howToExplain: 'Propose la tournure naturelle et laisse-le la redire.',
        avoid: ['Tout corriger — contente-toi d’écouter et de noter.'],
      },
      '13-17': {
        goal: 'Créer le lien autour de vrais centres d’intérêt et jauger l’aisance.',
        listenFor: ['l’étendue du vocabulaire', 'le naturel des tournures', 'la confiance'],
        ifStruggle: 'Propose un choix entre deux options plutôt qu’une question ouverte.',
        ifSucceed: 'Demande « What do you like about it? » pour prolonger.',
        howToExplain: 'Ajoute une raison avec « because ».',
        avoid: ['Avoir l’air d’un prof qui l’interroge.'],
      },
      adult: {
        goal: 'Une ouverture détendue ; entendre de la parole enchaînée et naturelle.',
        listenFor: ['la maîtrise des temps', 'l’aisance', 'les mots béquilles'],
        ifStruggle: 'Pose une question concrète, avec deux options.',
        ifSucceed: 'Relance sur les détails et sur son avis.',
        howToExplain: 'Relie les idées avec « and », « but », « so ».',
        avoid: ['Passer tout de suite aux corrections.'],
      },
    },
    speaking: {
      goal: 'Oral et écoute adaptés. Sonde le présent, le passé, le futur, la description, l’opinion.',
      listenFor: ['la maîtrise des temps', 'la forme des questions', 'l’étendue de la langue', 'un son à noter pour plus tard'],
      ifStruggle: 'Simplifie en questions oui/non ; donne une amorce de phrase.',
      ifSucceed: 'Demande des raisons, des détails et une hypothèse (« What would you…? »).',
      howToExplain: 'Pas de termes grammaticaux — donne simplement la forme correcte.',
      avoid: ['Parler plus que l’élève.'],
    },
    feedback: {
      goal: 'Donner un retour précis et encourageant, et fixer l’objectif suivant.',
      listenFor: [],
      ifStruggle: 'Garde une seule priorité claire ; termine sur une vraie qualité.',
      ifSucceed: 'Dis exactement ce qui s’est amélioré : « aujourd’hui le passé était juste ».',
      howToExplain: 'Précis et sincère, jamais un compliment passe-partout.',
      avoid: ['Les compliments vagues du type « très bien » sans détail.'],
    },
    fluency: {
      goal: 'L’aisance, pas la précision. Le même contenu, redit encore et encore contre un chrono qui rétrécit, jusqu’à ce que ça coule. On n’enseigne rien de nouveau ici.',
      listenFor: [
        'Les longues pauses au milieu des phrases — y en a-t-il moins à chaque tour ?',
        'Les faux départs et les auto-corrections — disparaissent-ils au dernier tour ?',
        'Le deuxième tour dit-il PLUS que le premier, en moins de temps ?',
      ],
      ifStruggle: 'Redonne-lui le même chrono plutôt qu’un plus court. Le remède, c’est la répétition, pas la pression.',
      ifSucceed: 'Ajoute une contrainte au dernier tour : pas de « and then », ou un détail nouveau.',
      howToExplain: 'Dis-le simplement : la même histoire à chaque fois, moins de temps à chaque fois. Ça doit devenir plus facile, pas plus dur.',
      avoid: [
        'Corriger quoi que ce soit pendant un tour. Interrompre un tour détruit l’exercice.',
        'Changer de sujet entre les tours — tout le bénéfice vient de répéter le même.',
      ],
      shape: 'Tour 1 — prends ton temps. Tour 2 — la même histoire, un peu plus vite. Le dernier — fluide, sans arrêt.',
      rounds2: 'Deux tours — le second plus rapide et avec un détail de plus.',
      rounds3: 'Trois tours — le même contenu, plus resserré à chaque fois.',
    },
    c1Review: {
      goal: 'Consolider les points de langue et de prononciation qui reviennent.',
      listenFor: ['Le moindre écart vu lors des derniers cours.'],
      ifStruggle: 'Redonne le modèle une fois et passe à la suite — que ça reste léger.',
      ifSucceed: 'Note que ça progresse ; monte d’un cran.',
      howToExplain: 'Propose la version plus naturelle et laisse-le la redire.',
      avoid: ['Transformer la reprise en long exposé.'],
    },
    c1Communication: {
      goal: 'Une parole longue et nuancée. C’est lui qui mène ; toi, tu façonnes.',
      listenFor: ['la précision', 'les associations de mots naturelles', 'le registre', 'l’intonation d’insistance'],
      ifStruggle: 'Donne un appui ou un angle plus vif, puis retire-toi.',
      ifSucceed: 'Ajoute une contrainte (temps limité, mot interdit, position inverse).',
      howToExplain: 'Signale les améliorations exactes : « ici, “significant” va mieux que “big” ».',
      avoid: ['Revenir à des exercices de manuel à ce niveau.'],
    },
    beginnerRecap: {
      goal: 'Consolider ce qui a été vu aujourd’hui et finir sur une vraie réussite.',
      listenFor: ['Ce qu’il retient des mots et expressions du jour'],
      ifStruggle: 'Ne reprends que deux éléments, avec des images.',
      ifSucceed: 'Demande-lui de t’apprendre un mot à son tour.',
      howToExplain: 'Chaleureux, court et précis.',
      avoid: ['Les compliments vagues — nomme ce qui a réellement marché.'],
    },
  },

  auto: {
    grammar: {
      do: 'Donne le modèle une fois, puis laisse-le essayer dans une phrase à lui.',
      nextHarder: 'C’est juste → appuie sur Plus difficile ({{title}})',
      nextHarderDefault: 'C’est juste → qu’il l’emploie dans une phrase sur lui-même',
      nextClose: 'Presque, mais fragile → redonne le modèle une fois, puis réessaie',
      nextEasier: 'Toujours bloqué → appuie sur Plus facile ({{title}})',
      nextEasierDefault: 'Toujours bloqué → donne une amorce de phrase et passe à la suite',
    },
    pron: {
      do: 'Dis-le lentement et en exagérant, puis à vitesse normale — qu’il copie les deux.',
      lookForPair: 'Entend-il la différence entre « {{a}} » et « {{b}} » ?',
      next: [
        'Net → passe à une phrase entière, puis à la conversation libre',
        'Presque → répète le mot deux ou trois fois de plus',
        'Pas encore → note-le, avance, et reviens-y au prochain cours',
      ],
    },
    warmup: {
      followUps: 'Si la réponse est courte : « {{a}} » ou « {{b}} »',
      '6-8': {
        do: ['Souris, garde le contact visuel, montre les objets pendant que tu poses la question.'],
        lookFor: ['La moindre tentative de répondre en anglais, même un seul mot.'],
        next: [
          'Répond librement → passe au cours',
          'A besoin d’aide → montrez ou mimez la réponse ensemble',
          'Reste muet → donne la réponse toi-même et enchaîne chaleureusement',
        ],
        teacherTip: 'Ici, c’est le lien qui compte, pas la justesse — garde le ton léger.',
      },
      '9-12': {
        do: ['Écoute-le jusqu’au bout avant de répondre ; acquiesce pendant qu’il parle.'],
        lookFor: ['La longueur des phrases', 'l’envie d’ajouter une deuxième phrase sans qu’on le lui demande'],
        next: [
          'Parle librement → passe au cours',
          'Répond en un mot → pose une question de relance facile',
          'Bloqué → donne une amorce de phrase et avance',
        ],
      },
      '13-17': {
        do: ['Traite ça comme une vraie conversation, pas comme un interrogatoire.'],
        lookFor: ['L’étendue du vocabulaire', 'la confiance', 'des tournures naturelles ou traduites'],
        next: [
          'Il est dedans et il parle → passe au cours',
          'Réponses courtes → propose un choix (« A ou B ? »)',
          'Réticent → laisse tomber, avance, réessaie une autre fois',
        ],
      },
      adult: {
        do: ['Écoute en cherchant un vrai fil à tirer.'],
        lookFor: ['La maîtrise des temps', 'l’aisance', 'un détail sur lequel il vaut la peine de revenir'],
        next: [
          'Parle facilement → passe au cours',
          'Reste bref → pose une question de relance précise',
          'Fatigué ou pressé → fais court et avance',
        ],
      },
    },
    speaking: {
      do: ['Pose une question, puis attends — ne comble pas le silence.'],
      lookFor: ['la maîtrise des temps', 'la forme des questions', 'un son à noter pour plus tard'],
      next: [
        'Répond facilement → demande une raison ou une hypothèse (« What would you…? »)',
        'En difficulté → simplifie en oui/non, ou donne une amorce de phrase',
        'Reste muet → donne la réponse toi-même, puis rends-lui la main',
      ],
    },
    reading: {
      nonreader: {
        do: ['Montre la lettre, dis le son, montre l’image.'],
        lookFor: ['Associe-t-il le son à l’image, même avec de l’aide ?'],
        next: [
          'Associe avec assurance → essaie une deuxième lettre',
          'A besoin d’aide → refaites-le ensemble une fois',
          'Perdu → passe à l’écoute seule et reviens à la lecture plus tard',
        ],
      },
      beginner: {
        do: ['Suis chaque mot du doigt pendant qu’il lit ; donne un mot bloqué au bout de deux ou trois secondes.'],
        lookFor: ['Déchiffrage son par son ou reconnaissance apprise par cœur', 'se corrige-t-il tout seul ?'],
        next: [
          'Lit couramment → pose la question de compréhension',
          'Lent mais juste → laisse-le finir, félicite l’effort',
          'Il devine → lisez à voix haute ensemble, puis fais-le répéter',
        ],
      },
      intermediate: {
        do: ['Laisse-le d’abord lire en silence ; ne corrige pas la prononciation pendant la lecture.'],
        lookFor: ['Saisit-il le sens général, pas seulement des mots isolés ?'],
        next: [
          'Idée principale claire → pose une question de détail',
          'Flou → demande « What happens first? »',
          'À côté → relisez une phrase ensemble et réessaie',
        ],
      },
      advanced: {
        do: ['Laisse-le relire la phrase clé s’il le souhaite.'],
        lookFor: ['L’inférence, pas seulement la compréhension littérale', 'peut-il montrer l’indice ?'],
        next: [
          'Saisit le sous-entendu → demande quel indice l’a mis sur la piste',
          'Presque → montre-lui la phrase clé et repose la question',
          'À côté → explique l’inférence et avance',
        ],
      },
    },
    writing: {
      early: {
        do: ['Écris-lui la trame si besoin ; laisse-le remplir le blanc.'],
        lookFor: ['Le tracé des lettres', 'sait-il ce qu’il a écrit une fois écrit ?'],
        next: [
          'Il l’écrit → fais-le te relire',
          'Il a besoin d’un modèle → écrivez-le une fois ensemble, puis il recopie',
        ],
      },
      beginner: {
        do: ['Laisse-lui du silence ; ne surveille pas chaque lettre.'],
        lookFor: ['La structure de base de la phrase', 'l’orthographe des mots fréquents'],
        next: [
          'Trois phrases claires → choisis-en une à dire à voix haute',
          'Une ou deux → c’est très bien, félicite ce qui est là',
          'Bloqué → donne une amorce de phrase',
        ],
      },
      intermediate: {
        do: ['Rappelle-lui un connecteur (and / but / so) s’il cale.'],
        lookFor: ['Les connecteurs bien employés', 'une idée claire et enchaînée'],
        next: [
          'Bien enchaîné → demande-lui d’ajouter une raison de plus',
          'Haché → montre-lui où « and » ou « so » relieraient deux idées',
        ],
      },
      advanced: {
        do: ['Laisse-lui une minute pour réfléchir en silence avant d’écrire.'],
        lookFor: ['Une position claire', 'un vrai contre-argument, pas un argument de plus dans le même sens'],
        next: [
          'Position claire et vrai contre-argument → note-le comme un travail solide',
          'Position sans contre-argument → demande « What would someone who disagrees say? »',
        ],
      },
    },
    communication: {
      now: 'Vraie conversation — il parle, tu écoutes et tu entretiens l’échange.',
      interest: 'Si ça se prête, oriente ça vers {{interest}} — ça compte pour lui.',
      do: [
        'Pose la question, puis tais-toi — c’est à lui de remplir le silence, pas à toi.',
        'Relances prêtes pour ce sujet : « {{follow1}} » · « {{follow2}} » · « {{follow3}} »',
      ],
      studentDoes: ['Parle la plupart du temps — plusieurs phrases d’affilée, pas des réponses d’un mot.'],
      lookFor: ['Développe-t-il, ou répond-il en un mot ?', 'Est-ce qu’il finit par ne plus savoir quoi dire ?'],
      help: ['Donne une réponse courte de ton côté comme modèle, puis rends-lui la main avec « {{follow4}} »'],
      challenge: ['Va chercher plus loin : « {{generic}} »'],
      doneWhen: 'Il a parlé sur de vraies durées et le sujet est réellement épuisé.',
      next: [
        'Parle facilement → continue : « {{follow1}} »',
        'Il ralentit → « {{follow2}} »',
        'Bloqué → « {{follow3}} », ou donne une réponse courte de ton côté comme modèle',
      ],
    },
    fluency: {
      clock: 'Tu as {{seconds}} secondes. Commence quand tu veux.',
      now: 'Sprint d’aisance — la même histoire, redite avec moins de temps à chaque tour.',
      do: [
        'Chronomètre à voix haute ou sur ton téléphone. Ne dis absolument rien pendant qu’il parle.',
        'Entre les tours : une phrase d’encouragement et zéro correction.',
      ],
      studentDoes: ['Parle sans s’arrêter pendant tout le tour, puis recommence en plus court.'],
      lookFor: [
        'Moins de longues pauses à chaque tour.',
        'Moins de faux départs — « I went… no, I was going… » doit s’estomper.',
        'Plus de contenu en moins de temps au dernier tour.',
      ],
      help: ['Redonne le même chrono au lieu de le raccourcir, ou laisse-le noter quelques mots avant le premier tour.'],
      challenge: ['Dernier tour en {{last}} secondes, sans mots béquilles.'],
      doneWhen: 'Le dernier tour ({{last}} s) est nettement plus fluide que le premier.',
      next: [
        'Plus fluide à chaque tour → dis exactement ce qui s’est amélioré, puis avance',
        'Comme au premier tour → refais un tour avec le MÊME chrono, pas plus court',
        'Il n’a plus rien à dire → raccourcis le chrono, garde le sujet',
      ],
      teacherTip: 'Ne dis rien pendant qu’il parle. Ton silence, c’est l’exercice.',
    },
    vocabulary: {
      do: ['Notez-le ensemble au moment où ça sort — n’attends pas la fin.'],
      lookFor: ['Sait-il le réemployer, tout seul, dans une autre phrase ?'],
      next: [
        'Bien employé → appuie sur Ajouter un mot pour l’enregistrer',
        'Fragile → redites-le une fois ensemble et enregistre-le quand même',
        'Rien ne lui vient → propose-lui-en un tiré de la conversation',
      ],
    },
    feedback: {
      do: ['Choisis exactement une chose réussie et une chose à travailler — pas une liste.'],
      lookFor: ['A-t-il l’air de reconnaître l’exemple précis que tu lui as donné ?'],
      next: ['Fin du cours — pas d’embranchement. Dis-le, puis passe à la clôture.'],
    },
    c1Review: {
      do: ['Propose une fois la version plus naturelle, puis fais-la redire dans une phrase nouvelle.'],
      lookFor: ['Les écarts qui traînent depuis les derniers cours.'],
      next: [
        'Corrigé facilement → avance, note que ça progresse',
        'Encore fragile → un modèle de plus, puis laisse tomber pour aujourd’hui',
        'Rien de récurrent en ce moment → passe directement à la conversation',
      ],
    },
    c1Communication: {
      do: ['N’interviens que pour rehausser — un mot plus juste, un angle plus dur, une contrainte.'],
      lookFor: [
        'La précision et le registre (c’est une tâche de type « {{category}} ») — pas seulement la correction.',
        'Va-t-il vers le mot facile ou vers le mot exact ?',
      ],
      next: [
        'Fluide et précis → monte d’un cran : « {{follow1}} »',
        'Bien mais générique → demande de la nuance : « {{follow2}} »',
        'Il s’essouffle → « {{follow3}} », ou ajoute une contrainte (mot interdit, temps limité, position inverse)',
      ],
    },
    c1Feedback: {
      do: ['Donne deux ou trois améliorations précises, pas une longue liste — à ce niveau, la qualité prime.'],
      lookFor: ['Voit-il tout de suite pourquoi l’autre formulation est meilleure ?'],
      next: ['Fin du cours — pas d’embranchement. Livre-le, puis passe à la consolidation.'],
    },
    c1Consolidation: {
      do: ['Choisis deux ou trois mots ou tournures précis de la conversation, plus un point de prononciation.'],
      lookFor: ['Sait-il reproduire la version précise sans qu’on la lui redonne ?'],
      next: [
        'Il la reproduit → note-la comme acquise',
        'Il a encore besoin du modèle → redis-la une fois et enregistre-la quand même',
      ],
    },
    beginnerRecap: {
      child: {
        do: ['Félicite-le chaleureusement. Reprends deux ou trois mots avec des images.', 'Si un parent est là, raconte-lui une réussite précise.'],
        lookFor: ['Se souvient-il de deux ou trois choses d’aujourd’hui ?', 'Repart-il avec le sentiment d’avoir réussi ?'],
        next: [
          'Se souvient facilement → le prochain cours peut passer à l’étape suivante',
          'Se souvient avec de l’aide → reprends un contenu semblable',
          'Se souvient à peine → reste sur ce contenu et ralentis',
        ],
        teacherTip: 'Termine chaque cours de débutant sur une vraie réussite. La confiance fait partie du programme.',
      },
      adult: {
        do: ['Nomme une réussite concrète.', 'Note une chose à travailler la prochaine fois.'],
        lookFor: ['Se souvient-il de deux ou trois choses d’aujourd’hui ?', 'Repart-il avec le sentiment d’avoir réussi ?'],
        next: [
          'Se souvient facilement → le prochain cours peut passer à l’étape suivante',
          'Se souvient avec de l’aide → reprends un contenu semblable',
          'Se souvient à peine → reste sur ce contenu et ralentis',
        ],
        teacherTip: 'Termine chaque cours de débutant sur une vraie réussite. La confiance fait partie du programme.',
      },
    },
  },

  step: {
    pattern: {
      notice: {
        now: 'Deux versions de la même phrase. Laisse-le trouver laquelle est anglaise.',
        say: 'Écoute : « {{said}} » … « {{better}} ». Laquelle sonne juste ?',
        do: [
          'Dis les deux à la même vitesse et au même volume. N’appuie pas sur la bonne.',
          'Puis attends. Laisse-le choisir avant de dire autre chose.',
        ],
        studentDoes: ['Écoute les deux, en choisit une et la dit à voix haute.'],
        lookFor: 'Entend-il la moindre différence ? C’est ça qui décide du temps que ça prendra.',
        help: ['Dis la bonne version deux fois toute seule, puis redemande.'],
        challenge: ['Demande-lui ce qui a changé exactement entre les deux.'],
        doneWhen: 'Il choisit la version anglaise et la dit une fois.',
        next: 'On entraîne : qu’il dise la bonne version, puis l’emploie dans une phrase à lui.',
      },
    },
    grammar: {
      meaning: {
        now: 'Montre ce que « {{title}} » VEUT DIRE — pas encore de règle, pas encore de terminologie.',
        studentDoes: ['Regarde et écoute. Rien à produire pour l’instant.'],
        lookFor: ['Une lueur de reconnaissance — un hochement de tête, une répétition, une réponse dans sa langue.'],
        help: ['Rends la situation plus concrète : un objet réel, un dessin, un geste.'],
        challenge: ['Demande-lui un deuxième exemple de la même situation, tiré de sa vie.'],
        doneWhen: 'Il montre qu’il a compris la situation, dans n’importe quelle langue.',
        next: 'Donner le modèle deux fois.',
      },
      model: {
        now: 'Donne le modèle — dis-le, ne l’explique pas.',
        do: [
          'Dis chaque exemple deux fois : une fois à vitesse normale, une fois lentement.',
          'Ne lui demande pas encore de répéter — laisse-le simplement entendre.',
        ],
        studentDoes: ['Écoute. Ne répète que s’il en a envie.'],
        lookFor: ['Est-ce qu’il écoute, ou est-ce qu’il essaie déjà de le dire ? Les deux vont bien.'],
        help: ['Réduis à un seul exemple et dis-le quatre fois.'],
        challenge: ['Ajoute un quatrième exemple, plus proche de sa vie réelle.'],
        doneWhen: 'Il a entendu la structure au moins trois fois.',
        next: 'Poser la question qui fait remarquer.',
      },
      notice: {
        now: 'Laisse-LE trouver la régularité. Ne la lui donne pas.',
        do: [
          'Pose la question, puis tais-toi. Compte jusqu’à cinq dans ta tête.',
          'Si un terme aide, qu’il tienne en une phrase simple.',
        ],
        studentDoes: ['Réfléchit, puis dit ce qu’il a remarqué — dans n’importe quelle langue.'],
        lookFor: ['Peut-il montrer ce qui a changé, même sans savoir le nommer ?'],
        help: 'Dis deux exemples à la suite et demande ce qui change. Ou dis-le-lui simplement : {{explanation}}',
        challenge: ['Demande-lui de deviner un quatrième exemple avant que tu ne le dises.'],
        doneWhen: 'Il sait montrer ce qui change, quelle que soit sa formulation.',
        next: 'Passer à la pratique guidée.',
      },
      guided: {
        now: 'Pratique guidée — c’est lui qui produit, toi tu relances.',
        do: ['Donne une consigne à la fois.', 'Attends. N’interviens que s’il cale plus de cinq secondes environ.'],
        studentDoes: ['Dit chaque réponse à voix haute, en phrase complète.'],
        lookFor: ['La justesse sur la structure du jour — le reste n’a pas d’importance maintenant.'],
        doneWhen: 'Il réussit trois fois de suite avec très peu de relances.',
        next: 'Passer à l’usage réel — une question à laquelle il a vraiment envie de répondre.',
      },
      realUse: {
        now: 'Usage réel — la même structure, mais sur sa vie à lui.',
        do: ['Demande, puis écoute. Ne corrige pas au milieu d’une phrase.', 'Note ce qui mérite d’être repris à l’étape du retour.'],
        studentDoes: ['Parle de quelque chose de réel et emploie la nouvelle structure quand elle s’y prête.'],
        lookFor: ['La structure apparaît-elle d’elle-même, sans relance ?', 'Pense-t-il au contenu plutôt qu’à la forme ?'],
        help: ['Donne une amorce de phrase et laisse-le la finir.'],
        challenge: 'Demande une raison, puis une hypothèse.',
        challengeHarder: 'Pousse vers {{title}}.',
        doneWhen: 'Il a employé la structure au moins une fois en communiquant pour de vrai.',
        next: 'Donner un retour précis.',
      },
      feedback: {
        now: 'Une correction. Pas une liste.',
        do: 'Choisis LA seule erreur qui gênait vraiment. Le reste, ce sera un autre jour.',
        studentDoes: ['Dit une fois, correctement, la version améliorée.'],
        lookFor: ['La redit-il avec justesse ?', 'A-t-il l’air encouragé plutôt qu’abattu ?'],
        help: 'Laisse passer pour aujourd’hui et note-le.',
        helpEasier: 'Mieux vaut redescendre vers {{title}} au prochain cours que d’insister maintenant.',
        challenge: ['Demande-lui d’employer tout de suite la forme corrigée dans une phrase nouvelle.'],
        doneWhen: 'Il a produit la version améliorée une fois, à voix haute.',
        next: 'Évaluer comment ça s’est passé et passer à l’activité suivante.',
      },
    },
    pron: {
      meaning: {
        now: 'Montre pourquoi {{title}} mérite deux minutes.',
        forThisLearner: 'Pour cet élève en particulier : {{note}}',
        studentDoes: ['Écoute la différence. Ne dit encore rien.'],
        lookFor: ['Entend-il seulement que ce sont deux mots différents ?'],
        help: ['Exagère les deux jusqu’à ce que la différence soit impossible à manquer, puis atténue.'],
        challenge: ['Dis l’un des deux au hasard et demande-lui lequel c’était.'],
        doneWhen: 'Il distingue les deux à l’oreille trois fois de suite.',
        next: 'Lui montrer comment le son se fabrique.',
      },
      model: {
        now: 'Donne le modèle du son, bouche bien visible.',
        do: 'Mets-toi face à lui. Exagère une fois, puis dis-le normalement.',
        studentDoes: ['Regarde ta bouche, puis copie à voix haute.'],
        lookFor: ['La position de la bouche d’abord, le son ensuite.', 'Accepte-t-il d’avoir l’air ridicule ? Ça aide.'],
        help: ['Prends un miroir pour qu’il voie sa bouche à côté du modèle.'],
        challenge: ['Passe directement au mot à l’intérieur d’un groupe de mots.'],
        doneWhen: 'Il produit le son de façon reconnaissable, isolément.',
        next: 'Le contraster avec le son qu’il met à la place d’habitude.',
      },
      guided: {
        now: 'Contraster et répéter — les paires, puis les mots, puis une phrase.',
        do: ['Alterne les deux, puis laisse-le mener.', 'Ne passe à la phrase entière que quand le mot est stable.'],
        studentDoes: ['Dit les paires, puis les mots, puis une phrase entière.'],
        help: ['Reviens aux mots isolés. Un mot net vaut mieux qu’une phrase brouillonne.'],
        doneWhen: 'Le son est net à l’intérieur d’une phrase entière, pas seulement isolé.',
        next: 'Enregistrer la version améliorée comme preuve.',
      },
      record: {
        now: 'Garder une trace — son propre avant et après.',
        do: 'Passe l’enregistrement de départ et le nouveau à la suite. Laisse-le écouter et dis-lui ce que TOI tu entends.',
        studentDoes: ['Enregistre un extrait, puis écoute les deux.'],
        lookFor: ['Est-ce que LUI entend la différence ? Ça compte plus que si toi tu l’entends.'],
        help: ['Si l’enregistrement le gêne, saute-le. Dis-lui simplement ce qui s’est amélioré.'],
        challenge: ['Enregistrer une phrase à vitesse naturelle plutôt qu’une phrase appliquée.'],
        doneWhen: 'Il a entendu son propre avant et après.',
        next: 'Évaluer à l’oreille et avancer.',
      },
      realUse: {
        now: 'L’utiliser en vraie conversation, là où ça compte vraiment.',
        do: ['Laisse-le parler. Note le son en silence — ne l’interromps pas pour corriger.'],
        studentDoes: ['Tient une vraie conversation, et le son travaillé y apparaît naturellement.'],
        lookFor: ['Le son tient-il à vitesse de conversation ?', 'Se faire comprendre passe avant la perfection.'],
        help: ['Réduis à une seule phrase qu’il maîtrise.'],
        challenge: ['Accélère, ou ajoute un sujet distrayant pour qu’il ne puisse plus penser au son.'],
        doneWhen: 'Il a parlé librement un bon moment et le son a tenu la plupart du temps.',
        next: 'Évaluer le son et avancer.',
      },
    },
    fluency: {
      round: {
        now: 'Tour {{round}} sur {{count}} — {{seconds}} secondes, le même sujet.',
        timer: 'Lance un chrono de {{seconds}} secondes, à un endroit où il le voit.',
        silence: 'Ne dis absolument rien pendant qu’il parle. Même pas « mm-hm ».',
        noteGood: 'Note une chose précise qui était bien — tu la lui diras entre les tours.',
        betweenRounds: 'Entre les tours : une phrase d’encouragement, zéro correction.',
        studentDoes: 'Parle sans s’arrêter pendant {{seconds}} secondes sur le même sujet.',
        lookForFirst: [
          'Combien de contenu y a-t-il ? C’est le point de départ pour le tour suivant.',
          'Où tombent les longues pauses ?',
        ],
        lookForLater: ['Moins de longues pauses qu’au tour précédent ?', 'Moins de faux départs et d’auto-corrections ?'],
        lookForMiddle: 'Un détail nouveau, absent la fois d’avant ?',
        lookForFinal: 'Est-ce que ça sonne enfin facile ?',
        helpFirst: 'Laisse-le d’abord jeter trois mots sur le papier. Des notes, oui ; lire un texte à voix haute, non.',
        helpLater: 'Relance le MÊME chrono au lieu d’un plus court. Le remède, c’est la répétition, pas la pression.',
        challenge: 'Demande une raison ou un exemple de plus dans le même temps.',
        challengeFinal: 'Interdis un mot sur lequel il s’appuie (« and then », « like », « very »), puis refais un tour.',
        doneWhen: 'Il a parlé les {{seconds}} secondes entières sans que tu combles une seule pause.',
        next: 'Lancer le tour suivant — {{next}} secondes, même sujet.',
        nextFinal: 'Dis-lui exactement ce qui s’est amélioré, puis avance.',
      },
      recap: {
        now: 'Nomme ce qui s’est vraiment amélioré. C’est là toute la récompense de l’exercice.',
        do: [
          'Sois précis : moins de pauses, un démarrage plus rapide, une phrase plus longue, moins de traduction intérieure.',
          'NE corrige PAS la grammaire ici. Le travail de justesse a sa place ailleurs dans le cours.',
        ],
        studentDoes: ['Entend une chose concrète qui s’est améliorée.'],
        lookFor: ['Reconnaît-il lui-même le progrès ? C’est ça qui lui donnera envie de recommencer chez lui.'],
        help: ['Si rien ne s’est amélioré, dis-le avec tact et garde le même sujet pour le prochain cours.'],
        challenge: ['Demande-lui quel tour lui a semblé le plus facile, et pourquoi.'],
        doneWhen: 'Il a entendu une chose précise et vraie qui s’est améliorée.',
        next: 'Passer à la conversation libre.',
      },
    },
    generic: {
      scoreAndMoveOn: 'Évalue comment ça s’est passé, puis avance.',
      handOver: 'Lui passer la main pour qu’il essaie.',
      turn: {
        now: 'À lui — c’est lui qui dit, toi tu ne fais que relancer.',
        do: [
          'Dis-le encore une fois, puis tais-toi et attends. Compte jusqu’à cinq avant d’aider.',
          'Félicite la tentative avant d’y corriger quoi que ce soit.',
        ],
        studentDoes: ['Dit la structure à voix haute, plusieurs fois, avec moins d’aide à chaque fois.'],
        lookFor: ['Est-ce qu’il la produit lui-même, ou répète-t-il encore mot pour mot après toi ?'],
        doneWhen: 'Il la produit une fois sans que tu l’aies dite avant.',
      },
      deeper: {
        now: 'Creuse le même sujet — ne change pas encore de thème.',
        do: ['Suis le fil qui l’intéresse le plus.', 'Parle nettement moins que lui.'],
        studentDoes: ['Développe, donne des raisons et des exemples, et te pose une question en retour.'],
        lookFor: ['Des tours de parole plus longs qu’au début.', 'Va-t-il chercher des mots nouveaux ou reste-t-il en terrain sûr ?'],
        help: ['Donne une réponse courte de ton côté comme modèle, puis rends-lui la main tout de suite.'],
        challenge: ['Ajoute une contrainte : un temps limité, un mot interdit, ou la position inverse.'],
        doneWhen: 'La conversation est vraiment allée au bout — pas quand la montre le dit.',
        next: 'Retenir un mot ou une expression utile de ce qu’il a dit.',
      },
    },
    fix: {
      now: 'Correction ciblée — les erreurs qui reviennent, dites correctement.',
      cue: 'Tu as dit « {{said}} ». En anglais, on dit « {{better}} ». Dis-le avec moi.',
      do: [
        'Une paire à la fois. Ils disent la bonne version à voix haute, deux fois.',
        'Ensuite demande une phrase à eux avec ça : la correction doit sortir de l’exercice.',
        'N’explique pas la règle sauf s’ils la demandent. C’est une habitude, pas de la théorie.',
      ],
      studentDoes: ['Dit la bonne version à voix haute, puis l’utilise dans une phrase à lui.'],
      lookFor: [
        'Se corrigent-ils avant que tu dises quoi que ce soit ? C’est ça, la victoire.',
        'Est-ce que ça tient dans leur propre phrase, ou seulement dans la répétition ?',
      ],
      help: ['Dis la bonne version et fais-la répéter. Répéter aujourd’hui, c’est produire la semaine prochaine.'],
      challenge: ['Demande la même forme trois fois dans une seule réponse longue.'],
      doneWhen: 'Chacune a été dite correctement au moins une fois, dans une phrase à eux.',
      next: 'Note ce qu’ils ont corrigé sans aide : ça va dans le rapport.',
    },
    retrieval: {
      now: 'Rappel rapide de ce qui doit être revu depuis les cours précédents.',
      cueMeaning: 'Comment dit-on en anglais : {{meaning}} ?',
      cueTerm: 'Emploie « {{term}} » dans une phrase.',
      do: [
        'Demande-lui de retrouver chaque élément de mémoire. Ne lui montre pas le mot avant.',
        'Si ça prend plus de quelques secondes, donne-le-lui et passe à la suite.',
      ],
      studentDoes: ['Retrouve chaque élément et l’emploie dans une phrase à lui.'],
      lookForRecall: 'C’est le rappel SANS indice qui fait preuve.',
      lookForErrors: 'Surveille : {{errors}}',
      lookForSlips: 'D’anciens écarts qui reviennent en douce.',
      help: ['Donne le premier son, puis le mot entier. Reconnaître, c’est déjà avancer.'],
      challenge: ['Demande-lui deux éléments dans la même phrase.'],
      doneWhen: 'Chaque élément a été retrouvé ou réexpliqué une fois.',
      next: 'Passer à l’objectif principal du cours.',
    },
  },
}

export default guide
