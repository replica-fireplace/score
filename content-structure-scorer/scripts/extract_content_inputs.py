#!/usr/bin/env python3
"""Extract structure and draft text for the content-structure-scorer skill.

Supports .xlsx, .docx, .txt, and .md using only Python standard libraries.
"""

from __future__ import annotations

import argparse
import json
import re
import sys
import zipfile
from pathlib import Path
from typing import Any
from xml.etree import ElementTree as ET


NS = {
    "a": "http://schemas.openxmlformats.org/spreadsheetml/2006/main",
    "w": "http://schemas.openxmlformats.org/wordprocessingml/2006/main",
}


def local_name(tag: str) -> str:
    return tag.rsplit("}", 1)[-1]


def read_text_file(path: Path) -> str:
    for encoding in ("utf-8", "utf-8-sig", "cp949", "euc-kr"):
        try:
            return path.read_text(encoding=encoding)
        except UnicodeDecodeError:
            continue
    return path.read_text(errors="replace")


def read_docx(path: Path) -> str:
    with zipfile.ZipFile(path) as zf:
        xml = zf.read("word/document.xml")
    root = ET.fromstring(xml)
    paragraphs: list[str] = []
    for para in root.iter(f"{{{NS['w']}}}p"):
        pieces = [node.text or "" for node in para.iter(f"{{{NS['w']}}}t")]
        text = "".join(pieces).strip()
        if text:
            paragraphs.append(text)
    return "\n\n".join(paragraphs)


def column_index(cell_ref: str) -> int:
    letters = re.match(r"[A-Z]+", cell_ref)
    if not letters:
        return 0
    value = 0
    for char in letters.group(0):
        value = value * 26 + ord(char) - ord("A") + 1
    return value - 1


def shared_strings(zf: zipfile.ZipFile) -> list[str]:
    try:
        xml = zf.read("xl/sharedStrings.xml")
    except KeyError:
        return []
    root = ET.fromstring(xml)
    values: list[str] = []
    for item in root:
        texts = [node.text or "" for node in item.iter() if local_name(node.tag) == "t"]
        values.append("".join(texts))
    return values


def workbook_sheet_names(zf: zipfile.ZipFile) -> list[dict[str, str]]:
    workbook = ET.fromstring(zf.read("xl/workbook.xml"))
    rels = ET.fromstring(zf.read("xl/_rels/workbook.xml.rels"))
    rel_map = {
        rel.attrib["Id"]: rel.attrib["Target"]
        for rel in rels
    }
    sheets: list[dict[str, str]] = []
    for sheet in workbook.findall(".//a:sheet", NS):
        rel_id = sheet.attrib.get("{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id")
        target = rel_map.get(rel_id or "", "")
        sheets.append({
            "name": sheet.attrib.get("name", "Sheet"),
            "path": "xl/" + target.lstrip("/"),
        })
    return sheets


def read_xlsx(path: Path) -> dict[str, Any]:
    with zipfile.ZipFile(path) as zf:
        strings = shared_strings(zf)
        sheets = []
        for sheet in workbook_sheet_names(zf):
            try:
                root = ET.fromstring(zf.read(sheet["path"]))
            except KeyError:
                continue
            rows: list[list[str]] = []
            for row in root.findall(".//a:sheetData/a:row", NS):
                values: list[str] = []
                for cell in row.findall("a:c", NS):
                    ref = cell.attrib.get("r", "")
                    idx = column_index(ref)
                    while len(values) < idx:
                        values.append("")
                    raw = cell.find("a:v", NS)
                    inline = cell.find("a:is/a:t", NS)
                    value = ""
                    if raw is not None and raw.text is not None:
                        if cell.attrib.get("t") == "s":
                            value = strings[int(raw.text)] if raw.text.isdigit() and int(raw.text) < len(strings) else raw.text
                        else:
                            value = raw.text
                    elif inline is not None and inline.text:
                        value = inline.text
                    values.append(value.strip())
                if any(values):
                    rows.append(values)
            sheets.append({"name": sheet["name"], "rows": rows, "text": rows_to_text(rows)})
    return {"sheets": sheets, "text": "\n\n".join(f"# {s['name']}\n{s['text']}" for s in sheets)}


def rows_to_text(rows: list[list[str]]) -> str:
    lines = []
    for row in rows:
        cleaned = [cell.replace("\n", " ").strip() for cell in row]
        lines.append(" | ".join(cleaned).strip(" |"))
    return "\n".join(line for line in lines if line)


def extract_headings(text: str) -> list[dict[str, Any]]:
    headings: list[dict[str, Any]] = []
    patterns = [
        re.compile(r"^(#{1,6})\s+(.+)$"),
        re.compile(r"^(H[1-6])(?:-\d+)?\s*[:.)-]\s*(.+)$", re.IGNORECASE),
    ]
    for line_no, line in enumerate(text.splitlines(), 1):
        stripped = line.strip()
        for pattern in patterns:
            match = pattern.match(stripped)
            if not match:
                continue
            marker, title = match.groups()
            level = len(marker) if marker.startswith("#") else int(marker[1])
            headings.append({"level": level, "title": title.strip(), "line": line_no})
            break
    return headings


def split_sections(text: str, headings: list[dict[str, Any]]) -> list[dict[str, Any]]:
    if not headings:
        return [{"title": "본문", "level": 0, "text": text.strip()}] if text.strip() else []
    lines = text.splitlines()
    sections: list[dict[str, Any]] = []
    for idx, heading in enumerate(headings):
        start = heading["line"] - 1
        end = headings[idx + 1]["line"] - 1 if idx + 1 < len(headings) else len(lines)
        sections.append({
            "title": heading["title"],
            "level": heading["level"],
            "text": "\n".join(lines[start:end]).strip(),
        })
    return sections


def read_supported(path: Path) -> dict[str, Any]:
    suffix = path.suffix.lower()
    if suffix == ".xlsx":
        parsed = read_xlsx(path)
        text = parsed["text"]
        return {"fileName": path.name, "kind": "xlsx", "rawText": text, "sheets": parsed["sheets"]}
    if suffix == ".docx":
        text = read_docx(path)
    elif suffix in {".txt", ".md"}:
        text = read_text_file(path)
    else:
        raise ValueError(f"Unsupported file type: {path.suffix}")
    headings = extract_headings(text)
    return {
        "fileName": path.name,
        "kind": suffix.lstrip("."),
        "rawText": text,
        "headings": headings,
        "sections": split_sections(text, headings),
    }


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--structure", type=Path, required=True)
    parser.add_argument("--draft", type=Path)
    args = parser.parse_args()

    result: dict[str, Any] = {"warnings": []}
    try:
        result["structure"] = read_supported(args.structure)
    except Exception as exc:
        result["warnings"].append(f"structure parse failed: {exc}")
    if args.draft:
        try:
            result["draft"] = read_supported(args.draft)
        except Exception as exc:
            result["warnings"].append(f"draft parse failed: {exc}")

    json.dump(result, sys.stdout, ensure_ascii=False, indent=2)
    sys.stdout.write("\n")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
