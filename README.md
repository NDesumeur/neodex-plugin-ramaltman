# Ram Altman

Un jeu d'horreur et de survie. Tu es veilleur de nuit chez **Brockman & Fils**, une vieille boutique de radios. Ton travail : garder **la Barrette**, une barrette de mémoire de 64 Go sous verre, de minuit à 6 h.

Le problème, c'est **Ram Altman**, le patron de ClosedRAM : un robot qui porte un visage d'homme, et qui rachète toute la mémoire du monde. Ce soir, il veut la Barrette.

*English version: [README.en.md](README.en.md)*

## Commandes

- **Souris aux bords de l'écran** (ou **← →**) : regarder à gauche et à droite dans le bureau.
- **Q / D** : fermer ou ouvrir la porte gauche / droite. **A / E** : la lumière de la porte gauche / droite.
- **V** : la trappe d'aération. **Espace** : lever ou baisser la tablette des caméras (ou passer la souris sur la barre du bas).
- **1 à 8** : choisir une caméra (ou cliquer sur la carte). **C** : couper le message du téléphone. **Échap** : retour au menu.
- Tous les boutons du bureau se cliquent aussi.

## Les trois menaces

- **Ram Altman** marche de caméra en caméra jusqu'à tes portes. Dans le noir, on ne le voit pas : allume la lumière, et s'il est dans l'encadrement, ferme. S'il trouve une porte ouverte, il entre : plus rien ne répond, et il attaque dès que tu baisses la tablette.
- Parfois il fixe la caméra. Parfois, à partir de la nuit 3, tu le vois là où il n'est pas.
- **Le Revendeur** dort au quai de livraison (caméra 5). Tant que tu le regardes, il ne bouge pas. Si tu l'oublies, il court par le couloir est : porte droite ouverte, il te vole 16 Go ; porte fermée, il tape dedans et ça coûte du courant.
- **Les Puces** grattent dans la gaine de ventilation (caméra 7). Quand elles arrivent au-dessus de toi, ferme la trappe, sinon elles mangent 8 Go.

- **Le leurre audio** (touche **L**, ou le bouton au-dessus de la carte) joue un carillon dans la pièce que tu regardes. Si Ram est dans une pièce voisine, il vient voir : c'est le moyen de l'éloigner d'une porte. Sur la caméra 7, il fait reculer les Puces. Il coûte un peu de courant et doit recharger.
- **Les pannes** (à partir de la nuit 2) : Ram pirate parfois les caméras (« accès refusé »), la trappe se bloque, le courant fuit. Le moniteur du bureau dit ce qui est en panne ; on répare une chose à la fois, en 4 secondes : **R** caméras, **T** trappe, **P** courant (ou clic sur la ligne du moniteur). Mais réparer coûte du courant et fait du bruit : s'il est tout près, il l'entend et avance.
- **Gérard** (à partir de la nuit 4), le père de Léo, entre dans le bureau si tu restes trop longtemps dans les caméras, et il te parle, de plus en plus perdu. Baisse la tablette pour qu'il reparte, sinon il prend une barrette « pour Léo ».
- **Tes oreilles** : les pas de Ram sont plus forts quand il est près, à gauche ou à droite, et les micros des pièces proches les signalent sur la carte. Mais à partir de la nuit 4, il imite le carillon et ses propres pas dans une autre pièce. Écoute plutôt le silence : quand même le bruit de fond se tait, c'est qu'il est à une pièce de toi.
- **Le téléphone** sonne parfois en pleine nuit : c'est Léo. Il te dit où est Ram… et ne dit pas toujours vrai.

Tout consomme du courant : portes, lumières, trappe, caméras. À 0 %, tout s'éteint… et Ram arrive en fredonnant.

## L'histoire

En 1987, Léo Brockman et son ami Raymond Altman ont construit **MNÉMO** (Machine Numérique d'Échange de Mémoire Organique), pour copier la mémoire de Léo sur de la RAM. Pendant la copie, le courant a été coupé. Ce qui s'est passé ensuite, c'est à toi de le découvrir.

Des papiers traînent parfois sur les caméras (la carte signale « papier ») : clique dessus pour les ramasser. Et le bureau change d'une nuit à l'autre : regarde ce qui apparaît sur la table. Chaque nuit gagnée ajoute aussi un article de journal. Tout se relit dans les **Archives** du menu, avec la page **Ce que tu sais**, qui résume en phrases simples ce que tu as compris jusqu'ici. Qui trouve les 8 fragments puis tient la nuit 6 découvre la vraie fin. Deux des fragments sont des cassettes, à écouter. La nuit, le vieux répondeur de la boutique repasse parfois tout bas des messages de 1987. Et si tu as tout trouvé, la nuit 6 se termine sur un choix, avec deux fins.

## Nuits

- La nuit 1 commence par un petit tutoriel, avec des flèches (il se rejoue depuis les Réglages).

- À la fin de chaque nuit, un compte rendu : courant restant, barrettes perdues, réparations, et ton record de courant.
- 6 nuits, de plus en plus dures, chacune avec son message au téléphone (parlé et sous-titré, en français ou en anglais).
- **Nuit perso** : règle chaque menace de 0 à 20, et ajoute des défis (sans leurre, courant à 50 %, tablette lente). Un défi gagné avec chaque menace à 10 ou plus donne une médaille.
- **Nuit 7** : cachée, elle s'ouvre après la vraie fin. Cette fois, tu es Léo, et c'est le veilleur qui te cherche aux caméras.
- **Trois étoiles** : finir la nuit 5, la nuit 6, puis la nuit perso en 20 / 20 / 20.

## Données et synchronisation

La nuit atteinte, les étoiles, les documents trouvés et les réglages de la nuit perso sont enregistrés par NeoDex, sauvegardés et synchronisés entre tes PC si la synchro est activée.

## À savoir

Des sauts au visage, des cris et des bruits soudains. Dans les **Réglages** : volume des bruits et des voix, son coupé, langue (français ou anglais, par défaut celle de NeoDex), vitesse du regard, et sauts au visage atténués (pas de cri ni d'hallucinations).

Tous les personnages sont inventés : les noms font sourire, l'histoire beaucoup moins. Tout est dessiné au pinceau du canvas (aucune image) et les bruits sont fabriqués en direct.

Les voix sont faites avec [Piper](https://github.com/rhasspy/piper) et ces voix libres : *fr_FR-mls-medium* (données [MLS](http://openslr.org/94/), CC BY 4.0), *en_US-libritts_r-medium* (données [LibriTTS-R](http://www.openslr.org/141/), CC BY 4.0) et *en_US-joe-medium* (CC0).

## Installer

Dans NeoDex : **NeoStore → À découvrir → Ram Altman → Installer**.
