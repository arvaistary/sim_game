import Phaser from "phaser";
import {
  DEFAULT_SAVE,
  HOUSING_LEVELS,
  CAREER_JOBS,
  FINANCE_EMERGENCY_EVENTS,
  GLOBAL_PROGRESS_EVENTS,
  formatMoney,
  loadSave,
  persistSave,
  advanceGameTime,
  applyMonthlyFinanceSettlement,
  applyStatChanges,
  applySkillChanges,
  clone,
  queuePendingEvent,
  shiftHousingLevel,
} from "./game-state";
import { COLORS, textStyle } from "./ui-kit";

const DEV = {
  overlay: 0x1a1410,
  panel: 0x2a2420,
  card: 0x3a3430,
  accent: 0xe8b4a0,
  green: 0x4EBF7A,
  red: 0xD14D4D,
  blue: 0x6d9dc5,
  yellow: 0xE8B94A,
  text: 0xf0e8df,
  dim: 0xa09888,
  border: 0x5a5248,
};

function ds(size, color = DEV.text, weight = "500") {
  return {
    fontFamily: "Inter, Poppins, Arial, sans-serif",
    fontSize: size + "px",
    color: "#" + color.toString(16).padStart(6, "0"),
    fontStyle: weight === "700" ? "bold" : "normal",
    fontWeight: weight,
  };
}

const PANEL_MAX_WIDTH = 480;
const BTN_H = 32;
const BTN_GAP = 8;
const SECTION_GAP = 12;

class DebugPanelScene extends Phaser.Scene {
  constructor() {
    super("DebugPanelScene");
    this.isOpen = false;
  }

  create() {
    this.saveData = this.registry.get("saveData") ?? loadSave();
    this.cameras.main.setBackgroundColor(0x000000);
    this.root = this.add.container(0, 0);
    this.overlay = this.add.rectangle(0, 0, 10, 10, DEV.overlay, 0.72).setOrigin(0);
    this.root.add(this.overlay);
    this.panelFrame = this.add.graphics();
    this.root.add(this.panelFrame);
    this.closeHint = this.add.text(0, 0, "[ ` / F2 ] закрыть", ds(13, DEV.dim));
    this.root.add(this.closeHint);
    this.contentGroup = this.add.container(0, 0);
    this.root.add(this.contentGroup);
    this.scrollMask = this.add.graphics().setVisible(false);
    this.contentGroup.setMask(this.scrollMask.createGeometryMask());
    this.ss = { y: 0, ch: 0, vh: 0, drag: false, lastY: 0 };
    this.input.on("pointerdown", (p) => this.onDown(p));
    this.input.on("pointerup", () => { this.ss.drag = false; });
    this.input.on("gameout", () => { this.ss.drag = false; });
    this.input.on("pointermove", (p) => this.onMove(p));
    this.input.on("wheel", (_p, _o, _dx, dy) => this.onWheel(dy));
    this.input.keyboard.on("keydown-BACKTICK", () => this.toggle());
    this.input.keyboard.on("keydown-F2", () => this.toggle());
    this.root.setVisible(false).setAlpha(0);
    this.handleResize(this.scale.gameSize);
  }

  toggle() { this.isOpen ? this.hide() : this.show(); }

  show() {
    this.saveData = this.registry.get("saveData") ?? loadSave();
    this.isOpen = true;
    this.root.setVisible(true).setAlpha(0);
    this.scene.bringToTop();
    this.rebuild();
    this.handleResize(this.scale.gameSize);
    this.tweens.add({ targets: this.root, alpha: 1, duration: 180, ease: "Quad.easeOut" });
  }

  hide() {
    this.isOpen = false;
    this.tweens.add({
      targets: this.root,
      alpha: 0,
      duration: 140,
      ease: "Quad.easeIn",
      onComplete: () => this.root.setVisible(false),
    });
  }

  clampScroll() {
    const s = this.ss;
    const min = Math.min(0, s.vh - s.ch);
    s.y = Phaser.Math.Clamp(s.y, min, 0);
    this.contentGroup.setPosition(this.px + 16, this.cy + s.y);
  }

  onDown(p) {
    const s = this.ss;
    if (p.x < this.px || p.x > this.px + this.pw) return;
    if (p.y < this.cy || p.y > this.cy + s.vh) return;
    if (s.ch <= s.vh) return;
    s.drag = true;
    s.lastY = p.y;
  }

  onMove(p) {
    const s = this.ss;
    if (!s.drag || !p.isDown || s.ch <= s.vh) return;
    s.y += p.y - s.lastY;
    s.lastY = p.y;
    this.clampScroll();
  }

  onWheel(dy) {
    if (this.ss.ch <= this.ss.vh) return;
    this.ss.y -= dy * 0.5;
    this.clampScroll();
  }

  handleResize(gs) {
    const w = gs.width;
    const h = gs.height;
    this.pw = Math.min(PANEL_MAX_WIDTH, w - 24);
    this.ph = h - 24;
    this.px = (w - this.pw) / 2;
    this.py = 12;
    this.cy = this.py + 56;
    this.overlay.setSize(w, h).setPosition(0, 0);
    this.panelFrame.clear();
    this.panelFrame.fillStyle(DEV.panel, 0.98);
    this.panelFrame.fillRoundedRect(this.px, this.py, this.pw, this.ph, 20);
    this.panelFrame.lineStyle(2, DEV.border, 0.6);
    this.panelFrame.strokeRoundedRect(this.px, this.py, this.pw, this.ph, 20);
    this.closeHint.setPosition(this.px + this.pw - 150, this.py + 18);
    this.ss.vh = this.ph - 68;
    this.scrollMask.clear();
    this.scrollMask.fillStyle(0xffffff, 1);
    this.scrollMask.fillRect(this.px, this.cy, this.pw, this.ss.vh);
    this.clampScroll();
  }

  rebuild() {
    this.contentGroup.removeAll(true);
    this.ss.y = 0;
    let y = 0;
    const sd = this.saveData;
    const hdr = this.add.text(0, y, "DEV PANEL", ds(20, DEV.accent, "700"));
    this.contentGroup.add(hdr);
    y += 32;

    y = this.sec(y, "STATE");
    y = this.info(y, [
      "День " + sd.gameDays + " • Неделя " + sd.gameWeeks + " • Месяц " + sd.gameMonths,
      "Возраст " + sd.currentAge + " • Деньги " + formatMoney(sd.money) + " ₽ • Резерв " + formatMoney(sd.finance.reserveFund) + " ₽",
      "Жильё: " + sd.housing.name + " (ур." + sd.housing.level + ") • Комфорт " + sd.housing.comfort + "%",
      "Работа: " + sd.currentJob.name + " • " + formatMoney(sd.currentJob.salaryPerDay) + " ₽/д",
      "Очередь событий: " + sd.pendingEvents.length + " • История: " + sd.eventHistory.length,
      "Голод " + sd.stats.hunger + " • Энергия " + sd.stats.energy + " • Стресс " + sd.stats.stress,
      "Настроение " + sd.stats.mood + " • Здоровье " + sd.stats.health + " • Форма " + sd.stats.physical,
    ]);
    y += SECTION_GAP;

    y = this.sec(y, "TIME");
    y = this.row(y, [
      { l: "+1д", a: () => this.aTime(1) },
      { l: "+7д", a: () => this.aTime(7) },
      { l: "+30д", a: () => this.aTime(30) },
    ]);
    y = this.row(y, [
      { l: "+100д", a: () => this.aTime(100) },
      { l: "+360д (год)", a: () => this.aTime(360) },
    ]);
    y += SECTION_GAP;

    y = this.sec(y, "MONEY");
    y = this.row(y, [
      { l: "+10k", a: () => this.aMoney(10000) },
      { l: "+50k", a: () => this.aMoney(50000) },
      { l: "+100k", a: () => this.aMoney(100000) },
    ]);
    y = this.row(y, [
      { l: "-10k", a: () => this.aMoney(-10000) },
      { l: "-50k", a: () => this.aMoney(-50000) },
      { l: "= 0", a: () => this.aSetMoney(0), c: DEV.red },
    ]);
    y = this.row(y, [
      { l: "Резерв +20k", a: () => this.aReserve(20000) },
      { l: "Резерв = 0", a: () => this.aSetReserve(0), c: DEV.red },
    ]);
    y += SECTION_GAP;

    y = this.sec(y, "STATS");
    y = this.row(y, [
      { l: "Все MAX", a: () => this.aAllStats(100), c: DEV.green },
      { l: "Все 50", a: () => this.aAllStats(50) },
      { l: "Все MIN", a: () => this.aAllStats(0), c: DEV.red },
    ]);
    y = this.row(y, [
      { l: "Выгорание", a: () => this.aPreset("burnout") },
      { l: "Отличная форма", a: () => this.aPreset("peak") },
    ]);
    ["hunger", "energy", "stress", "mood", "health", "physical"].forEach((k) => {
      const v = sd.stats[k];
      y = this.row(y, [
        { l: k + ": " + v, w: 140, lbl: true },
        { l: "-20", w: 56, a: () => this.aStat(k, -20) },
        { l: "+20", w: 56, a: () => this.aStat(k, 20) },
        { l: "MAX", w: 56, a: () => this.aStat(k, 100) },
      ]);
    });
    y += SECTION_GAP;

    y = this.sec(y, "HOUSING");
    y = this.row(y, [
      { l: "Ур.1", a: () => this.aHousing(1) },
      { l: "Ур.2", a: () => this.aHousing(2) },
      { l: "Ур.3", a: () => this.aHousing(3) },
    ]);
    y = this.row(y, [
      { l: "Комфорт MAX", a: () => this.aComfort(100) },
      { l: "Комфорт 50", a: () => this.aComfort(50) },
      { l: "Комфорт MIN", a: () => this.aComfort(0) },
    ]);
    y += SECTION_GAP;

    y = this.sec(y, "CAREER & SKILLS");
    CAREER_JOBS.forEach((job) => {
      const cur = sd.currentJob.id === job.id;
      y = this.row(y, [
        { l: (cur ? ">> " : "") + job.name, w: 220, lbl: true },
        { l: "Установить (" + formatMoney(job.salaryPerDay) + " ₽/д)", a: () => this.aJob(job), c: cur ? DEV.green : undefined },
      ]);
    });
    y = this.row(y, [
      { l: "Навыки MAX", a: () => this.aMaxSkills(), c: DEV.green },
      { l: "Навыки 0", a: () => this.aZeroSkills(), c: DEV.red },
    ]);
    y = this.row(y, [
      { l: "Проф. +2", a: () => this.aSkill("professionalism", 2) },
      { l: "Комм. +2", a: () => this.aSkill("communication", 2) },
      { l: "Фин.гр. +2", a: () => this.aSkill("financialLiteracy", 2) },
    ]);
    y += SECTION_GAP;

    y = this.sec(y, "EVENTS");
    const pc = sd.pendingEvents.length;
    if (pc > 0) {
      const preview = sd.pendingEvents.slice(0, 5).map((e, i) => "  " + (i + 1) + ". " + (e.title ?? e.id)).join("\n");
      y = this.info(y, ["В очереди: " + pc, preview + (pc > 5 ? "\n..." : "")]);
    } else {
      y = this.info(y, ["Очередь пуста"]);
    }
    y = this.row(y, [
      { l: "Очистить очередь", a: () => this.aClearEvents(), c: DEV.red },
      { l: "Запустить след.", a: () => this.aTriggerNext() },
    ]);
    y = this.row(y, [
      { l: "Emergency: reserve", a: () => this.aQueueEmer("finance_reserve_warning") },
      { l: "Emergency: cash_gap", a: () => this.aQueueEmer("finance_cash_gap") },
    ]);
    y = this.row(y, [
      { l: "Weekly event", a: () => this.aQueueProg("weekly") },
      { l: "Age-30 event", a: () => this.aQueueProg("age_30") },
    ]);
    y += SECTION_GAP;

    y = this.sec(y, "MONTHLY FINANCE");
    const ls = sd.finance?.lastMonthlySettlement;
    if (ls) {
      y = this.info(y, [
        "Последнее списание (мес." + ls.month + "):",
        "  Всего: " + formatMoney(ls.totalCharged) + "  Резерв: " + formatMoney(ls.reservePaid) + "  Дефицит: " + formatMoney(ls.shortage),
      ]);
    } else {
      y = this.info(y, ["Списание ещё не происходило."]);
    }
    const me = sd.finance?.monthlyExpenses ?? {};
    y = this.info(y, ["Расходы: " + Object.entries(me).map(([k, v]) => k + ":" + formatMoney(v)).join("  ")]);
    y = this.row(y, [
      { l: "Принудительное списание", a: () => this.aForceMonthly(), c: DEV.yellow },
    ]);
    y += SECTION_GAP;

    y = this.sec(y, "SAVE");
    y = this.row(y, [
      { l: "Сбросить сохранение", a: () => this.aReset(), c: DEV.red },
      { l: "Копировать JSON", a: () => this.aExport() },
    ]);
    y = this.row(y, [
      { l: "Обновить панель", a: () => this.rebuild() },
    ]);
    y += 24;

    this.ss.ch = y;
    this.clampScroll();
  }

  sec(y, title) {
    const bg = this.add.graphics();
    bg.fillStyle(DEV.card, 0.5);
    bg.fillRoundedRect(0, y - 4, 440, 24, 8);
    const t = this.add.text(8, y, title, ds(14, DEV.accent, "700"));
    this.contentGroup.add([bg, t]);
    return y + 30;
  }

  info(y, lines) {
    lines.forEach((line) => {
      const t = this.add.text(0, y, line, ds(13, DEV.dim));
      this.contentGroup.add(t);
      y += 18;
    });
    return y;
  }

  row(y, buttons) {
    let ox = 0;
    const dw = 130;
    buttons.forEach((b) => {
      const bw = b.w ?? dw;
      const c = this.add.container(ox, y);
      const bg = this.add.graphics();
      const fc = b.c ?? DEV.card;
      bg.fillStyle(fc, 0.7);
      bg.fillRoundedRect(0, 0, bw, BTN_H, 8);
      if (!b.lbl) {
        bg.lineStyle(1, DEV.border, 0.5);
        bg.strokeRoundedRect(0, 0, bw, BTN_H, 8);
      }
      const lbl = this.add.text(bw / 2, BTN_H / 2, b.l, ds(12, DEV.text, b.lbl ? "600" : "500")).setOrigin(0.5);
      if (b.a) {
        const hit = this.add.rectangle(bw / 2, BTN_H / 2, bw, BTN_H, 0, 0).setOrigin(0.5);
        hit.setInteractive({ useHandCursor: true });
        hit.on("pointerover", () => {
          bg.clear();
          bg.fillStyle(DEV.accent, 0.3);
          bg.fillRoundedRect(0, 0, bw, BTN_H, 8);
          bg.lineStyle(1, DEV.accent, 0.6);
          bg.strokeRoundedRect(0, 0, bw, BTN_H, 8);
        });
        hit.on("pointerout", () => {
          bg.clear();
          bg.fillStyle(fc, 0.7);
          bg.fillRoundedRect(0, 0, bw, BTN_H, 8);
          bg.lineStyle(1, DEV.border, 0.5);
          bg.strokeRoundedRect(0, 0, bw, BTN_H, 8);
        });
        hit.on("pointerup", () => {
          b.a();
          this.tweens.add({ targets: c, scaleX: 0.97, scaleY: 0.97, duration: 80, yoyo: true });
        });
        c.add(hit);
      }
      c.add([bg, lbl]);
      this.contentGroup.add(c);
      ox += bw + BTN_GAP;
    });
    return y + BTN_H + 6;
  }

  reload() { this.saveData = this.registry.get("saveData") ?? this.saveData; }
  save() { persistSave(this, this.saveData); this.rebuild(); this.notify(); }

  notify() {
    const keys = [
      "MainGameScene", "RecoveryScene", "HomeScene", "ShopScene",
      "SocialScene", "FunScene", "CareerScene", "FinanceScene",
      "EducationScene", "InteractiveWorkEventScene",
    ];
    keys.forEach((k) => {
      if (this.scene.isActive(k)) {
        this.scene.get(k).onExternalStateChange?.();
      }
    });
  }

  aTime(d) { this.reload(); advanceGameTime(this.saveData, d); this.save(); }
  aMoney(n) { this.reload(); this.saveData.money = Math.max(0, this.saveData.money + n); if (n > 0) this.saveData.totalEarnings += n; this.save(); }
  aSetMoney(n) { this.reload(); this.saveData.money = n; this.save(); }
  aReserve(n) { this.reload(); this.saveData.finance.reserveFund = Math.max(0, (this.saveData.finance.reserveFund ?? 0) + n); this.save(); }
  aSetReserve(n) { this.reload(); this.saveData.finance.reserveFund = n; this.save(); }
  aAllStats(v) { this.reload(); Object.keys(this.saveData.stats).forEach((k) => { this.saveData.stats[k] = Phaser.Math.Clamp(v, 0, 100); }); this.save(); }
  aStat(k, v) { this.reload(); this.saveData.stats[k] = v === 100 ? 100 : Phaser.Math.Clamp((this.saveData.stats[k] ?? 0) + v, 0, 100); this.save(); }

  aPreset(p) {
    this.reload();
    if (p === "burnout") this.saveData.stats = { hunger: 12, energy: 8, stress: 95, mood: 10, health: 30, physical: 15 };
    if (p === "peak") this.saveData.stats = { hunger: 90, energy: 95, stress: 5, mood: 95, health: 95, physical: 85 };
    this.save();
  }

  aHousing(lv) { this.reload(); const d = lv - (this.saveData.housing?.level ?? 1); if (d !== 0) shiftHousingLevel(this.saveData, d); this.save(); }
  aComfort(v) { this.reload(); this.saveData.housing.comfort = Phaser.Math.Clamp(v, 0, 100); this.save(); }

  aJob(job) {
    this.reload();
    this.saveData.currentJob = { ...this.saveData.currentJob, ...job, daysAtWork: this.saveData.currentJob.daysAtWork ?? 0 };
    this.save();
  }

  aMaxSkills() { this.reload(); Object.keys(this.saveData.skills).forEach((k) => { this.saveData.skills[k] = 10; }); this.save(); }
  aZeroSkills() { this.reload(); Object.keys(this.saveData.skills).forEach((k) => { this.saveData.skills[k] = 0; }); this.save(); }
  aSkill(k, d) { this.reload(); this.saveData.skills[k] = Phaser.Math.Clamp((this.saveData.skills[k] ?? 0) + d, 0, 10); this.save(); }
  aClearEvents() { this.reload(); this.saveData.pendingEvents = []; this.save(); }

  aTriggerNext() {
    this.hide();
    const qs = this.scene.get("EventQueueScene");
    if (qs && this.scene.isActive("EventQueueScene")) qs.requestOpen();
  }

  aQueueEmer(eid) {
    this.reload();
    const t = FINANCE_EMERGENCY_EVENTS.find((e) => e.id === eid);
    if (t) { queuePendingEvent(this.saveData, { ...clone(t), instanceId: eid + "_dbg_" + Date.now() }); this.save(); }
  }

  aQueueProg(type) {
    this.reload();
    if (type === "weekly") {
      const pool = GLOBAL_PROGRESS_EVENTS.filter((e) => e.type === "weekly");
      const ev = pool[Math.floor(Math.random() * pool.length)];
      if (ev) queuePendingEvent(this.saveData, { ...clone(ev), instanceId: ev.id + "_dbg_" + Date.now() });
    } else if (type === "age_30") {
      const ev = GLOBAL_PROGRESS_EVENTS.find((e) => e.id === "age_30_reunion");
      if (ev) queuePendingEvent(this.saveData, { ...clone(ev), instanceId: ev.id + "_dbg_" + Date.now() });
    }
    this.save();
  }

  aForceMonthly() {
    this.reload();
    applyMonthlyFinanceSettlement(this.saveData, this.saveData.gameMonths + 1);
    this.save();
  }

  aReset() { this.saveData = clone(DEFAULT_SAVE); this.save(); }

  aExport() {
    this.reload();
    navigator.clipboard.writeText(JSON.stringify(this.saveData, null, 2)).then(
      () => console.log("[DebugPanel] Save copied to clipboard"),
      () => console.log("[DebugPanel] Clipboard write failed"),
    );
  }
}

export function ensureDebugPanel(game) {
  if (!game.scene.isActive("DebugPanelScene")) {
    game.scene.start("DebugPanelScene");
  }
}

export { DebugPanelScene };
