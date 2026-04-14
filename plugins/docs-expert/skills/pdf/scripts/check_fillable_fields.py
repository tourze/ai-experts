import sys

from pypdf import PdfReader


def main() -> int:
    if len(sys.argv) != 2:
        print("Usage: check_fillable_fields.py <input.pdf>")
        return 1

    reader = PdfReader(sys.argv[1])
    if reader.get_fields():
        print("This PDF has fillable form fields")
    else:
        print("This PDF does not have fillable form fields; you will need to visually determine where to enter data")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
