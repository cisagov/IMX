ARG REGISTRY=docker.io/library

FROM $REGISTRY/python:3.14-alpine

RUN apk update && apk upgrade

WORKDIR /imx-py

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 5000
CMD ["gunicorn", "-c", "gunicorn.conf.py", "wsgi:app"]
