import { OracleTexts } from './oracle.en';

export const ORACLE_PL: OracleTexts = {
  oracleTitle: 'Wyrocznia w Delfach',
  oracleIntro:
    'Wyślij posłów z ofiarą i pytaniem; Pytia wyciąga los z urny. Bóg może dać wielokrotność ofiary — albo nic. Hojniejsze ofiary i skarbce wzniesione w Delfach zyskują więcej łaski. Każdemu miastu odpowiada raz w roku.',
  oracleOpen: 'Zapytaj Pytię',
  oracleWait: 'Pytia odpowie znów za {t}.',
  oracleAsk: 'Pytanie',
  oracleOffer: 'Ofiara',
  oracleQuestions: {
    war: { name: 'Wojna', ask: 'Czy nasze włócznie zwyciężą?' },
    harvest: { name: 'Plony', ask: 'Czy pola obrodzą?' },
    sea: { name: 'Morze', ask: 'Czy morze przyniesie bogactwo?' },
    colonies: { name: 'Kolonie', ask: 'Dokąd wyślemy naszych synów?' },
    festival: { name: 'Święta', ask: 'Czy bogowie uśmiechną się do naszych świąt?' }
  },
  oracleStakes: ['Skromna', 'Hojna', 'Królewska'],
  oracleStakeHint: '{m} mies. dochodu',
  oracleOdds: 'Losy w urnie',
  oracleOutcomes: {
    blessing: {
      name: 'Błogosławieństwo',
      verses: [
        '„Świetlisty Apollo otwiera przed tobą dłoń: weź, o co prosiłeś, i więcej.”',
        '„Jak laur nie więdnie nigdy, tak rozkwitnie twoja pomyślność.”',
        '„Idź, a bóg pójdzie przed tobą.”'
      ],
      result: 'Bóg daje {d} dr na fundusz: {fund}, a cała Hellada o tym słyszy: projekcja siły +1.'
    },
    favour: {
      name: 'Pomyślna',
      verses: ['„Czego szukasz, znajdziesz — jeśli nie będziesz zwlekał.”', '„Przypływ unosi okręt, który jest gotów.”', '„Proś, a Apollo da.”'],
      result: 'Bóg daje {d} dr na fundusz: {fund}.'
    },
    riddle: {
      name: 'Zagadka',
      verses: [
        '„Jeśli wyruszysz na wojnę, upadnie wielkie królestwo.” — Ale czyje?',
        '„Zaufaj drewnianym murom.” — Posłowie spierają się przez całą drogę do domu.',
        '„Poznaj samego siebie.” — Nic więcej.'
      ],
      result: 'Połowa ofiary wraca jako życzliwość kapłanów: {d} dr na fundusz: {fund}.'
    },
    ill: {
      name: 'Zła wróżba',
      verses: ['„Nieszczęśni, czemu tu siedzicie? Uciekajcie na krańce ziemi!”', '„Bóg odwrócił od was oblicze.”', '„Nic ponad miarę — nawet nadziei.”'],
      result: 'Ofiara przepada, a lud jest niespokojny: zadowolenie −6.'
    }
  },
  oracleConsult: 'Wyślij posłów · {d} dr',
  oracleDrawing: 'Pytia zasiada na trójnogu i wyciąga los…',
  oracleAgain: 'Bóg przemówił.',
  oracleClose: 'Wracamy do domu',
  oracleCannot: 'Nasze oszczędności nie wystarczą na tę ofiarę.',
  evOracle: '{a} pyta Pytię: {w}'
};
