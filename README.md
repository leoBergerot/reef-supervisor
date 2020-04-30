### Production

## Build (check dockerfile to option from local file or from github)
docker build -f dockerfile.prod \
    --build-arg REACT_APP_PUBLIC_URL=http://localhost:8181 \
    --build-arg REACT_APP_API_URL=localhost:8080 \
    --build-arg REACT_APP_RECAPTCHA_KEY_SITE=xxxx \
    -t reef-supervisor-prod:latest .

## Run (sample)
docker run --rm -it -p 8181:80 reef-supervisor-prod:latest

You can access to the app via -> http://localhost:8181    
