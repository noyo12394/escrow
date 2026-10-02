"""Build the two-page Earthquake Rescue Lab quick-reference guide."""

from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    BaseDocTemplate,
    Frame,
    KeepTogether,
    ListFlowable,
    ListItem,
    PageBreak,
    PageTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
)


OUTPUT = "Earthquake_Rescue_Lab_User_Guide.pdf"
APP_URL = "https://escrow-taupe.vercel.app?_vercel_share=vad7H1etAkBMOIPBTADwcSfM1ThjMl4S"

NAVY = colors.HexColor("#14314d")
BLUE = colors.HexColor("#1877d9")
LIGHT_BLUE = colors.HexColor("#eaf3fc")
PALE_BLUE = colors.HexColor("#f1f6fc")
GRID = colors.HexColor("#c9d8e7")
PALE_GOLD = colors.HexColor("#fff8e5")
GOLD = colors.HexColor("#f5a623")
TEXT = colors.HexColor("#222222")
MUTED = colors.HexColor("#8197ad")

FONT_SETS = [
    (
        Path("/System/Library/Fonts/Supplemental/Arial.ttf"),
        Path("/System/Library/Fonts/Supplemental/Arial Bold.ttf"),
        Path("/System/Library/Fonts/Supplemental/Arial Italic.ttf"),
    ),
    (
        Path("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"),
        Path("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"),
        Path("/usr/share/fonts/truetype/dejavu/DejaVuSans-Oblique.ttf"),
    ),
]
REGULAR_FONT, BOLD_FONT, ITALIC_FONT = next(
    font_set for font_set in FONT_SETS if all(path.exists() for path in font_set)
)
pdfmetrics.registerFont(TTFont("GuideSans", str(REGULAR_FONT)))
pdfmetrics.registerFont(TTFont("GuideSans-Bold", str(BOLD_FONT)))
pdfmetrics.registerFont(TTFont("GuideSans-Italic", str(ITALIC_FONT)))
pdfmetrics.registerFontFamily(
    "GuideSans",
    normal="GuideSans",
    bold="GuideSans-Bold",
    italic="GuideSans-Italic",
    boldItalic="GuideSans-Bold",
)


class GuideDoc(BaseDocTemplate):
    def __init__(self, filename):
        super().__init__(
            filename,
            pagesize=letter,
            leftMargin=0.55 * inch,
            rightMargin=0.55 * inch,
            topMargin=0.52 * inch,
            bottomMargin=0.62 * inch,
            title="Earthquake Rescue Lab - User Guide",
            author="Earthquake Rescue Lab",
        )
        frame = Frame(
            self.leftMargin,
            self.bottomMargin,
            self.width,
            self.height,
            id="guide",
            leftPadding=0,
            rightPadding=0,
            topPadding=0,
            bottomPadding=0,
        )
        self.addPageTemplates(PageTemplate(id="guide", frames=[frame], onPage=draw_footer))


def draw_footer(canvas, doc):
    if doc.page <= 1:
        return
    canvas.saveState()
    canvas.setStrokeColor(GRID)
    canvas.setLineWidth(0.7)
    canvas.line(doc.leftMargin, 0.52 * inch, letter[0] - doc.rightMargin, 0.52 * inch)
    canvas.setFillColor(MUTED)
    canvas.setFont("GuideSans", 7.4)
    canvas.drawCentredString(letter[0] / 2, 0.34 * inch, "Earthquake Rescue Lab - User Guide")
    canvas.setFont("GuideSans", 6.7)
    canvas.drawCentredString(letter[0] / 2, 0.21 * inch, APP_URL)
    canvas.restoreState()


styles = getSampleStyleSheet()
styles.add(
    ParagraphStyle(
        name="GuideTitle",
        parent=styles["Title"],
        fontName="GuideSans-Bold",
        fontSize=18,
        leading=22,
        textColor=NAVY,
        alignment=0,
        spaceAfter=4,
    )
)
styles.add(
    ParagraphStyle(
        name="GuideSubtitle",
        parent=styles["Normal"],
        fontName="GuideSans",
        fontSize=9.4,
        leading=12,
        textColor=colors.HexColor("#40688e"),
        spaceAfter=7,
    )
)
styles.add(
    ParagraphStyle(
        name="Section",
        parent=styles["Heading2"],
        fontName="GuideSans-Bold",
        fontSize=11.2,
        leading=14,
        textColor=NAVY,
        spaceBefore=7,
        spaceAfter=3,
        borderColor=GRID,
        borderWidth=0,
        borderPadding=0,
    )
)
styles.add(
    ParagraphStyle(
        name="BodySmall",
        parent=styles["BodyText"],
        fontName="GuideSans",
        fontSize=8.7,
        leading=11.3,
        textColor=TEXT,
        spaceAfter=3,
    )
)
styles.add(
    ParagraphStyle(
        name="BodyTiny",
        parent=styles["BodyText"],
        fontName="GuideSans",
        fontSize=8.25,
        leading=10.6,
        textColor=TEXT,
        spaceAfter=2,
    )
)
styles.add(
    ParagraphStyle(
        name="Callout",
        parent=styles["BodyText"],
        fontName="GuideSans",
        fontSize=8.3,
        leading=10.8,
        textColor=TEXT,
    )
)
styles.add(
    ParagraphStyle(
        name="MiniHeading",
        parent=styles["BodyText"],
        fontName="GuideSans-Bold",
        fontSize=8.7,
        leading=11,
        textColor=colors.HexColor("#264f76"),
        spaceBefore=3,
        spaceAfter=2,
    )
)
styles.add(
    ParagraphStyle(
        name="TableHeader",
        parent=styles["BodyText"],
        fontName="GuideSans-Bold",
        fontSize=8.2,
        leading=10,
        textColor=colors.white,
    )
)
styles.add(
    ParagraphStyle(
        name="TableCell",
        parent=styles["BodyText"],
        fontName="GuideSans",
        fontSize=8.1,
        leading=10,
        textColor=TEXT,
    )
)


def section(title):
    return KeepTogether(
        [
            Paragraph(title, styles["Section"]),
            Table([[""]], colWidths=[7.3 * inch], rowHeights=[0.012 * inch], style=[("BACKGROUND", (0, 0), (-1, -1), GRID)]),
        ]
    )


def numbered(items, level=0):
    return ListFlowable(
        [ListItem(Paragraph(item, styles["BodySmall"]), leftIndent=0) for item in items],
        bulletType="1",
        start="1",
        leftIndent=15 + level,
        bulletFontName="GuideSans",
        bulletFontSize=8.5,
        bulletColor=TEXT,
        spaceAfter=2,
    )


def bullets(items):
    return ListFlowable(
        [ListItem(Paragraph(item, styles["BodySmall"]), leftIndent=0) for item in items],
        bulletType="bullet",
        bulletChar="bullet",
        leftIndent=15,
        bulletFontName="GuideSans",
        bulletFontSize=7,
        bulletColor=TEXT,
        spaceAfter=2,
    )


def table(data, widths, header=True):
    rows = []
    for row_index, row in enumerate(data):
        style = styles["TableHeader"] if header and row_index == 0 else styles["TableCell"]
        rows.append([Paragraph(cell, style) for cell in row])
    result = Table(rows, colWidths=widths, hAlign="LEFT", repeatRows=1 if header else 0)
    commands = [
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ("LINEBELOW", (0, 0), (-1, -1), 0.55, GRID),
    ]
    if header:
        commands.append(("BACKGROUND", (0, 0), (-1, 0), NAVY))
    first_body = 1 if header else 0
    for row_index in range(first_body, len(rows)):
        if (row_index - first_body) % 2 == 0:
            commands.append(("BACKGROUND", (0, row_index), (-1, row_index), PALE_BLUE))
    result.setStyle(TableStyle(commands))
    return result


def callout(text, background=PALE_GOLD, accent=GOLD):
    return Table(
        [[Paragraph(text, styles["Callout"])]],
        colWidths=[7.3 * inch],
        style=TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), background),
                ("BOX", (0, 0), (-1, -1), 0, background),
                ("LINEBEFORE", (0, 0), (0, -1), 3, accent),
                ("LEFTPADDING", (0, 0), (-1, -1), 10),
                ("RIGHTPADDING", (0, 0), (-1, -1), 7),
                ("TOPPADDING", (0, 0), (-1, -1), 6),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
            ]
        ),
    )


def build_story():
    story = [
        Paragraph("Earthquake Rescue Lab", styles["GuideTitle"]),
        Paragraph("User Guide - Quick Reference", styles["GuideSubtitle"]),
        Table([[""]], colWidths=[7.3 * inch], rowHeights=[0.03 * inch], style=[("BACKGROUND", (0, 0), (-1, -1), NAVY)]),
        Spacer(1, 7),
        callout(f'<b><font color="#1877d9">Open the App:</font></b> {APP_URL}', LIGHT_BLUE, BLUE),
        section("1. Getting Started"),
        numbered(
            [
                "Open the link above in a desktop browser (Chrome, Edge, or Firefox recommended).",
                "Enter your name in the sign-in field and click <b>Enter the Basement</b>.",
                "You are placed inside a 3D earthquake-damaged basement. Your mission: investigate every station, answer survival questions, then rank 12 survival actions.",
            ]
        ),
        callout("<b>Returning?</b> Your name is remembered automatically. Click <b>Re-enter the Basement</b> to continue."),
        section("2. Navigating the Scene"),
        table(
            [
                ["Action", "How"],
                ["Orbit / rotate camera", "Click and drag with the mouse"],
                ["Zoom in / out", "Scroll wheel"],
                ["Scan a station", "Hover over a glowing marker - its name appears at the top"],
                ["Investigate a station", "Click the glowing marker"],
            ],
            [2.55 * inch, 4.75 * inch],
        ),
        section("3. Investigating Stations"),
        Paragraph("There are <b>11 glowing markers</b> floating in the basement, one per station:", styles["BodySmall"]),
        table(
            [
                ["1. Utility Panel", "7. Refrigerator / Food Station"],
                ["2. First-Aid Station", "8. Purification Supplies"],
                ["3. Radio Desk", "9. Overhead Pipes"],
                ["4. Water Station", "10. Blocked Stairwell"],
                ["5. Signal Board", "11. Candle Shelf"],
                ["6. Planning Table", ""],
            ],
            [3.65 * inch, 3.65 * inch],
            header=False,
        ),
        Paragraph(
            "<b>When you click a marker:</b> a popup opens with a survival question (3 choices). Select your answer, read the expert explanation, and the station is checked off on your <b>Mission Checklist</b>.",
            styles["BodySmall"],
        ),
        section("4. Mission Checklist &amp; Rescue Readiness"),
        bullets(
            [
                "The <b>Mission Checklist</b> tracks which stations you have visited.",
                "The <b>Rescue Readiness</b> bar reflects your progress: <b>50%</b> from stations, <b>35%</b> from correct answers, and a <b>15%</b> ranking bonus.",
                "Goal: reach <b>100%</b> by investigating all stations, answering correctly, and submitting.",
            ]
        ),
        section("5. Ranking Board"),
        numbered(
            [
                "Click <b>Ranking Board</b> in the top toolbar.",
                "Drag the 12 action cards (or use the arrow buttons) to rank them from <b>1 (most helpful)</b> to <b>12 (most dangerous)</b>.",
                "Use <b>Shuffle</b> if you want a fresh order.",
                "When satisfied, click <b>Submit &amp; Score</b>.",
            ]
        ),
        Paragraph("Scoring", styles["MiniHeading"]),
        PageBreak(),
        Paragraph(
            "For each action: <b>|Your Rank - Expert Rank|</b>. All 12 differences are summed. <b>Lower is better</b> - a perfect match scores 0.",
            styles["BodySmall"],
        ),
        table(
            [
                ["Total Score", "Rating"],
                ["0 - 8", "Elite Rescue Coordinator"],
                ["9 - 20", "Strong Survivor"],
                ["21 - 34", "Capable but Risky"],
                ["35 - 48", "In Danger"],
                ["49+", "Critical Mistakes"],
            ],
            [2.55 * inch, 4.75 * inch],
        ),
        Paragraph("After Submission", styles["MiniHeading"]),
        bullets(
            [
                "A <b>Rescue Readiness Report</b> shows your score, rating, and a side-by-side rank comparison.",
                "Click <b>Download Report</b> to save a text summary. Click <b>Adjust Ranking</b> to revise and resubmit.",
            ]
        ),
        section("6. Expert Key"),
        bullets(
            [
                "The Expert Key is <b>locked</b> until you submit your ranking.",
                "Once unlocked, click <b>Expert Key</b> to see the official expert ranking (1-12) with the rescue specialists' reasoning.",
                "<i>Instructors:</i> enter the instructor passcode in the Expert Key panel to unlock it early.",
            ]
        ),
        section("7. Toolbar Reference"),
        table(
            [
                ["Button", "What It Does"],
                ["<b>Ranking Board</b>", "Open or return to the ranking interface"],
                ["<b>Expert Key</b>", "View the official expert ranking after it is unlocked"],
                ["<b>Help</b>", "Open the mission briefing, controls, and scoring rules"],
                ["<b>Sound</b>", "Toggle ambient audio and interface sounds"],
                ["<b>Enable Alerts</b>", "Turn on browser notifications for drill reminders"],
                ["<b>Reset</b>", "Clear all progress and start over"],
            ],
            [2.05 * inch, 5.25 * inch],
        ),
        section("8. Tips for Success"),
        numbered(
            [
                "<b>Investigate all 11 stations first</b> - the clues help you rank accurately.",
                "<b>Read the expert feedback</b> after each question; it explains the ranking logic.",
                "After submitting, study the <b>difference column</b> to see where you diverged from experts.",
                "Use <b>Adjust Ranking</b> to try again - you can resubmit as many times as you like.",
            ]
        ),
        callout(
            "<b>Alerts:</b> Click <b>Enable Alerts</b> to receive drill reminders even after you close the tab. Your browser will ask for notification permission."
        ),
    ]
    return story


if __name__ == "__main__":
    GuideDoc(OUTPUT).build(build_story())
