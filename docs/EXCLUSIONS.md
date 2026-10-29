# Final repository allowlist and exclusions

`Origin-Final` was assembled from the current local backend/research and
frontend projects using an explicit allowlist. Source repositories were not
copied wholesale.

## Preserved

- Runtime backend: `src/api.py`, `src/retrieval.py`, and the package initializer.
- Original 103-project processed dataset and evaluation-query dataset.
- Research notebooks 01–09, final results, metrics, and EDA figures.
- Backend contract tests.
- Active React routes, services, state/i18n, styles, error boundary, approved
  logo, public assets, and meaningful frontend tests.
- Required Python and Node dependency manifests and local build configuration.

## Excluded from the source projects

- `.env`: contains local credentials. Only placeholder `.env.example` files are
  included.
- `.venv`, `node_modules`, model caches, downloaded weights, `__pycache__`,
  `.pytest_cache`, `.output`, `dist`, and `.wrangler`: generated or local state.
- `.origin-local-logs` and other logs: runtime/debug output.
- Docker-specific files such as `.dockerignore`: the final application does not
  use Docker.
- Hugging Face deployment workflows, static-space verification, live browser
  probe workflows, and empty `hf`/deployment directories: unrelated to the
  required local VS Code workflow.
- Lovable project metadata and repository synchronization instructions: tied to
  the previous repository rather than the self-contained final repository.
- Empty deployment/script directories and Cloudflare state.
- Old project-plan, team-workflow, route-template, and duplicate setup READMEs:
  superseded by the root `README.md` and current API contract.
- Unused generated shadcn/Radix `src/components/ui` files, `use-mobile` hook,
  `lib/utils.ts`, and `components.json`: no active Origin route or component
  imports them. Their unused package dependencies were removed from the final
  frontend manifest.
- `streamlit` from the broad research requirements: it is not imported by the
  preserved notebooks or runtime and belonged to an abandoned prototype plan.

The `@lovable.dev/vite-tanstack-config` package is retained only because the
current working TanStack/Vite application imports it as its build configuration
wrapper. No Lovable hosting, synchronization metadata, or deployment workflow
is included.
