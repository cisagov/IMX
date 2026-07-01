FROM debian:bookworm-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates curl git \
    && rm -rf /var/lib/apt/lists/*

RUN curl https://mise.run | bash

ENV PATH="/root/.local/bin:$PATH"

RUN echo 'eval "$(mise activate bash)"' >> /root/.bashrc
