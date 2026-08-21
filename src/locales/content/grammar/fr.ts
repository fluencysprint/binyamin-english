/* Grammaire — consignes pour le tuteur. Les exemples et exercices restent en anglais. */

import { Dict } from '../../../i18n/dict'

const grammar: Dict = {
  g_present_be: {
    title: 'Le verbe « to be » (am / is / are)',
    tutorExplanation:
      'Les formes du présent de « be » : I am, you/we/they are, he/she/it is. Il relie le sujet à une description ou à une identité. C’est le verbe le plus fréquent de l’anglais.',
    studentExplanation: 'am / is / are servent à dire ce qu’est une chose ou comment on se sent.',
    meaningFirst:
      'Montre-toi du doigt : « I am Binyamin. » Montre-le : « You are ___. » Montre un objet : « It is a cup. » Le sens vient du geste, pas d’une explication.',
    correctionMethod: 'Montre le sujet, puis choisissez ensemble la forme qui va avec. Fais-lui redire la phrase correctement.',
    fallback: 'Redescends au seul « I am ___ ». Une forme, sur lui-même, dix fois : c’est un vrai progrès.',
    extension: 'Ajoute la négation (« I’m not… ») et la question (« Are you…? »), puis laisse-le t’interviewer.',
    jargon: ['la personne ou la chose qui fait l’action — le mot placé avant le verbe.'],
  },
  g_pronouns_possessives: {
    title: 'Les mots pour les personnes (I / my, you / your, he / his…)',
    tutorExplanation:
      'Les pronoms sujets (I, you, he, she, it, we, they) et les possessifs correspondants (my, your, his, her, its, our, their). Ceux dont la langue marque le genre autrement confondent his et her en permanence.',
    studentExplanation: '« I / you / he / she » pour la personne, « my / your / his / her » pour ce qui lui appartient.',
    meaningFirst:
      'Lève ton stylo : « my pen ». Donne-le-lui : « your pen ». Montre une troisième personne ou une photo : « his pen » / « her pen ». On n’explique rien ; ce sont les objets qui travaillent.',
    correctionMethod:
      'Demande « C’est à qui — à un homme ou à une femme ? », donne ensuite le bon mot et fais redire toute la phrase.',
    fallback: 'Seulement « my » et « your », avec de vrais objets que vous vous passez.',
    extension: 'Ajoute « mine / yours / hers » (« That book is mine ») et les pronoms compléments (« I saw him »).',
  },
  g_plurals: {
    title: 'Un et plus d’un (le pluriel)',
    tutorExplanation:
      'Le pluriel régulier ajoute -s (qui se prononce /s/, /z/ ou /ɪz/ selon le son précédent). Une courte liste est irrégulière : man→men, woman→women, child→children, foot→feet, person→people. Dans les langues sans ce -s, on l’oublie tout simplement.',
    studentExplanation: 'Pour plus d’une chose, on ajoute « s » à la fin du mot.',
    meaningFirst:
      'Pose un stylo sur la table : « a pen ». Ajoutes-en deux : « three pens ». Fais-le avec trois objets différents avant de dire un mot sur la lettre s.',
    correctionMethod: 'Lève le bon nombre de doigts, puis dis le mot avec le -s bien net. Fais-lui répéter toute l’expression, pas seulement le mot.',
    fallback: 'Comptez ensemble de vrais objets, de un à trois, et laisse-le simplement copier ta phrase.',
    extension: 'Oppose les trois prononciations du pluriel (cats /s/, dogs /z/, boxes /ɪz/) — une victoire de prononciation au passage.',
  },
  g_have_got: {
    title: 'Dire ce qu’on a',
    tutorExplanation:
      '« I have a car » (américain, neutre) et « I have got a car » (plus britannique, plus oral). Enseigne « have/has » — à la troisième personne, c’est « has ». En anglais américain, questions et négations passent par do/does : « Do you have…? », « I don’t have… ».',
    studentExplanation: '« have » sert à dire ce que tu as. Avec he, she et it, on dit « has ».',
    meaningFirst:
      'Lève ton téléphone : « I have a phone. » Montre le sien : « You have a phone. » Montre une main vide : « I don’t have a pen. »',
    correctionMethod: 'He/she/it → « has ». À la négation ou à la question, do/does entre en jeu et le verbe redevient « have ».',
    fallback: 'Seulement « I have ___ » avec des objets que vous voyez et touchez tous les deux.',
    extension: 'Passez à « How many … do you have? » et aux réponses courtes (« Yes, I do. »).',
  },
  g_there_is_are: {
    title: 'There is / There are',
    tutorExplanation:
      'Sert à dire que quelque chose existe ou se trouve là : « There is a problem », « There are two chairs ». Singulier → is, pluriel → are. Beaucoup de langues expriment cela avec un verbe du type « avoir », d’où le « Here have a chair ».',
    studentExplanation: '« There is » pour une chose, « There are » pour plusieurs.',
    meaningFirst:
      'Fais un geste circulaire dans la pièce en nommant ce qu’elle contient : « There is a window. There are two chairs. » Laisse le geste porter le sens.',
    correctionMethod: 'Demande « Une seule, ou plusieurs ? » et laisse-le choisir lui-même is ou are avant de redire la phrase.',
    fallback: 'Seulement « There is a ___ » en montrant des objets isolés.',
    extension: 'Ajoute le passé (« There was / There were ») et la négation (« There isn’t any… »).',
  },
  g_present_simple: {
    title: 'Présent simple',
    tutorExplanation:
      'Pour les habitudes, les routines et les faits. À la troisième personne du singulier (he/she/it), on ajoute -s. Aux questions et aux négations, do/does entre en jeu et le verbe principal reprend sa forme de base.',
    studentExplanation: 'Le présent simple sert à ce qu’on fait souvent ou à ce qui est toujours vrai.',
    meaningFirst:
      'Mime ta propre matinée dans l’ordre — réveil, café, travail — en la commentant : « I wake up. I drink coffee. I go to work. » Puis demande la sienne.',
    correctionMethod: 'Souligne qu’après he/she/it le verbe a besoin d’un -s. Dans la question, ce -s déménage dans « does ».',
    fallback: 'Restez sur « I » et « you » uniquement — aucun -s à gérer — et construisez d’abord l’aisance là.',
    extension: 'Ajoute les mots de fréquence (« usually », « hardly ever ») et des questions à la troisième personne sur quelqu’un d’autre.',
    jargon: ['tout simplement he, she ou it — les formes qui prennent un -s en plus.'],
  },
  g_wh_questions: {
    title: 'Les mots interrogatifs (what / where / when / who / why / how)',
    tutorExplanation:
      'Dans les questions en wh-, le mot interrogatif vient en premier, puis on retrouve la même structure avec do/does ou be : « Where do you live? », « Who is she? ». Ce qui se perd, c’est le basculement de l’ordre des mots.',
    studentExplanation: 'Commence par le mot interrogatif, puis pose la question comme d’habitude.',
    meaningFirst:
      'La réponse d’abord, la question ensuite : dis « I live in Haifa, » puis demande « Where do you live? » Le schéma se voit avant d’être nommé.',
    correctionMethod:
      'Dis la bonne question à vitesse normale, puis lentement, en tapant une fois par mot pour qu’il entende l’ordre. Fais-la-lui reposer à toi.',
    fallback: 'Donne la question entière comme un bloc à copier (« Where do you live? ») et ne changez que le dernier mot.',
    extension: 'Ajoute « How long / How often / What kind of… » et des relances qui s’appuient sur la réponse.',
  },
  g_can_ability: {
    title: 'Can — capacité, demande et permission',
    tutorExplanation:
      '« Can » ne prend jamais de -s et est toujours suivi du verbe nu : « She can swim ». À la question, il y a inversion : « Can you help? ». Il couvre d’un coup la capacité, la demande et la permission — excellent rapport qualité-prix très tôt.',
    studentExplanation: '« can » sert à dire ce que tu sais faire et à demander quelque chose.',
    meaningFirst:
      'Mime la nage et dis « I can swim. » Mime que tu n’arrives pas à soulever quelque chose de lourd : « I can’t lift it. » Puis demande-lui ce qu’il sait faire.',
    correctionMethod: 'On n’ajoute rien à « can », et rien non plus au verbe qui suit. Donne le modèle de la paire nue.',
    fallback: 'Seulement « I can ___ » avec des actions mimées.',
    extension: 'Oppose « can » à « could » pour les demandes polies, et à « be able to » aux autres temps.',
  },
  g_present_continuous: {
    title: 'Présent continu',
    tutorExplanation:
      'am/is/are + verbe en -ing pour ce qui se passe maintenant ou en ce moment. Il y a DEUX morceaux, et on en perd un — soit le « be », soit le -ing.',
    studentExplanation: 'am/is/are + -ing pour ce qui se passe en ce moment même.',
    meaningFirst:
      'Commente l’action en direct : lève-toi et dis « I am standing. » Assieds-toi : « Now I am sitting. » Demande-lui de faire quelque chose et commente-le.',
    correctionMethod: 'Vérifie les deux morceaux : le verbe « be » ET le -ing. S’il en manque un, ajoutez-le ensemble.',
    fallback: 'Seulement « I am ___ing » pendant qu’il fait réellement l’action.',
    extension: 'Oppose au présent simple : « I work in a bank » et « I’m working from home this week. »',
  },
  g_prepositions_place: {
    title: 'Où se trouvent les choses (in / on / at / under / next to)',
    tutorExplanation:
      'in = à l’intérieur d’un espace, on = en contact avec une surface, at = un point ou un lieu où l’on va. Les prépositions ne se correspondent presque jamais une pour une d’une langue à l’autre : on les retient en expressions, pas par une règle.',
    studentExplanation: 'De petits mots qui disent où est une chose : in the box, on the table, at home.',
    meaningFirst:
      'Déplace un seul objet en nommant chaque position : « in the cup », « on the cup », « under the cup », « next to the cup ». Rien d’autre.',
    correctionMethod: 'N’explique pas — remontre avec l’objet et laisse-le redire l’expression. Cela s’apprend au toucher et par répétition.',
    fallback: 'Deux prépositions seulement — in et on — avec un seul objet.',
    extension: 'Ajoute les prépositions de mouvement (into, out of, through, across) en les jouant.',
  },
  g_adverbs_frequency: {
    title: 'À quelle fréquence (always / usually / sometimes / never)',
    tutorExplanation:
      'Les adverbes de fréquence se placent normalement AVANT le verbe principal (« I always eat breakfast ») mais APRÈS « be » (« I am always late »). Toute la difficulté est là.',
    studentExplanation: 'always, usually, sometimes et never disent à quelle fréquence tu fais quelque chose.',
    meaningFirst:
      'Trace une ligne : never à un bout, always à l’autre. Places-y à voix haute deux de tes propres habitudes avant de demander les siennes.',
    correctionMethod: 'L’adverbe se place juste avant le mot d’action — sauf avec am/is/are, où il passe après. Donne le modèle des deux cas.',
    fallback: 'Seulement « always » et « never », avec deux habitudes très concrètes.',
    extension: 'Ajoute « hardly ever », « once a week », « every other day » et demande des raisons.',
  },
  g_articles: {
    title: 'Les articles (a / an / the)',
    tutorExplanation:
      'a/an = un, non précisé (an devant un SON de voyelle). the = précis, ou déjà connu de vous deux. Pas d’article pour les pluriels généraux et les indénombrables. Les locuteurs de langues sans articles (russe, hébreu) les omettent purement et simplement.',
    studentExplanation: '« a/an » pour une chose nouvelle, « the » quand on sait tous les deux de laquelle il s’agit.',
    meaningFirst:
      'Raconte une histoire de deux lignes avec le même nom : « I saw a dog. The dog was huge. » Dis-la deux fois et laisse la bascule se faire sentir avant de la nommer.',
    correctionMethod: 'Demande : « Une chose, pour la première fois ? » → a/an. « On sait tous les deux laquelle ? » → the. Donne le modèle, puis qu’il réessaie.',
    fallback: 'Travaillez seulement « a/an » avec des métiers et des objets. Laisse « the » entièrement pour un autre cours.',
    extension: 'Travaille l’absence d’article avec les noms abstraits et les généralités (« Life is short », « I love dogs »).',
    jargon: ['tout simplement les mots a, an et the.', 'ce qui ne se compte pas un par un : l’eau, la musique, l’information.'],
  },
  g_past_simple: {
    title: 'Prétérit (past simple)',
    tutorExplanation:
      'Actions terminées dans le passé. Les verbes réguliers ajoutent -ed ; beaucoup des plus courants sont irréguliers (go→went, buy→bought). Aux questions et négations, « did » entre en jeu et le verbe principal reprend sa forme de base.',
    studentExplanation: 'Le prétérit sert à ce qui est déjà terminé. Beaucoup de verbes changent : go → went.',
    meaningFirst:
      'Trace une ligne du temps, marque « now », montre derrière et raconte vingt secondes de ton vrai hier. Puis demande le sien.',
    correctionMethod: 'Repère le mot de temps (yesterday, last…). Mets le verbe au passé. Après « did », le verbe revient à sa forme de base.',
    fallback: 'Donne-lui cinq verbes irréguliers sur papier et laisse-le raconter en lisant la liste. L’aisance d’abord, la mémoire ensuite.',
    extension: 'Ajoute « ago », la négation et des relances, pour que ce soit une vraie conversation et pas une récitation.',
    jargon: ['un verbe qui n’ajoute pas simplement -ed — il faut apprendre sa forme de passé.'],
  },
  g_countable_quantifiers: {
    title: 'Combien (some, any, a lot of)',
    tutorExplanation:
      'Les dénombrables prennent many / a few / How many. Les indénombrables (water, money, time, information, advice) prennent much / a little / How much. « A lot of » marche avec les deux : c’est un repli sûr et utile.',
    studentExplanation: 'Ce qui se compte prend « many » ; ce qui ne se compte pas prend « much ».',
    meaningFirst:
      'Pose trois pièces et un verre d’eau sur la table. Compte les pièces à voix haute ; essaie de compter l’eau et hausse les épaules. La distinction passe sans un mot d’explication.',
    correctionMethod: 'Demande « On peut les compter, un, deux, trois ? » Laisse-le répondre, puis fournis much ou many.',
    fallback: 'N’utilisez que « a lot of », correct avec tout, et construisez d’abord la confiance.',
    extension: 'Ajoute « too much / too many / not enough » et laisse-le se plaindre de quelque chose pour de vrai.',
  },
  g_comparatives: {
    title: 'Comparatifs et superlatifs',
    tutorExplanation:
      'Adjectifs courts : -er / -est (big→bigger→biggest). Longs : more/most (interesting). Irréguliers : good→better→best, bad→worse→worst. La comparaison prend « than ».',
    studentExplanation: 'On compare deux choses avec -er ou « more ». Pour la première de toutes, -est ou « most ».',
    meaningFirst:
      'Prends deux objets de tailles nettement différentes : « This one is bigger. » Ajoutes-en un troisième : « And this is the biggest. » D’abord physique, ensuite verbal.',
    correctionMethod: 'Compte les syllabes : court → -er ; long → more. Jamais « more » et -er ensemble.',
    fallback: 'Deux objets devant lui, un seul adjectif, et vous le dites ensemble à voix haute.',
    extension: 'Ajoute « as … as », « not as … as » et « the more … the more … ».',
    jargon: ['une frappe dans le mot — « big » en a une, « in-te-res-ting » en a quatre.'],
  },
  g_going_to: {
    title: 'Les projets avec « going to »',
    tutorExplanation:
      '« be going to » + verbe pour des projets déjà décidés et pour des prédictions avec des indices visibles : « Look at those clouds — it’s going to rain. » On perd le « be » ou on met le présent simple à la place.',
    studentExplanation: '« going to » sert à ce que tu as déjà décidé de faire.',
    meaningFirst:
      'Montre un calendrier ou un agenda — vrai ou dessiné —, désigne un jour à venir et dis ce que tu vas faire. Puis désigne le sien.',
    correctionMethod: 'Vérifie que le « be » est là, puis le verbe nu après « to ». Si le projet est déjà décidé, « going to » est le choix naturel.',
    fallback: 'Une seule trame : « I’m going to ___ tomorrow. »',
    extension: 'Oppose à « will » pour les décisions prises sur le moment, et au présent continu pour les rendez-vous fixés.',
  },
  g_will_future: {
    title: '« Will » — décisions, propositions et prédictions',
    tutorExplanation:
      '« will » + verbe nu. Pour les décisions prises au moment de parler (« I’ll get it »), les propositions, les promesses et les prédictions sans indice. Ne prend jamais de -s, jamais de « to ».',
    studentExplanation: '« will » quand tu décides à l’instant, ou quand tu penses que quelque chose va arriver.',
    meaningFirst:
      'Fais tomber quelque chose (ou mime-le) et dis aussitôt « I’ll get it. » La décision se prend devant lui, et c’est tout le sens.',
    correctionMethod: 'Après « will », rien d’autre que le verbe nu. Si le projet était déjà pris, passe à « going to ».',
    fallback: 'Ne travaillez que les propositions : « I’ll ___. » dans trois situations mimées.',
    extension: 'Ajoute « might / probably / definitely » pour doser la confiance d’une prédiction.',
  },
  g_past_continuous: {
    title: 'Passé continu (le décor d’un récit)',
    tutorExplanation:
      'was/were + -ing pour une action déjà en cours quand une autre survient : « I was cooking when he called. » L’action longue est au continu, celle qui interrompt au prétérit.',
    studentExplanation: '« was/were + -ing » pour ce qui était déjà en train de se passer quand autre chose est arrivé.',
    meaningFirst:
      'Jouez-le : commence à mimer la cuisine, et qu’il « appelle ». Fige-toi et raconte : « I was cooking when you called. »',
    correctionMethod: 'Dessine l’action longue en ligne et la courte en croix dessus. Laisse le dessin expliquer, puis fais redire la phrase.',
    fallback: 'Demande seulement « What were you doing at 8 o’clock? » et accepte une seule proposition.',
    extension: 'Construisez une anecdote entière en alternant décor (continu) et événements (prétérit).',
  },
  g_must_have_to: {
    title: 'Règles et nécessité (have to / must / don’t have to)',
    tutorExplanation:
      '« have to » = nécessité extérieure (une règle, un travail). « must » = fort, souvent personnel ou dans des règlements écrits. Le piège est la négation : « mustn’t » = c’est interdit, « don’t have to » = c’est facultatif. Ce sont des contraires.',
    studentExplanation: '« Have to », c’est obligatoire. « Don’t have to », c’est comme tu veux.',
    meaningFirst:
      'Prends deux règles réelles de sa vie — une obligation et un libre choix — et énonce chacune comme un fait avant de les comparer.',
    correctionMethod: 'Demande « C’est interdit, ou simplement facultatif ? » La réponse choisit la forme. Redis les deux versions pour qu’on entende le contraste.',
    fallback: 'Seulement « I have to ___ » à propos de sa vraie journée.',
    extension: 'Ajoute la nécessité au passé (« had to ») et « should » pour le conseil, et fais comparer la force de chacun.',
  },
  g_prepositions_time: {
    title: 'Quand les choses se passent (in / on / at)',
    tutorExplanation:
      'at + l’heure et « night » ; on + les jours et les dates ; in + les mois, les années, les saisons et les moments de la journée. Petit ensemble, très fréquent, et faux dans presque toute production de débutant.',
    studentExplanation: 'at 7 o’clock, on Monday, in July — trois petits mots pour trois tailles de temps.',
    meaningFirst: 'Écris un vrai emploi du temps : une heure, un jour, un mois. Lis chacun à voix haute avec sa préposition avant de les comparer.',
    correctionMethod: 'Du plus petit au plus grand : at (l’heure) → on (le jour) → in (le mois ou l’année). Dis l’échelle, puis la phrase.',
    fallback: 'Ne travaille que les heures avec « at ».',
    extension: 'Ajoute « during / for / since / until / by » avec une ligne du temps dessinée entre vous.',
  },
  g_present_perfect: {
    title: 'Present perfect',
    tutorExplanation:
      'have/has + participe passé. Relie le passé au présent : expériences (ever/never), période non terminée (for/since), résultats récents. S’il y a un mot de temps fermé (yesterday, in 2019), l’anglais passe au prétérit.',
    studentExplanation: 'have/has + verbe pour les expériences de vie ou ce qui compte encore maintenant. Sans moment précis du passé.',
    meaningFirst:
      'Interroge sur l’expérience, pas sur l’événement : « Have you ever eaten sushi? » Après un oui, demande « When? » — et regarde le temps basculer tout seul au prétérit.',
    correctionMethod: 'S’il y a un mot de temps fermé (yesterday, in 2019), c’est le prétérit. Sinon, present perfect pour le « jusqu’à maintenant ».',
    fallback: 'Restez sur le bloc figé « Have you ever…? » et laisse-le répondre au prétérit. La forme de la question vaut à elle seule le cours.',
    extension: 'Oppose present perfect et prétérit dans une même histoire, et ajoute « just / already / yet ».',
    jargon: ['la troisième forme du verbe : go – went – GONE, see – saw – SEEN.'],
  },
  g_used_to: {
    title: '« Used to » — comment c’était avant',
    tutorExplanation:
      '« used to » + verbe nu pour des habitudes et des états passés qui ne sont plus vrais. Aux questions et aux négations, le « d » disparaît : « Did you use to…? », « I didn’t use to… ».',
    studentExplanation: '« used to » sert à ce qui était vrai avant et ne l’est plus.',
    meaningFirst:
      'Raconte un avant/après vrai sur toi : « I used to live in the States. Now I live here. » C’est le contraste qui porte le sens.',
    correctionMethod: 'Vérifie qu’il s’agit d’une habitude répétée et non d’un événement unique. Dans la question, « did » porte déjà le passé, donc le « d » tombe.',
    fallback: 'Une seule trame : « I used to ___. » sur l’enfance.',
    extension: 'Ajoute « would » pour les actions répétées dans un récit, et « be used to » (tout autre chose).',
  },
  g_should_advice: {
    title: 'Donner un conseil (should / ought to / why don’t you)',
    tutorExplanation:
      '« should » + verbe nu. Plus doux que « must ». Très rentable en conversation : le conseil est l’une des choses que les apprenants veulent le plus donner et qu’ils formulent le plus souvent comme un ordre.',
    studentExplanation: '« should » sert à dire ce qui te paraît une bonne idée.',
    meaningFirst:
      'Décris un petit problème réel à toi et demande conseil. Il ira chercher la structure tout seul, parce qu’il a vraiment envie de répondre.',
    correctionMethod: 'Pas de « to » après « should ». Si ça doit sonner comme un ami et non comme un chef, « should » plutôt que « must ».',
    fallback: 'Une trame : « You should ___. » avec trois problèmes évidents.',
    extension: 'Dose la force : « You might want to… / I’d suggest… / You really ought to… ».',
  },
  g_gerund_infinitive: {
    title: 'Verbe + -ing ou verbe + to',
    tutorExplanation:
      'Certains verbes sont suivis de -ing (enjoy, finish, avoid, mind, keep), d’autres de « to » + verbe (want, need, decide, hope, promise). Quelques-uns acceptent les deux. Il n’y a pas de règle fiable — cela s’apprend verbe par verbe, en blocs.',
    studentExplanation: 'Après certains verbes vient « -ing », après d’autres « to ». Apprends-les par paires.',
    meaningFirst:
      'Dis quatre phrases vraies sur toi avec ces verbes, pour que le schéma arrive dans du contenu réel : « I enjoy cooking. I want to travel. »',
    correctionMethod:
      'N’explique pas de règle — il n’y en a pas. Dis le bon bloc de deux mots (« enjoy cooking ») et fais-lui répéter la paire, puis la phrase entière.',
    fallback: 'Ne travaillez que « I like ___ing » et « I want to ___ ». Deux blocs, bien ancrés.',
    extension: 'Ajoute les verbes qui changent de sens selon la forme : « stop smoking » et « stop to smoke », « remember to » et « remember -ing ».',
    jargon: ['un verbe qui se comporte comme un nom — la forme en -ing, comme dans « I like swimming ».', 'la forme « to + verbe » : to go, to eat.'],
  },
  g_conditionals: {
    title: 'Les conditionnelles (zéro, première, deuxième)',
    tutorExplanation:
      'Zéro : vérités générales (« If you heat ice, it melts »). Première : futur réel (« If it rains, I will stay »). Deuxième : irréel ou hypothétique (« If I had time, I would travel »). L’erreur universelle : mettre will/would dans la moitié en « if ».',
    studentExplanation: '« if » sert à parler de conséquences. Futur réel : « will ». Situation imaginée : « would ».',
    meaningFirst:
      'Commence par quelque chose de réel et d’immédiat : « If it rains tomorrow, I’ll stay home. » Puis par quelque chose d’impossible : « If I had a million dollars… » Que la deuxième soit d’abord amusante, et grammaticale ensuite.',
    correctionMethod: 'Pas de « will/would » dans la partie en « if ». Futur réel = if + présent, … will. Imaginé = if + prétérit, … would.',
    fallback: 'Seulement la première conditionnelle, sur la météo de demain. Une structure, beaucoup de phrases.',
    extension: 'Ajoute la troisième conditionnelle pour les regrets et les conditionnelles mixtes pour les conséquences qui vont jusqu’à aujourd’hui.',
  },
  g_reported_speech: {
    title: 'Rapporter ce que quelqu’un a dit',
    tutorExplanation:
      'Le discours rapporté recule le temps d’un cran (« I’m tired » → « he said he WAS tired ») et ajuste pronoms et mots de temps. « Say » ne prend pas de destinataire (« he said that… »), « tell » en exige un (« he told ME… »).',
    studentExplanation: 'Quand tu répètes ce qu’a dit quelqu’un, recule le verbe d’un cran vers le passé.',
    meaningFirst: 'Fais-lui chuchoter une phrase, puis rapporte-la à voix haute. Le faire va plus vite que de le décrire.',
    correctionMethod: 'Deux vérifications : « say » ou « tell », puis le recul du verbe. Dans une question rapportée, l’ordre redevient celui d’une phrase normale.',
    fallback: 'Ne rapportez que « He said… » du présent au passé, sans toucher aux questions.',
    extension: 'Ajoute des verbes de parole avec une attitude : admitted, insisted, denied, suggested, warned.',
  },
  g_passive: {
    title: 'La voix passive',
    tutorExplanation:
      'be + participe passé, quand l’action compte plus que celui qui l’a faite. C’est « be » qui porte le temps (is made, was built, has been sold). On perd le « be » ou on met le prétérit à la place du participe.',
    studentExplanation: 'Le passif sert quand on ne sait pas, ou qu’on se moque de savoir, qui a fait l’action.',
    meaningFirst:
      'Montre un objet manufacturé et demande « Who made this? » Il ne saura pas — et c’est exactement là que l’anglais prend le passif : « It was made in China. »',
    correctionMethod: 'Vérifie les deux morceaux : la bonne forme de « be » + le participe passé (la troisième forme du verbe).',
    fallback: 'Seulement le passif au présent, avec des objets que vous voyez tous les deux : « It’s made of wood. »',
    extension: 'Ajoute le passif avec « get », le passif de rumeur (« It is believed that… ») et les cas où le passif sert à atténuer.',
  },
  g_relative_clauses: {
    title: 'Les relatives (who / which / that)',
    tutorExplanation:
      'Elles ajoutent une information sur un nom : who (personnes), which (choses), that (les deux). Les relatives déterminatives ne prennent pas de virgule ; les explicatives si, et elles n’acceptent pas « that ». « What » n’est jamais un pronom relatif.',
    studentExplanation: 'who/which/that servent à relier deux idées et à décrire une personne ou une chose.',
    meaningFirst:
      'Dis deux phrases courtes sur la même personne, puis relie-les à voix haute. La soudure, c’est le cours : « I have a friend. She lives in Rome. → I have a friend who lives in Rome. »',
    correctionMethod: 'Personnes → who ; choses → which/that. Jamais « what ». Et ne répète jamais le sujet après who/that.',
    fallback: 'Reliez deux phrases données avec « who » seulement, à voix haute, cinq fois.',
    extension: 'Ajoute les relatives explicatives avec virgules, « whose » et les relatives réduites (« the man standing there »).',
    jargon: ['la personne ou la chose qui fait l’action — le mot placé avant le verbe.'],
  },
  g_modals_deduction: {
    title: 'Deviner avec plus ou moins de certitude (must / might / can’t)',
    tutorExplanation:
      'Déduction sur le présent : « must be » (j’en suis sûr), « might/could be » (c’est possible), « can’t be » (je suis sûr que non). Attention : le contraire de « must be », c’est « can’t be », jamais « mustn’t be ».',
    studentExplanation: '« must » quand tu es sûr, « might » quand tu ne l’es pas, « can’t » quand tu es sûr que non.',
    meaningFirst:
      'Cache quelque chose dans ta main et fais-le deviner. Ses hypothèses auront besoin exactement de cette langue : donne-la au moment où il la cherche.',
    correctionMethod: 'Demande « Tu es sûr à quel point — 100 %, 50 %, ou sûr que non ? » et laisse-le choisir lui-même le modal.',
    fallback: 'Deux options seulement — « must be » et « might be » — avec des images évidentes.',
    extension: 'Passez à la déduction sur le passé : « must have been », « can’t have known », « might have left ».',
  },
  g_third_conditional: {
    title: 'Parler de ce qui n’est pas arrivé',
    tutorExplanation:
      'Troisième conditionnelle : if + had + participe, … would have + participe. Pour les regrets et les passés alternatifs. Les conditionnelles mixtes relient une cause passée à un résultat présent : « If I had studied, I would have a better job now. »',
    studentExplanation: 'Cela sert à parler d’un passé qui n’a pas eu lieu et de ce qui aurait été différent.',
    meaningFirst:
      'Raconte un petit regret réel à toi, simplement : « I didn’t take that job. If I had taken it, I would have moved. » C’est le regret qui porte la grammaire.',
    correctionMethod: 'Ici non plus, « would » n’entre pas dans la partie en « if ». Vérifie ensuite le participe après « have ». Donne la phrase entière à vitesse normale.',
    fallback: 'Redescends à la deuxième conditionnelle sur le présent ; la troisième peut attendre un cours.',
    extension: 'Ajoute « I wish I had… » et « If only… » pour le même sens, avec plus d’émotion.',
  },
  g_wish_regret: {
    title: 'Souhaits et regrets (I wish / if only)',
    tutorExplanation:
      '« I wish » + prétérit pour un présent irréel (« I wish I had more time »), + plus-que-parfait pour un regret passé (« I wish I had said something »), + « would » pour se plaindre du comportement d’un autre (« I wish he would listen »).',
    studentExplanation: '« I wish » sert à dire ce que tu voudrais voir autrement — maintenant ou avant.',
    meaningFirst: 'Formule un petit souhait sincère à toi sur la journée. C’est une structure personnelle : elle marche mieux quand le tuteur commence.',
    correctionMethod: 'Un cran en arrière par rapport au réel : présent → prétérit, passé → plus-que-parfait. Dis côte à côte la version vraie et le souhait.',
    fallback: 'Seulement des souhaits au présent : « I wish I had more ___. »',
    extension: 'Oppose « I wish » et « I hope » — la différence entre l’irréel et le encore-possible.',
  },
  g_causative: {
    title: 'Quand c’est quelqu’un d’autre qui le fait',
    tutorExplanation:
      '« have/get + complément + participe » : « I had my hair cut », « We’re getting the kitchen painted ». L’apprenant dit « I cut my hair » et prétend sans le vouloir qu’il s’est coupé les cheveux lui-même.',
    studentExplanation: '« have something done » quand c’est quelqu’un d’autre qui fait le travail pour toi.',
    meaningFirst: 'Demande « Did you cut your own hair? » Le rire, c’est le cours : « No — you HAD it cut. »',
    correctionMethod: 'D’abord le complément, ensuite la troisième forme du verbe. Dis la paire « my car repaired » avant la phrase entière.',
    fallback: 'Une trame : « I had my hair cut. » avec trois services.',
    extension: 'Ajoute « have someone do something » et le contrarié « I had my phone stolen ».',
  },
  g_advanced_cohesion: {
    title: 'Connecteurs et cohésion avancés',
    tutorExplanation:
      'Marqueurs du discours et atténuateurs pour argumenter avec précision et naturel : however, nevertheless, whereas, arguably, to some extent, having said that. À ce niveau, le problème n’est presque jamais la correction, mais la collocation et le registre.',
    studentExplanation: 'Des connecteurs naturels relient les idées sans à-coups et donnent de la précision.',
    meaningFirst:
      'Donne deux fois le même court argument — une fois avec seulement « and/but », une fois avec de vrais connecteurs — et demande lequel sonnait professionnel.',
    correctionMethod: 'En C1, travaille la collocation naturelle et le registre plutôt que les règles. Propose une tournure plus idiomatique et fais-la redire.',
    fallback: 'Travaille avec trois connecteurs seulement — « however », « although », « on the other hand » — jusqu’à ce qu’ils viennent tout seuls.',
    extension: 'Passe à la forme du paragraphe entier : annoncer, concéder, et garder l’argument le plus fort pour la fin.',
  },
  g_inversion_emphasis: {
    title: 'Emphase et inversion',
    tutorExplanation:
      'Placer en tête une expression négative ou restrictive impose l’ordre de la question : « Never have I seen… », « Not only did she… ». Les phrases clivées font le même travail de façon plus orale : « What I really meant was… », « It was the timing that worried me. »',
    studentExplanation: 'Mets une expression en tête pour lui donner du poids — la phrase bascule alors comme une question.',
    meaningFirst:
      'Dis une phrase plate, puis la version emphatique, et demande laquelle avait l’air de compter davantage. L’emphase s’entend avant de s’analyser.',
    correctionMethod:
      'Explique que la bascule est tout le signal — sans elle, l’emphase se lit comme une faute et non comme un choix. Puis fais-le dire à bon rythme : une inversion hésitante sonne plus mal que pas d’inversion du tout.',
    fallback: 'Restez sur les phrases clivées (« What I mean is… ») : même effet, sans inversion.',
    extension: 'Ajoute « Only when… », « Little did I know… » et la répétition rhétorique, puis fais-en un petit discours.',
  },
  g_hedging_register: {
    title: 'Registre, atténuation et anglais diplomatique',
    tutorExplanation:
      'Le même contenu sonne brutal ou diplomatique selon les atténuateurs (« it seems », « I’d suggest », « that may not be quite right »), les modaux prudents et les négations adoucies (« not ideal » plutôt que « bad »). C’est là-dessus qu’un locuteur C1 est jugé professionnellement.',
    studentExplanation: 'On peut dire la même chose plus doucement ou plus directement, selon à qui on parle.',
    meaningFirst:
      'Lance une phrase brutale et demande-lui d’imaginer la dire à son responsable. La gêne, c’est le but — puis donne la version diplomatique.',
    correctionMethod: 'Ne marque jamais cela comme une erreur : c’est un choix. Propose l’autre registre, nomme la situation qui lui va, et laisse-le choisir.',
    fallback: 'Travaille avec trois atténuateurs seulement : « I think », « maybe », « it seems ».',
    extension: 'Ajoute la dimension culturelle : en quoi la franchise diffère entre sa langue et l’anglais américain, et quand être direct est le bon choix.',
  },
}

export default grammar
