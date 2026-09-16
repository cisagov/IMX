ARG REGISTRY=docker.io

FROM ghcr.io/astral-sh/uv:0.12.15-python3.14-alpine AS builder

WORKDIR /imx-py
COPY pyproject.toml uv.lock ./

RUN uv sync --frozen --no-dev

COPY . .

FROM $REGISTRY/library/python:3.14-alpine

RUN apk update && apk upgrade

WORKDIR /imx-py

COPY --from=builder /imx-py /imx-py

RUN ls /imx-py/.venv
RUN ls /imx-py/.venv/bin

ENV PATH="/imx-py/.venv/bin:$PATH"
RUN chgrp -R 0 /imx-py/.venv && \
    chmod -R g+rwX /imx-py/.venv

EXPOSE 5000
CMD ["gunicorn", "-c", "gunicorn.conf.py", "wsgi:app"]
