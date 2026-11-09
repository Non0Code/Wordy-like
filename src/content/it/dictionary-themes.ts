// Vocabulaire thématique du parcours A1 → C2 (voir dsl.ts pour le format).
export const THEMES = String.raw`
# ——— A1 · Saluer ———
ciao | int | A1 | salut ; au revoir, ciao {a,dopo,@fin} | t=salutations pr=/ˈtʃa.o/ | Ciao Marco, come va? = Salut Marco, ça va ? | Informel : à utiliser avec les amis, la famille, les jeunes. Sert pour dire bonjour ET au revoir.
buongiorno | int | A1 | bonjour | t=salutations | Buongiorno, signora Rossi! = Bonjour, madame Rossi ! | S'utilise jusqu'en début d'après-midi environ.
buonasera | int | A1 | bonsoir | t=salutations | Buonasera a tutti! = Bonsoir à tous ! | Dès l'après-midi (vers 16 h) en Italie.
buonanotte | int | A1 | bonne nuit | t=salutations | Buonanotte, a domani! = Bonne nuit, à demain !
arrivederci | int | A1 | au revoir | t=salutations | Arrivederci e grazie! = Au revoir et merci ! | Forme neutre/polie. Très formel : « ArrivederLa ».
grazie | int | A1 | merci | t=salutations pr=/ˈɡrat.tsje/ | Grazie mille! = Merci mille fois !
prego | int | A1 | de rien {grazie} ; je vous en prie, allez-y {entri,si,accomodi,@seul} ; je vous écoute (commerce) {desidera,dica} | t=salutations | — Grazie! — Prego! = — Merci ! — De rien ! // Prego, si accomodi. = Je vous en prie, asseyez-vous. | Réponse à « grazie », mais aussi invitation polie (« allez-y, entrez »).
per favore | expr | A1 | s'il te plaît, s'il vous plaît | t=salutations f=per_piacere | Un caffè, per favore. = Un café, s'il vous plaît.
scusa | int | A1 | pardon, excuse-moi ; dis-moi (pour interpeller) {senti,ma} | t=salutations f=scusi | Scusa, non ho capito. = Pardon, je n'ai pas compris. | « scusa » = tutoiement ; « scusi » = vouvoiement (forme de politesse).
benvenuto | adj | A1 | bienvenu | t=salutations | Benvenuti in Italia! = Bienvenue en Italie !
# ——— A1 · Se présenter ———
chiamarsi | v | A1 | s'appeler | t=presentazioni | Come ti chiami? = Comment tu t'appelles ? // Mi chiamo Sofia. = Je m'appelle Sofia.
nome | n | A1 | prénom, nom | g=m t=presentazioni | Qual è il tuo nome? = Quel est ton prénom ?
cognome | n | A1 | nom de famille | g=m t=presentazioni | Il mio cognome è Bianchi. = Mon nom de famille est Bianchi.
piacere | expr | A1 | enchanté(e) {@seul,@debut,mio} ; plaisir | id=piacere_n g=m t=presentazioni | Piacere, Giulia! = Enchantée, je suis Giulia ! // Con piacere! = Avec plaisir ! | En se présentant, on serre la main et on dit « Piacere » suivi de son prénom.
italiano | adj | A1 | italien ; l'italien (langue) {parli,parla,parlo,studio,lingua,in} | t=presentazioni | Sono italiano. = Je suis italien. // Parli italiano? = Tu parles italien ? | Les adjectifs de nationalité ne prennent pas de majuscule.
francese | adj | A1 | français ; le français (langue) {parli,parlo,in} | t=presentazioni | Sono francese, di Lione. = Je suis français, de Lyon.
abitare | v | A1 | habiter | t=presentazioni,casa s=3 | Abito a Parigi. = J'habite à Paris.
lavorare | v | A1 | travailler | t=lavoro | Lavoro in un negozio. = Je travaille dans un magasin.
studente | n | A1 | étudiant | g=m f=studentessa,studentesse t=studio | Sono uno studente. = Je suis étudiant.
anno | n | A1 | an, année | g=m t=numeri | Ho trent'anni. = J'ai trente ans. // Buon anno! = Bonne année !
# ——— A1 · Questions ———
quale | adj | A1 | quel, lequel | f=qual,quali | Qual è il tuo numero? = Quel est ton numéro ? | Devant « è » : « qual è » (sans apostrophe !).
# ——— A1 · La famille ———
famiglia | n | A1 | famille | g=f t=famiglia | Ho una famiglia numerosa. = J'ai une famille nombreuse.
madre | n | A1 | mère | g=f t=famiglia | Mia madre si chiama Anna. = Ma mère s'appelle Anna.
padre | n | A1 | père | g=m t=famiglia | Mio padre è medico. = Mon père est médecin.
fratello | n | A1 | frère | g=m t=famiglia | Ho due fratelli. = J'ai deux frères. | Au pluriel « fratelli » peut signifier « frères et sœurs ».
sorella | n | A1 | sœur | g=f t=famiglia | Mia sorella è più grande. = Ma sœur est plus âgée.
figlio | n | A1 | fils ; enfants (pluriel) {hai,ho,abbiamo,figli} | g=m t=famiglia | Hai figli? = Tu as des enfants ?
figlia | n | A1 | fille (enfant) | g=f t=famiglia | Mia figlia ha sei anni. = Ma fille a six ans.
nonno | n | A1 | grand-père ; grands-parents (pluriel) {nonni} | g=m t=famiglia | I miei nonni vivono in Sicilia. = Mes grands-parents vivent en Sicile.
nonna | n | A1 | grand-mère | g=f t=famiglia | La nonna cucina benissimo. = Grand-mère cuisine très bien.
marito | n | A2 | mari | g=m t=famiglia | Mio marito è di Bologna. = Mon mari est de Bologne.
moglie | n | A2 | épouse, femme | g=f pl=mogli t=famiglia | Sua moglie è simpatica. = Sa femme est sympathique.
zio | n | A2 | oncle | g=m t=famiglia pr=/ˈtsi.o/ | Mio zio abita a Firenze. = Mon oncle habite à Florence.
# ——— A1 · Décrire ———
alto | adj | A1 | grand (taille) ; haut {montagna,voce,prezzo} | t=descrizione | Marco è molto alto. = Marco est très grand.
basso | adj | A1 | petit (taille) ; bas {voce,prezzo} | t=descrizione | Sono basso come mio padre. = Je suis petit comme mon père.
giovane | adj | A1 | jeune | s=3 t=descrizione | È ancora giovane. = Il est encore jeune.
vecchio | adj | A1 | vieux | t=descrizione | Una casa vecchia. = Une vieille maison.
simpatico | adj | A1 | sympathique | s=3 t=descrizione | La tua amica è simpatica! = Ton amie est sympa !
bello | adj | A1 | beau ; agréable {tempo,giornata,serata} | t=descrizione f=bel,begli,bei,bell' | Che bella giornata! = Quelle belle journée ! // Un bel ragazzo. = Un beau garçon. | Devant un nom, « bello » se comporte comme l'article : bel ragazzo, bell'uomo, begli occhi.
brutto | adj | A1 | laid ; mauvais {tempo,notizia,sogno} | t=descrizione | Che brutto tempo! = Quel sale temps !
carino | adj | A1 | mignon, joli ; gentil {sei,molto,gentile} | t=descrizione | Che carino! = Comme c'est mignon ! // Sei stato carino. = Tu as été gentil.
gentile | adj | A2 | gentil, aimable ; cher, chère (lettre) {@debut,signor,signora,dottore} | t=descrizione,lavoro | Grazie, sei molto gentile. = Merci, tu es très gentil. // Gentile signora Rossi, = Chère madame Rossi,
# ——— A1 · Nombres ———
uno | num | A1 | un (nombre) | id=uno_num t=numeri | Uno, due, tre... = Un, deux, trois...
due | num | A1 | deux | t=numeri | Due caffè, per favore. = Deux cafés, s'il vous plaît.
tre | num | A1 | trois | t=numeri | Tre biglietti. = Trois billets.
quattro | num | A1 | quatre | t=numeri | Alle quattro. = À quatre heures.
cinque | num | A1 | cinq | t=numeri | Cinque minuti. = Cinq minutes.
dieci | num | A1 | dix | t=numeri | Dieci euro. = Dix euros.
venti | num | A1 | vingt | f=vent' t=numeri | Ho vent'anni. = J'ai vingt ans.
cento | num | A1 | cent | t=numeri | Cento per cento! = Cent pour cent !
mille | num | A1 | mille | f=mila t=numeri | Grazie mille! = Merci mille fois !
# ——— A1 · Au café ———
caffè | n | A1 | café (boisson) ; café (lieu) {al,bar} | g=m t=cibo | Un caffè e un cornetto. = Un café et un croissant. | En Italie, « un caffè » = un expresso. On le boit souvent debout au comptoir.
acqua | n | A1 | eau | g=f t=cibo | Acqua naturale o frizzante? = Eau plate ou gazeuse ?
cornetto | n | A1 | croissant (viennoiserie) | g=m t=cibo | Un cornetto alla crema. = Un croissant à la crème.
bar | n | A1 | café, bar | g=m t=cibo | Ci vediamo al bar. = On se voit au café.
conto | n | A1 | addition ; compte {banca,bancario} | g=m t=cibo | Il conto, per favore. = L'addition, s'il vous plaît.
zucchero | n | A2 | sucre | g=m s=3 t=cibo | Senza zucchero, grazie. = Sans sucre, merci.
latte | n | A1 | lait | g=m t=cibo | Un caffè con un po' di latte. = Un café avec un peu de lait. | « Un latte » au bar = un verre de lait ! Pour un café au lait, demandez « un caffellatte ».
# ——— A1 · La maison ———
casa | n | A1 | maison ; chez soi, à la maison {a,torno,vado,resto} | g=f t=casa | Torno a casa. = Je rentre à la maison.
camera | n | A1 | chambre | g=f s=3 t=casa | La mia camera è piccola. = Ma chambre est petite.
cucina | n | A1 | cuisine | g=f t=casa,cibo | La cucina italiana è famosa. = La cuisine italienne est célèbre.
grande | adj | A1 | grand ; adulte, âgé {più,sorella,fratello} | t=descrizione | Una casa grande. = Une grande maison.
piccolo | adj | A1 | petit | s=3 t=descrizione | Un piccolo problema. = Un petit problème.
# ——— A2 · Au restaurant ———
mangiare | v | A1 | manger | t=cibo | Cosa mangiamo stasera? = Qu'est-ce qu'on mange ce soir ?
bere | v | A1 | boire | v=irr/avere t=cibo | Cosa vuoi bere? = Que veux-tu boire ?
pasta | n | A1 | pâtes ; pâtisserie {pasticceria} | g=f t=cibo | La pasta al dente. = Les pâtes al dente.
pizza | n | A1 | pizza | g=f t=cibo | Una pizza margherita. = Une pizza margherita.
vino | n | A1 | vin | g=m t=cibo | Un bicchiere di vino rosso. = Un verre de vin rouge.
pane | n | A1 | pain | g=m t=cibo | Il pane è fresco. = Le pain est frais.
buono | adj | A1 | bon ; délicieux {pizza,pasta,vino,è} | t=cibo f=buon,buon' | Buon appetito! = Bon appétit ! // Questa pizza è buonissima. = Cette pizza est délicieuse.
ristorante | n | A1 | restaurant | g=m t=cibo | Andiamo al ristorante? = On va au restaurant ?
menù | n | A2 | menu, carte | g=m t=cibo | Posso vedere il menù? = Je peux voir la carte ?
cameriere | n | A2 | serveur | g=m f=cameriera t=cibo | Il cameriere è molto simpatico. = Le serveur est très sympathique.
# ——— A2 · Courses ———
comprare | v | A1 | acheter | t=acquisti | Devo comprare il pane. = Je dois acheter du pain.
mercato | n | A2 | marché | g=m t=acquisti | Il mercato è aperto la mattina. = Le marché est ouvert le matin.
frutta | n | A2 | fruits (collectif) | g=f t=acquisti,cibo | Mangio molta frutta. = Je mange beaucoup de fruits.
verdura | n | A2 | légumes (collectif) | g=f t=acquisti,cibo | La verdura è fresca. = Les légumes sont frais.
costare | v | A2 | coûter | v=are/essere t=acquisti | Quanto costa? = Combien ça coûte ?
euro | n | A1 | euro | g=m pl=euro t=acquisti | Sono dieci euro. = Ça fait dix euros.
caro | adj | A2 | cher (prix) {costa,troppo,prezzo,è} ; cher, chère (affection) {mio,mia,amico,@debut} | t=acquisti | È troppo caro! = C'est trop cher ! // Caro Paolo, = Cher Paolo,
negozio | n | A2 | magasin | g=m t=acquisti | Il negozio chiude alle otto. = Le magasin ferme à huit heures.
# ——— A2 · En ville ———
città | n | A1 | ville | g=f t=viaggi | Roma è una città bellissima. = Rome est une ville magnifique.
strada | n | A2 | rue, route | g=f t=viaggi | Sono per strada. = Je suis en route. // Questa strada va al centro. = Cette rue mène au centre.
stazione | n | A2 | gare | g=f t=viaggi | Dov'è la stazione? = Où est la gare ?
treno | n | A1 | train | g=m t=viaggi | Il treno è in ritardo. = Le train est en retard.
biglietto | n | A2 | billet, ticket | g=m t=viaggi | Un biglietto per Napoli. = Un billet pour Naples.
vicino | adj | A2 | près, proche ; voisin {mio,di,casa} | t=viaggi | È vicino? = C'est près ? // Il mio vicino è rumoroso. = Mon voisin est bruyant.
lontano | adj | A2 | loin | t=viaggi | Non è lontano. = Ce n'est pas loin.
destra | n | A2 | droite | g=f t=viaggi | Gira a destra. = Tourne à droite.
sinistra | n | A2 | gauche | g=f t=viaggi | La farmacia è a sinistra. = La pharmacie est à gauche.
dritto | adv | A2 | tout droit | f=diritto t=viaggi | Vai sempre dritto. = Va toujours tout droit.
# ——— A2 · À l'hôtel ———
albergo | n | A2 | hôtel | g=m pl=alberghi t=viaggi | L'albergo è vicino al mare. = L'hôtel est près de la mer.
notte | n | A1 | nuit | g=f t=viaggi | Per due notti. = Pour deux nuits.
stanza | n | A2 | chambre, pièce | g=f t=viaggi,casa | Una stanza doppia. = Une chambre double.
chiave | n | A2 | clé | g=f t=viaggi | Ecco la chiave della stanza. = Voici la clé de la chambre.
prenotare | v | A2 | réserver | t=viaggi | Ho prenotato un tavolo. = J'ai réservé une table.
libero | adj | A2 | libre | s=3 t=viaggi | Questo tavolo è libero? = Cette table est libre ?
colazione | n | A2 | petit-déjeuner | g=f t=viaggi,cibo | La colazione è inclusa? = Le petit-déjeuner est compris ?
mare | n | A1 | mer | g=m t=viaggi | Andiamo al mare! = Allons à la mer !
# ——— A2 · Météo ———
tempo | n | A1 | temps (météo) {fa,bel,brutto,che} ; temps (durée) {non,ho,hai,molto,poco,quanto} | g=m t=meteo | Che tempo fa? = Quel temps fait-il ? // Non ho tempo. = Je n'ai pas le temps.
sole | n | A1 | soleil | g=m t=meteo | C'è il sole. = Il y a du soleil.
pioggia | n | A2 | pluie | g=f t=meteo pr=/ˈpjɔd.dʒa/ | Domani pioggia. = Demain, pluie.
piovere | v | A2 | pleuvoir | s=3 v=ere/essere t=meteo | Piove da tre giorni. = Il pleut depuis trois jours.
caldo | adj | A1 | chaud ; chaleur {che,fa,ho} | t=meteo | Fa caldo! = Il fait chaud ! // Ho caldo. = J'ai chaud. | « avere caldo » = avoir chaud (personne) ; « fare caldo » = faire chaud (météo).
freddo | adj | A1 | froid | t=meteo | Ho freddo. = J'ai froid. // Fa freddo. = Il fait froid.
stagione | n | A2 | saison | g=f t=meteo | La mia stagione preferita è l'estate. = Ma saison préférée est l'été.
estate | n | A2 | été | g=f t=meteo | D'estate vado al mare. = L'été je vais à la mer.
inverno | n | A2 | hiver | g=m t=meteo | L'inverno a Milano è freddo. = L'hiver à Milan est froid.
# ——— A2 · Loisirs ———
piacere | v | A1 | plaire, aimer (mi piace) | v=irr/essere t=tempo_libero | Mi piace la musica. = J'aime la musique. // Ti piacciono i film italiani? = Tu aimes les films italiens ? | Construction inversée : ce qui plaît est le sujet. « Mi piace il cinema » (singulier), « mi piacciono i film » (pluriel).
leggere | v | A1 | lire | s=3 v=ere/avere t=tempo_libero | Leggo un libro. = Je lis un livre.
musica | n | A1 | musique | g=f s=3 t=tempo_libero | Ascolto musica italiana. = J'écoute de la musique italienne.
ascoltare | v | A2 | écouter | t=tempo_libero | Ascoltami bene. = Écoute-moi bien.
film | n | A1 | film | g=m pl=film t=tempo_libero,cinema | Un bel film. = Un beau film.
uscire | v | A2 | sortir | v=irr/essere t=tempo_libero | Usciamo stasera? = On sort ce soir ?
amico | n | A1 | ami | g=m pl=amici f=amica,amiche t=tempo_libero | È il mio migliore amico. = C'est mon meilleur ami.
sera | n | A1 | soir | g=f f=stasera t=tempo_libero | Stasera c'è una festa. = Ce soir il y a une fête.
libro | n | A1 | livre | g=m t=tempo_libero | Un libro interessante. = Un livre intéressant.
cinema | n | A1 | cinéma | g=m pl=cinema s=3 t=tempo_libero,cinema | Andiamo al cinema? = On va au cinéma ?
festa | n | A2 | fête | g=f t=tempo_libero | Vieni alla mia festa? = Tu viens à ma fête ?
# ——— A2 · Hier ———
svegliarsi | v | A2 | se réveiller | t=quotidiano | Mi sono svegliato tardi. = Je me suis réveillé tard.
dopo | adv | A2 | après, plus tard | | Ci vediamo dopo. = On se voit plus tard.
prima | adv | A2 | avant, d'abord | | Prima il dovere, poi il piacere. = Le devoir d'abord, le plaisir ensuite.
mattina | n | A1 | matin | g=f f=stamattina,mattino t=quotidiano | Di mattina bevo un caffè. = Le matin je bois un café.
settimana | n | A2 | semaine | g=f t=quotidiano | La settimana prossima. = La semaine prochaine.
lavoro | n | A1 | travail | g=m t=lavoro | Vado al lavoro. = Je vais au travail. // Buon lavoro! = Bon travail !
# ——— A2 · Expressions utiles ———
magari | adv | A2 | peut-être, éventuellement {forse,domani,stasera,dopo,potremmo,possiamo} ; si seulement ! {fosse,avessi,fossi,potessi,avesse,potesse,vero,così} ; volontiers, j'aimerais bien ! (réponse) {@seul,sì} | t=espressioni | Magari ci vediamo domani. = Peut-être qu'on se voit demain. // Magari fosse vero! = Si seulement c'était vrai ! // — Vieni al mare? — Magari! = — Tu viens à la mer ? — J'aimerais bien ! | Mot très italien : selon le contexte, il exprime une possibilité (« peut-être »), un souhait (« si seulement », avec le subjonctif imparfait) ou un enthousiasme (« volontiers ! »).
allora | adv | A2 | alors, donc ; à l'époque {era,c'era,eravamo} | t=espressioni | Allora, cosa facciamo? = Alors, qu'est-ce qu'on fait ? | Mot de remplissage très courant en début de phrase, comme « bon » ou « alors ».
dai | int | A2 | allez ! ; arrête !, sans blague ! {ma,smettila} | id=dai_int t=espressioni | Dai, andiamo! = Allez, on y va ! // Ma dai! = Sans blague ! | Vient de l'impératif de « dare ». Encourage (« allez ! ») ou marque l'incrédulité (« ma dai! »).
boh | int | A2 | aucune idée, bof | t=espressioni | — Dov'è Luca? — Boh! = — Où est Luca ? — Aucune idée !
figurati | expr | A2 | je t'en prie, de rien {grazie,@seul} ; tu parles !, penses-tu ! {se,ma} | t=espressioni f=si_figuri | — Grazie! — Figurati! = — Merci ! — Je t'en prie ! | Réponse chaleureuse à un remerciement. Forme polie : « si figuri ».
mica | adv | B1 | pas du tout, quand même pas | t=espressioni | Non è mica facile! = Ce n'est pas si facile ! // Mica male! = Pas mal du tout ! | Renforce la négation, registre familier.
insomma | adv | B1 | bref, en somme ; bof, couci-couça {@seul,così} | t=espressioni | Insomma, hai capito? = Bref, tu as compris ? // — Com'è andata? — Insomma... = — Comment ça s'est passé ? — Bof...
vabbè | int | B1 | bon, d'accord, tant pis | t=espressioni f=va_be' | Vabbè, non importa. = Bon, ce n'est pas grave.
# ——— B1 · Émotions ———
felice | adj | B1 | heureux | t=emozioni | Sono felice di vederti. = Je suis heureux de te voir.
triste | adj | B1 | triste | t=emozioni | Perché sei triste? = Pourquoi es-tu triste ?
stanco | adj | A2 | fatigué | t=emozioni | Sono stanca morta. = Je suis morte de fatigue.
arrabbiato | adj | B1 | en colère, fâché | t=emozioni | È arrabbiato con me. = Il est fâché contre moi.
preoccupato | adj | B1 | inquiet | t=emozioni | Non essere preoccupata. = Ne sois pas inquiète.
sentirsi | v | B1 | se sentir | t=emozioni | Mi sento meglio. = Je me sens mieux.
paura | n | B1 | peur | g=f t=emozioni pr=/paˈu.ra/ | Ho paura del buio. = J'ai peur du noir.
contento | adj | A2 | content | t=emozioni | Sono contento per te. = Je suis content pour toi.
nervoso | adj | B1 | nerveux, énervé | t=emozioni | Oggi è nervoso. = Aujourd'hui il est énervé.
preoccuparsi | v | B1 | s'inquiéter | t=emozioni | Non ti preoccupare! = Ne t'inquiète pas !
# ——— B1 · Relations ———
ragazzo | n | A1 | garçon, jeune homme ; petit ami {mio,suo,il_mio,ha} | g=m t=relazioni | Un ragazzo simpatico. = Un garçon sympa. // Il mio ragazzo si chiama Luca. = Mon copain s'appelle Luca. | « ragazzi! » sert aussi à interpeller un groupe : « les amis ! ».
ragazza | n | A1 | fille, jeune femme ; petite amie {mia,sua,ha} | g=f t=relazioni | Quella ragazza è mia cugina. = Cette fille est ma cousine.
amore | n | A2 | amour ; mon amour, chéri(e) {@seul,@fin,ciao} | g=m t=relazioni | L'amore è cieco. = L'amour est aveugle. // Ciao, amore! = Salut, mon cœur !
fidanzato | n | B1 | fiancé, petit ami | g=m f=fidanzata t=relazioni | Ha un fidanzato a Milano. = Elle a un copain à Milan. | Plus large qu'en français : désigne souvent simplement le copain/la copine.
innamorarsi | v | B1 | tomber amoureux | t=relazioni | Mi sono innamorato di te. = Je suis tombé amoureux de toi.
fiducia | n | B1 | confiance | g=f t=relazioni pr=/fiˈdu.tʃa/ | Ho fiducia in te. = J'ai confiance en toi.
baciare | v | B1 | embrasser | t=relazioni | Mi ha baciato. = Il m'a embrassée.
mancare | v | B1 | manquer | v=are/essere t=relazioni,emozioni | Mi manchi. = Tu me manques. | Même construction que « piacere » : « mi manchi » = tu me manques.
# ——— B1 · Travail ———
ufficio | n | B1 | bureau | g=m t=lavoro | Sono in ufficio fino alle sei. = Je suis au bureau jusqu'à six heures.
collega | n | B1 | collègue | g=mf pl=colleghi f=colleghe t=lavoro | Il mio collega è in ferie. = Mon collègue est en vacances.
capo | n | B1 | chef, patron | g=m pl=capi t=lavoro | Il capo è arrabbiato. = Le patron est en colère.
riunione | n | B1 | réunion | g=f t=lavoro | Ho una riunione alle dieci. = J'ai une réunion à dix heures.
stipendio | n | B1 | salaire | g=m t=lavoro | Lo stipendio è basso. = Le salaire est bas.
# ——— B1 · Études ———
università | n | B1 | université | g=f t=studio | Studio all'università di Bologna. = J'étudie à l'université de Bologne.
studiare | v | A1 | étudier | t=studio | Studio l'italiano. = J'étudie l'italien.
esame | n | B1 | examen | g=m t=studio | Domani ho un esame. = Demain j'ai un examen.
corso | n | B1 | cours ; avenue {vittorio,emanuele} | g=m t=studio | Un corso di italiano. = Un cours d'italien.
professore | n | A2 | professeur | g=m f=professoressa,professoresse t=studio | Il professore spiega bene. = Le professeur explique bien.
laurea | n | B1 | diplôme universitaire | g=f s=3 t=studio | Ho preso la laurea in legge. = J'ai obtenu mon diplôme en droit.
imparare | v | A2 | apprendre | t=studio | Voglio imparare l'italiano. = Je veux apprendre l'italien.
# ——— B1 · Donner son avis ———
pensare | v | A2 | penser | t=opinioni | Penso di sì. = Je pense que oui. // A cosa pensi? = À quoi tu penses ?
credere | v | B1 | croire | s=3 t=opinioni | Non ci credo! = Je n'y crois pas !
secondo | prep | B1 | selon {me,te,lui,lei,noi,voi,loro} ; deuxième, seconde {il,la,piatto,volta} | t=opinioni f=seconda | Secondo me, hai ragione. = À mon avis, tu as raison. // Il secondo piatto. = Le plat principal.
sembrare | v | B1 | sembler | v=are/essere t=opinioni | Mi sembra una buona idea. = Ça me semble une bonne idée.
accordo | n | B1 | accord | g=m t=opinioni | Sono d'accordo con te. = Je suis d'accord avec toi. // D'accordo! = D'accord !
invece | adv | B1 | au contraire, par contre | t=opinioni | Io invece preferisco il mare. = Moi, par contre, je préfère la mer.
però | conj | A2 | mais, pourtant | t=opinioni | È bello, però costa troppo. = C'est beau, mais ça coûte trop cher.
ragione | n | B1 | raison | g=f t=opinioni | Hai ragione. = Tu as raison.
# ——— B1 · Projets ———
futuro | n | B1 | avenir ; futur (grammaire) {tempo,verbo} | g=m t=progetti | Cosa farai in futuro? = Que feras-tu à l'avenir ?
sperare | v | B1 | espérer | t=progetti | Spero di sì. = J'espère que oui.
progetto | n | B1 | projet | g=m t=progetti | Ho un nuovo progetto. = J'ai un nouveau projet.
cercare | v | A2 | chercher | t=progetti | Cerco lavoro. = Je cherche du travail.
trovare | v | A2 | trouver ; aller voir (qqn) {vengo,venire,andare} | t=progetti | Non trovo le chiavi! = Je ne trouve pas les clés ! // Vengo a trovarti. = Je viens te voir.
sognare | v | B1 | rêver | t=progetti | Sogno di vivere in Italia. = Je rêve de vivre en Italie.
# ——— B1 · Santé ———
medico | n | B1 | médecin | g=m pl=medici s=3 t=salute | Devo andare dal medico. = Je dois aller chez le médecin.
testa | n | A2 | tête | g=f t=salute | Ho mal di testa. = J'ai mal à la tête.
malato | adj | B1 | malade | t=salute | Sono malato da tre giorni. = Je suis malade depuis trois jours.
febbre | n | B1 | fièvre | g=f t=salute | Ho la febbre. = J'ai de la fièvre.
farmacia | n | B1 | pharmacie | g=f t=salute pr=/far.maˈtʃi.a/ | C'è una farmacia qui vicino? = Il y a une pharmacie près d'ici ?
meglio | adv | B1 | mieux | t=salute | Va meglio oggi? = Ça va mieux aujourd'hui ?
# ——— B2 · Expressions idiomatiques ———
in bocca al lupo | expr | B2 | bonne chance (merde !) | t=espressioni | — Domani ho l'esame. — In bocca al lupo! = — Demain j'ai l'examen. — Bonne chance ! | Littéralement « dans la gueule du loup ». On répond « Crepi! » (qu'il crève !), jamais « grazie ».
crepi | int | B2 | qu'il crève ! (réponse à « in bocca al lupo ») | t=espressioni | — In bocca al lupo! — Crepi! = — Bonne chance ! — Merci !
non vedo l'ora | expr | B2 | j'ai hâte | t=espressioni | Non vedo l'ora di vederti! = J'ai hâte de te voir ! | Littéralement « je ne vois pas l'heure ».
che ne so | expr | B2 | qu'est-ce que j'en sais | t=espressioni | — Dove sono le chiavi? — E che ne so io! = — Où sont les clés ? — Qu'est-ce que j'en sais, moi !
costare un occhio della testa | expr | B2 | coûter les yeux de la tête | t=espressioni | Questa borsa costa un occhio della testa. = Ce sac coûte les yeux de la tête.
fare due passi | expr | B2 | faire un petit tour | t=espressioni | Facciamo due passi in centro? = On fait un petit tour en ville ?
# ——— B2 · Argot ———
figo | adj | B2 | cool, canon (familier) | t=gergo pl=fighi | Che figo! = Trop cool ! | Familier. Au féminin, préférer « fica »/« figa » avec prudence : peut être vulgaire.
casino | n | B2 | bazar, pagaille ; énormément {un,di} | g=m t=gergo | Che casino! = Quel bazar ! // Ho un casino di lavoro. = J'ai un boulot monstre. | Faux ami : ne signifie pas « casino » (= casinò, avec accent).
cavolo | n | B2 | chou ; zut !, mince ! {che,@seul,ma} | g=m s=3 t=gergo | Cavolo, è tardi! = Mince, il est tard ! // Che cavolo dici? = Qu'est-ce que tu racontes ? | Euphémisme poli pour un juron.
roba | n | B2 | truc, trucs, affaires | g=f t=gergo | Che roba è? = C'est quoi ce truc ? // Prendi la tua roba. = Prends tes affaires.
fregarsene | v | B2 | s'en ficher | t=gergo f=me_ne_frego,te_ne_frega,frega | Me ne frego! = Je m'en fiche ! // Chi se ne frega? = On s'en fiche !
sfigato | adj | B2 | malchanceux, loser (familier) | t=gergo | Che sfigato! = Quel loser !
# ——— B2 · Entretien d'embauche ———
colloquio | n | B2 | entretien | g=m t=lavoro | Ho un colloquio di lavoro. = J'ai un entretien d'embauche.
candidato | n | B2 | candidat | g=m t=lavoro | Il candidato ideale. = Le candidat idéal.
esperienza | n | B2 | expérience | g=f t=lavoro | Ho cinque anni di esperienza. = J'ai cinq ans d'expérience.
competenza | n | B2 | compétence | g=f t=lavoro | Le mie competenze linguistiche. = Mes compétences linguistiques.
assumere | v | B2 | embaucher ; assumer {responsabilità} | s=3 pp=assunto t=lavoro | Mi hanno assunto! = Ils m'ont embauché !
scadenza | n | B2 | échéance, date limite | g=f t=lavoro | La scadenza è venerdì. = La date limite est vendredi.
contratto | n | B2 | contrat | g=m t=lavoro | Un contratto a tempo indeterminato. = Un CDI.
# ——— B2 · E-mails ———
cordiali saluti | expr | B2 | cordialement | t=lavoro | Cordiali saluti, Marta Rossi = Cordialement, Marta Rossi
allegato | n | B2 | pièce jointe | g=m t=lavoro | Trova in allegato il mio CV. = Vous trouverez mon CV en pièce jointe.
rispondere | v | B2 | répondre | s=3 t=lavoro | Rispondo subito. = Je réponds tout de suite.
inviare | v | B2 | envoyer | t=lavoro | Le invio il documento. = Je vous envoie le document.
richiesta | n | B2 | demande, requête | g=f t=lavoro | Ho ricevuto la sua richiesta. = J'ai reçu votre demande.
disponibile | adj | B2 | disponible | s=3 t=lavoro | Sono disponibile da lunedì. = Je suis disponible à partir de lundi.
# ——— B2 · Société ———
notizia | n | B2 | nouvelle, information | g=f t=societa | Ho una bella notizia! = J'ai une bonne nouvelle !
giornale | n | B2 | journal | g=m t=societa | Leggo il giornale ogni mattina. = Je lis le journal chaque matin.
governo | n | B2 | gouvernement | g=m t=societa | Il governo ha deciso. = Le gouvernement a décidé.
crisi | n | B2 | crise | g=f pl=crisi t=societa | La crisi economica. = La crise économique.
cambiamento | n | B2 | changement | g=m t=societa | Un grande cambiamento. = Un grand changement.
ambiente | n | B2 | environnement ; ambiance {bel,piacevole} | g=m t=societa | Proteggere l'ambiente. = Protéger l'environnement.
problema | n | A2 | problème | g=m pl=problemi t=societa | Nessun problema! = Aucun problème ! | Masculin malgré le -a : « il problema », « i problemi ».
# ——— B2 · Argumenter ———
tuttavia | conj | B2 | toutefois | t=argomentare | È difficile, tuttavia possibile. = C'est difficile, toutefois possible.
quindi | conj | B1 | donc | t=argomentare | Piove, quindi resto a casa. = Il pleut, donc je reste à la maison.
infatti | conj | B1 | en effet ; justement, exactement {@seul} | t=argomentare | — È tardi. — Infatti! = — Il est tard. — Justement ! | Faux ami partiel : souvent « en effet / exactement », pas « en fait » (= in realtà).
nonostante | prep | B2 | malgré, bien que | t=argomentare | Nonostante la pioggia, siamo usciti. = Malgré la pluie, nous sommes sortis.
purché | conj | B2 | pourvu que, à condition que | t=argomentare | Vengo, purché tu guidi. = Je viens, à condition que tu conduises. | Suivi du subjonctif.
affinché | conj | B2 | afin que | t=argomentare | Te lo dico affinché tu lo sappia. = Je te le dis afin que tu le saches. | Suivi du subjonctif.
sebbene | conj | B2 | bien que | t=argomentare | Sebbene sia stanco, lavoro. = Bien que je sois fatigué, je travaille. | Suivi du subjonctif.
# ——— C1 · Nuances ———
benché | conj | C1 | bien que, quoique | t=nuances | Benché piovesse, siamo usciti. = Bien qu'il plût, nous sommes sortis.
qualora | conj | C1 | au cas où, si jamais | t=nuances | Qualora avesse domande, mi scriva. = Si jamais vous aviez des questions, écrivez-moi.
bisognare | v | C1 | falloir | t=nuances f=bisogna | Bisogna partire subito. = Il faut partir tout de suite. | Verbe impersonnel : « bisogna che + subjonctif ».
occorrere | v | C1 | être nécessaire | s=3 v=ere/essere pp=occorso t=nuances | Occorre più tempo. = Il faut plus de temps.
comunque | adv | B1 | de toute façon, quand même | t=nuances | Comunque, grazie. = Merci quand même.
addirittura | adv | C1 | carrément, même | t=nuances | È venuto addirittura il sindaco! = Même le maire est venu !
piuttosto | adv | C1 | plutôt | t=nuances | Prendo piuttosto un tè. = Je prendrai plutôt un thé.
appunto | adv | C1 | justement, précisément | t=nuances | Appunto! = Justement !
ormai | adv | B2 | désormais, maintenant (c'est trop tard) | t=nuances | Ormai è troppo tardi. = Maintenant, c'est trop tard.
eppure | conj | C1 | et pourtant | t=nuances | Eppure ti avevo avvertito! = Et pourtant je t'avais prévenu !
# ——— C1 · Cinéma ———
regista | n | C1 | réalisateur | g=mf pl=registi t=cinema | Fellini è il mio regista preferito. = Fellini est mon réalisateur préféré.
attore | n | B1 | acteur | g=m f=attrice,attrici t=cinema | Un attore bravissimo. = Un acteur excellent.
sceneggiatura | n | C1 | scénario | g=f t=cinema | Una sceneggiatura originale. = Un scénario original.
inquadratura | n | C1 | plan, cadrage | g=f t=cinema | Un'inquadratura bellissima. = Un plan magnifique.
recitare | v | C1 | jouer (un rôle) | s=3 t=cinema | Recita molto bene. = Il joue très bien.
girare | v | B1 | tourner ; tourner (un film) {film,scena,scene} ; se promener {per,città} | t=cinema,viaggi | Gira a destra. = Tourne à droite. // Hanno girato il film a Roma. = Ils ont tourné le film à Rome.
trama | n | C1 | intrigue | g=f t=cinema | La trama è complicata. = L'intrigue est compliquée.
scena | n | B1 | scène | g=f t=cinema | L'ultima scena è stupenda. = La dernière scène est magnifique.
# ——— C1 · Littérature ———
romanzo | n | B2 | roman | g=m t=letteratura | Un romanzo di Elena Ferrante. = Un roman d'Elena Ferrante.
poesia | n | B2 | poésie, poème | g=f t=letteratura pr=/po.eˈzi.a/ | Una poesia di Leopardi. = Un poème de Leopardi.
scrittore | n | B2 | écrivain | g=m f=scrittrice t=letteratura | È uno scrittore famoso. = C'est un écrivain célèbre.
ambientato | adj | C1 | situé, qui se déroule (intrigue) | t=letteratura,cinema | Il romanzo è ambientato a Napoli. = Le roman se déroule à Naples.
tradurre | v | C1 | traduire | v=irr/avere t=letteratura | Puoi tradurre questa frase? = Peux-tu traduire cette phrase ?
capolavoro | n | C1 | chef-d'œuvre | g=m t=letteratura | È un capolavoro! = C'est un chef-d'œuvre !
personaggio | n | C1 | personnage | g=m t=letteratura,cinema | Il personaggio principale. = Le personnage principal.
# ——— C2 · Idiomes avancés ———
acqua in bocca | expr | C2 | motus et bouche cousue | t=idiomi | Acqua in bocca, mi raccomando! = Motus et bouche cousue, je compte sur toi !
prendere in giro | expr | C2 | se moquer de, faire marcher | t=idiomi | Mi stai prendendo in giro? = Tu te moques de moi ?
essere al verde | expr | C2 | être fauché | t=idiomi | Sono al verde fino a fine mese. = Je suis fauché jusqu'à la fin du mois.
tirare le somme | expr | C2 | faire le bilan | t=idiomi | Alla fine tiriamo le somme. = À la fin, faisons le bilan.
rompere le scatole | expr | C2 | casser les pieds | t=idiomi | Smettila di rompere le scatole! = Arrête de me casser les pieds !
avere le mani in pasta | expr | C2 | avoir le bras long, être impliqué | t=idiomi | Ha le mani in pasta dappertutto. = Il a des relations partout.
# ——— C2 · Langue soutenue ———
pertanto | conj | C2 | par conséquent | t=soutenu | Pertanto, la riunione è annullata. = Par conséquent, la réunion est annulée.
alquanto | adv | C2 | quelque peu, assez | t=soutenu | Era alquanto sorpreso. = Il était quelque peu surpris.
nondimeno | conj | C2 | néanmoins | t=soutenu | È tardi; nondimeno proveremo. = Il est tard ; néanmoins nous essaierons.
giacché | conj | C2 | puisque, étant donné que | t=soutenu | Giacché sei qui, aiutami. = Puisque tu es là, aide-moi.
alcunché | pron | C2 | quoi que ce soit, rien | t=soutenu | Non ha detto alcunché. = Il n'a rien dit du tout.
siffatto | adj | C2 | pareil, tel | t=soutenu | Un comportamento siffatto è inaccettabile. = Un tel comportement est inacceptable.
# ——— C2 · Régionalismes ———
mannaggia | int | C2 | zut !, flûte ! (Sud) | t=regionale | Mannaggia, ho perso il treno! = Zut, j'ai raté le train !
ammazza | int | C2 | waouh !, la vache ! (Rome) | t=regionale | Ammazza quanto è grande! = La vache, qu'est-ce que c'est grand !
daje | int | C2 | allez !, vas-y ! (Rome) | t=regionale | Daje Roma! = Allez la Roma !
macché | int | C2 | mais non !, tu parles ! | t=regionale | — Hai vinto? — Macché! = — Tu as gagné ? — Tu parles !
uffa | int | C2 | pff !, ras-le-bol ! | t=regionale | Uffa, che noia! = Pff, quel ennui !
`;
