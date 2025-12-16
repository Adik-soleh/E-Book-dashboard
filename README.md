# Frontend – Vue 3 SPA

Vue 3 + TypeScript + Pinia client for the E-Book platform. It mirrors the UX described in `flow.md`:
- Catalog home (search, tag filtering, pagination)
- Ebook detail page with buy/download/read options
- Checkout page that calls `/orders/create`
- Secure download + in-browser reader using `pdfjs-dist`
- Admin panel for uploading PDFs/covers, managing tags, and pruning catalog entries

## Quick start
```bash
cd frontend
cp .env.example .env   # optional, defaults to http://localhost:3000/api
npm install
npm run dev
```

## Tech stack
- Vue 3 + Vite + TypeScript
- Pinia state management
- Vue Router for the 5 main screens
- Axios API client with automatic JWT header + response unwrap
- pdfjs-dist canvas renderer for the Reader page

## Environment variables
| Variable | Description |
| --- | --- |
| `VITE_API_URL` | Base URL of the Nest API (`http://localhost:3000/api` by default) |

All API calls assume the JSON shape produced by the Nest response interceptor (`{ success: true, data: ... }`).
