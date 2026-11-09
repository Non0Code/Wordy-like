/**
 * Parcours A1 → C2 : niveaux → chapitres → leçons.
 * Chaque leçon introduit 6 à 9 mots (identifiants du dictionnaire),
 * puis les réutilise dans des phrases concrètes et une note de grammaire.
 */
import type { Cefr } from "../../core/types";

export interface Lesson {
  id: string;
  title: string;
  goal: string;
  words: string[];
  sentences: Array<[string, string]>;
  grammar?: { title: string; body: string };
}
export interface Chapter {
  id: string;
  title: string;
  icon: string;
  lessons: Lesson[];
}
export interface LevelDef {
  level: Cefr;
  name: string;
  description: string;
  chapters: Chapter[];
}

export const CURRICULUM: LevelDef[] = [
  {
    level: "A1",
    name: "Débutant",
    description: "Se présenter, saluer, parler de sa famille et du quotidien.",
    chapters: [
      {
        id: "a1-premiers-pas",
        title: "Premiers pas",
        icon: "👋",
        lessons: [
          {
            id: "a1-saluer",
            title: "Saluer",
            goal: "Dire bonjour, au revoir et merci selon la situation.",
            words: ["ciao", "buongiorno", "buonasera", "arrivederci", "grazie", "prego", "per_favore", "scusa"],
            sentences: [
              ["Ciao, come stai?", "Salut, comment vas-tu ?"],
              ["Buongiorno, signora!", "Bonjour, madame !"],
              ["Grazie mille! Prego.", "Merci beaucoup ! De rien."],
              ["Scusa, non ho capito.", "Pardon, je n'ai pas compris."],
              ["Un caffè, per favore.", "Un café, s'il vous plaît."],
            ],
            grammar: {
              title: "Tu ou Lei ?",
              body: "Avec les amis : « ciao », « scusa ». Avec un inconnu ou au travail, on utilise la forme de politesse « Lei » (3e personne) : « buongiorno », « scusi », « ArrivederLa ».",
            },
          },
          {
            id: "a1-presentarsi",
            title: "Se présenter",
            goal: "Dire son prénom, sa nationalité et où l'on habite.",
            words: ["chiamarsi", "essere", "io", "tu", "nome", "piacere_n", "italiano", "francese", "abitare"],
            sentences: [
              ["Mi chiamo Sofia, e tu?", "Je m'appelle Sofia, et toi ?"],
              ["Piacere, sono Marco.", "Enchanté, je suis Marco."],
              ["Sono francese, di Lione.", "Je suis français, de Lyon."],
              ["Abito a Roma da un anno.", "J'habite à Rome depuis un an."],
              ["Parli italiano? Sì, un po'.", "Tu parles italien ? Oui, un peu."],
            ],
            grammar: {
              title: "Le verbe essere",
              body: "io sono · tu sei · lui/lei è · noi siamo · voi siete · loro sono. Le pronom sujet est généralement omis : « Sono Marco ».",
            },
          },
          {
            id: "a1-domande",
            title: "Poser des questions",
            goal: "Utiliser les mots interrogatifs essentiels.",
            words: ["come", "dove", "cosa", "chi", "quando", "perche", "quale", "si_oui", "no"],
            sentences: [
              ["Dove abiti?", "Où habites-tu ?"],
              ["Chi è quella ragazza?", "Qui est cette fille ?"],
              ["Quando parti per Milano?", "Quand pars-tu pour Milan ?"],
              ["Perché sei qui? Perché studio l'italiano.", "Pourquoi es-tu ici ? Parce que j'étudie l'italien."],
              ["Qual è il tuo nome?", "Quel est ton prénom ?"],
            ],
            grammar: {
              title: "Perché : pourquoi ET parce que",
              body: "Le même mot sert à poser la question et à y répondre. À l'oral, seule l'intonation change.",
            },
          },
        ],
      },
      {
        id: "a1-famiglia",
        title: "La famille",
        icon: "👨‍👩‍👧",
        lessons: [
          {
            id: "a1-mia-famiglia",
            title: "Ma famille",
            goal: "Présenter les membres de sa famille.",
            words: ["famiglia", "madre", "padre", "fratello", "sorella", "figlio", "nonno", "avere"],
            sentences: [
              ["Ho un fratello e una sorella.", "J'ai un frère et une sœur."],
              ["Mia madre si chiama Anna.", "Ma mère s'appelle Anna."],
              ["Hai figli?", "Tu as des enfants ?"],
              ["I miei nonni vivono in Sicilia.", "Mes grands-parents vivent en Sicile."],
            ],
            grammar: {
              title: "Possessifs et famille",
              body: "Pas d'article devant un nom de parenté au singulier : « mia madre », « tuo padre ». Mais on le garde au pluriel : « i miei fratelli ».",
            },
          },
          {
            id: "a1-descrivere",
            title: "Décrire quelqu'un",
            goal: "Décrire l'apparence et le caractère.",
            words: ["alto", "basso", "giovane", "vecchio", "simpatico", "bello", "carino", "molto"],
            sentences: [
              ["Marco è alto e simpatico.", "Marco est grand et sympathique."],
              ["Mia sorella è molto carina.", "Ma sœur est très mignonne."],
              ["Che bella giornata!", "Quelle belle journée !"],
              ["Mio nonno è vecchio ma giovane di spirito.", "Mon grand-père est vieux mais jeune d'esprit."],
            ],
            grammar: {
              title: "L'accord des adjectifs",
              body: "-o → -a au féminin, -i / -e au pluriel (alto, alta, alti, alte). Les adjectifs en -e ont une seule forme au singulier (giovane) et font -i au pluriel (giovani).",
            },
          },
        ],
      },
      {
        id: "a1-quotidiano",
        title: "Le quotidien",
        icon: "☕",
        lessons: [
          {
            id: "a1-numeri",
            title: "Les nombres et l'âge",
            goal: "Compter et dire son âge.",
            words: ["uno_num", "due", "tre", "cinque", "dieci", "venti", "anno", "quanto"],
            sentences: [
              ["Quanti anni hai?", "Quel âge as-tu ?"],
              ["Ho vent'anni.", "J'ai vingt ans."],
              ["Due caffè, per favore.", "Deux cafés, s'il vous plaît."],
              ["Sono dieci euro.", "Ça fait dix euros."],
            ],
            grammar: {
              title: "L'âge avec avere",
              body: "Comme en français, on « a » son âge : « Ho 19 anni » (et jamais « sono 19 anni »).",
            },
          },
          {
            id: "a1-al-bar",
            title: "Au café",
            goal: "Commander au comptoir d'un bar italien.",
            words: ["caffe", "acqua", "cornetto", "bar", "volere", "prendere", "conto", "latte"],
            sentences: [
              ["Vorrei un caffè e un cornetto.", "Je voudrais un café et un croissant."],
              ["Prendo un'acqua naturale.", "Je prends une eau plate."],
              ["Il conto, per favore.", "L'addition, s'il vous plaît."],
              ["Ci vediamo al bar alle otto.", "On se voit au café à huit heures."],
            ],
            grammar: {
              title: "Vorrei : la politesse",
              body: "« Voglio » (je veux) est direct. Pour commander poliment on utilise le conditionnel « vorrei » (je voudrais).",
            },
          },
          {
            id: "a1-casa",
            title: "La maison",
            goal: "Décrire son logement.",
            words: ["casa", "camera", "cucina", "grande", "piccolo", "qui", "abitare"],
            sentences: [
              ["La mia casa è piccola ma bella.", "Ma maison est petite mais belle."],
              ["La cucina è grande.", "La cuisine est grande."],
              ["Vieni qui!", "Viens ici !"],
              ["Torno a casa stasera.", "Je rentre à la maison ce soir."],
            ],
          },
        ],
      },
    ],
  },
  {
    level: "A2",
    name: "Élémentaire",
    description: "Se débrouiller au restaurant, en voyage, parler de ses loisirs et de sa journée.",
    chapters: [
      {
        id: "a2-cibo",
        title: "La nourriture",
        icon: "🍝",
        lessons: [
          {
            id: "a2-ristorante",
            title: "Au restaurant",
            goal: "Commander un repas et donner son avis.",
            words: ["mangiare", "bere", "pasta", "pizza", "vino", "pane", "buono", "ristorante", "menu"],
            sentences: [
              ["Cosa vuoi mangiare?", "Que veux-tu manger ?"],
              ["Questa pizza è buonissima!", "Cette pizza est délicieuse !"],
              ["Un bicchiere di vino rosso, per favore.", "Un verre de vin rouge, s'il vous plaît."],
              ["Posso vedere il menù?", "Je peux voir la carte ?"],
            ],
            grammar: {
              title: "Le superlatif en -issimo",
              body: "buono → buonissimo, bello → bellissimo : très bon, très beau. Très fréquent à l'oral.",
            },
          },
          {
            id: "a2-spesa",
            title: "Faire les courses",
            goal: "Acheter, demander un prix.",
            words: ["comprare", "mercato", "frutta", "verdura", "costare", "euro", "caro", "negozio"],
            sentences: [
              ["Quanto costa questa frutta?", "Combien coûtent ces fruits ?"],
              ["È troppo caro!", "C'est trop cher !"],
              ["Devo comprare la verdura al mercato.", "Je dois acheter des légumes au marché."],
              ["Il negozio chiude alle otto.", "Le magasin ferme à huit heures."],
            ],
          },
        ],
      },
      {
        id: "a2-viaggi",
        title: "Voyages",
        icon: "🚆",
        lessons: [
          {
            id: "a2-citta",
            title: "En ville",
            goal: "Demander et comprendre son chemin.",
            words: ["andare", "citta", "strada", "stazione", "treno", "biglietto", "vicino", "lontano", "destra", "sinistra"],
            sentences: [
              ["Scusi, dov'è la stazione?", "Excusez-moi, où est la gare ?"],
              ["Vada sempre dritto, poi giri a destra.", "Allez tout droit, puis tournez à droite."],
              ["Non è lontano, è qui vicino.", "Ce n'est pas loin, c'est tout près."],
              ["Un biglietto per Napoli, per favore.", "Un billet pour Naples, s'il vous plaît."],
            ],
            grammar: {
              title: "L'impératif de politesse",
              body: "Pour vouvoyer, l'impératif prend la forme du subjonctif : « vada » (allez), « giri » (tournez), « scusi » (excusez-moi).",
            },
          },
          {
            id: "a2-albergo",
            title: "À l'hôtel",
            goal: "Réserver une chambre et poser des questions.",
            words: ["albergo", "notte", "stanza", "chiave", "prenotare", "libero", "colazione", "mare"],
            sentences: [
              ["Ho prenotato una stanza per due notti.", "J'ai réservé une chambre pour deux nuits."],
              ["La colazione è inclusa?", "Le petit-déjeuner est compris ?"],
              ["Ecco la chiave della stanza.", "Voici la clé de la chambre."],
              ["L'albergo è vicino al mare.", "L'hôtel est près de la mer."],
            ],
          },
        ],
      },
      {
        id: "a2-tempo",
        title: "Temps et loisirs",
        icon: "☀️",
        lessons: [
          {
            id: "a2-meteo",
            title: "Le temps qu'il fait",
            goal: "Parler de la météo et des saisons.",
            words: ["tempo", "sole", "pioggia", "caldo", "freddo", "fare", "oggi", "domani", "piovere"],
            sentences: [
              ["Che tempo fa oggi?", "Quel temps fait-il aujourd'hui ?"],
              ["Fa caldo e c'è il sole.", "Il fait chaud et il y a du soleil."],
              ["Domani piove.", "Demain il pleut."],
              ["Ho freddo, chiudi la finestra.", "J'ai froid, ferme la fenêtre."],
            ],
            grammar: {
              title: "Fare caldo / avere caldo",
              body: "« Fa caldo » : il fait chaud (météo). « Ho caldo » : j'ai chaud (sensation).",
            },
          },
          {
            id: "a2-tempo-libero",
            title: "Les loisirs",
            goal: "Dire ce qu'on aime faire.",
            words: ["piacere", "leggere", "musica", "film", "uscire", "amico", "sera", "insieme", "cinema"],
            sentences: [
              ["Mi piace la musica italiana.", "J'aime la musique italienne."],
              ["Ti piacciono i film di Fellini?", "Tu aimes les films de Fellini ?"],
              ["Stasera esco con gli amici.", "Ce soir je sors avec mes amis."],
              ["Andiamo al cinema insieme?", "On va au cinéma ensemble ?"],
            ],
            grammar: {
              title: "Mi piace / mi piacciono",
              body: "Le verbe s'accorde avec ce qui plaît : « mi piace il film » (singulier), « mi piacciono i film » (pluriel).",
            },
          },
        ],
      },
      {
        id: "a2-ieri",
        title: "Raconter",
        icon: "🗓️",
        lessons: [
          {
            id: "a2-giornata",
            title: "Raconter sa journée",
            goal: "Utiliser le passé composé (passato prossimo).",
            words: ["ieri", "gia", "ancora", "dopo", "prima", "tornare", "svegliarsi", "mattina"],
            sentences: [
              ["Ieri mi sono svegliato tardi.", "Hier je me suis réveillé tard."],
              ["Ho già mangiato, grazie.", "J'ai déjà mangé, merci."],
              ["Non sono ancora tornata a casa.", "Je ne suis pas encore rentrée à la maison."],
              ["Prima ho lavorato, dopo sono uscito.", "D'abord j'ai travaillé, ensuite je suis sorti."],
            ],
            grammar: {
              title: "Essere ou avere ?",
              body: "Verbes de mouvement/changement et pronominaux → essere (sono andato, mi sono svegliata) ; avec essere, le participe s'accorde. Les autres → avere (ho mangiato).",
            },
          },
          {
            id: "a2-espressioni",
            title: "Petits mots indispensables",
            goal: "Comprendre les mots qui rythment la conversation.",
            words: ["magari", "allora", "dai_int", "boh", "figurati", "mica", "insomma", "vabbe"],
            sentences: [
              ["Allora, cosa facciamo stasera?", "Alors, qu'est-ce qu'on fait ce soir ?"],
              ["Magari andiamo al mare domani.", "Peut-être qu'on ira à la mer demain."],
              ["Magari fosse vero!", "Si seulement c'était vrai !"],
              ["Dai, non è mica difficile!", "Allez, ce n'est pas si difficile !"],
              ["Grazie! Figurati!", "Merci ! Je t'en prie !"],
            ],
            grammar: {
              title: "Magari : trois sens",
              body: "1) peut-être (magari domani) ; 2) si seulement (magari fosse vero, + subjonctif imparfait) ; 3) volontiers ! (en réponse seule).",
            },
          },
        ],
      },
    ],
  },
  {
    level: "B1",
    name: "Intermédiaire",
    description: "Exprimer ses émotions, parler de travail, d'études, donner son avis.",
    chapters: [
      {
        id: "b1-emozioni",
        title: "Les émotions",
        icon: "💭",
        lessons: [
          {
            id: "b1-sentimenti",
            title: "Comment je me sens",
            goal: "Exprimer ses émotions et son état.",
            words: ["felice", "triste", "stanco", "arrabbiato", "preoccupato", "sentirsi", "paura", "contento", "preoccuparsi"],
            sentences: [
              ["Oggi mi sento un po' triste.", "Aujourd'hui je me sens un peu triste."],
              ["Non ti preoccupare, va tutto bene.", "Ne t'inquiète pas, tout va bien."],
              ["Sono stanca morta.", "Je suis morte de fatigue."],
              ["Ho paura di sbagliare.", "J'ai peur de me tromper."],
            ],
            grammar: {
              title: "L'impératif négatif",
              body: "À la 2e personne du singulier : non + infinitif. « Non preoccuparti » / « Non ti preoccupare ».",
            },
          },
          {
            id: "b1-relazioni",
            title: "Les relations",
            goal: "Parler d'amour, d'amitié, de confiance.",
            words: ["ragazzo", "ragazza", "amore", "fidanzato", "innamorarsi", "lasciare", "fiducia", "mancare"],
            sentences: [
              ["Mi sono innamorato di te.", "Je suis tombé amoureux de toi."],
              ["Mi manchi tanto.", "Tu me manques tellement."],
              ["La mia ragazza mi ha lasciato.", "Ma copine m'a quitté."],
              ["Ho fiducia in te.", "J'ai confiance en toi."],
            ],
          },
        ],
      },
      {
        id: "b1-lavoro",
        title: "Travail et études",
        icon: "💼",
        lessons: [
          {
            id: "b1-lavoro-1",
            title: "Le travail",
            goal: "Parler de son métier et de son quotidien professionnel.",
            words: ["lavoro", "lavorare", "ufficio", "collega", "capo", "riunione", "stipendio"],
            sentences: [
              ["Lavoro in ufficio dalle nove alle sei.", "Je travaille au bureau de neuf heures à six heures."],
              ["Ho una riunione con il capo.", "J'ai une réunion avec le patron."],
              ["I miei colleghi sono simpatici.", "Mes collègues sont sympathiques."],
              ["Lo stipendio non è alto.", "Le salaire n'est pas élevé."],
            ],
          },
          {
            id: "b1-studio",
            title: "Les études",
            goal: "Parler de ses études et examens.",
            words: ["universita", "studiare", "esame", "corso", "professore", "laurea", "imparare"],
            sentences: [
              ["Studio legge all'università.", "J'étudie le droit à l'université."],
              ["Domani ho un esame difficile.", "Demain j'ai un examen difficile."],
              ["Voglio imparare l'italiano bene.", "Je veux bien apprendre l'italien."],
              ["Il professore spiega molto bene.", "Le professeur explique très bien."],
            ],
          },
        ],
      },
      {
        id: "b1-conversazione",
        title: "Conversations quotidiennes",
        icon: "🗣️",
        lessons: [
          {
            id: "b1-opinioni",
            title: "Donner son avis",
            goal: "Exprimer son opinion et nuancer.",
            words: ["pensare", "credere", "secondo", "sembrare", "accordo", "invece", "pero", "ragione"],
            sentences: [
              ["Secondo me, hai ragione.", "À mon avis, tu as raison."],
              ["Mi sembra una buona idea.", "Ça me semble une bonne idée."],
              ["Non sono d'accordo con te.", "Je ne suis pas d'accord avec toi."],
              ["Io invece penso di no.", "Moi, par contre, je pense que non."],
            ],
            grammar: {
              title: "Penso che + subjonctif",
              body: "Après les verbes d'opinion, on utilise le subjonctif : « Penso che sia vero », « Credo che abbia ragione ».",
            },
          },
          {
            id: "b1-progetti",
            title: "Projets et rêves",
            goal: "Parler de l'avenir.",
            words: ["futuro", "sperare", "progetto", "cercare", "trovare", "forse", "sognare"],
            sentences: [
              ["Spero di trovare un lavoro in Italia.", "J'espère trouver un travail en Italie."],
              ["Sogno di vivere a Napoli.", "Je rêve de vivre à Naples."],
              ["Forse l'anno prossimo cambierò città.", "Peut-être que l'an prochain je changerai de ville."],
              ["Ho un nuovo progetto.", "J'ai un nouveau projet."],
            ],
            grammar: {
              title: "Le futur simple",
              body: "-are/-ere → -erò, -ire → -irò : parlerò, prenderò, partirò. Irréguliers : sarò, avrò, andrò, farò, verrò.",
            },
          },
          {
            id: "b1-salute",
            title: "Chez le médecin",
            goal: "Expliquer ce qui ne va pas.",
            words: ["medico", "male", "testa", "stare", "malato", "febbre", "farmacia", "meglio"],
            sentences: [
              ["Ho mal di testa da due giorni.", "J'ai mal à la tête depuis deux jours."],
              ["Ho la febbre, sto male.", "J'ai de la fièvre, je ne vais pas bien."],
              ["Devo andare dal medico.", "Je dois aller chez le médecin."],
              ["Oggi sto meglio, grazie.", "Aujourd'hui je vais mieux, merci."],
            ],
          },
        ],
      },
    ],
  },
  {
    level: "B2",
    name: "Intermédiaire avancé",
    description: "Expressions idiomatiques, langage familier, monde professionnel, argumentation.",
    chapters: [
      {
        id: "b2-espressioni",
        title: "Expressions italiennes",
        icon: "🍀",
        lessons: [
          {
            id: "b2-idiomi",
            title: "In bocca al lupo !",
            goal: "Utiliser les expressions idiomatiques courantes.",
            words: ["in_bocca_al_lupo", "crepi", "non_vedo_lora", "che_ne_so", "costare_un_occhio_della_testa", "fare_due_passi"],
            sentences: [
              ["Domani ho l'esame. In bocca al lupo! Crepi!", "Demain j'ai l'examen. Bonne chance ! Merci !"],
              ["Non vedo l'ora di partire!", "J'ai hâte de partir !"],
              ["Questa macchina costa un occhio della testa.", "Cette voiture coûte les yeux de la tête."],
              ["Facciamo due passi?", "On fait un petit tour ?"],
            ],
          },
          {
            id: "b2-gergo",
            title: "Argot et langage familier",
            goal: "Comprendre l'italien des films et des jeunes.",
            words: ["figo", "casino", "cavolo", "roba", "fregarsene", "sfigato"],
            sentences: [
              ["Che casino in questa stanza!", "Quel bazar dans cette chambre !"],
              ["Me ne frego!", "Je m'en fiche !"],
              ["Cavolo, è già tardi!", "Mince, il est déjà tard !"],
              ["Che figo il tuo telefono!", "Trop cool ton téléphone !"],
            ],
          },
        ],
      },
      {
        id: "b2-professionale",
        title: "Situations professionnelles",
        icon: "📧",
        lessons: [
          {
            id: "b2-colloquio",
            title: "L'entretien d'embauche",
            goal: "Présenter son parcours en entretien.",
            words: ["colloquio", "candidato", "esperienza", "competenza", "assumere", "scadenza", "contratto"],
            sentences: [
              ["Ho un colloquio di lavoro domani.", "J'ai un entretien d'embauche demain."],
              ["Ho cinque anni di esperienza nel settore.", "J'ai cinq ans d'expérience dans le secteur."],
              ["Mi hanno assunto con un contratto a tempo indeterminato.", "Ils m'ont embauché en CDI."],
              ["La scadenza è venerdì.", "La date limite est vendredi."],
            ],
          },
          {
            id: "b2-email",
            title: "Écrire un e-mail",
            goal: "Rédiger un e-mail formel.",
            words: ["gentile", "cordiali_saluti", "allegato", "rispondere", "inviare", "richiesta", "disponibile"],
            sentences: [
              ["Gentile dottoressa Bianchi,", "Chère docteure Bianchi,"],
              ["Le invio in allegato il mio curriculum.", "Je vous envoie mon CV en pièce jointe."],
              ["Resto disponibile per un colloquio.", "Je reste disponible pour un entretien."],
              ["Cordiali saluti, Paolo Verdi", "Cordialement, Paolo Verdi"],
            ],
            grammar: {
              title: "Le registre formel",
              body: "Dans un e-mail formel, on utilise « Lei » et ses pronoms avec majuscule : « Le invio », « La ringrazio ».",
            },
          },
        ],
      },
      {
        id: "b2-societa",
        title: "Société et argumentation",
        icon: "📰",
        lessons: [
          {
            id: "b2-attualita",
            title: "L'actualité",
            goal: "Discuter des nouvelles et des enjeux de société.",
            words: ["notizia", "giornale", "governo", "crisi", "cambiamento", "ambiente", "problema"],
            sentences: [
              ["Hai letto la notizia sul giornale?", "Tu as lu la nouvelle dans le journal ?"],
              ["Il governo deve proteggere l'ambiente.", "Le gouvernement doit protéger l'environnement."],
              ["La crisi è un problema per tutti.", "La crise est un problème pour tout le monde."],
            ],
          },
          {
            id: "b2-argomentare",
            title: "Argumenter",
            goal: "Relier ses idées avec des connecteurs.",
            words: ["tuttavia", "quindi", "infatti", "nonostante", "purche", "affinche", "sebbene"],
            sentences: [
              ["Sebbene sia stanco, continuo a lavorare.", "Bien que je sois fatigué, je continue à travailler."],
              ["Nonostante la pioggia, siamo usciti.", "Malgré la pluie, nous sommes sortis."],
              ["Vengo, purché tu guidi.", "Je viens, à condition que tu conduises."],
              ["È tardi, quindi andiamo.", "Il est tard, donc on y va."],
            ],
            grammar: {
              title: "Conjonctions + subjonctif",
              body: "sebbene, benché, purché, affinché, nonostante (+ verbe) sont toujours suivies du subjonctif.",
            },
          },
        ],
      },
    ],
  },
  {
    level: "C1",
    name: "Avancé",
    description: "Nuances, subjonctif, registres, culture et cinéma.",
    chapters: [
      {
        id: "c1-sfumature",
        title: "Nuances",
        icon: "🎚️",
        lessons: [
          {
            id: "c1-congiuntivo",
            title: "Hypothèses et nécessité",
            goal: "Maîtriser les structures avec subjonctif.",
            words: ["benche", "qualora", "bisognare", "occorrere", "magari"],
            sentences: [
              ["Bisogna che tu venga subito.", "Il faut que tu viennes tout de suite."],
              ["Qualora avesse domande, mi scriva.", "Si jamais vous aviez des questions, écrivez-moi."],
              ["Benché piovesse, siamo usciti.", "Bien qu'il plût, nous sommes sortis."],
              ["Occorre più tempo per finire.", "Il faut plus de temps pour finir."],
            ],
          },
          {
            id: "c1-registri",
            title: "Les mots qui nuancent",
            goal: "Utiliser les adverbes de nuance comme un natif.",
            words: ["comunque", "addirittura", "piuttosto", "appunto", "ormai", "eppure"],
            sentences: [
              ["Ormai è troppo tardi.", "Maintenant, c'est trop tard."],
              ["Eppure ti avevo avvertito!", "Et pourtant je t'avais prévenu !"],
              ["Prendo piuttosto un tè.", "Je prendrai plutôt un thé."],
              ["È venuto addirittura il sindaco!", "Même le maire est venu !"],
            ],
          },
        ],
      },
      {
        id: "c1-cultura",
        title: "Culture",
        icon: "🎬",
        lessons: [
          {
            id: "c1-cinema",
            title: "Parler de cinéma",
            goal: "Analyser un film en italien.",
            words: ["regista", "attore", "sceneggiatura", "inquadratura", "recitare", "girare", "trama", "scena"],
            sentences: [
              ["Il regista ha girato il film a Roma.", "Le réalisateur a tourné le film à Rome."],
              ["L'attore recita benissimo.", "L'acteur joue très bien."],
              ["La trama è complicata ma la sceneggiatura è geniale.", "L'intrigue est compliquée mais le scénario est génial."],
            ],
          },
          {
            id: "c1-letteratura",
            title: "Littérature",
            goal: "Parler de livres et d'auteurs.",
            words: ["romanzo", "poesia", "scrittore", "ambientato", "tradurre", "capolavoro", "personaggio"],
            sentences: [
              ["Il romanzo è ambientato a Napoli.", "Le roman se déroule à Naples."],
              ["È un capolavoro della letteratura italiana.", "C'est un chef-d'œuvre de la littérature italienne."],
              ["Il personaggio principale è una donna forte.", "Le personnage principal est une femme forte."],
            ],
          },
        ],
      },
    ],
  },
  {
    level: "C2",
    name: "Maîtrise",
    description: "Idiomes rares, langue soutenue, régionalismes.",
    chapters: [
      {
        id: "c2-padronanza",
        title: "Maîtrise",
        icon: "🏛️",
        lessons: [
          {
            id: "c2-idiomi",
            title: "Idiomes avancés",
            goal: "Comprendre les images de la langue italienne.",
            words: ["acqua_in_bocca", "prendere_in_giro", "essere_al_verde", "tirare_le_somme", "rompere_le_scatole", "avere_le_mani_in_pasta"],
            sentences: [
              ["Acqua in bocca, mi raccomando!", "Motus et bouche cousue, je compte sur toi !"],
              ["Mi stai prendendo in giro?", "Tu te moques de moi ?"],
              ["Sono al verde fino a fine mese.", "Je suis fauché jusqu'à la fin du mois."],
            ],
          },
          {
            id: "c2-soutenu",
            title: "Langue soutenue",
            goal: "Lire des textes administratifs et littéraires.",
            words: ["pertanto", "alquanto", "nondimeno", "giacche", "alcunche", "siffatto"],
            sentences: [
              ["Pertanto, la riunione è annullata.", "Par conséquent, la réunion est annulée."],
              ["Era alquanto sorpreso.", "Il était quelque peu surpris."],
              ["Giacché sei qui, aiutami.", "Puisque tu es là, aide-moi."],
            ],
          },
          {
            id: "c2-regionale",
            title: "Régionalismes",
            goal: "Reconnaître les exclamations régionales des films.",
            words: ["mannaggia", "ammazza", "daje", "macche", "uffa", "beh"],
            sentences: [
              ["Mannaggia, ho perso il treno!", "Zut, j'ai raté le train !"],
              ["Ammazza quanto è grande!", "La vache, qu'est-ce que c'est grand !"],
              ["Uffa, che noia!", "Pff, quel ennui !"],
            ],
          },
        ],
      },
    ],
  },
];

export function allLessons(): Array<Lesson & { level: Cefr; chapterId: string; chapterTitle: string }> {
  return CURRICULUM.flatMap((lv) =>
    lv.chapters.flatMap((ch) => ch.lessons.map((l) => ({ ...l, level: lv.level, chapterId: ch.id, chapterTitle: ch.title }))),
  );
}
