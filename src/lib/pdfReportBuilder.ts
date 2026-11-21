// src/lib/pdfReportBuilder.ts
import {
  PDFDocument,
  StandardFonts,
  rgb,
  degrees,
  type PDFFont,
  type PDFPage,
  type RGB,
} from "pdf-lib";
import type { HabitReportPayload } from "../../convex/reports/index";

// Crisp 24x24 Lucide-inspired Flame SVG path for vector rendering
const FLAME_OUTER_PATH =
  "M12 2C9.5 6 6 8.8 6 13.5C6 17.1 8.7 20 12 20C15.3 20 18 17.1 18 13.5C18 10.6 16.4 8.2 14.8 6.5C14.6 8.1 13.6 9.1 12.5 9.1C13.3 6.8 12.9 4.2 12 2Z";
const FLAME_INNER_PATH =
  "M12 11.5C10.8 13 10 14.2 10 15.8C10 17.1 10.9 18.2 12 18.2C13.1 18.2 14 17.1 14 15.8C14 14.3 13.1 12.9 12 11.5Z";

function sanitizeForPdf(text: string): string {
  return text
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/[^\x20-\x7E]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function wrapText(
  text: string,
  font: PDFFont,
  fontSize: number,
  maxWidth: number
): string[] {
  const clean = sanitizeForPdf(text);
  if (!clean) return [];
  const words = clean.split(" ");
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    const candidate = currentLine ? `${currentLine} ${word}` : word;
    if (font.widthOfTextAtSize(candidate, fontSize) <= maxWidth) {
      currentLine = candidate;
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    }
  }
  if (currentLine) lines.push(currentLine);
  return lines;
}

function drawFlameLogo(
  page: PDFPage,
  x: number,
  topY: number,
  scale: number,
  outerColor: RGB,
  innerColor: RGB,
  opacity = 1
) {
  page.drawSvgPath(FLAME_OUTER_PATH, {
    x,
    y: topY,
    scale,
    color: outerColor,
    opacity,
  });
  page.drawSvgPath(FLAME_INNER_PATH, {
    x,
    y: topY,
    scale,
    color: innerColor,
    opacity,
  });
}

function drawComicPanel(
  page: PDFPage,
  opts: {
    x: number;
    y: number; // top Y
    width: number;
    height: number;
    fill: RGB;
    ink: RGB;
    shadowOffset?: number;
    borderWidth?: number;
  }
) {
  const offset = opts.shadowOffset ?? 3.5;
  // Hard comic ink shadow
  page.drawRectangle({
    x: opts.x + offset,
    y: opts.y - opts.height - offset,
    width: opts.width,
    height: opts.height,
    color: opts.ink,
  });
  // Main comic panel box
  page.drawRectangle({
    x: opts.x,
    y: opts.y - opts.height,
    width: opts.width,
    height: opts.height,
    color: opts.fill,
    borderColor: opts.ink,
    borderWidth: opts.borderWidth ?? 1.5,
  });
}

export async function buildAndDownloadHabitReportPdf(
  report: HabitReportPayload
): Promise<string> {
  const pdfDoc = await PDFDocument.create();
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontItalic = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

  const PAGE_W = 595.28; // A4 width
  const PAGE_H = 841.89; // A4 height
  const MARGIN = 40;
  const CONTENT_W = PAGE_W - MARGIN * 2;

  const palette = {
    pageBg: rgb(0.99, 0.985, 0.965), // Warm slam-book paper tint
    ink: rgb(0.11, 0.12, 0.18), // Comic book ink outline
    indigo: rgb(0.32, 0.28, 0.92),
    amber: rgb(0.96, 0.62, 0.08),
    amberDeep: rgb(0.84, 0.45, 0.04),
    flameCore: rgb(1, 0.92, 0.55),
    muted: rgb(0.36, 0.4, 0.48),
    white: rgb(1, 1, 1),
    // Slam-book pastel sticky notes
    stickyYellow: rgb(1.0, 0.97, 0.78),
    stickyMint: rgb(0.86, 0.98, 0.91),
    stickySky: rgb(0.88, 0.95, 1.0),
    stickyCoral: rgb(1.0, 0.9, 0.92),
    tape: rgb(0.93, 0.9, 0.8),
    emerald: rgb(0.08, 0.66, 0.44),
    rose: rgb(0.86, 0.22, 0.35),
  };

  const initPageDecorations = (targetPage: PDFPage) => {
    // 1. Warm comic/slam-book page background
    targetPage.drawRectangle({
      x: 0,
      y: 0,
      width: PAGE_W,
      height: PAGE_H,
      color: palette.pageBg,
    });

    // Subtle outer comic page frame
    targetPage.drawRectangle({
      x: 18,
      y: 18,
      width: PAGE_W - 36,
      height: PAGE_H - 36,
      borderColor: palette.ink,
      borderWidth: 1,
      opacity: 0.18,
    });

    // 2. Large Center Watermark (Flame Logo + HABIT PULSE)
    drawFlameLogo(
      targetPage,
      PAGE_W / 2 - 115,
      PAGE_H / 2 + 125,
      9.5,
      palette.amber,
      palette.indigo,
      0.055
    );
    targetPage.drawText("HABIT PULSE", {
      x: PAGE_W / 2 - 135,
      y: PAGE_H / 2 - 75,
      size: 42,
      font: fontBold,
      color: palette.ink,
      opacity: 0.045,
      rotate: degrees(18),
    });
  };

  let page: PDFPage = pdfDoc.addPage([PAGE_W, PAGE_H]);
  initPageDecorations(page);
  let cursorY = PAGE_H - MARGIN;

  const ensureSpace = (neededHeight: number) => {
    if (cursorY - neededHeight < MARGIN + 34) {
      page = pdfDoc.addPage([PAGE_W, PAGE_H]);
      initPageDecorations(page);
      cursorY = PAGE_H - MARGIN;
    }
  };

  // --- 1. Comic Hero Header Banner with Flame Emblem ---
  const bannerH = 88;
  drawComicPanel(page, {
    x: MARGIN,
    y: cursorY,
    width: CONTENT_W,
    height: bannerH,
    fill: palette.indigo,
    ink: palette.ink,
    shadowOffset: 4.5,
    borderWidth: 2,
  });

  // Circular Flame Emblem Badge
  const emblemCenterX = MARGIN + 38;
  const emblemCenterY = cursorY - bannerH / 2;
  page.drawCircle({
    x: emblemCenterX,
    y: emblemCenterY,
    size: 22,
    color: palette.white,
    borderColor: palette.ink,
    borderWidth: 1.5,
  });
  drawFlameLogo(
    page,
    emblemCenterX - 14.5,
    emblemCenterY + 13.5,
    1.22,
    palette.amber,
    palette.rose,
    1
  );

  // Brand Title & Period Subtitle
  page.drawText("HABIT PULSE", {
    x: MARGIN + 72,
    y: cursorY - 26,
    size: 11,
    font: fontBold,
    color: palette.flameCore,
  });

  page.drawText(sanitizeForPdf(report.stats.periodLabel), {
    x: MARGIN + 72,
    y: cursorY - 48,
    size: 17.5,
    font: fontBold,
    color: palette.white,
  });

  const metaLine = sanitizeForPdf(
    `Player: ${report.stats.userName}   |   ${report.stats.startDate} to ${report.stats.endDate}`
  );
  page.drawText(metaLine, {
    x: MARGIN + 72,
    y: cursorY - 68,
    size: 9.5,
    font: fontRegular,
    color: rgb(0.9, 0.92, 1),
  });

  // Tilted Comic Stamp Pill on Top-Right of Banner
  const stampW = 104;
  const stampH = 22;
  const stampX = MARGIN + CONTENT_W - stampW - 14;
  const stampY = cursorY - 12;
  page.drawRectangle({
    x: stampX,
    y: stampY - stampH,
    width: stampW,
    height: stampH,
    color: palette.amber,
    borderColor: palette.ink,
    borderWidth: 1.4,
  });
  page.drawText("STREAK DOSSIER", {
    x: stampX + 10,
    y: stampY - 15,
    size: 8.5,
    font: fontBold,
    color: palette.ink,
  });

  cursorY -= bannerH + 22;

  // --- 2. Slam-Book Sticky Note KPI Cards ---
  const stickyNotes = [
    {
      label: "CONSISTENCY",
      value: `${report.stats.overallCompletionRate}%`,
      sub: `${report.stats.totalCompletions}/${report.stats.totalPossible} logged`,
      bg: palette.stickyYellow,
    },
    {
      label: "ACTIVE QUESTS",
      value: `${report.stats.activeHabitsCount}`,
      sub: `${report.stats.totalDays}-day sprint`,
      bg: palette.stickyMint,
    },
    {
      label: "POWER DAY",
      value: sanitizeForPdf(report.stats.bestDayOfWeek),
      sub: "Peak check-ins",
      bg: palette.stickySky,
    },
    {
      label: "BOSS DAY",
      value: sanitizeForPdf(report.stats.weakestDayOfWeek),
      sub: "Needs shield",
      bg: palette.stickyCoral,
    },
  ];

  const gap = 11;
  const noteW = (CONTENT_W - gap * 3) / 4;
  const noteH = 66;

  stickyNotes.forEach((note, idx) => {
    const x = MARGIN + idx * (noteW + gap);
    drawComicPanel(page, {
      x,
      y: cursorY,
      width: noteW,
      height: noteH,
      fill: note.bg,
      ink: palette.ink,
      shadowOffset: 3,
      borderWidth: 1.3,
    });

    // Slam-book top adhesive tape strip
    page.drawRectangle({
      x: x + noteW / 2 - 16,
      y: cursorY - 4,
      width: 32,
      height: 8,
      color: palette.tape,
      borderColor: palette.ink,
      borderWidth: 0.7,
    });

    page.drawText(note.label, {
      x: x + 9,
      y: cursorY - 21,
      size: 7.5,
      font: fontBold,
      color: palette.muted,
    });

    page.drawText(note.value, {
      x: x + 9,
      y: cursorY - 40,
      size: 13.5,
      font: fontBold,
      color: palette.ink,
    });

    page.drawText(note.sub, {
      x: x + 9,
      y: cursorY - 55,
      size: 8,
      font: fontItalic,
      color: palette.muted,
    });
  });

  cursorY -= noteH + 22;

  // --- 3. Pulse Coach AI Summary Comic Speech Panel ---
  const summaryLines = wrapText(
    report.coaching.executiveSummary,
    fontRegular,
    10,
    CONTENT_W - 26
  );
  const diagnosisLines = wrapText(
    `Streak Radar: ${report.coaching.streakDiagnosis}`,
    fontBold,
    9.2,
    CONTENT_W - 26
  );
  const summaryBoxH =
    38 + summaryLines.length * 14 + diagnosisLines.length * 13 + 12;

  ensureSpace(summaryBoxH + 8);
  drawComicPanel(page, {
    x: MARGIN,
    y: cursorY,
    width: CONTENT_W,
    height: summaryBoxH,
    fill: palette.white,
    ink: palette.ink,
    shadowOffset: 3.5,
    borderWidth: 1.5,
  });

  // Comic Header Tag
  page.drawRectangle({
    x: MARGIN + 12,
    y: cursorY - 22,
    width: 158,
    height: 16,
    color: palette.stickyYellow,
    borderColor: palette.ink,
    borderWidth: 1,
  });
  page.drawText("PULSE COACH AI BRIEFING", {
    x: MARGIN + 18,
    y: cursorY - 17,
    size: 8.2,
    font: fontBold,
    color: palette.ink,
  });

  let textY = cursorY - 38;
  for (const line of summaryLines) {
    page.drawText(line, {
      x: MARGIN + 13,
      y: textY,
      size: 10,
      font: fontRegular,
      color: palette.ink,
    });
    textY -= 14;
  }

  textY -= 4;
  for (const line of diagnosisLines) {
    page.drawText(line, {
      x: MARGIN + 13,
      y: textY,
      size: 9.2,
      font: fontBold,
      color: palette.indigo,
    });
    textY -= 13;
  }

  cursorY -= summaryBoxH + 22;

  // --- 4. Habit-by-Habit Quest Cards ---
  ensureSpace(34);
  page.drawText("HABIT QUEST SCORECARD & COACHING", {
    x: MARGIN,
    y: cursorY - 12,
    size: 11,
    font: fontBold,
    color: palette.ink,
  });
  cursorY -= 24;

  const insightMap = new Map(
    report.coaching.habitInsights.map((i) => [
      i.habitTitle.toLowerCase().trim(),
      i,
    ])
  );

  for (const habit of report.stats.habits) {
    const insight = insightMap.get(habit.title.toLowerCase().trim());
    const adviceLines = insight
      ? wrapText(insight.advice, fontRegular, 9, CONTENT_W - 26)
      : [];
    const rowH = 50 + (adviceLines.length > 0 ? adviceLines.length * 12 + 6 : 0);

    ensureSpace(rowH + 10);

    drawComicPanel(page, {
      x: MARGIN,
      y: cursorY,
      width: CONTENT_W,
      height: rowH,
      fill: palette.white,
      ink: palette.ink,
      shadowOffset: 3,
      borderWidth: 1.3,
    });

    // Comic Rank Sticker Badge
    const rankLabel =
      habit.completionRate >= 75
        ? "ON FIRE"
        : habit.completionRate >= 45
          ? "LEVELING UP"
          : "NEEDS BOOST";
    const rankBg =
      habit.completionRate >= 75
        ? palette.stickyMint
        : habit.completionRate >= 45
          ? palette.stickyYellow
          : palette.stickyCoral;

    const badgeW = fontBold.widthOfTextAtSize(rankLabel, 7.5) + 12;
    page.drawRectangle({
      x: MARGIN + 12,
      y: cursorY - 21,
      width: badgeW,
      height: 14,
      color: rankBg,
      borderColor: palette.ink,
      borderWidth: 0.9,
    });
    page.drawText(rankLabel, {
      x: MARGIN + 18,
      y: cursorY - 16.5,
      size: 7.5,
      font: fontBold,
      color: palette.ink,
    });

    const titleText = sanitizeForPdf(`${habit.title}  •  ${habit.category}`);
    page.drawText(titleText, {
      x: MARGIN + 12 + badgeW + 8,
      y: cursorY - 17.5,
      size: 10.5,
      font: fontBold,
      color: palette.ink,
    });

    const rightStat = `${habit.completedDays}/${habit.scheduledDays}d (${habit.completionRate}%)  |  Best: ${habit.longestStreak}d`;
    const statW = fontBold.widthOfTextAtSize(rightStat, 8.5);
    page.drawText(rightStat, {
      x: MARGIN + CONTENT_W - 12 - statW,
      y: cursorY - 17.5,
      size: 8.5,
      font: fontBold,
      color: palette.muted,
    });

    // XP-style Bordered Progress Bar
    const barX = MARGIN + 12;
    const barY = cursorY - 34;
    const barW = CONTENT_W - 24;
    const barH = 7;
    page.drawRectangle({
      x: barX,
      y: barY,
      width: barW,
      height: barH,
      color: rgb(0.93, 0.94, 0.97),
      borderColor: palette.ink,
      borderWidth: 0.8,
    });

    const fillColor =
      habit.completionRate >= 75
        ? palette.emerald
        : habit.completionRate >= 45
          ? palette.amber
          : palette.rose;
    if (habit.completionRate > 0) {
      page.drawRectangle({
        x: barX + 0.8,
        y: barY + 0.8,
        width: Math.max(3, ((barW - 1.6) * habit.completionRate) / 100),
        height: barH - 1.6,
        color: fillColor,
      });
    }

    let adviceY = cursorY - 49;
    for (const line of adviceLines) {
      page.drawText(line, {
        x: MARGIN + 13,
        y: adviceY,
        size: 9,
        font: fontRegular,
        color: palette.muted,
      });
      adviceY -= 12;
    }

    cursorY -= rowH + 10;
  }

  cursorY -= 8;

  // --- 5. Slam-Book Action Plan Note ---
  if (report.coaching.actionPlan.length > 0) {
    const wrappedSteps = report.coaching.actionPlan.map((step, idx) =>
      wrapText(`#${idx + 1}  ${step}`, fontRegular, 9.5, CONTENT_W - 28)
    );
    const totalLines = wrappedSteps.reduce((acc, l) => acc + l.length, 0);
    const planH = 38 + totalLines * 13 + wrappedSteps.length * 4;

    ensureSpace(planH + 8);
    drawComicPanel(page, {
      x: MARGIN,
      y: cursorY,
      width: CONTENT_W,
      height: planH,
      fill: palette.stickyYellow,
      ink: palette.ink,
      shadowOffset: 3.5,
      borderWidth: 1.5,
    });

    page.drawText("NEXT-SPRINT STREAK POWER-UPS", {
      x: MARGIN + 13,
      y: cursorY - 20,
      size: 9.5,
      font: fontBold,
      color: palette.ink,
    });

    let planY = cursorY - 37;
    for (const stepLines of wrappedSteps) {
      for (const line of stepLines) {
        page.drawText(line, {
          x: MARGIN + 13,
          y: planY,
          size: 9.5,
          font: fontRegular,
          color: palette.ink,
        });
        planY -= 13;
      }
      planY -= 4;
    }
  }

  // --- Branded Footer with Mini Flame Logo on Every Page ---
  const totalPages = pdfDoc.getPageCount();
  const timestampStr = new Date(report.generatedAt).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  pdfDoc.getPages().forEach((p, idx) => {
    drawFlameLogo(
      p,
      MARGIN - 2,
      36,
      0.62,
      palette.amber,
      palette.rose,
      0.95
    );
    p.drawText(
      `Habit Pulse  •  Pulse Coach AI Edition  •  ${timestampStr}`,
      {
        x: MARGIN + 16,
        y: 25,
        size: 8.2,
        font: fontBold,
        color: palette.muted,
      }
    );

    const pageStr = `Page ${idx + 1} of ${totalPages}`;
    const pageStrW = fontBold.widthOfTextAtSize(pageStr, 8.2);
    p.drawText(pageStr, {
      x: MARGIN + CONTENT_W - pageStrW,
      y: 25,
      size: 8.2,
      font: fontBold,
      color: palette.muted,
    });
  });

  // Trigger Browser Download
  const pdfBytes = await pdfDoc.save();
  const blob = new Blob([new Uint8Array(pdfBytes)], {
    type: "application/pdf",
  });
  const url = URL.createObjectURL(blob);
  const fileName = `Habit-Pulse-${report.stats.period === "week" ? "Weekly" : "Monthly"}-Report-${report.stats.endDate}.pdf`;

  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 5000);

  return fileName;
}