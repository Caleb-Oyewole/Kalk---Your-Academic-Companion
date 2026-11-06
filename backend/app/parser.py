"""Extract course rows (code, title, units, score/grade) from PDF, DOCX or text results.

Result sheets vary a lot between institutions, so parsing is heuristic: every line or
table row containing a course code (e.g. CSC 301, MTH101) is treated as a course, and
the remaining tokens are interpreted as units, score and/or letter grade. Anything
ambiguous is flagged `needs_review` so the UI can ask the student to confirm.
"""
import io
import re
from dataclasses import dataclass, field
from typing import List, Optional

from .grading import GRADE_POINTS, grade_from_score

CODE_RE = re.compile(r"\b([A-Z]{2,4})\s?-?(\d{3})\b")
SESSION_RE = re.compile(r"\b(20\d{2})\s*/\s*(20\d{2}|\d{2})\b")
FIRST_RE = re.compile(r"\b(first|1st|harmattan)\b", re.I)
SECOND_RE = re.compile(r"\b(second|2nd|rain)\b", re.I)
TOKEN_RE = re.compile(r"[A-Za-z]+|\d+(?:\.\d+)?")


@dataclass
class ParsedCourse:
    code: str
    title: str = ""
    units: Optional[int] = None
    score: Optional[float] = None
    grade: Optional[str] = None
    session: str = ""
    semester: str = ""
    needs_review: bool = False
    source_file: str = ""


def extract_lines(filename: str, data: bytes) -> List[str]:
    name = filename.lower()
    if name.endswith(".pdf"):
        return _pdf_lines(data)
    if name.endswith(".docx"):
        return _docx_lines(data)
    if name.endswith((".txt", ".csv")):
        return data.decode("utf-8", errors="ignore").splitlines()
    raise ValueError(f"Unsupported file type: {filename}. Use PDF, DOCX, TXT or CSV.")


def _pdf_lines(data: bytes) -> List[str]:
    import pdfplumber

    lines: List[str] = []
    with pdfplumber.open(io.BytesIO(data)) as pdf:
        for page in pdf.pages:
            text_lines = (page.extract_text() or "").splitlines()
            # Plain text keeps reading order (session/semester headings stay in front of
            # their rows). Only fall back to table cells when the text has no course rows.
            if any(CODE_RE.search(line) for line in text_lines):
                lines.extend(text_lines)
                continue
            for table in page.extract_tables() or []:
                for row in table:
                    cells = [(c or "").replace("\n", " ").strip() for c in row]
                    lines.append(" ".join(c for c in cells if c))
            lines.extend(text_lines)
    return lines


def _docx_lines(data: bytes) -> List[str]:
    from docx import Document
    from docx.text.paragraph import Paragraph

    doc = Document(io.BytesIO(data))
    lines: List[str] = []
    # Walk the body in document order so headings stay attached to the tables under them.
    for block in doc.iter_inner_content():
        if isinstance(block, Paragraph):
            lines.append(block.text)
            continue
        for row in block.rows:
            cells = [c.text.replace("\n", " ").strip() for c in row.cells]
            lines.append(" ".join(c for c in cells if c))
    return lines


def parse_lines(lines: List[str], source_file: str = "") -> List[ParsedCourse]:
    session, semester = "", ""
    found: dict = {}

    for raw in lines:
        line = " ".join(raw.split())
        if not line:
            continue

        sm = SESSION_RE.search(line)
        if sm:
            end = sm.group(2)
            session = f"{sm.group(1)}/{end if len(end) == 4 else sm.group(1)[:2] + end}"
        if re.search(r"semester|harmattan|rain", line, re.I) and not CODE_RE.search(line):
            if FIRST_RE.search(line):
                semester = "First"
            elif SECOND_RE.search(line):
                semester = "Second"

        m = CODE_RE.search(line)
        if not m:
            continue

        course = _parse_row(line, m)
        course.session, course.semester, course.source_file = session, semester, source_file
        # Same code + term appearing twice (table and text extraction) -> keep the fuller one.
        key = (course.code, course.session, course.semester)
        existing = found.get(key)
        if existing is None or _completeness(course) > _completeness(existing):
            found[key] = course

    return list(found.values())


def _completeness(c: ParsedCourse) -> int:
    return sum(x is not None for x in (c.units, c.score, c.grade)) + (1 if c.title else 0)


def _parse_row(line: str, m: re.Match) -> ParsedCourse:
    code = f"{m.group(1)} {m.group(2)}"
    before, after = line[: m.start()], line[m.end():]
    tokens = TOKEN_RE.findall(after)

    grade: Optional[str] = None
    numbers: List[float] = []
    title_words: List[str] = []
    for tok in tokens:
        if re.fullmatch(r"\d+(?:\.\d+)?", tok):
            numbers.append(float(tok))
        elif len(tok) == 1 and tok.upper() in GRADE_POINTS and tok.isupper():
            grade = tok.upper()
        else:
            title_words.append(tok)

    units: Optional[int] = None
    score: Optional[float] = None
    for n in numbers:
        if units is None and n == int(n) and 0 < n <= 9:
            units = int(n)
        elif score is None and 0 <= n <= 100:
            score = n

    if grade is None and score is not None:
        grade = grade_from_score(score)

    # A leading number before the code is often a serial number; ignore it.
    del before

    title = " ".join(title_words).strip()
    return ParsedCourse(
        code=code,
        title=title,
        units=units,
        score=score,
        grade=grade,
        needs_review=units is None or grade is None,
    )


def parse_file(filename: str, data: bytes) -> List[ParsedCourse]:
    return parse_lines(extract_lines(filename, data), source_file=filename)
