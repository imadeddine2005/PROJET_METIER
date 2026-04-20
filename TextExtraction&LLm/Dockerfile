FROM python:3.11-slim

WORKDIR /app

# Dépendances système pour traitement PDF
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpoppler-cpp-dev \
    poppler-utils \
    && rm -rf /var/lib/apt/lists/*

# Utilisateur non-root
RUN useradd -m -u 1000 llmuser
USER llmuser

COPY --chown=llmuser:llmuser requirements.txt .
RUN pip install --no-cache-dir --user -r requirements.txt

COPY --chown=llmuser:llmuser . .

EXPOSE 5001

HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:5001/health')" || exit 1

CMD ["python", "app1.py"]
