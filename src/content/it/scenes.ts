/**
 * Scènes de démonstration — DIALOGUES ORIGINAUX écrits pour l'application.
 * Les titres (« Bar Centrale », « Ultimo treno per Napoli »...) sont fictifs.
 * Les vidéos correspondantes sont générées localement (scripts/generate-media.ts :
 * synthèse vocale espeak-ng + ffmpeg) : aucun extrait protégé n'est utilisé.
 *
 * Pour ajouter un vrai catalogue (vidéos sous licence), il suffit de fournir des
 * objets `Scene` avec `video.src` et des sous-titres horodatés (voir README).
 */
import type { Cefr } from "../../core/types";

export interface SceneLine {
  speaker: string;
  it: string;
  fr: string;
  /** Sens imposé pour un mot ambigu : lemme → index du sens dans le dictionnaire. */
  senses?: Record<string, number>;
  start?: number;
  end?: number;
}

export interface ComprehensionQuestion {
  q: string;
  options: string[];
  answer: number;
}

export interface Scene {
  id: string;
  title: string;
  work: string;
  kind: "film" | "série";
  episode?: string;
  level: Cefr;
  themes: string[];
  synopsis: string;
  palette: [string, string];
  speakers: Record<string, { voice: string; color: string }>;
  lines: SceneLine[];
  questions: ComprehensionQuestion[];
  /** Source vidéo. "generated" = fichier produit par le script de démo. */
  video?: { src: string; license: string };
  demo: boolean;
}

export const SCENES: Scene[] = [
  {
    id: "bar-centrale-1",
    title: "Il primo caffè",
    work: "Bar Centrale",
    kind: "série",
    episode: "S1 · É1",
    level: "A1",
    themes: ["Café", "Salutations"],
    synopsis: "Giulia vient d'arriver à Bologne. Premier matin, premier café au comptoir du bar de son quartier.",
    palette: ["#5b3a29", "#d9a066"],
    speakers: {
      Giulia: { voice: "it+f3", color: "#f4a261" },
      Franco: { voice: "it+m3", color: "#8ecae6" },
    },
    lines: [
      { speaker: "Franco", it: "Buongiorno! Prego, signorina.", fr: "Bonjour ! Je vous écoute, mademoiselle.", senses: { prego: 2 } },
      { speaker: "Giulia", it: "Buongiorno! Vorrei un caffè, per favore.", fr: "Bonjour ! Je voudrais un café, s'il vous plaît." },
      { speaker: "Franco", it: "Subito. Vuole anche un cornetto?", fr: "Tout de suite. Vous voulez aussi un croissant ?" },
      { speaker: "Giulia", it: "Sì, grazie. Un cornetto alla crema.", fr: "Oui, merci. Un croissant à la crème." },
      { speaker: "Franco", it: "Lei non è di qui, vero?", fr: "Vous n'êtes pas d'ici, n'est-ce pas ?", senses: { lei: 1 } },
      { speaker: "Giulia", it: "No, sono francese. Mi chiamo Giulia.", fr: "Non, je suis française. Je m'appelle Giulia." },
      { speaker: "Franco", it: "Piacere, io sono Franco. Benvenuta a Bologna!", fr: "Enchanté, moi c'est Franco. Bienvenue à Bologne !" },
      { speaker: "Giulia", it: "Grazie! Quanto costa?", fr: "Merci ! Combien ça coûte ?" },
      { speaker: "Franco", it: "Due euro e cinquanta.", fr: "Deux euros cinquante." },
      { speaker: "Giulia", it: "Ecco. Arrivederci, a domani!", fr: "Voilà. Au revoir, à demain !" },
    ],
    questions: [
      { q: "Que commande Giulia ?", options: ["Un thé et un gâteau", "Un café et un croissant", "Un jus d'orange"], answer: 1 },
      { q: "D'où vient Giulia ?", options: ["De Rome", "De France", "De Bologne"], answer: 1 },
      { q: "Combien paie-t-elle ?", options: ["2,50 €", "5 €", "1,20 €"], answer: 0 },
    ],
    demo: true,
  },
  {
    id: "ultimo-treno",
    title: "Alla stazione",
    work: "Ultimo treno per Napoli",
    kind: "film",
    level: "A2",
    themes: ["Voyages", "Ville"],
    synopsis: "Paolo a raté son bus et doit absolument prendre le dernier train pour Naples.",
    palette: ["#1d3557", "#457b9d"],
    speakers: {
      Paolo: { voice: "it+m1", color: "#a8dadc" },
      Impiegata: { voice: "it+f2", color: "#f1faee" },
    },
    lines: [
      { speaker: "Paolo", it: "Scusi, un biglietto per Napoli, per favore.", fr: "Excusez-moi, un billet pour Naples, s'il vous plaît." },
      { speaker: "Impiegata", it: "Per stasera? C'è solo l'ultimo treno, alle dieci.", fr: "Pour ce soir ? Il n'y a que le dernier train, à dix heures." },
      { speaker: "Paolo", it: "Va bene. Quanto costa?", fr: "D'accord. Combien ça coûte ?" },
      { speaker: "Impiegata", it: "Trenta euro. Andata e ritorno?", fr: "Trente euros. Aller-retour ?" },
      { speaker: "Paolo", it: "No, solo andata. Non so quando torno.", fr: "Non, aller simple. Je ne sais pas quand je reviens." },
      { speaker: "Impiegata", it: "Ecco il biglietto. Binario quattro.", fr: "Voici le billet. Quai numéro quatre." },
      { speaker: "Paolo", it: "Dov'è il binario quattro?", fr: "Où est le quai quatre ?" },
      { speaker: "Impiegata", it: "Vada sempre dritto, poi a destra. Non è lontano.", fr: "Allez tout droit, puis à droite. Ce n'est pas loin." },
      { speaker: "Paolo", it: "Grazie mille! Lei è molto gentile.", fr: "Merci beaucoup ! Vous êtes très aimable.", senses: { lei: 1 } },
      { speaker: "Impiegata", it: "Si figuri. Buon viaggio!", fr: "Je vous en prie. Bon voyage !" },
    ],
    questions: [
      { q: "À quelle heure part le train ?", options: ["À huit heures", "À dix heures", "À minuit"], answer: 1 },
      { q: "Quel billet achète Paolo ?", options: ["Un aller-retour", "Un aller simple", "Un abonnement"], answer: 1 },
      { q: "Où se trouve le quai ?", options: ["Tout droit puis à droite", "À gauche", "Au sous-sol"], answer: 0 },
    ],
    demo: true,
  },
  {
    id: "amici-magari",
    title: "Magari!",
    work: "Amici di Trastevere",
    kind: "série",
    episode: "S1 · É3",
    level: "A2",
    themes: ["Amis", "Expressions"],
    synopsis: "Chiara et Matteo organisent le week-end. Écoutez les trois sens de « magari ».",
    palette: ["#e76f51", "#f4a261"],
    speakers: {
      Chiara: { voice: "it+f4", color: "#ffd166" },
      Matteo: { voice: "it+m4", color: "#06d6a0" },
    },
    lines: [
      { speaker: "Matteo", it: "Allora, cosa facciamo questo fine settimana?", fr: "Alors, qu'est-ce qu'on fait ce week-end ?" },
      { speaker: "Chiara", it: "Non so. Magari andiamo al mare?", fr: "Je ne sais pas. On va peut-être à la mer ?", senses: { magari: 0 } },
      { speaker: "Matteo", it: "Al mare? Magari! Ho bisogno di sole.", fr: "À la mer ? Avec plaisir ! J'ai besoin de soleil.", senses: { magari: 2 } },
      { speaker: "Chiara", it: "Però domani forse piove.", fr: "Mais demain il pleut peut-être." },
      { speaker: "Matteo", it: "Dai, non è mica sicuro!", fr: "Allez, ce n'est pas sûr du tout !" },
      { speaker: "Chiara", it: "E poi sono al verde. Magari avessi più soldi!", fr: "Et puis je suis fauchée. Si seulement j'avais plus d'argent !", senses: { magari: 1 } },
      { speaker: "Matteo", it: "Figurati, pago io la benzina.", fr: "Penses-tu, je paie l'essence." },
      { speaker: "Chiara", it: "Davvero? Sei un amico!", fr: "Vraiment ? T'es un vrai ami !" },
      { speaker: "Matteo", it: "Boh, forse sono solo troppo stanco di Roma.", fr: "Bof, peut-être que je suis juste trop fatigué de Rome." },
      { speaker: "Chiara", it: "Vabbè, partiamo domani mattina!", fr: "Bon, on part demain matin !" },
    ],
    questions: [
      { q: "Où veulent-ils aller ?", options: ["À la montagne", "À la mer", "À Milan"], answer: 1 },
      { q: "Pourquoi Chiara hésite-t-elle ?", options: ["Elle est malade", "Elle n'a pas d'argent", "Elle travaille"], answer: 1 },
      { q: "Que propose Matteo ?", options: ["De payer l'essence", "De rester à Rome", "De prendre le train"], answer: 0 },
    ],
    demo: true,
  },
  {
    id: "domenica-famiglia",
    title: "La cena dalla nonna",
    work: "Domenica in famiglia",
    kind: "film",
    level: "B1",
    themes: ["Famille", "Nourriture"],
    synopsis: "Déjeuner du dimanche chez la grand-mère : Luca annonce une nouvelle importante.",
    palette: ["#606c38", "#dda15e"],
    speakers: {
      Nonna: { voice: "it+f1", color: "#fefae0" },
      Luca: { voice: "it+m2", color: "#dda15e" },
    },
    lines: [
      { speaker: "Nonna", it: "Luca, mangia! Sei troppo magro.", fr: "Luca, mange ! Tu es trop maigre." },
      { speaker: "Luca", it: "Nonna, ho già mangiato due piatti di pasta!", fr: "Grand-mère, j'ai déjà mangé deux assiettes de pâtes !" },
      { speaker: "Nonna", it: "E allora? La pasta della nonna è la più buona.", fr: "Et alors ? Les pâtes de grand-mère sont les meilleures." },
      { speaker: "Luca", it: "Hai ragione. Senti, ti devo dire una cosa.", fr: "Tu as raison. Écoute, je dois te dire quelque chose.", senses: { sentire: 2 } },
      { speaker: "Nonna", it: "Cosa è successo? Sei preoccupato?", fr: "Qu'est-ce qui s'est passé ? Tu es inquiet ?" },
      { speaker: "Luca", it: "No, sono felice. Ho trovato un lavoro a Milano.", fr: "Non, je suis heureux. J'ai trouvé un travail à Milan." },
      { speaker: "Nonna", it: "A Milano? Ma è così lontano!", fr: "À Milan ? Mais c'est tellement loin !" },
      { speaker: "Luca", it: "Lo so, ma torno ogni mese. Te lo prometto.", fr: "Je sais, mais je reviens chaque mois. Je te le promets." },
      { speaker: "Nonna", it: "Mi mancherai tanto, amore mio.", fr: "Tu vas tellement me manquer, mon chéri." },
      { speaker: "Luca", it: "Anche tu, nonna. Anche tu.", fr: "Toi aussi, grand-mère. Toi aussi." },
    ],
    questions: [
      { q: "Quelle nouvelle annonce Luca ?", options: ["Il se marie", "Il a trouvé un travail à Milan", "Il est malade"], answer: 1 },
      { q: "Comment réagit la grand-mère ?", options: ["Elle est fâchée", "Il va lui manquer", "Elle veut venir"], answer: 1 },
      { q: "Tous les combien Luca reviendra-t-il ?", options: ["Chaque semaine", "Chaque mois", "Chaque année"], answer: 1 },
    ],
    demo: true,
  },
  {
    id: "ufficio-milano",
    title: "Il colloquio",
    work: "Ufficio Milano",
    kind: "série",
    episode: "S2 · É1",
    level: "B2",
    themes: ["Travail", "Formel"],
    synopsis: "Elena passe un entretien d'embauche dans une agence de design milanaise.",
    palette: ["#22223b", "#9a8c98"],
    speakers: {
      Direttore: { voice: "it+m6", color: "#c9ada7" },
      Elena: { voice: "it+f5", color: "#f2e9e4" },
    },
    lines: [
      { speaker: "Direttore", it: "Buongiorno, si accomodi pure.", fr: "Bonjour, asseyez-vous je vous prie." },
      { speaker: "Elena", it: "Buongiorno, grazie per avermi ricevuta.", fr: "Bonjour, merci de m'avoir reçue." },
      { speaker: "Direttore", it: "Ho letto il suo curriculum. Ha molta esperienza.", fr: "J'ai lu votre CV. Vous avez beaucoup d'expérience." },
      { speaker: "Elena", it: "Sì, ho lavorato cinque anni a Parigi come designer.", fr: "Oui, j'ai travaillé cinq ans à Paris comme designer." },
      { speaker: "Direttore", it: "Perché vuole lavorare con noi?", fr: "Pourquoi voulez-vous travailler avec nous ?" },
      { speaker: "Elena", it: "Secondo me la vostra agenzia è la più creativa di Milano.", fr: "À mon avis, votre agence est la plus créative de Milan." },
      { speaker: "Direttore", it: "Il lavoro è intenso. Le scadenze sono strette.", fr: "Le travail est intense. Les délais sont serrés." },
      { speaker: "Elena", it: "Non è un problema. Sono abituata a lavorare sotto pressione.", fr: "Ce n'est pas un problème. J'ai l'habitude de travailler sous pression." },
      { speaker: "Direttore", it: "Bene. Le faremo sapere entro venerdì.", fr: "Bien. Nous vous ferons savoir d'ici vendredi." },
      { speaker: "Elena", it: "Perfetto. Resto a disposizione. Arrivederci.", fr: "Parfait. Je reste à votre disposition. Au revoir." },
    ],
    questions: [
      { q: "Où Elena a-t-elle travaillé ?", options: ["À Rome", "À Paris", "À Londres"], answer: 1 },
      { q: "Quel est le défi du poste ?", options: ["Les délais serrés", "Les voyages", "Le salaire bas"], answer: 0 },
      { q: "Quand aura-t-elle une réponse ?", options: ["Demain", "D'ici vendredi", "Dans un mois"], answer: 1 },
    ],
    demo: true,
  },
  {
    id: "notte-roma",
    title: "Che casino!",
    work: "Notte a Roma",
    kind: "film",
    level: "B2",
    themes: ["Argot", "Relations"],
    synopsis: "Deux colocataires romains rentrent tard. Langage familier et expressions de rue.",
    palette: ["#3d0e3d", "#b5179e"],
    speakers: {
      Simone: { voice: "it+m7", color: "#f72585" },
      Marta: { voice: "it+f3", color: "#4cc9f0" },
    },
    lines: [
      { speaker: "Marta", it: "Mannaggia, ho perso le chiavi!", fr: "Zut, j'ai perdu les clés !" },
      { speaker: "Simone", it: "Ma dai! Di nuovo?", fr: "Sans blague ! Encore ?" },
      { speaker: "Marta", it: "Che ne so, erano nella borsa...", fr: "Qu'est-ce que j'en sais, elles étaient dans le sac..." },
      { speaker: "Simone", it: "Che casino! Sono le due di notte.", fr: "Quel bazar ! Il est deux heures du matin." },
      { speaker: "Marta", it: "Non mi prendere in giro, sono stanca morta.", fr: "Ne te moque pas de moi, je suis morte de fatigue." },
      { speaker: "Simone", it: "Ammazza quanto sei nervosa stasera!", fr: "La vache, qu'est-ce que tu es énervée ce soir !" },
      { speaker: "Marta", it: "Uffa! Hai una soluzione o no?", fr: "Pff ! Tu as une solution ou pas ?" },
      { speaker: "Simone", it: "Guarda qua: le chiavi di riserva sotto il vaso.", fr: "Regarde ici : les clés de secours sous le pot." },
      { speaker: "Marta", it: "Sei un genio! Che figo!", fr: "T'es un génie ! Trop cool !" },
      { speaker: "Simone", it: "Lo so. Acqua in bocca, però!", fr: "Je sais. Mais motus et bouche cousue !" },
    ],
    questions: [
      { q: "Quel est le problème de Marta ?", options: ["Elle a raté le bus", "Elle a perdu ses clés", "Elle a faim"], answer: 1 },
      { q: "Quelle heure est-il ?", options: ["Minuit", "Deux heures du matin", "Huit heures du soir"], answer: 1 },
      { q: "Où sont les clés de secours ?", options: ["Sous le pot", "Dans la boîte aux lettres", "Chez le voisin"], answer: 0 },
    ],
    demo: true,
  },
  {
    id: "il-regista",
    title: "Il capolavoro",
    work: "Dietro la macchina da presa",
    kind: "série",
    episode: "S1 · É5",
    level: "C1",
    themes: ["Cinéma", "Culture"],
    synopsis: "Une critique et un réalisateur débattent de son dernier film. Registre soutenu et nuances.",
    palette: ["#14213d", "#fca311"],
    speakers: {
      Critica: { voice: "it+f2", color: "#fca311" },
      Regista: { voice: "it+m3", color: "#e5e5e5" },
    },
    lines: [
      { speaker: "Critica", it: "Il suo ultimo film è stato definito un capolavoro.", fr: "Votre dernier film a été qualifié de chef-d'œuvre." },
      { speaker: "Regista", it: "Addirittura? Mi sembra un po' esagerato.", fr: "Carrément ? Ça me semble un peu exagéré." },
      { speaker: "Critica", it: "Eppure la sceneggiatura è geniale.", fr: "Et pourtant le scénario est génial." },
      { speaker: "Regista", it: "Il merito è soprattutto degli attori, che recitano benissimo.", fr: "Le mérite revient surtout aux acteurs, qui jouent remarquablement." },
      { speaker: "Critica", it: "Perché ha girato tutto a Napoli?", fr: "Pourquoi avez-vous tout tourné à Naples ?" },
      { speaker: "Regista", it: "Il romanzo è ambientato lì. Non avrei potuto girarlo altrove.", fr: "Le roman se déroule là-bas. Je n'aurais pas pu le tourner ailleurs." },
      { speaker: "Critica", it: "Qualora le offrissero di lavorare a Hollywood, accetterebbe?", fr: "Si on vous proposait de travailler à Hollywood, accepteriez-vous ?" },
      { speaker: "Regista", it: "Piuttosto resterei in Italia. Ormai qui è casa mia.", fr: "Je resterais plutôt en Italie. Désormais, c'est chez moi ici." },
      { speaker: "Critica", it: "Comunque, il pubblico l'ha amato.", fr: "En tout cas, le public l'a adoré." },
      { speaker: "Regista", it: "Appunto: è questo che conta.", fr: "Justement : c'est ce qui compte." },
    ],
    questions: [
      { q: "Comment le réalisateur réagit-il au mot « chef-d'œuvre » ?", options: ["Il le trouve exagéré", "Il est d'accord", "Il se fâche"], answer: 0 },
      { q: "Pourquoi a-t-il tourné à Naples ?", options: ["Pour des raisons fiscales", "Le roman s'y déroule", "Il y est né"], answer: 1 },
      { q: "Irait-il à Hollywood ?", options: ["Oui, sans hésiter", "Il préférerait rester en Italie", "Il y vit déjà"], answer: 1 },
    ],
    demo: true,
  },
];
