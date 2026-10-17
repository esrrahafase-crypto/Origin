# Origin team workflow

1. Each teammate uses their own GitHub account.
2. Create a short-lived branch for each task, e.g. `feature/data-extraction`.
3. Open a pull request into `main`; request at least one teammate's review.
4. Prefer editing different notebooks to avoid `.ipynb` merge conflicts.
5. Keep project test labels separate from development decisions; never tune on the final test set.
6. Document significant changes to models and evaluation in the PR and update the report later.
7. Never commit tokens, unpublished student data, or licensed PDFs without permission.

Colab: use File > Open notebook > GitHub to open a notebook. When saving, choose File > Save a copy in GitHub and target your working branch. Colab runtimes are temporary; notebooks must reinstall dependencies and reload data independently.
