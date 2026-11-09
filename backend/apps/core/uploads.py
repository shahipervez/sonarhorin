"""Safe file uploads: size limit, extension allow-list, magic-byte sniffing, zip-bomb guard,
and a random, sanitised storage name. Use `check_upload(f, kinds=("pdf","docx","txt"))`."""
import io
import os
import uuid
import zipfile

from django.core.files.storage import FileSystemStorage
from django.conf import settings
from django.utils.text import get_valid_filename

MB = 1024 * 1024
LABEL = {"pdf": "PDF", "docx": "DOCX", "txt": "TXT"}


class UploadError(ValueError):
    pass


class PrivateStorage(FileSystemStorage):
    """Reads PRIVATE_MEDIA_ROOT on every access (so tests/overrides work) and has no public URL."""

    @property
    def base_location(self):
        return str(settings.PRIVATE_MEDIA_ROOT)

    @property
    def location(self):
        return os.path.abspath(self.base_location)

    def url(self, name):
        raise ValueError("Private files have no public URL — use the owner-checked download view.")


_PRIVATE = PrivateStorage()


def private_storage():
    """Files that must never be public (CVs, resumes, pitch decks). Not served by /media/."""
    return _PRIVATE


def safe_name(name: str, max_len: int = 80) -> str:
    base = get_valid_filename((name or "file").rsplit("/", 1)[-1].rsplit("\\", 1)[-1]) or "file"
    return f"{uuid.uuid4().hex[:10]}_{base[-max_len:]}"


def _kind(name: str):
    n = (name or "").lower()
    for k in ("pdf", "docx", "txt"):
        if n.endswith("." + k):
            return k
    return None


def check_upload(f, kinds=("pdf", "docx", "txt"), max_mb=5) -> str:
    """Validate an UploadedFile. Returns its kind ('pdf' | 'docx' | 'txt') or raises UploadError."""
    if f is None:
        raise UploadError("Choose a file to upload.")
    if f.size > max_mb * MB:
        raise UploadError(f"Max file size is {max_mb} MB.")
    if f.size == 0:
        raise UploadError("This file is empty.")
    kind = _kind(f.name)
    allowed = " or ".join(LABEL[k] for k in kinds)
    if kind not in kinds:
        raise UploadError(f"Upload a {allowed} file.")
    head = f.read(8)
    f.seek(0)
    if kind == "pdf" and not head.startswith(b"%PDF-"):
        raise UploadError("This doesn't look like a real PDF.")
    if kind == "docx":
        if not head.startswith(b"PK\x03\x04"):
            raise UploadError("This doesn't look like a real DOCX file.")
        data = f.read()
        f.seek(0)
        try:
            with zipfile.ZipFile(io.BytesIO(data)) as z:
                infos = z.infolist()
                if len(infos) > 2000 or sum(i.file_size for i in infos) > 60 * MB:
                    raise UploadError("This DOCX is too large once unpacked.")
                if "word/document.xml" not in z.namelist():
                    raise UploadError("This doesn't look like a Word document.")
        except zipfile.BadZipFile:
            raise UploadError("This DOCX file is corrupted.")
    if kind == "txt":
        chunk = f.read(64 * 1024)
        f.seek(0)
        if b"\x00" in chunk:
            raise UploadError("This text file contains binary data.")
    return kind
