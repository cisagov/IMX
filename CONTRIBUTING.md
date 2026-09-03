# Contributing

# Welcome #

We're so glad you're thinking about contributing to IMX! If
you're unsure or hesitant to make a recommendation, just ask, submit
the issue, or pull request. The worst that can happen is that you'll
be politely asked to change something. We appreciate any sort of
contribution(s), and don't want a wall of rules to stifle innovation.

Before contributing, we encourage you to read our CONTRIBUTING policy (you are here), our
[LICENSE](./LICENSE), and our [README](./README.md), all of which are in this repository.

## Issues ##

If you want to report a bug or request a new feature, the most direct method is to
[create an issue](https://github.com/cisagov/imx/issues) in this repository. We recommend that you first search through existing
open and closed issues to check if your particular issue has already
been reported.

If it has then you might want to add a comment to the existing issue.

If it hasn't then feel free to create a new one.

## Pull Requests (PR) ##

If you choose to [submit a pull
request](https://github.com/cisagov/imx/pulls), it must pass
several style, format, and sanity checks in our continuous
integration (CI) pipeline before it can be merged. Your pull request
may fail these checks, and that's OK. If you want you can stop there
and wait for us to make the necessary corrections to ensure your code
passes the CI checks. If you would rather make the changes yourself
to pass the CI checks, please feel free to do so.

### PR assignee responsibilities

If you are assigned to a PR, whether you are an external contributor or a member of the core team, you are responsible for moving that PR through the review process.

PR assignees should:

1. Provide a clear and complete PR description that explains what changed and links the issue(s) the PR resolves, preferably with [closing keywords](https://docs.github.com/en/issues/tracking-your-work-with-issues/linking-a-pull-request-to-an-issue#linking-a-pull-request-to-an-issue-using-a-keyword).
2. Include testing instructions reviewers can follow.
3. Assign the appropriate reviewers for the PR.
4. Collaborate with reviewers to resolve questions, requested changes, and outstanding comments.
5. Ensure all pre-approval, pre-merge, and post-merge checklist items in the PR template are completed.
6. After approval from two reviewers, merge your own PR when the repository workflow allows it.
    - If you are an external contributor, @mention one of the reviewers to merge your PR.

### Quality assurance and code reviews ##

All PRs will be tested, vetted, and reviewed by our team before being
merged to the main branch. Please stand by to address questions,
concerns, or improvement suggestions we may have about your PR.

## Changes

- Keep changes focused and reviewable.
- Add or update tests for changed behavior.
- Update documentation when behavior, configuration, or operational procedures change.
- Do not commit secrets or developer-local environment files.
- Use conventional commits.
- Update dependency lockfiles only through the repository's dependency-update tasks.

