import { DilemmaId, WorldNoteId } from '../../game/data/dilemmas';

export interface DilemmaText {
  title: string;
  text: string;
  options: Record<string, string>;
}

export const DILEMMAS_EN: Record<DilemmaId, DilemmaText> = {
  lawgiver: {
    title: 'Shaking off the burdens',
    text: 'In Athens the archon Solon has struck the mortgage stones from the fields and freed every citizen sold into slavery for debt. Now our own poor gather in the agora and ask for the same, while the landowners warn that the city will be ruined.',
    options: {
      cancel: 'Cancel the debts, free the debt-slaves',
      code: 'Write down the laws — and change nothing else',
      creditors: 'Uphold the creditors: a debt is a debt'
    }
  },
  sacredWar: {
    title: 'The Sacred War against Kirrha',
    text: 'Kirrha, the port below Delphi, taxes and robs the pilgrims who come to Apollo. The Amphictyonic League has declared a holy war and calls every Greek city to send help to the god.',
    options: {
      hoplites: 'Send our hoplites to fight for Apollo',
      silver: 'Send silver to the Amphictyons',
      refuse: 'Kirrha is not our quarrel'
    }
  },
  eclipse: {
    title: 'The sun goes dark',
    text: 'At midday the sun has vanished from the sky, just as Thales of Miletus foretold — on the Halys, they say, the Lydians and Medes threw down their arms. Here the people wail in the streets and the priests demand sacrifices.',
    options: {
      sacrifice: 'Offer a great sacrifice to calm the gods',
      thales: 'Let the philosophers of Miletus explain it'
    }
  },
  pythia: {
    title: 'The Pythian Games',
    text: 'With Kirrha razed, the Amphictyons have founded new games at Delphi in honour of Apollo, the slayer of the Python: contests in song to the kithara, flute-playing and races. Every city is invited.',
    options: {
      choir: 'Send our finest singers and kithara players',
      athletes: 'Send runners and wrestlers',
      stay: 'Stay at home'
    }
  },
  festival: {
    title: 'A festival for the patron god',
    text: 'Athens has made her Panathenaia great: every four years a procession, contests and amphorae of sacred oil for the victors. Our priests propose a festival as splendid for our own patron god.',
    options: {
      grand: 'A great festival, every four years',
      modest: 'A modest yearly procession'
    }
  },
  tyrant: {
    title: 'A bodyguard of club-bearers',
    text: 'A noble beloved of the hill-folk drives his bleeding mules into the agora: his enemies, he says, tried to murder him. He asks the assembly for a bodyguard of club-bearers — just as Peisistratos did in Athens before he seized the Acropolis.',
    options: {
      grant: 'Give him his bodyguard',
      refuse: 'Refuse — and watch him closely'
    }
  },
  croesus: {
    title: 'The gold of Croesus',
    text: 'Envoys of Croesus, king of Lydia and the richest man alive, have come with gold and fine gifts. The king honours the gods of the Greeks and seeks friends among their cities — friends who will not stand in his way in Ionia.',
    options: {
      accept: 'Take the gold and the friendship',
      gifts: 'Accept the gifts, promise nothing',
      decline: 'Send them home with thanks'
    }
  },
  sardis: {
    title: 'Ionia in flames',
    text: 'Sardis has fallen to Cyrus the Persian and Croesus is his prisoner. The Ionian cities will be next; ships full of refugees — weavers, potters, scholars and their families — crowd into our harbour.',
    options: {
      welcome: 'Open the gates to all of them',
      craftsmen: 'Take in the craftsmen, pay for their workshops',
      turn: 'Turn the ships away'
    }
  },
  pythagoras: {
    title: 'The sage from Samos',
    text: 'Pythagoras of Samos, who left his island to escape the tyrant Polycrates, asks leave to found a brotherhood among us: men who study number and harmony, eat no beans and hold their goods in common.',
    options: {
      host: 'Welcome the philosopher and his school',
      refuse: 'We want no secret brotherhoods'
    }
  },
  polycrates: {
    title: 'The pirate king of Samos',
    text: 'Polycrates of Samos rules the Aegean with a hundred pentekonters and a thousand archers. "A friend is more grateful when his goods are returned than if they had never been taken," he says — and takes them.',
    options: {
      tribute: 'Pay him to spare our ships',
      warships: 'Build warships of our own',
      endure: 'Endure it and hope for better days'
    }
  },
  isonomia: {
    title: 'Equal laws for all',
    text: 'Cleisthenes has given Athens ten new tribes and equal laws for every citizen, rich or poor. Our own demos now demands isonomia: a voice in the assembly for every free man.',
    options: {
      grant: 'Grant the people their equal laws',
      refuse: 'Keep power with the best families'
    }
  },
  ionianRevolt: {
    title: 'Aristagoras asks for ships',
    text: 'Aristagoras of Miletus has come with a bronze map of the whole world. The Ionians have risen against the Great King; he begs the cities of the mainland for ships to set their kinsmen free.',
    options: {
      ships: 'Send twenty ships to Ionia',
      refuse: 'Persia is too far, and too strong'
    }
  },
  earthAndWater: {
    title: 'Earth and water',
    text: 'Heralds of Darius, King of Kings, stand in our agora. They ask only for a little earth and water — the token by which a city submits to the Great King.',
    options: {
      refuse: 'Throw them down a well: there is earth and water',
      submit: 'Give them earth and water'
    }
  },
  xerxes: {
    title: 'The Mede is coming',
    text: 'Xerxes marches with the army of all Asia; they say his host drinks rivers dry. The Greeks who will not submit are meeting at the Isthmus to swear an alliance against the Mede.',
    options: {
      swear: 'Swear the oath and send our men',
      neutral: 'Stay neutral and wait',
      medize: 'Side with the Great King'
    }
  },
  oracle: {
    title: 'The answer of the Pythia',
    text: 'Our envoys have returned from Delphi. Seated on her tripod above the chasm, the Pythia spoke of "wooden walls" and "a land of horses by the sea" — her answer as dark as ever. How shall we read it?',
    options: {
      colony: 'Apollo wants a new colony',
      war: 'The god promises victory',
      silence: 'Dedicate a tripod and wait for a clearer sign'
    }
  },
  drought: {
    title: 'The rains have failed',
    text: 'No rain since the spring: the barley withers in the fields and the springs run thin. Merchants offer grain from Egypt and the Black Sea — at a price.',
    options: {
      grain: 'Buy grain from abroad',
      ration: 'Ration what we have'
    }
  },
  plague: {
    title: 'Fever in the lower town',
    text: 'A fever spreads through the crowded lower town. Some say the city is polluted by an old crime, as Athens was before Epimenides of Crete came to purify it.',
    options: {
      physicians: 'Hire physicians from Kos and Croton',
      purify: 'Call a seer to purify the city',
      pray: 'Pray to Apollo the Healer'
    }
  },
  feud: {
    title: 'Blood feud',
    text: 'Two great families are at war over a broken marriage contract; their armed retainers fight in the streets. One of them, it is whispered, is under an old curse for killing suppliants at an altar.',
    options: {
      nobles: 'Side with the older house',
      demos: 'Let the assembly judge them both',
      exile: 'Exile both families'
    }
  },
  poet: {
    title: 'A poet at the gate',
    text: 'A lyric poet has arrived from Lesbos — a pupil of Alcaeus, or so he says — and seeks a patron. He sings of wine, love and the deeds of great men, and will make our city famous if we feed him well.',
    options: {
      patron: 'Become his patron',
      decline: 'We have no silver for songs'
    }
  },
  silverVein: {
    title: 'A vein of silver',
    text: 'Miners digging in the hills have struck a rich vein of silver-bearing lead. The work in the shafts is cruel. Who shall go down?',
    options: {
      slaves: 'Buy slaves to work the shafts',
      citizens: 'Lease the shafts to citizens'
    }
  },
  coinage: {
    title: 'Coins of our own',
    text: 'The Lydians stamp lumps of electrum, the Aeginetans silver "turtles". Our merchants ask the city to strike its own coins: trade, they say, will flow like water.',
    options: {
      mint: 'Strike our own silver coins',
      barter: 'Spits and ingots served our fathers'
    }
  },
  exiles: {
    title: 'Suppliants at the altar',
    text: 'Nobles exiled from a neighbouring city sit as suppliants at our altar with olive branches in their hands. To give them up would anger the gods; to keep them will anger their city.',
    options: {
      shelter: 'Shelter them: the gods protect suppliants',
      refuse: 'Hand them back'
    }
  },
  omen: {
    title: 'Bad omens',
    text: 'On the eve of battle the seers have opened the victims: the livers are spotted and the lobe is missing. The men are uneasy.',
    options: {
      sacrifice: 'Sacrifice again until the signs are good',
      march: 'March anyway: the best omen is to fight for one’s country'
    }
  },
  ransom: {
    title: 'Prisoners for ransom',
    text: 'The enemy has sent a herald: our citizens taken in battle can come home for two minae a head. Their wives and mothers wait at the council house.',
    options: {
      pay: 'Pay the ransom',
      refuse: 'Pay nothing: they should have fought harder'
    }
  },
  victor: {
    title: 'A victor comes home',
    text: 'One of our citizens has won the stadion race at a great festival. He drives home in a four-horse chariot through a breach in the walls — a city with such men needs no walls.',
    options: {
      statue: 'A bronze statue and free meals for life',
      wreath: 'An olive wreath is honour enough'
    }
  },
  stoneTemple: {
    title: 'A temple of stone',
    text: 'Lightning has struck the old temple of mud brick and timber. Builders propose to raise it again in stone, with Doric columns and a painted frieze, as the Corinthians have done.',
    options: {
      stone: 'Build it in stone',
      timber: 'Rebuild it as it was'
    }
  },
  pirates: {
    title: 'Pirates in the straits',
    text: 'Pirates from the small islands prey on our merchantmen: three ships and their crews lost this month alone.',
    options: {
      escort: 'Pay for escorts',
      endure: 'Trade will find its way'
    }
  },
  phalanx: {
    title: 'Farmers in bronze',
    text: 'The middling farmers ask to stand in the phalanx beside the nobles, in bronze armour bought at their own cost — and with a voice in the assembly to match.',
    options: {
      arm: 'Arm them and drill them',
      refuse: 'War is for the well-born'
    }
  },
  serfs: {
    title: 'Unrest in the fields',
    text: 'The serfs who work our estates are restless; there is talk of a rising, as among the helots of Messenia. The young men of the city ask leave to hunt the ringleaders by night.',
    options: {
      concede: 'Ease their burden',
      crush: 'Let the young men loose'
    }
  }
};

export const WORLD_NOTES_EN: Record<WorldNoteId, string> = {
  massalia: 'Phocaean colonists found Massalia far to the west, at the mouth of the Rhône',
  solon: 'Solon, archon of Athens, cancels the debts and frees the debt-slaves',
  sacredWar: 'The Amphictyons declare a sacred war on Kirrha for robbing Apollo’s pilgrims',
  halys: 'An eclipse foretold by Thales ends the battle of the Halys between Lydians and Medes',
  pythian: 'The Pythian Games are founded at Delphi',
  isthmian: 'The Isthmian Games become a festival of all the Greeks',
  nemean: 'The Nemean Games are founded in honour of Zeus',
  naucratis: 'Pharaoh Amasis grants Naucratis on the Nile to the Greek merchants',
  panathenaia: 'Athens celebrates the first Great Panathenaia',
  peisistratos: 'Peisistratos seizes the Acropolis and makes himself tyrant of Athens',
  croesus: 'Croesus becomes king of Lydia and showers Delphi with gold',
  cyrus: 'Cyrus the Persian overthrows the king of the Medes',
  sardis: 'Sardis falls to Cyrus; the Ionian cities submit to Persia',
  alalia: 'The Phocaeans fight Etruscans and Carthaginians off Alalia in Corsica',
  polycrates: 'Polycrates makes himself tyrant of Samos and lord of the sea',
  croton: 'Pythagoras founds his brotherhood at Croton in Italy',
  egypt: 'Cambyses the Persian conquers Egypt',
  cleomenes: 'Cleomenes becomes king of Sparta',
  hipparchus: 'Harmodius and Aristogeiton slay Hipparchus at the Panathenaia',
  tyrantsFall: 'With Spartan help the Athenians drive out the tyrant Hippias',
  cleisthenes: 'Cleisthenes gives Athens equal laws and ten new tribes',
  ionia: 'The Ionian cities rise against the Great King',
  miletus: 'The Persians sack Miletus; the Ionian revolt is over',
  marathon: 'The Athenians and Plataeans rout the Persians at Marathon',
  salamis: 'Leonidas falls at Thermopylae; the Greek fleet wins at Salamis',
  plataea: 'The Persians are defeated at Plataea and Mycale; Greece is free'
};
