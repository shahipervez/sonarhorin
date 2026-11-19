# Build the React app, then serve it with nginx (which also proxies /api to Django)
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
# Build, then pre-compress text assets once; nginx serves the .gz files via gzip_static.
RUN npm run build \
 && find dist -type f \( -name '*.js' -o -name '*.css' -o -name '*.html' -o -name '*.svg' -o -name '*.json' -o -name '*.webmanifest' \) \
      -size +1k -exec gzip -9 -k -n {} \;

FROM nginx:1.27-alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY proxy_params_sh /etc/nginx/proxy_params_sh
COPY security_headers.conf /etc/nginx/security_headers.conf
EXPOSE 80
