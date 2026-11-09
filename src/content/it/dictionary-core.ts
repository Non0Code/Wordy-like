// Mots grammaticaux et vocabulaire de base très fréquent (voir dsl.ts pour le format).
export const CORE = String.raw`
# ——— Articles ———
il | art | A1 | le, la (article défini) | g=m f=lo,la,i,gli,le,l' | Il ragazzo e la ragazza. = Le garçon et la fille. | « il » devant consonne, « lo » devant s+consonne, z, gn, ps ; « l' » devant voyelle. Pluriel : i / gli / le.
un | art | A1 | un, une | f=uno,una,un' | Ho un fratello e una sorella. = J'ai un frère et une sœur. | « uno » devant s+consonne ou z (uno studente), « un' » devant un nom féminin commençant par une voyelle.
# ——— Prépositions ———
di | prep | A1 | de ; que (comparaison) {più,meno} | f=del,dello,della,dei,degli,delle,dell' | Sono di Roma. = Je suis de Rome. // È più alto di me. = Il est plus grand que moi. | Se contracte avec l'article : del, della, dei...
a | prep | A1 | à ; chez {casa} | f=al,allo,alla,ai,agli,alle,all',ad | Vado a Milano. = Je vais à Milan. | Devant une voyelle, on écrit parfois « ad ». Contractions : al, alla, ai...
da | prep | A1 | de (provenance) {vengo,arrivo,torno,parte} ; chez {me,medico,dottore,mamma} ; depuis {anni,mesi,tempo,quando} ; à faire (qch à faire) {fare,vedere,mangiare} | f=dal,dallo,dalla,dai,dagli,dalle,dall' | Studio l'italiano da due anni. = J'étudie l'italien depuis deux ans. // Vado da Marco. = Je vais chez Marco. | Préposition très polyvalente : provenance, « chez » une personne, durée (« depuis »).
in | prep | A1 | en, dans ; à (pays, régions) {italia,francia,città,centro} | f=nel,nello,nella,nei,negli,nelle,nell' | Vivo in Italia. = Je vis en Italie. // Il libro è nella borsa. = Le livre est dans le sac.
su | prep | A1 | sur ; au sujet de {libro,film,articolo} | f=sul,sullo,sulla,sui,sugli,sulle,sull' | Il gatto è sul divano. = Le chat est sur le canapé.
con | prep | A1 | avec | f=col,coi | Esco con gli amici. = Je sors avec les amis.
per | prep | A1 | pour ; par {strada,favore,caso} ; pendant {ore,anni,giorni} | | Questo è per te. = C'est pour toi. // Ho studiato per tre ore. = J'ai étudié pendant trois heures.
tra | prep | A2 | entre ; dans (futur) {minuti,ore,giorni,settimana,anno} | f=fra | Arrivo tra cinque minuti. = J'arrive dans cinq minutes. | « tra » et « fra » sont interchangeables. Pour le futur, « tra dieci minuti » = dans dix minutes.
senza | prep | A2 | sans | | Un caffè senza zucchero. = Un café sans sucre.
# ——— Pronoms ———
io | pron | A1 | je, moi | | Io sono Marco. = Je suis Marco. | Le pronom sujet est souvent omis : « sono Marco » suffit. On l'exprime pour insister.
tu | pron | A1 | tu, toi | | E tu, come ti chiami? = Et toi, comment tu t'appelles ?
lui | pron | A1 | il, lui | | Lui è mio fratello. = Lui, c'est mon frère.
lei | pron | A1 | elle ; vous (politesse) {signore,signora,scusi,può} | f=Lei | Lei è molto gentile. = Elle est très gentille / Vous êtes très aimable. | « Lei » (souvent avec majuscule) est la forme de politesse : on vouvoie avec la 3e personne du singulier.
noi | pron | A1 | nous | | Noi andiamo al mare. = Nous allons à la mer.
voi | pron | A1 | vous (pluriel) | | Voi siete pronti? = Vous êtes prêts ?
loro | pron | A1 | ils, elles, eux ; leur {il,la,i,le} | | Loro abitano a Napoli. = Ils habitent à Naples.
mi | pron | A1 | me, moi | f=me | Mi piace. = Ça me plaît. // Dimmi tutto. = Dis-moi tout.
ti | pron | A1 | te, toi | f=te | Ti amo. = Je t'aime. // Ti chiamo domani. = Je t'appelle demain.
ci | pron | A1 | nous ; y, là {è,sono,vado,andiamo,vuole,vogliono} | | C'è un problema. = Il y a un problème. // Ci vediamo domani! = On se voit demain ! | « ci » = nous (complément) ou « y / là ». « c'è / ci sono » = il y a.
si | pron | A1 | se ; on (impersonnel) {dice,può,mangia,fa} | f=sé | Come si dice? = Comment dit-on ? // Si chiama Giulia. = Elle s'appelle Giulia.
ne | pron | A2 | en | | Ne voglio due. = J'en veux deux. // Che ne so! = Qu'est-ce que j'en sais !
lo | pron | A2 | le (pronom complément) ; l' {so,vedo,conosco} | id=lo_pron | Lo so. = Je le sais. // Non lo conosco. = Je ne le connais pas.
gli | pron | A2 | lui (complément indirect) ; leur | id=gli_pron f=glielo,gliela,glieli,gliene | Gli ho detto la verità. = Je lui ai dit la vérité.
questo | pron | A1 | ce, cet, cette ; ceci, celui-ci | f=questa,questi,queste,quest' | Questo è buonissimo! = C'est délicieux ! // Questa sera esco. = Ce soir je sors.
quello | pron | A1 | ce...là ; cela, celui-là | f=quella,quelli,quelle,quel,quei,quegli,quell' | Quello che dici è vero. = Ce que tu dis est vrai.
che | conj | A1 | que ; qui {è,sono,ha} ; quel, quelle (exclamation) {bello,bella,peccato,schifo,fortuna} ; quoi, qu'est-ce que (question) {fai,cosa,succede,dici,vuoi} | | Che fai stasera? = Qu'est-ce que tu fais ce soir ? // Che bello! = Que c'est beau ! // So che hai ragione. = Je sais que tu as raison. | Mot à tout faire : conjonction (« que »), relatif (« qui/que »), interrogatif et exclamatif.
chi | pron | A1 | qui | | Chi è? = Qui est-ce ?
cosa | pron | A1 | quoi, qu'est-ce que ; chose {una,questa,ogni,tante,poche} | | Cosa vuoi? = Qu'est-ce que tu veux ? // È una cosa importante. = C'est une chose importante.
niente | pron | A1 | rien | f=nulla | Non ho capito niente. = Je n'ai rien compris. // Niente di grave. = Rien de grave.
tutto | pron | A1 | tout | f=tutta,tutti,tutte,tutt' | Va tutto bene. = Tout va bien. // Tutti i giorni. = Tous les jours.
qualcosa | pron | A2 | quelque chose | f=qualcos' | Vuoi qualcosa da bere? = Tu veux quelque chose à boire ?
qualcuno | pron | A2 | quelqu'un | f=qualcuna | C'è qualcuno? = Il y a quelqu'un ?
nessuno | pron | A2 | personne ; aucun {problema,dubbio} | f=nessuna,nessun | Non c'è nessuno. = Il n'y a personne. // Nessun problema. = Aucun problème.
mio | det | A1 | mon, ma ; le mien | f=mia,miei,mie | Mia madre è francese. = Ma mère est française. | Pas d'article devant un nom de famille au singulier : « mia madre », mais « la mia casa ».
tuo | det | A1 | ton, ta ; le tien | f=tua,tuoi,tue | Come sta tua sorella? = Comment va ta sœur ?
suo | det | A1 | son, sa ; votre (politesse) | f=sua,suoi,sue | Il suo nome è Luca. = Son prénom est Luca.
nostro | det | A1 | notre ; le nôtre | f=nostra,nostri,nostre | Questa è casa nostra. = C'est notre maison.
vostro | det | A2 | votre (pluriel) | f=vostra,vostri,vostre | È la vostra macchina? = C'est votre voiture ?
ogni | det | A2 | chaque | | Ogni giorno studio un po'. = Chaque jour j'étudie un peu.
# ——— Conjonctions ———
e | conj | A1 | et | f=ed | Pane e acqua. = Du pain et de l'eau. | « ed » devant une voyelle, surtout « e » (ed era...).
ma | conj | A1 | mais ; vraiment, enfin (insistance) {dai,come,che} | | Mi piace, ma è caro. = Ça me plaît, mais c'est cher. // Ma dai! = Pas possible ! / Allez !
o | conj | A1 | ou | f=oppure | Caffè o tè? = Café ou thé ?
se | conj | A2 | si | | Se vuoi, vengo anch'io. = Si tu veux, je viens aussi.
anche | adv | A1 | aussi ; même {se} | f=anch' | Anch'io! = Moi aussi ! // Anche se piove, esco. = Même s'il pleut, je sors.
come | adv | A1 | comment ; comme {sempre,te,lui,me} | f=com' | Come stai? = Comment vas-tu ? // Come sempre. = Comme toujours.
dove | adv | A1 | où | f=dov' | Dove abiti? = Où habites-tu ?
quando | adv | A1 | quand | | Quando parti? = Quand pars-tu ?
perché | conj | A1 | parce que ; pourquoi {?} | | Perché ridi? = Pourquoi tu ris ? // Resto a casa perché piove. = Je reste à la maison parce qu'il pleut. | Le même mot sert pour la question (« pourquoi ») et la réponse (« parce que »).
quanto | adv | A2 | combien ; que (exclamation) {è,sei,bello,tempo} | f=quanta,quanti,quante | Quanto costa? = Combien ça coûte ? // Quanti anni hai? = Quel âge as-tu ?
# ——— Adverbes ———
non | adv | A1 | ne... pas | | Non capisco. = Je ne comprends pas. | Se place devant le verbe. La double négation est normale : « non ho visto niente ».
sì | adv | A1 | oui | id=si_oui | Sì, certo! = Oui, bien sûr !
no | adv | A1 | non | | No, grazie. = Non, merci.
molto | adv | A1 | très ; beaucoup {lavoro,tempo,soldi,gente} | f=molta,molti,molte | Sono molto stanco. = Je suis très fatigué. // Ho molti amici. = J'ai beaucoup d'amis.
poco | adv | A2 | peu ; un peu {un} | f=poca,pochi,poche,po' | Parlo un po' d'italiano. = Je parle un peu italien.
bene | adv | A1 | bien | | Sto bene, grazie. = Je vais bien, merci. // Va bene! = D'accord !
male | adv | A1 | mal ; mal (douleur) {testa,pancia,gola,denti,fa} | f=mal | Ho mal di testa. = J'ai mal à la tête. // Non c'è male. = Pas mal.
sempre | adv | A1 | toujours | | Arrivi sempre in ritardo! = Tu arrives toujours en retard !
mai | adv | A2 | jamais ; déjà (question) {hai,sei,?} | | Non bevo mai caffè. = Je ne bois jamais de café. // Sei mai stato a Roma? = Es-tu déjà allé à Rome ?
già | adv | A2 | déjà ; bien sûr, c'est vrai (réponse) {@seul} | | Ho già mangiato. = J'ai déjà mangé. // Già! = Eh oui !
ancora | adv | A2 | encore ; toujours (pas) {non} | | Non ho ancora finito. = Je n'ai pas encore fini. // Ancora un caffè? = Encore un café ?
adesso | adv | A1 | maintenant | f=ora | Adesso devo andare. = Maintenant je dois y aller.
oggi | adv | A1 | aujourd'hui | | Oggi fa bel tempo. = Aujourd'hui il fait beau.
domani | adv | A1 | demain | | A domani! = À demain !
ieri | adv | A2 | hier | | Ieri sono andato al cinema. = Hier je suis allé au cinéma.
qui | adv | A1 | ici | f=qua | Vieni qui! = Viens ici !
lì | adv | A1 | là, là-bas | f=là | Il bar è lì. = Le bar est là-bas.
così | adv | A1 | ainsi, comme ça ; si, tellement {bello,bella,tanto,stanco,felice} | | Non fare così! = Ne fais pas comme ça ! // È così bello! = C'est tellement beau !
più | adv | A1 | plus ; ne... plus {non} | | Parla più piano, per favore. = Parle plus lentement, s'il te plaît. // Non fumo più. = Je ne fume plus.
troppo | adv | A2 | trop | f=troppa,troppi,troppe | È troppo caro. = C'est trop cher.
solo | adv | A1 | seulement ; seul {sono,sei,è,da} | f=sola,soli,sole,soltanto | Solo un momento. = Juste un instant. // Vivo da solo. = Je vis seul.
proprio | adv | B1 | vraiment, justement ; propre (adj.) {il,la} | f=propria,propri,proprie | È proprio vero. = C'est vraiment vrai. // Proprio ora! = Juste maintenant !
davvero | adv | A2 | vraiment | | Davvero? = Vraiment ?
subito | adv | A2 | tout de suite | s=3 | Arrivo subito! = J'arrive tout de suite !
presto | adv | A2 | tôt ; vite, bientôt {a,più} | | A presto! = À bientôt ! // Mi alzo presto. = Je me lève tôt.
tardi | adv | A2 | tard | | È tardi, andiamo. = Il est tard, allons-y.
forse | adv | A2 | peut-être | | Forse domani piove. = Peut-être qu'il pleuvra demain.
insieme | adv | A2 | ensemble | | Andiamo insieme? = On y va ensemble ?
poi | adv | A1 | puis, ensuite ; d'ailleurs, et puis (insistance) {e} | | Prima mangio, poi esco. = D'abord je mange, puis je sors.
# ——— Verbes de base ———
essere | v | A1 | être | v=irr/essere s=3 | Sono stanco. = Je suis fatigué. // Siamo italiani. = Nous sommes italiens. | Auxiliaire des verbes de mouvement et des pronominaux au passato prossimo (sono andato, mi sono svegliato).
avere | v | A1 | avoir | v=irr/avere pp=avuto | Ho fame. = J'ai faim. // Hai tempo? = Tu as le temps ? | Attention : l'âge se dit avec « avere » : « ho vent'anni ». Le « h » ne se prononce jamais.
fare | v | A1 | faire ; faire (météo) {caldo,freddo,bel,brutto} | v=irr/avere | Cosa fai? = Que fais-tu ? // Fa caldo. = Il fait chaud.
andare | v | A1 | aller | v=irr/essere | Dove vai? = Où vas-tu ? // Andiamo! = Allons-y ! | Auxiliaire « essere » : « sono andato/andata ».
venire | v | A1 | venir | v=irr/essere | Vieni con me? = Tu viens avec moi ?
stare | v | A1 | aller (santé) {bene,male,come} ; rester {casa,qui,zitto} ; être en train de {per} | v=irr/essere pp=stato | Come stai? = Comment vas-tu ? // Sto a casa stasera. = Je reste à la maison ce soir. | « stare + gérondif » = être en train de : « sto mangiando ».
dire | v | A1 | dire | v=irr/avere | Cosa hai detto? = Qu'est-ce que tu as dit ? // Come si dice in italiano? = Comment dit-on en italien ?
potere | v | A1 | pouvoir | v=irr/avere pp=potuto | Posso entrare? = Je peux entrer ?
volere | v | A1 | vouloir | v=irr/avere pp=voluto | Voglio un gelato. = Je veux une glace. // Vorrei un caffè. = Je voudrais un café. | Au conditionnel « vorrei » (je voudrais) est la forme polie pour commander.
dovere | v | A1 | devoir | v=irr/avere pp=dovuto | Devo lavorare. = Je dois travailler.
sapere | v | A1 | savoir | v=irr/avere pp=saputo | Non lo so. = Je ne sais pas. // Sai nuotare? = Tu sais nager ?
vedere | v | A1 | voir | v=ere/avere | Ci vediamo! = On se voit ! / À plus ! // Hai visto il film? = Tu as vu le film ?
parlare | v | A1 | parler | | Parli italiano? = Tu parles italien ?
capire | v | A1 | comprendre | v=isc/avere | Non capisco. = Je ne comprends pas. // Hai capito? = Tu as compris ?
sentire | v | A2 | entendre ; sentir {odore,profumo} ; écouter, dis donc {senti,@debut} | | Mi senti? = Tu m'entends ? // Senti, ti devo parlare. = Écoute, je dois te parler.
dare | v | A2 | donner | v=irr/avere pp=dato | Mi dai una mano? = Tu me donnes un coup de main ?
conoscere | v | A2 | connaître ; rencontrer (passé) {ho,abbiamo,conosciuto} | | Conosci Luca? = Tu connais Luca ? // Ci siamo conosciuti a Roma. = Nous nous sommes rencontrés à Rome.
aspettare | v | A2 | attendre | | Aspettami! = Attends-moi !
chiamare | v | A1 | appeler | | Ti chiamo stasera. = Je t'appelle ce soir.
guardare | v | A1 | regarder | | Guardo un film. = Je regarde un film.
finire | v | A2 | finir | v=isc/avere | Ho finito! = J'ai fini !
partire | v | A2 | partir | v=ire/essere | Il treno parte alle otto. = Le train part à huit heures.
arrivare | v | A1 | arriver | v=are/essere | Arrivo! = J'arrive !
tornare | v | A2 | rentrer, revenir | v=are/essere | Torno a casa. = Je rentre à la maison.
restare | v | A2 | rester | v=are/essere | Resta con me. = Reste avec moi.
lasciare | v | B1 | laisser ; quitter (relation) {ragazzo,ragazza,mi,ha,fidanzato} | | Lasciami in pace! = Laisse-moi tranquille ! // Mi ha lasciato. = Il/elle m'a quitté(e).
mettere | v | A2 | mettre | | Dove hai messo le chiavi? = Où as-tu mis les clés ?
prendere | v | A1 | prendre ; prendre (commander) {caffè,cornetto,pizza,cosa} | | Prendo un caffè. = Je prends un café. // Prendo il treno. = Je prends le train.
vivere | v | A2 | vivre | s=3 v=ere/essere | Vivo a Torino. = Je vis à Turin.
aiutare | v | A2 | aider | | Mi puoi aiutare? = Tu peux m'aider ?
succedere | v | B1 | arriver, se passer | s=3 v=ere/essere | Cosa è successo? = Qu'est-ce qui s'est passé ?
ricordare | v | B1 | se souvenir de, rappeler | f=ricordarsi | Ti ricordi di me? = Tu te souviens de moi ?
dimenticare | v | B1 | oublier | f=dimenticarsi | Ho dimenticato il telefono. = J'ai oublié mon téléphone.
scusare | v | A1 | excuser | | Mi scusi, signora. = Excusez-moi, madame.
sbagliare | v | B1 | se tromper | | Ho sbagliato strada. = Je me suis trompé de route. // Scusa, ho sbagliato. = Pardon, je me suis trompé.
entrare | v | A2 | entrer | v=are/essere | Entra pure! = Entre donc !
# ——— Noms très fréquents ———
uomo | n | A1 | homme | g=m pl=uomini | È un uomo gentile. = C'est un homme gentil.
donna | n | A1 | femme | g=f | Quella donna è mia zia. = Cette femme est ma tante.
giorno | n | A1 | jour | g=m | Buon giorno! = Bonjour ! // Tutti i giorni. = Tous les jours.
volta | n | A2 | fois | g=f | Una volta alla settimana. = Une fois par semaine. // C'era una volta... = Il était une fois...
ora | n | A1 | heure | g=f id=ora_n | Che ore sono? = Quelle heure est-il ? // Un'ora di lezione. = Une heure de cours.
vita | n | A2 | vie | g=f | È la mia vita. = C'est ma vie.
mondo | n | A2 | monde | g=m | Il mondo è piccolo! = Le monde est petit !
momento | n | A2 | moment | g=m | Un momento, per favore. = Un instant, s'il vous plaît.
storia | n | A2 | histoire | g=f s=3 | Che storia! = Quelle histoire !
parola | n | A2 | mot, parole | g=f | Non ho capito una parola. = Je n'ai pas compris un mot.
mano | n | A2 | main | g=f pl=mani | Dammi la mano. = Donne-moi la main.
occhio | n | B1 | œil ; attention ! {@seul} | g=m pl=occhi | Ha gli occhi azzurri. = Il a les yeux bleus. // Occhio! = Attention !
verità | n | B1 | vérité | g=f | Dimmi la verità. = Dis-moi la vérité.
idea | n | A2 | idée | g=f pr=/iˈdɛ.a/ | Buona idea! = Bonne idée !
posto | n | A2 | place, endroit | g=m | È un bel posto. = C'est un bel endroit. // Questo posto è libero? = Cette place est libre ?
signore | n | A1 | monsieur | g=m | Buongiorno, signore. = Bonjour, monsieur.
signora | n | A1 | madame | g=f | Grazie, signora. = Merci, madame.
mamma | n | A1 | maman ; mon Dieu ! (exclamation) {mia} | g=f | Mamma mia! = Mon Dieu ! / Oh là là !
# ——— Adjectifs fréquents ———
nuovo | adj | A1 | nouveau, neuf | | Ho un lavoro nuovo. = J'ai un nouveau travail.
vero | adj | A2 | vrai | | È vero! = C'est vrai ! // Vero? = N'est-ce pas ?
altro | adj | A2 | autre | | Un altro caffè? = Un autre café ?
primo | adj | A2 | premier | | La prima volta. = La première fois.
ultimo | adj | B1 | dernier | s=3 | L'ultimo treno. = Le dernier train.
stesso | adj | B1 | même | | Abbiamo la stessa età. = Nous avons le même âge.
certo | adj | A2 | certain ; bien sûr ! {@seul,sì} | | Certo! = Bien sûr ! // Sei certo? = Tu es sûr ?
pronto | adj | A1 | prêt ; allô (téléphone) {@seul,@debut} | | Sei pronta? = Tu es prête ? // Pronto? Chi parla? = Allô ? Qui est à l'appareil ?
sicuro | adj | A2 | sûr | | Sei sicuro? = Tu es sûr ?
importante | adj | A2 | important | | È molto importante. = C'est très important.
difficile | adj | A2 | difficile | s=3 | L'italiano non è difficile! = L'italien n'est pas difficile !
facile | adj | A2 | facile | s=3 | È facile! = C'est facile !
tanto | adj | A2 | beaucoup de, tant de ; beaucoup (adv.) {grazie,ti,voglio} | f=tanta,tanti,tante | Tanti auguri! = Joyeux anniversaire ! / Meilleurs vœux ! // Ti voglio tanto bene. = Je t'aime beaucoup.
# ——— Interjections ———
ecco | int | A2 | voici, voilà | | Ecco il tuo caffè. = Voici ton café. // Ecco! = Voilà !
oddio | int | B1 | mon Dieu ! | | Oddio, che paura! = Mon Dieu, quelle peur !
beh | int | B1 | bah, eh bien | | Beh, vediamo. = Bon, on verra.
eh | int | A2 | hein, eh | | Eh, lo so. = Eh, je sais.
ah | int | A1 | ah | | Ah, capisco! = Ah, je comprends !
oh | int | A1 | oh | | Oh, che bello! = Oh, que c'est beau !
`;
