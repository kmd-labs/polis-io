import { Component, OnDestroy, computed, inject, input, signal } from '@angular/core';
import { I18nService } from '../core/i18n/i18n.service';
import { formatEta, formatNumber, interpolate } from '../core/i18n/format';
import { GameService } from '../game/game.service';
import { RULES } from '../game/simulation';
import { ORACLE_FUND, ORACLE_OUTCOMES, ORACLE_QUESTIONS, ORACLE_STAKES, OracleAnswer, OracleOutcome, OracleQuestion } from '../game/oracle';

/**
 * The oracle at Delphi: choose a question and an offering, see the lots in the urn, send the envoys —
 * and watch the lot run along the urn's lots, slow down and stop on the god's answer.
 */
@Component({
  selector: 'app-oracle',
  standalone: true,
  templateUrl: './oracle.component.html',
  styleUrl: './oracle.component.scss'
})
export class OracleComponent implements OnDestroy {
  readonly i18n = inject(I18nService);
  private readonly game = inject(GameService);

  /** Called to close the letter. */
  readonly close = input.required<() => void>();

  readonly questions = ORACLE_QUESTIONS;
  readonly outcomes = ORACLE_OUTCOMES;
  readonly question = signal<OracleQuestion>('war');
  readonly level = signal(1);
  readonly phase = signal<'choose' | 'drawing' | 'result'>('choose');
  readonly answer = signal<OracleAnswer | null>(null);
  private timer = 0;

  readonly view = computed(() => {
    this.game.poleis();
    const t = this.i18n.t();
    const lang = this.i18n.lang();
    const sim = this.game.sim;
    const me = sim.poleis[this.game.player()];
    if (!me) return null;
    const treasury = sim.treasury(me);
    const stakes = ORACLE_STAKES.map((months, level) => {
      const amount = sim.oracleStake(me, level);
      return {
        level,
        name: t.oracleStakes[level],
        hint: interpolate(t.oracleStakeHint, { m: months }),
        amount: formatNumber(amount, lang),
        affordable: treasury >= amount
      };
    });
    const odds = sim.oracleOdds(me, this.level());
    let from = 0;
    const lots = ORACLE_OUTCOMES.map(o => {
      const lot = { outcome: o, name: t.oracleOutcomes[o].name, from: from * 100, width: odds[o] * 100, pct: Math.round(odds[o] * 100) };
      from += odds[o];
      return lot;
    });
    const wait = sim.oracleWait(me);
    return {
      streak: me.oracleStreak,
      streakText: me.oracleStreak > 0 ? interpolate(t.oracleStreak, { n: me.oracleStreak }) : t.oracleStreakNone,
      stakes,
      lots,
      ready: sim.oracleReady(me),
      wait: interpolate(t.oracleWait, { t: formatEta(wait, RULES.secondsPerYear, t, lang) }),
      stake: stakes[this.level()]
    };
  });

  /** Where the lot stops on the bar: the middle of the drawn outcome's lots. */
  readonly target = computed(() => {
    const a = this.answer();
    const v = this.view();
    if (!a || !v) return 50;
    const lot = v.lots.find(l => l.outcome === a.outcome)!;
    return lot.from + lot.width / 2;
  });

  readonly result = computed(() => {
    const a = this.answer();
    if (!a) return null;
    const t = this.i18n.t();
    const o = t.oracleOutcomes[a.outcome];
    return {
      outcome: a.outcome,
      name: o.name,
      verse: o.verses[a.verse % o.verses.length],
      text: interpolate(o.result, { d: formatNumber(a.payout, this.i18n.lang()), fund: t.budgetKeys[ORACLE_FUND[a.question]].name })
    };
  });

  pickQuestion(q: OracleQuestion) {
    if (this.phase() === 'choose') this.question.set(q);
  }

  pickLevel(level: number) {
    if (this.phase() === 'choose') this.level.set(level);
  }

  consult() {
    const answer = this.game.consultOracle(this.question(), this.level());
    if (!answer) return;
    this.answer.set(answer);
    this.phase.set('drawing');
    // The lot runs along the urn for a moment before the answer is read out.
    this.timer = window.setTimeout(() => this.phase.set('result'), 2600);
  }

  outcomeClass(o: OracleOutcome): string {
    return `lots__lot lots__lot--${o}`;
  }

  ngOnDestroy() {
    clearTimeout(this.timer);
  }
}
