ARG REGISTRY=ghcr.io

FROM $REGISTRY/astral-sh/uv:alpine

RUN apk update && apk upgrade

WORKDIR /imx-py

COPY pyproject.toml uv.lock ./
RUN uv sync

COPY . .

EXPOSE 5000
CMD ["uv", "run", "gunicorn", "-c", "gunicorn.conf.py", "wsgi:app"]
