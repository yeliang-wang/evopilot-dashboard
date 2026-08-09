FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:1.27-alpine
ENV EVOPILOT_API_BASE_URL=http://evopilot-api:19876
ENV EVOPILOT_HARNESS_HUB_URL=http://127.0.0.1:4176
COPY nginx.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 8080
