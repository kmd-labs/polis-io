import { DilemmaId, WorldNoteId } from '../../game/data/dilemmas';
import { DilemmaText } from './dilemmas.en';

export const DILEMMAS_PL: Record<DilemmaId, DilemmaText> = {
  lawgiver: {
    title: 'Strząśnięcie ciężarów',
    text: 'W Atenach archont Solon kazał wyrwać z pól kamienie hipoteczne i uwolnił każdego obywatela sprzedanego w niewolę za długi. Teraz nasi biedni gromadzą się na agorze i żądają tego samego, a właściciele ziemscy ostrzegają, że miasto czeka ruina.',
    options: {
      cancel: 'Umorzyć długi, uwolnić niewolników za długi',
      code: 'Spisać prawa — i nic poza tym nie zmieniać',
      creditors: 'Stanąć po stronie wierzycieli: dług to dług'
    }
  },
  sacredWar: {
    title: 'Święta wojna z Kirrą',
    text: 'Kirra, port pod Delfami, łupi i obkłada myto pielgrzymów idących do Apollina. Związek Amfiktionów ogłosił świętą wojnę i wzywa każde greckie miasto, by przyszło bogu z pomocą.',
    options: {
      hoplites: 'Wysłać hoplitów, by walczyli za Apollina',
      silver: 'Wysłać Amfiktionom srebro',
      refuse: 'Kirra to nie nasza sprawa'
    }
  },
  eclipse: {
    title: 'Słońce gaśnie',
    text: 'W samo południe słońce zniknęło z nieba, dokładnie tak, jak przepowiedział Tales z Miletu — nad Halysem, powiadają, Lidyjczycy i Medowie rzucili broń. U nas lud zawodzi na ulicach, a kapłani żądają ofiar.',
    options: {
      sacrifice: 'Złożyć wielką ofiarę, by przebłagać bogów',
      thales: 'Niech filozofowie z Miletu to wyjaśnią'
    }
  },
  pythia: {
    title: 'Igrzyska Pytyjskie',
    text: 'Po zburzeniu Kirry Amfiktionowie ustanowili w Delfach nowe igrzyska na cześć Apollina, pogromcy Pytona: zawody w śpiewie przy kitarze, grze na aulosie i biegach. Zaproszone jest każde miasto.',
    options: {
      choir: 'Posłać najlepszych śpiewaków i kitarzystów',
      athletes: 'Posłać biegaczy i zapaśników',
      stay: 'Zostać w domu'
    }
  },
  festival: {
    title: 'Święto boga opiekuna',
    text: 'Ateny uczyniły swoje Panatenaje Wielkimi: co cztery lata procesja, zawody i amfory świętej oliwy dla zwycięzców. Nasi kapłani proponują równie wspaniałe święto dla naszego boga opiekuna.',
    options: {
      grand: 'Wielkie święto, co cztery lata',
      modest: 'Skromna coroczna procesja'
    }
  },
  tyrant: {
    title: 'Straż z pałkami',
    text: 'Szlachcic ukochany przez lud z gór wjeżdża na agorę zakrwawionymi mułami: wrogowie, mówi, chcieli go zamordować. Prosi zgromadzenie o straż przyboczną uzbrojoną w pałki — tak jak Pizystrat w Atenach, zanim zajął Akropol.',
    options: {
      grant: 'Dać mu straż',
      refuse: 'Odmówić — i mieć go na oku'
    }
  },
  croesus: {
    title: 'Złoto Krezusa',
    text: 'Posłowie Krezusa, króla Lidii i najbogatszego z żyjących, przybyli ze złotem i kosztownymi darami. Król czci bogów Greków i szuka przyjaciół wśród ich miast — przyjaciół, którzy nie staną mu na drodze w Jonii.',
    options: {
      accept: 'Przyjąć złoto i przyjaźń',
      gifts: 'Przyjąć dary, niczego nie obiecywać',
      decline: 'Odesłać ich z podziękowaniem'
    }
  },
  sardis: {
    title: 'Jonia w ogniu',
    text: 'Sardes padło przed Cyrusem Persem, a Krezus jest jego jeńcem. Następne będą miasta Jonii; statki pełne uchodźców — tkaczy, garncarzy, uczonych i ich rodzin — tłoczą się w naszym porcie.',
    options: {
      welcome: 'Otworzyć bramy dla wszystkich',
      craftsmen: 'Przyjąć rzemieślników, opłacić ich warsztaty',
      turn: 'Zawrócić statki'
    }
  },
  pythagoras: {
    title: 'Mędrzec z Samos',
    text: 'Pitagoras z Samos, który opuścił wyspę, uciekając przed tyranem Polikratesem, prosi o zgodę na założenie u nas bractwa: ludzi badających liczbę i harmonię, niejedzących bobu i dzielących majątek.',
    options: {
      host: 'Przyjąć filozofa i jego szkołę',
      refuse: 'Nie chcemy tajnych bractw'
    }
  },
  polycrates: {
    title: 'Król piratów z Samos',
    text: 'Polikrates z Samos rządzi Egejem setką pentekontor i tysiącem łuczników. „Przyjaciel jest wdzięczniejszy, gdy zwróci mu się dobra, niż gdyby nigdy ich nie zabrano” — mówi. I zabiera.',
    options: {
      tribute: 'Zapłacić mu, by oszczędzał nasze statki',
      warships: 'Zbudować własne okręty wojenne',
      endure: 'Przetrwać i czekać na lepsze czasy'
    }
  },
  isonomia: {
    title: 'Równe prawa dla wszystkich',
    text: 'Klejstenes dał Atenom dziesięć nowych fyli i równe prawa dla każdego obywatela, bogatego czy biednego. Nasz demos żąda teraz isonomii: głosu w zgromadzeniu dla każdego wolnego mężczyzny.',
    options: {
      grant: 'Dać ludowi równe prawa',
      refuse: 'Władza zostaje przy najlepszych rodach'
    }
  },
  ionianRevolt: {
    title: 'Arystagoras prosi o okręty',
    text: 'Arystagoras z Miletu przybył z brązową mapą całego świata. Jończycy powstali przeciw Wielkiemu Królowi; błaga miasta lądu stałego o okręty, by uwolnić pobratymców.',
    options: {
      ships: 'Wysłać do Jonii dwadzieścia okrętów',
      refuse: 'Persja jest za daleko i za silna'
    }
  },
  earthAndWater: {
    title: 'Ziemia i woda',
    text: 'Heroldowie Dariusza, Króla Królów, stoją na naszej agorze. Proszą tylko o odrobinę ziemi i wody — znak, którym miasto poddaje się Wielkiemu Królowi.',
    options: {
      refuse: 'Wrzucić ich do studni: tam jest ziemia i woda',
      submit: 'Dać im ziemię i wodę'
    }
  },
  xerxes: {
    title: 'Med nadciąga',
    text: 'Kserkses maszeruje z armią całej Azji; mówią, że jego wojsko wypija rzeki do dna. Grecy, którzy nie chcą się poddać, zbierają się na Istmie, by zaprzysiąc sojusz przeciw Medom.',
    options: {
      swear: 'Złożyć przysięgę i wysłać ludzi',
      neutral: 'Pozostać neutralnym i czekać',
      medize: 'Stanąć po stronie Wielkiego Króla'
    }
  },
  oracle: {
    title: 'Odpowiedź Pytii',
    text: 'Nasi posłowie wrócili z Delf. Siedząc na trójnogu nad rozpadliną, Pytia mówiła o „drewnianych murach” i „krainie koni nad morzem” — jej odpowiedź jak zwykle mroczna. Jak ją odczytamy?',
    options: {
      colony: 'Apollo chce nowej kolonii',
      war: 'Bóg obiecuje zwycięstwo',
      silence: 'Ofiarować trójnóg i czekać na jaśniejszy znak'
    }
  },
  drought: {
    title: 'Deszcze zawiodły',
    text: 'Od wiosny ani kropli deszczu: jęczmień usycha na polach, źródła słabną. Kupcy oferują zboże z Egiptu i znad Morza Czarnego — za odpowiednią cenę.',
    options: {
      grain: 'Kupić zboże za granicą',
      ration: 'Racjonować to, co mamy'
    }
  },
  plague: {
    title: 'Gorączka w dolnym mieście',
    text: 'Gorączka szerzy się w ciasnym dolnym mieście. Niektórzy mówią, że miasto skalała dawna zbrodnia, jak Ateny, zanim przybył Epimenides z Krety, by je oczyścić.',
    options: {
      physicians: 'Nająć lekarzy z Kos i Krotonu',
      purify: 'Wezwać wieszcza, by oczyścił miasto',
      pray: 'Modlić się do Apollina Uzdrowiciela'
    }
  },
  feud: {
    title: 'Krwawa waśń',
    text: 'Dwa wielkie rody walczą o zerwany kontrakt małżeński; ich uzbrojeni ludzie biją się na ulicach. O jednym z nich szepcze się, że ciąży na nim dawna klątwa za zabicie błagalników przy ołtarzu.',
    options: {
      nobles: 'Stanąć po stronie starszego rodu',
      demos: 'Niech zgromadzenie osądzi obu',
      exile: 'Wygnać oba rody'
    }
  },
  poet: {
    title: 'Poeta u bram',
    text: 'Z Lesbos przybył poeta liryczny — uczeń Alkajosa, jak twierdzi — i szuka mecenasa. Śpiewa o winie, miłości i czynach wielkich mężów, i rozsławi nasze miasto, jeśli dobrze go nakarmimy.',
    options: {
      patron: 'Zostać jego mecenasem',
      decline: 'Nie mamy srebra na pieśni'
    }
  },
  silverVein: {
    title: 'Żyła srebra',
    text: 'Górnicy kopiący w górach trafili na bogatą żyłę srebronośnego ołowiu. Praca w szybach jest okrutna. Kto zejdzie pod ziemię?',
    options: {
      slaves: 'Kupić niewolników do kopalń',
      citizens: 'Wydzierżawić szyby obywatelom'
    }
  },
  coinage: {
    title: 'Własna moneta',
    text: 'Lidyjczycy stemplują grudki elektronu, Egineci srebrne „żółwie”. Nasi kupcy proszą, by miasto biło własną monetę: handel, mówią, popłynie jak woda.',
    options: {
      mint: 'Bić własną srebrną monetę',
      barter: 'Rożny i sztabki wystarczały naszym ojcom'
    }
  },
  exiles: {
    title: 'Błagalnicy przy ołtarzu',
    text: 'Szlachcice wygnani z sąsiedniego miasta siedzą jako błagalnicy przy naszym ołtarzu, z gałązkami oliwnymi w dłoniach. Wydać ich — rozgniewać bogów; zatrzymać — rozgniewać ich miasto.',
    options: {
      shelter: 'Dać im schronienie: bogowie strzegą błagalników',
      refuse: 'Wydać ich'
    }
  },
  omen: {
    title: 'Złe znaki',
    text: 'W przeddzień bitwy wróżbici otworzyli zwierzęta ofiarne: wątroby są plamiste, brak jednego płata. Ludzie są niespokojni.',
    options: {
      sacrifice: 'Składać ofiary, aż znaki będą dobre',
      march: 'Wyruszyć mimo to: najlepszy znak to walczyć za ojczyznę'
    }
  },
  ransom: {
    title: 'Jeńcy za okup',
    text: 'Wróg przysłał herolda: nasi obywatele wzięci do niewoli mogą wrócić za dwie miny od głowy. Ich żony i matki czekają przed radą.',
    options: {
      pay: 'Zapłacić okup',
      refuse: 'Nic nie płacić: trzeba było lepiej walczyć'
    }
  },
  victor: {
    title: 'Zwycięzca wraca do domu',
    text: 'Nasz obywatel wygrał bieg na stadion na wielkich igrzyskach. Wjeżdża do miasta kwadrygą przez wyłom w murach — miasto, które ma takich mężów, nie potrzebuje murów.',
    options: {
      statue: 'Posąg z brązu i dożywotnie posiłki w prytanejonie',
      wreath: 'Wieniec oliwny to dość zaszczytu'
    }
  },
  stoneTemple: {
    title: 'Świątynia z kamienia',
    text: 'Piorun uderzył w starą świątynię z cegły mułowej i drewna. Budowniczowie proponują wznieść ją na nowo z kamienia, z doryckimi kolumnami i malowanym fryzem, jak zrobili Koryntianie.',
    options: {
      stone: 'Zbudować ją z kamienia',
      timber: 'Odbudować jak była'
    }
  },
  pirates: {
    title: 'Piraci w cieśninach',
    text: 'Piraci z małych wysp napadają na nasze statki kupieckie: tylko w tym miesiącu straciliśmy trzy statki z załogami.',
    options: {
      escort: 'Opłacić eskortę',
      endure: 'Handel znajdzie drogę'
    }
  },
  phalanx: {
    title: 'Rolnicy w brązie',
    text: 'Średniozamożni rolnicy proszą, by mogli stanąć w falandze obok szlachty, w zbrojach z brązu kupionych za własne pieniądze — i mieć za to głos w zgromadzeniu.',
    options: {
      arm: 'Uzbroić ich i wyćwiczyć',
      refuse: 'Wojna jest dla dobrze urodzonych'
    }
  },
  serfs: {
    title: 'Niepokój na polach',
    text: 'Chłopi pańszczyźniani na naszych majątkach są niespokojni; mówi się o buncie, jak wśród helotów w Mesenii. Młodzi mężczyźni z miasta proszą o pozwolenie, by nocą polowali na prowodyrów.',
    options: {
      concede: 'Ulżyć ich doli',
      crush: 'Spuścić młodych ze smyczy'
    }
  }
};

export const WORLD_NOTES_PL: Record<WorldNoteId, string> = {
  massalia: 'Koloniści z Fokai zakładają Massalię daleko na zachodzie, u ujścia Rodanu',
  solon: 'Solon, archont Aten, umarza długi i uwalnia niewolników za długi',
  sacredWar: 'Amfiktionowie wypowiadają świętą wojnę Kirrze za łupienie pielgrzymów Apollina',
  halys: 'Zaćmienie przepowiedziane przez Talesa przerywa bitwę nad Halysem między Lidyjczykami a Medami',
  pythian: 'W Delfach ustanowiono Igrzyska Pytyjskie',
  isthmian: 'Igrzyska Istmijskie stają się świętem wszystkich Greków',
  nemean: 'Ustanowiono Igrzyska Nemejskie na cześć Zeusa',
  naucratis: 'Faraon Amazis oddaje greckim kupcom Naukratis nad Nilem',
  panathenaia: 'Ateny obchodzą pierwsze Wielkie Panatenaje',
  peisistratos: 'Pizystrat zajmuje Akropol i ogłasza się tyranem Aten',
  croesus: 'Krezus zostaje królem Lidii i obsypuje Delfy złotem',
  cyrus: 'Cyrus Pers obala króla Medów',
  sardis: 'Sardes pada przed Cyrusem; miasta Jonii poddają się Persji',
  alalia: 'Fokajczycy walczą z Etruskami i Kartagińczykami pod Alalią na Korsyce',
  polycrates: 'Polikrates zostaje tyranem Samos i panem morza',
  croton: 'Pitagoras zakłada swoje bractwo w Krotonie w Italii',
  egypt: 'Kambyzes Pers podbija Egipt',
  cleomenes: 'Kleomenes zostaje królem Sparty',
  hipparchus: 'Harmodios i Arystogejton zabijają Hipparcha podczas Panatenajów',
  tyrantsFall: 'Z pomocą Sparty Ateńczycy wypędzają tyrana Hippiasza',
  cleisthenes: 'Klejstenes daje Atenom równe prawa i dziesięć nowych fyli',
  ionia: 'Miasta Jonii powstają przeciw Wielkiemu Królowi',
  miletus: 'Persowie burzą Milet; powstanie jońskie upada',
  marathon: 'Ateńczycy i Platejczycy rozbijają Persów pod Maratonem',
  salamis: 'Leonidas ginie pod Termopilami; flota grecka zwycięża pod Salaminą',
  plataea: 'Persowie pokonani pod Platejami i Mykale; Grecja jest wolna'
};
