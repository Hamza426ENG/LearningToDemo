import jsPDF from "jspdf";

interface AssessmentCategory {
  name: string;
  score: number;
  maxScore: number;
  feedback: string;
}

interface AssessmentResult {
  sessionId: string;
  overallScore: number;
  categories: AssessmentCategory[];
  strengths: string[];
  improvements: string[];
  tips: string[];
  summary: string;
}

interface SessionMeta {
  topic: string;
  mode: string;
  duration: string;
}

export function generateAssessmentPDF(
  assessment: AssessmentResult,
  meta: SessionMeta
) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 40;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  const checkPageBreak = (needed: number) => {
    if (y + needed > pageHeight - margin) {
      doc.addPage();
      y = margin;
    }
  };

  const drawDivider = () => {
    doc.setDrawColor(220, 220, 220);
    doc.setLineWidth(0.5);
    doc.line(margin, y, pageWidth - margin, y);
    y += 14;
  };

  const writeWrapped = (
    text: string,
    fontSize: number,
    style: "normal" | "bold" = "normal",
    color: [number, number, number] = [40, 40, 40],
    indent = 0
  ) => {
    doc.setFontSize(fontSize);
    doc.setFont("helvetica", style);
    doc.setTextColor(color[0], color[1], color[2]);
    const lines = doc.splitTextToSize(text, contentWidth - indent);
    const lineHeight = fontSize * 1.35;
    checkPageBreak(lines.length * lineHeight);
    lines.forEach((line: string) => {
      doc.text(line, margin + indent, y);
      y += lineHeight;
    });
  };

  // ---------- HEADER ----------
  doc.setFillColor(37, 99, 235); // blue-600
  doc.rect(0, 0, pageWidth, 80, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text("DemoCoach", margin, 38);
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text("Practice Session Assessment Report", margin, 58);
  // Date on the right
  doc.setFontSize(9);
  const dateStr = new Date().toLocaleString();
  const dateWidth = doc.getTextWidth(dateStr);
  doc.text(dateStr, pageWidth - margin - dateWidth, 58);

  y = 110;

  // ---------- SESSION INFO ----------
  doc.setTextColor(60, 60, 60);
  writeWrapped("Session Details", 14, "bold", [30, 30, 30]);
  y += 4;
  writeWrapped(`Topic: ${meta.topic}`, 11, "normal");
  writeWrapped(`Mode: ${meta.mode}`, 11, "normal");
  writeWrapped(`Duration: ${meta.duration}`, 11, "normal");
  y += 8;
  drawDivider();

  // ---------- OVERALL SCORE ----------
  checkPageBreak(120);
  const score = assessment.overallScore;
  let scoreColor: [number, number, number] = [220, 53, 69]; // red
  let grade = "D";
  let label = "Needs Work";
  if (score >= 90) {
    scoreColor = [34, 197, 94];
    grade = "A+";
    label = "Excellent";
  } else if (score >= 80) {
    scoreColor = [34, 197, 94];
    grade = "A";
    label = "Great";
  } else if (score >= 70) {
    scoreColor = [59, 130, 246];
    grade = "B";
    label = "Good";
  } else if (score >= 60) {
    scoreColor = [234, 179, 8];
    grade = "C";
    label = "Fair";
  }

  // Score box
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(margin, y, contentWidth, 100, 6, 6, "F");

  doc.setFontSize(48);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(scoreColor[0], scoreColor[1], scoreColor[2]);
  doc.text(`${score}`, margin + 30, y + 60);

  doc.setFontSize(11);
  doc.setTextColor(100, 100, 100);
  doc.setFont("helvetica", "normal");
  doc.text("Overall Score", margin + 30, y + 78);

  // Grade
  doc.setFontSize(36);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(scoreColor[0], scoreColor[1], scoreColor[2]);
  doc.text(grade, margin + 150, y + 55);

  doc.setFontSize(11);
  doc.setTextColor(100, 100, 100);
  doc.setFont("helvetica", "normal");
  doc.text(label, margin + 150, y + 75);

  // Summary on the right of score
  doc.setFontSize(10);
  doc.setTextColor(60, 60, 60);
  const summaryLines = doc.splitTextToSize(
    assessment.summary,
    contentWidth - 240
  );
  let sy = y + 25;
  summaryLines.slice(0, 5).forEach((line: string) => {
    doc.text(line, margin + 230, sy);
    sy += 13;
  });

  y += 120;

  // ---------- CATEGORY BREAKDOWN ----------
  checkPageBreak(40);
  writeWrapped("Detailed Breakdown", 14, "bold", [30, 30, 30]);
  y += 6;

  assessment.categories.forEach((cat) => {
    const catBoxHeight = 50 + Math.ceil(cat.feedback.length / 90) * 12;
    checkPageBreak(catBoxHeight + 10);

    const pct = (cat.score / cat.maxScore) * 100;
    let catColor: [number, number, number] = [220, 53, 69];
    if (pct >= 80) catColor = [34, 197, 94];
    else if (pct >= 60) catColor = [234, 179, 8];

    // Category name
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(40, 40, 40);
    doc.text(cat.name, margin, y);

    // Score on right
    doc.setTextColor(catColor[0], catColor[1], catColor[2]);
    const scoreText = `${cat.score}/${cat.maxScore}`;
    const sw = doc.getTextWidth(scoreText);
    doc.text(scoreText, pageWidth - margin - sw, y);
    y += 8;

    // Progress bar background
    doc.setFillColor(229, 231, 235);
    doc.roundedRect(margin, y, contentWidth, 5, 2, 2, "F");
    // Progress bar fill
    doc.setFillColor(catColor[0], catColor[1], catColor[2]);
    doc.roundedRect(margin, y, (contentWidth * pct) / 100, 5, 2, 2, "F");
    y += 14;

    // Feedback
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(90, 90, 90);
    const fbLines = doc.splitTextToSize(cat.feedback, contentWidth);
    fbLines.forEach((line: string) => {
      checkPageBreak(11);
      doc.text(line, margin, y);
      y += 11;
    });
    y += 10;
  });

  // ---------- STRENGTHS / IMPROVEMENTS / TIPS ----------
  const renderListSection = (
    title: string,
    items: string[],
    color: [number, number, number],
    bullet: string
  ) => {
    checkPageBreak(40);
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(color[0], color[1], color[2]);
    doc.text(title, margin, y);
    y += 16;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(50, 50, 50);
    items.forEach((item) => {
      const lines = doc.splitTextToSize(item, contentWidth - 20);
      checkPageBreak(lines.length * 13 + 4);
      doc.setTextColor(color[0], color[1], color[2]);
      doc.text(bullet, margin, y);
      doc.setTextColor(50, 50, 50);
      lines.forEach((line: string, i: number) => {
        doc.text(line, margin + 16, y + i * 13);
      });
      y += lines.length * 13 + 4;
    });
    y += 10;
  };

  renderListSection(
    "Strengths",
    assessment.strengths,
    [34, 197, 94],
    "+"
  );
  renderListSection(
    "Areas to Improve",
    assessment.improvements,
    [220, 53, 69],
    ">"
  );
  renderListSection(
    "Pro Tips",
    assessment.tips,
    [59, 130, 246],
    "*"
  );

  // ---------- FOOTER on every page ----------
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.setFont("helvetica", "normal");
    const footer = `DemoCoach Assessment Report  |  Session ${assessment.sessionId.slice(0, 8)}  |  Page ${i} of ${totalPages}`;
    const fw = doc.getTextWidth(footer);
    doc.text(footer, (pageWidth - fw) / 2, pageHeight - 20);
  }

  // Save the file
  const safeName = meta.topic
    .replace(/[^a-z0-9]+/gi, "-")
    .toLowerCase()
    .slice(0, 40);
  doc.save(`democoach-${safeName}-${Date.now()}.pdf`);
}
